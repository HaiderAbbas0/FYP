"""PyTorch sequence detectors for IoMT packet windows: bidirectional RNN and packet-sequence Transformer.
Each window = the current packet + the previous (n_ctx - 1) packets of the same stream, SEQ_FEATURES per packet.
Input normalisation (arcsinh + standardisation with FIT statistics) lives inside the model as buffers, so a saved
model takes raw per-packet features and is self-contained."""
import math
import os
import time

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

try:                                   # torch >= 2.3
    from torch.amp import GradScaler as _GradScaler

    def make_scaler(enabled):
        return _GradScaler("cuda", enabled=enabled)
except ImportError:                    # older torch
    from torch.cuda.amp import GradScaler as _GradScaler

    def make_scaler(enabled):
        return _GradScaler(enabled=enabled)


def autocast(enabled):
    """Mixed precision on CUDA (fp16); a no-op context on CPU."""
    return torch.autocast(device_type="cuda", dtype=torch.float16, enabled=enabled)


class InputNorm(nn.Module):
    def __init__(self, mu, sd):
        super().__init__()
        self.register_buffer("mu", torch.as_tensor(mu, dtype=torch.float32))
        self.register_buffer("sd", torch.as_tensor(sd, dtype=torch.float32))

    def forward(self, x):
        return (torch.asinh(x) - self.mu) / self.sd


class BiRNNClassifier(nn.Module):
    """Multi-layer bidirectional LSTM/GRU -> concat(final fwd, final bwd) -> dropout -> linear -> logits."""

    def __init__(self, n_features, n_classes, mu, sd, cell="lstm", hidden=64, layers=2, dropout=0.2):
        super().__init__()
        self.norm = InputNorm(mu, sd)
        rnn = nn.LSTM if cell == "lstm" else nn.GRU
        self.rnn = rnn(n_features, hidden, num_layers=layers, batch_first=True, bidirectional=True,
                       dropout=dropout if layers > 1 else 0.0)
        self.drop = nn.Dropout(dropout)
        self.head = nn.Linear(2 * hidden, n_classes)

    def forward(self, x):
        _, h = self.rnn(self.norm(x))
        h = h[0] if isinstance(h, tuple) else h                    # LSTM returns (h_n, c_n)
        z = torch.cat([h[-2], h[-1]], dim=1)                       # last layer: forward, backward
        return self.head(self.drop(z))


class PositionalEncoding(nn.Module):
    def __init__(self, d_model, max_len=512):
        super().__init__()
        pe = torch.zeros(max_len, d_model)
        pos = torch.arange(max_len).unsqueeze(1).float()
        div = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        pe[:, 0::2] = torch.sin(pos * div)
        pe[:, 1::2] = torch.cos(pos * div[: pe[:, 1::2].shape[1]])
        self.register_buffer("pe", pe.unsqueeze(0))

    def forward(self, x):
        return x + self.pe[:, : x.size(1)]


class PacketTransformer(nn.Module):
    """Input projection -> sinusoidal positions -> L pre-norm encoder blocks (multi-head attention + FFN)
    -> LayerNorm -> global average pooling over the window -> classification head."""

    def __init__(self, n_features, n_classes, mu, sd, d_model=64, n_heads=4, n_layers=2, ff_mult=2, dropout=0.1):
        super().__init__()
        self.norm = InputNorm(mu, sd)
        self.proj = nn.Linear(n_features, d_model)
        self.pos = PositionalEncoding(d_model)
        layer = nn.TransformerEncoderLayer(d_model, n_heads, dim_feedforward=ff_mult * d_model, dropout=dropout,
                                           batch_first=True, norm_first=True, activation="gelu")
        self.encoder = nn.TransformerEncoder(layer, n_layers, enable_nested_tensor=False)
        self.out_norm = nn.LayerNorm(d_model)
        self.drop = nn.Dropout(dropout)
        self.head = nn.Linear(d_model, n_classes)

    def forward(self, x):
        z = self.encoder(self.pos(self.proj(self.norm(x))))
        z = self.out_norm(z).mean(dim=1)
        return self.head(self.drop(z))


ARCHS = {"birnn": BiRNNClassifier, "transformer": PacketTransformer}


def build_model(arch, cfg, n_features, n_classes, mu, sd):
    return ARCHS[arch](n_features, n_classes, mu, sd, **cfg)


class TorchSequencePredictor:
    """Portable wrapper: picklable (state dict + spec), CPU by default, predict_proba on (n, n_ctx, F) windows."""
    kind = "sequence"

    def __init__(self, arch, cfg, n_features, n_classes, mu, sd, state_dict=None, device="cpu"):
        self.spec = {"arch": arch, "cfg": dict(cfg), "n_features": int(n_features), "n_classes": int(n_classes),
                     "mu": np.asarray(mu, np.float32).tolist(), "sd": np.asarray(sd, np.float32).tolist()}
        self._build(state_dict, device)

    def _build(self, state_dict, device):
        s = self.spec
        self.model = build_model(s["arch"], s["cfg"], s["n_features"], s["n_classes"], s["mu"], s["sd"])
        if state_dict is not None:
            self.model.load_state_dict(state_dict)
        self.device = device
        self.model.to(device).eval()
        self.classes_ = np.arange(s["n_classes"])

    def to(self, device):
        self.device = device
        self.model.to(device)
        return self

    @torch.no_grad()
    def predict_proba(self, windows, batch_size=4096):
        out = []
        use_amp = str(self.device).startswith("cuda")
        for a in range(0, len(windows), batch_size):
            xb = torch.from_numpy(np.ascontiguousarray(windows[a:a + batch_size], dtype=np.float32)).to(self.device)
            with autocast(use_amp):
                p = torch.softmax(self.model(xb).float(), dim=1)
            out.append(p.cpu().numpy().astype(np.float64))
            del xb, p
        return np.concatenate(out) if out else np.zeros((0, self.spec["n_classes"]))

    def save(self, path):
        torch.save({"spec": self.spec, "state_dict": {k: v.cpu() for k, v in self.model.state_dict().items()}}, path)

    @classmethod
    def load(cls, path, device="cpu"):
        ck = torch.load(path, map_location="cpu", weights_only=False)
        s = ck["spec"]
        return cls(s["arch"], s["cfg"], s["n_features"], s["n_classes"], s["mu"], s["sd"], ck["state_dict"], device)

    def __getstate__(self):
        return {"spec": self.spec, "state_dict": {k: v.cpu() for k, v in self.model.state_dict().items()}}

    def __setstate__(self, st):
        self.spec = st["spec"]
        self._build(st["state_dict"], "cpu")


def n_parameters(model):
    return sum(p.numel() for p in model.parameters())


def train_sequence_model(model, train_loader_fn, val_loader, class_weight, device, epochs, lr, weight_decay,
                         patience, use_amp, ckpt_path=None, ckpt_key=None, log=print):
    """AdamW + per-step cosine annealing + AMP; early stopping on weighted VAL loss; resumable per-epoch checkpoint.
    train_loader_fn(epoch) -> DataLoader yielding (x, y, w) batches. Returns (model, info)."""
    model.to(device)
    opt = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=weight_decay)
    steps = len(train_loader_fn(0))
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=max(1, epochs * steps))
    scaler = make_scaler(use_amp)
    cw = torch.as_tensor(class_weight, dtype=torch.float32, device=device)
    start_epoch, best_loss, best_state, best_epoch, bad, history = 0, float("inf"), None, -1, 0, []
    if ckpt_path and os.path.exists(ckpt_path):
        ck = torch.load(ckpt_path, map_location=device, weights_only=False)
        if ck.get("key") == ckpt_key:
            model.load_state_dict(ck["model"]); opt.load_state_dict(ck["opt"]); sched.load_state_dict(ck["sched"])
            # A checkpoint written with AMP off (CPU runtime / GPU not attached) stores an empty scaler state;
            # an enabled GradScaler refuses to load it. Resume the weights/optimiser anyway and start a fresh scaler.
            sc_state = ck.get("scaler") or {}
            if scaler.is_enabled() and sc_state:
                scaler.load_state_dict(sc_state)
            elif scaler.is_enabled():
                log("    checkpoint was saved with AMP off -> fresh GradScaler")
            start_epoch, best_loss, best_epoch, bad, history = (ck["epoch"] + 1, ck["best_loss"], ck["best_epoch"],
                                                                 ck["bad"], ck["history"])
            best_state = ck["best_state"]
            log(f"    resumed from epoch {ck['epoch'] + 1}")
    if device.startswith("cuda"):
        torch.cuda.reset_peak_memory_stats()
    t0 = time.time()
    for epoch in range(start_epoch, epochs):
        if bad >= patience:
            break
        model.train()
        tl, tw = 0.0, 0.0
        for xb, yb, wb in train_loader_fn(epoch):
            xb, yb, wb = xb.to(device, non_blocking=True), yb.to(device, non_blocking=True), wb.to(device, non_blocking=True)
            opt.zero_grad(set_to_none=True)
            with autocast(use_amp):
                logits = model(xb)
            loss_i = F.cross_entropy(logits.float(), yb, reduction="none")
            sw = wb * cw[yb]
            loss = (loss_i * sw).sum() / sw.sum().clamp_min(1e-12)
            scaler.scale(loss).backward()
            scaler.unscale_(opt)
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            scaler.step(opt)
            scaler.update()
            sched.step()
            tl += float(loss.detach()) * float(sw.sum()); tw += float(sw.sum())
            del xb, yb, wb, logits, loss_i, loss, sw
        vl = evaluate_loss(model, val_loader, device, use_amp)
        history.append({"epoch": epoch, "train_loss": tl / max(tw, 1e-12), "val_loss": vl, "lr": sched.get_last_lr()[0]})
        improved = vl < best_loss - 1e-5
        if improved:
            best_loss, best_epoch, bad = vl, epoch, 0
            best_state = {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}
        else:
            bad += 1
        log(f"    epoch {epoch + 1}/{epochs}  train {history[-1]['train_loss']:.4f}  val {vl:.4f}"
            f"{'  *' if improved else ''}  ({time.time() - t0:.0f}s)")
        if ckpt_path:
            torch.save({"key": ckpt_key, "epoch": epoch, "model": model.state_dict(), "opt": opt.state_dict(),
                        "sched": sched.state_dict(), "scaler": scaler.state_dict(), "amp": bool(use_amp), "best_loss": best_loss,
                        "best_epoch": best_epoch, "bad": bad, "history": history, "best_state": best_state},
                       ckpt_path + ".tmp")
            os.replace(ckpt_path + ".tmp", ckpt_path)
        if device.startswith("cuda"):
            torch.cuda.empty_cache()
    if best_state is not None:
        model.load_state_dict(best_state)
    info = {"best_epoch": best_epoch, "best_val_loss": best_loss, "history": history,
            "train_seconds": time.time() - t0, "n_parameters": n_parameters(model),
            "peak_train_vram_mb": (torch.cuda.max_memory_allocated() / 2**20) if device.startswith("cuda") else 0.0}
    model.eval()
    if device.startswith("cuda"):
        torch.cuda.empty_cache()
    return model, info


@torch.no_grad()
def evaluate_loss(model, loader, device, use_amp):
    model.eval()
    tot, wt = 0.0, 0.0
    for xb, yb, wb in loader:
        xb, yb, wb = xb.to(device), yb.to(device), wb.to(device)
        with autocast(use_amp):
            logits = model(xb)
        l = F.cross_entropy(logits.float(), yb, reduction="none")
        tot += float((l * wb).sum()); wt += float(wb.sum())
        del xb, yb, wb, logits, l
    return tot / max(wt, 1e-12)
