"""IoMT PCAP runtime — shared by training and deployment.

* PcapSource      : classic-pcap / pcapng reader with a fast header-only index and block (seek) reads
* decode_records  : packet bytes -> raw header fields (no feature engineering, identifiers only hashed)
* build_features  : causal per-packet features + context over the previous N packets (same math in training & live)
* StreamFeaturizer: carries the last N raw packets across batches for live streams
* ProbaPassthrough: lets a post-hoc calibrator work on any model's probabilities (tabular or sequence)
"""
import os
import socket
import struct
import zlib

import dpkt
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, ClassifierMixin

RUNTIME_VERSION = "1.1.0"           # 1.1: victim-centric long-horizon (attacker-cardinality) features
PARSE_VERSION = "raw-v1"            # bump when decode_records changes -> invalidates parquet caches
MQTT_PORTS = (1883, 8883)
DEFAULT_LONG_CONTEXT_N = 1024       # history (packets) for the long-horizon features; the bundle stores its own value

# ----------------------------------------------------------------------------------------------------------------
# raw fields produced by the decoder (one row per packet)
# ----------------------------------------------------------------------------------------------------------------
RAW_SPEC = [  # name, dtype, value when absent
    ("ts", "float64", 0.0), ("frame_len", "int32", 0), ("ip_ver", "int8", 0), ("is_arp", "int8", 0),
    ("ip_hdr_len", "int16", 0), ("ttl", "int16", 0), ("l4", "int16", -1), ("ip_df", "int8", 0),
    ("ip_mf", "int8", 0), ("ip_frag", "int8", 0), ("sport", "int32", -1), ("dport", "int32", -1),
    ("tcp_flags", "int16", -1), ("tcp_win", "int32", 0), ("tcp_hdr_len", "int16", 0), ("payload_len", "int32", 0),
    ("icmp_type", "int16", -1), ("icmp_code", "int16", -1), ("mqtt_type", "int8", -1),
    ("src_h", "uint32", 0), ("dst_h", "uint32", 0), ("malformed", "int8", 0)]
RAW_COLUMNS = [n for n, _, _ in RAW_SPEC]
RAW_DTYPES = {n: d for n, d, _ in RAW_SPEC}
_ABSENT = tuple(v for _, _, v in RAW_SPEC)

LINKTYPE_ETHERNET, LINKTYPE_NULL, LINKTYPE_LOOP = 1, 0, 108
LINKTYPE_RAW = (101, 12, 14, 228, 229)
LINKTYPE_SLL, LINKTYPE_SLL2 = 113, 276

_PCAP_MAGIC = {0xA1B2C3D4: ("<", 1e-6), 0xD4C3B2A1: (">", 1e-6),
               0xA1B23C4D: ("<", 1e-9), 0x4D3CB2A1: (">", 1e-9)}
_PCAPNG_MAGIC = 0x0A0D0D0A
_CHUNK = 32 << 20
_IP_HAS_BITFIELDS = hasattr(dpkt.ip.IP, "df") and hasattr(dpkt.ip.IP, "offset")


class PcapSource:
    """Streaming reader. Classic pcap supports a header-only index + seek-based block reads; pcapng is sequential."""

    def __init__(self, path):
        self.path = path
        with open(path, "rb") as f:
            head = f.read(24)
        if len(head) < 4:
            raise ValueError("file too short to be a capture")
        magic = struct.unpack("<I", head[:4])[0]
        if magic in _PCAP_MAGIC:
            self.format = "pcap"
            self.endian, self.ts_scale = _PCAP_MAGIC[magic]
            if len(head) < 24:
                raise ValueError("truncated pcap global header")
            self.linktype = struct.unpack(self.endian + "I", head[20:24])[0] & 0x0FFFFFFF
            self._rec = struct.Struct(self.endian + "IIII")
        elif magic == _PCAPNG_MAGIC:
            self.format = "pcapng"
            self.linktype = None                         # read from the interface block
            with open(path, "rb") as f:
                r = dpkt.pcapng.Reader(f)
                self.linktype = r.datalink()
        else:
            raise ValueError(f"unknown capture magic 0x{magic:08x}")

    # ---------------------------------------------------------------- classic pcap
    _MAX_RECORD = 1 << 20          # a record longer than 1 MiB means a corrupt file

    def _walk(self, offset, f):
        """Yield (ts, orig_len, data) for consecutive records starting at byte `offset` (bounded memory)."""
        rec, scale = self._rec, self.ts_scale
        f.seek(offset)
        buf, bpos = f.read(_CHUNK), 0
        while True:
            if len(buf) - bpos < 16:
                more = f.read(_CHUNK)
                if not more:
                    return
                buf, bpos = buf[bpos:] + more, 0
                continue
            sec, frac, incl, orig = rec.unpack_from(buf, bpos)
            if incl > self._MAX_RECORD:
                raise ValueError(f"corrupt pcap record (incl_len={incl}) in {self.path}")
            end = bpos + 16 + incl
            if end > len(buf):
                more = f.read(max(_CHUNK, end - len(buf)))
                if not more:
                    return                                  # truncated final record -> ignored
                buf, bpos = buf[bpos:] + more, 0
                continue
            yield sec + frac * scale, orig, buf[bpos + 16:end]
            bpos = end

    def index(self, every):
        """Header-only pass: (n_packets, byte offsets of packets 0, every, 2*every, ...). pcapng -> (n, None)."""
        if self.format == "pcapng":
            return sum(1 for _ in self.iter_all()), None
        rec, size = self._rec, os.path.getsize(self.path)
        offsets, n = [], 0
        with open(self.path, "rb") as f:
            f.seek(24)
            buf, bpos, fpos = f.read(_CHUNK), 0, 24        # fpos = file offset of buf[0]
            while True:
                if bpos > len(buf):                         # next header lies beyond the buffer: seek forward
                    f.seek(bpos - len(buf), 1)
                    fpos, buf, bpos = fpos + bpos, f.read(_CHUNK), 0
                if len(buf) - bpos < 16:
                    more = f.read(_CHUNK)
                    if not more:
                        break
                    fpos, buf, bpos = fpos + bpos, buf[bpos:] + more, 0
                    continue
                incl = rec.unpack_from(buf, bpos)[2]
                pos = fpos + bpos
                if incl > self._MAX_RECORD or pos + 16 + incl > size:
                    break                                   # corrupt or truncated tail
                if n % every == 0:
                    offsets.append(pos)
                n += 1
                bpos += 16 + incl
        return n, np.asarray(offsets, dtype=np.int64)

    def read_blocks(self, plan):
        """plan: sorted list of (block_id, start_index, n_packets, byte_offset or None).
        Yields (block_id, start_index, [(ts, orig_len, data), ...]). Classic pcap seeks; pcapng reads once."""
        if self.format == "pcap":
            with open(self.path, "rb") as f:
                for bid, s, n, off in plan:
                    recs = []
                    for r in self._walk(int(off), f):
                        recs.append(r)
                        if len(recs) >= n:
                            break
                    yield bid, s, recs
            return
        it = iter(plan)
        cur = next(it, None)
        recs = []
        for i, r in enumerate(self.iter_all()):
            if cur is None:
                break
            bid, s, n, _ = cur
            if i >= s:
                recs.append(r)
                if len(recs) >= n:
                    yield bid, s, recs
                    recs, cur = [], next(it, None)
        if cur is not None and recs:
            yield cur[0], cur[1], recs

    def iter_all(self):
        """Sequential (ts, orig_len, data) over the whole capture."""
        if self.format == "pcap":
            with open(self.path, "rb") as f:
                yield from self._walk(24, f)
        else:
            with open(self.path, "rb") as f:
                for ts, data in dpkt.pcapng.Reader(f):
                    yield ts, len(data), data


# ----------------------------------------------------------------------------------------------------------------
# packet decoding
# ----------------------------------------------------------------------------------------------------------------
def _ip4_int(b):
    return struct.unpack("!I", b)[0] if len(b) == 4 else zlib.crc32(b)


def _decode_one(ts, orig_len, data, linktype):
    ip_ver = is_arp = ip_hdr = ttl = df = mf = frag = 0
    l4, sport, dport, flags, win, thl, plen = -1, -1, -1, -1, 0, 0, 0
    itype = icode = mqtt = -1
    src_h = dst_h = 0
    try:
        if linktype == LINKTYPE_ETHERNET:
            l2 = dpkt.ethernet.Ethernet(data)
            net = l2.data
            src_h, dst_h = zlib.crc32(l2.src), zlib.crc32(l2.dst)
        elif linktype in LINKTYPE_RAW:
            v = data[0] >> 4 if data else 0
            net = dpkt.ip.IP(data) if v == 4 else dpkt.ip6.IP6(data) if v == 6 else None
        elif linktype == LINKTYPE_SLL:
            net = dpkt.sll.SLL(data).data
        elif linktype == LINKTYPE_SLL2 and hasattr(dpkt, "sll2"):
            net = dpkt.sll2.SLL2(data).data
        elif linktype in (LINKTYPE_NULL, LINKTYPE_LOOP):
            net = dpkt.loopback.Loopback(data).data
        else:
            return (ts, orig_len, 0, 0, 0, 0, -1, 0, 0, 0, -1, -1, -1, 0, 0, 0, -1, -1, -1, 0, 0, 1)
        if isinstance(net, dpkt.ip.IP):
            ip_ver, ip_hdr, ttl = 4, net.hl * 4, net.ttl
            if _IP_HAS_BITFIELDS:
                df, mf, frag = int(net.df), int(net.mf), int(net.offset != 0)
            else:                                        # dpkt < 1.9.5
                df, mf = int(bool(net.off & dpkt.ip.IP_DF)), int(bool(net.off & dpkt.ip.IP_MF))
                frag = int((net.off & dpkt.ip.IP_OFFMASK) != 0)
            src_h, dst_h, l4, seg = _ip4_int(net.src), _ip4_int(net.dst), net.p, net.data
        elif isinstance(net, dpkt.ip6.IP6):
            ip_ver, ip_hdr, ttl = 6, 40, net.hlim
            src_h, dst_h, l4, seg = zlib.crc32(net.src), zlib.crc32(net.dst), net.nxt, net.data
        elif isinstance(net, dpkt.arp.ARP):
            is_arp = 1
            src_h, dst_h = _ip4_int(net.spa), _ip4_int(net.tpa)
            seg = None
        else:
            seg = None
        if ip_ver and frag == 0:
            if isinstance(seg, dpkt.tcp.TCP):
                sport, dport, flags, win, thl = seg.sport, seg.dport, seg.flags, seg.win, seg.off * 4
                plen = len(seg.data)
                if plen and (sport in MQTT_PORTS or dport in MQTT_PORTS):
                    mqtt = seg.data[0] >> 4
            elif isinstance(seg, dpkt.udp.UDP):
                sport, dport, plen = seg.sport, seg.dport, len(seg.data)
            elif isinstance(seg, (dpkt.icmp.ICMP, dpkt.icmp6.ICMP6)):
                itype, icode = seg.type, seg.code
                plen = max(0, len(bytes(seg)) - 4)
            elif isinstance(seg, (bytes, bytearray)):
                plen = len(seg)
        return (ts, orig_len, ip_ver, is_arp, ip_hdr, ttl, l4, df, mf, frag, sport, dport, flags, win, thl, plen,
                itype, icode, mqtt, src_h, dst_h, 0)
    except Exception:          # malformed / truncated packet: keep timing + length, flag it
        return (ts, orig_len, ip_ver, is_arp, ip_hdr, ttl, l4, df, mf, frag, sport, dport, flags, win, thl, plen,
                itype, icode, mqtt, src_h, dst_h, 1)


def decode_records(records, linktype):
    """records: iterable of (ts, orig_len, data) -> DataFrame[RAW_COLUMNS] with compact dtypes."""
    rows = [_decode_one(ts, ol, d, linktype) for ts, ol, d in records]
    if not rows:
        return pd.DataFrame({c: np.array([], dtype=RAW_DTYPES[c]) for c in RAW_COLUMNS})
    arr = np.array(rows, dtype=np.float64)
    return pd.DataFrame({c: arr[:, j].astype(RAW_DTYPES[c]) for j, c in enumerate(RAW_COLUMNS)})


def packet_addresses(data, linktype):
    """Human-readable (src, dst) for incident reports only - never used as features."""
    try:
        if linktype == LINKTYPE_ETHERNET:
            l2 = dpkt.ethernet.Ethernet(data)
            net = l2.data
            fallback = (":".join(f"{b:02x}" for b in l2.src), ":".join(f"{b:02x}" for b in l2.dst))
        elif linktype in LINKTYPE_RAW:
            v = data[0] >> 4 if data else 0
            net, fallback = (dpkt.ip.IP(data) if v == 4 else dpkt.ip6.IP6(data)), (None, None)
        elif linktype == LINKTYPE_SLL:
            net, fallback = dpkt.sll.SLL(data).data, (None, None)
        else:
            return None, None
        if isinstance(net, dpkt.ip.IP):
            return socket.inet_ntoa(net.src), socket.inet_ntoa(net.dst)
        if isinstance(net, dpkt.ip6.IP6):
            return socket.inet_ntop(socket.AF_INET6, net.src), socket.inet_ntop(socket.AF_INET6, net.dst)
        if isinstance(net, dpkt.arp.ARP):
            return socket.inet_ntoa(net.spa), socket.inet_ntoa(net.tpa)
        return fallback
    except Exception:
        return None, None


# ----------------------------------------------------------------------------------------------------------------
# features — causal: a packet only sees itself and the packets before it in the same segment
# ----------------------------------------------------------------------------------------------------------------
BASE_FEATURES = [
    "frame_len", "ip_hdr_len", "payload_len", "ttl", "is_ipv4", "is_ipv6", "is_arp", "is_tcp", "is_udp", "is_icmp",
    "is_other_l4", "ip_df", "ip_mf", "ip_frag", "tcp_fin", "tcp_syn", "tcp_rst", "tcp_psh", "tcp_ack", "tcp_urg",
    "tcp_ece", "tcp_cwr", "tcp_win", "tcp_hdr_len", "icmp_type", "icmp_code", "sport_mqtt", "dport_mqtt",
    "sport_wellknown", "dport_wellknown", "mqtt_connect", "mqtt_publish", "mqtt_other", "log_iat_prev",
    "same_src_prev", "same_dst_prev", "same_sport_prev", "same_dport_prev", "malformed"]
CONTEXT_FEATURES = [
    "ctx_len_mean", "ctx_len_std", "ctx_len_min", "ctx_len_max", "ctx_len_sum", "ctx_payload_mean",
    "ctx_ttl_mean", "ctx_ttl_std", "ctx_log_iat_mean", "ctx_iat_cv", "ctx_log_pkt_rate", "ctx_log_byte_rate",
    "ctx_syn_ratio", "ctx_ack_ratio", "ctx_fin_ratio", "ctx_rst_ratio", "ctx_psh_ratio",
    "ctx_tcp_ratio", "ctx_udp_ratio", "ctx_icmp_ratio", "ctx_other_ratio",
    "ctx_mqtt_connect_ratio", "ctx_mqtt_publish_ratio",
    "ctx_n_src", "ctx_n_dst", "ctx_n_sport", "ctx_n_dport"]
# Long-horizon, victim-centric features over the previous n_long packets of the stream (see long_horizon_features).
# DoS and DDoS of one protocol send the same packets; they differ in HOW MANY hosts attack the same victim. That is
# only visible over a horizon longer than an attacker's burst, and only when sources are counted per endpoint.
LONG_FEATURES = [
    "lh_n_src",             # distinct sources in the whole window
    "lh_fanin_dst",         # distinct sources that sent to this packet's destination
    "lh_fanout_src",        # distinct destinations this packet's source sent to
    "lh_peer_max",          # max(fan-in of dst, fan-out of src): attacker count, whatever the packet direction
    "lh_pair_share_min",    # min(pair / dst-inbound, pair / src-outbound): ~1 for one attacker, ~1/k for k attackers
    "lh_dst_share",         # share of the window that goes to this destination (victim concentration)
    "lh_log_dst_rate",      # log10 packets/s into this destination over the window
    "lh_log_pair_rate"]     # log10 packets/s of this (source, destination) pair over the window
TAB_FEATURES = BASE_FEATURES + CONTEXT_FEATURES + LONG_FEATURES
SEQ_FEATURES = BASE_FEATURES + LONG_FEATURES
SHORTCUT_COLUMNS = ["timestamp", "packet_no"]      # never model features; used only by the shortcut ablation
_FLAG_BITS = [("tcp_fin", 0x01), ("tcp_syn", 0x02), ("tcp_rst", 0x04), ("tcp_psh", 0x08), ("tcp_ack", 0x10),
              ("tcp_urg", 0x20), ("tcp_ece", 0x40), ("tcp_cwr", 0x80)]


def _prev_equal(a):
    out = np.zeros(len(a), np.float32)
    if len(a) > 1:
        out[1:] = (a[1:] == a[:-1])
    return out


def _window_sum(x, start):
    cs = np.concatenate([[0.0], np.cumsum(x, dtype=np.float64)])
    i = np.arange(len(x))
    return cs[i + 1] - cs[start]


def _group_codes(a, b=None):
    """Dense int64 code per row for the key a (or the pair (a, b)); a, b are 32-bit hashes."""
    k = np.asarray(a).astype(np.uint64)
    if b is not None:
        k = (k << np.uint64(32)) | np.asarray(b).astype(np.uint64)
    return np.unique(k, return_inverse=True)[1].astype(np.int64).ravel()


def window_group_stats(group, value, H):
    """Exact sliding-window statistics, causal, O(n log n), no Python loop.

    For every row i, over the rows j in the window (i-H, i] that share i's group (group[j] == group[i]):
      count[i]    = number of such rows
      distinct[i] = number of distinct value[j] among them      (skipped when value is None)

    Distinct count uses the 'first occurrence inside the window' identity: a row j is the first of its
    (group, value) inside the window ending at i  <=>  its previous same-(group, value) row prev(j) lies outside,
    i.e.  max(j, prev(j) + H) <= i <= j + H - 1.  Each row therefore adds +1 to one contiguous range of its group's
    rows, which a difference array + cumsum resolves for all rows at once."""
    group = np.asarray(group, np.int64)
    n = len(group)
    if n == 0:
        return np.zeros(0, np.int64), (None if value is None else np.zeros(0, np.int64))
    H = max(1, int(H))
    idx = np.arange(n, dtype=np.int64)
    M = np.int64(n + H + 1)                        # composite key group*M + index never crosses a group band
    order = np.lexsort((idx, group))
    C = group[order] * M + idx[order]              # strictly increasing
    rank = np.empty(n, np.int64)
    rank[order] = np.arange(n)
    count = rank - np.searchsorted(C, group * M + (idx - H), side="right") + 1
    if value is None:
        return count, None
    value = np.asarray(value)
    o2 = np.lexsort((idx, value, group))
    same = np.zeros(n, bool)
    same[1:] = (group[o2][1:] == group[o2][:-1]) & (value[o2][1:] == value[o2][:-1])
    prev = np.empty(n, np.int64)
    prev[o2] = np.where(same, np.r_[np.int64(-H - 1), idx[o2][:-1]], -H - 1)
    lo, hi = np.maximum(idx, prev + H), idx + H - 1
    L = np.searchsorted(C, group * M + lo, side="left")
    R = np.searchsorted(C, group * M + hi, side="right")
    diff = np.bincount(L, minlength=n + 1) - np.bincount(R, minlength=n + 1)
    distinct = np.cumsum(diff[:n])[rank]
    return count, distinct


def long_horizon_features(src_h, dst_h, ts, n_long):
    """Victim-centric attacker-cardinality features over the previous n_long packets (inclusive), causal.
    Addresses are used only as anonymous hashes for counting; no identifier becomes a feature."""
    n = len(src_h)
    if n == 0:
        return {c: np.zeros(0, np.float32) for c in LONG_FEATURES}
    H = max(1, int(n_long))
    src, dst = np.asarray(src_h), np.asarray(dst_h)
    ts = np.asarray(ts, np.float64)
    idx = np.arange(n)
    cnt = np.minimum(idx + 1, H).astype(np.float64)
    _, n_src = window_group_stats(np.zeros(n, np.int64), src, H)
    dst_in, fanin = window_group_stats(_group_codes(dst), src, H)
    src_out, fanout = window_group_stats(_group_codes(src), dst, H)
    pair, _ = window_group_stats(_group_codes(src, dst), None, H)
    dur = np.maximum(ts - ts[np.maximum(idx - H + 1, 0)], 1e-6)
    pair_f = pair.astype(np.float64)
    out = {"lh_n_src": n_src, "lh_fanin_dst": fanin, "lh_fanout_src": fanout,
           "lh_peer_max": np.maximum(fanin, fanout),
           "lh_pair_share_min": np.minimum(pair_f / dst_in, pair_f / src_out),
           "lh_dst_share": dst_in / cnt,
           "lh_log_dst_rate": np.log10(dst_in / dur + 1.0),
           "lh_log_pair_rate": np.log10(pair_f / dur + 1.0)}
    return {c: np.asarray(out[c], dtype=np.float32) for c in LONG_FEATURES}


def build_features(raw, n_ctx, n_long=DEFAULT_LONG_CONTEXT_N):
    """raw: DataFrame[RAW_COLUMNS] for ONE contiguous packet segment (in capture order).
    Returns float32 DataFrame[TAB_FEATURES]. Row i uses packets max(0, i-n_ctx+1)..i for the short context and
    max(0, i-n_long+1)..i for the long-horizon features - the past only."""
    n = len(raw)
    g = {c: raw[c].to_numpy() for c in RAW_COLUMNS}
    f = {}
    l4, ipv = g["l4"].astype(np.int32), g["ip_ver"]
    is_tcp, is_udp = (l4 == 6), (l4 == 17)
    is_icmp = (l4 == 1) | (l4 == 58)
    flags = np.where(is_tcp, g["tcp_flags"], 0).astype(np.int32)
    f["frame_len"] = g["frame_len"].astype(np.float32)
    f["ip_hdr_len"] = g["ip_hdr_len"].astype(np.float32)
    f["payload_len"] = g["payload_len"].astype(np.float32)
    f["ttl"] = g["ttl"].astype(np.float32)
    f["is_ipv4"], f["is_ipv6"] = (ipv == 4).astype(np.float32), (ipv == 6).astype(np.float32)
    f["is_arp"] = g["is_arp"].astype(np.float32)
    f["is_tcp"], f["is_udp"], f["is_icmp"] = is_tcp.astype(np.float32), is_udp.astype(np.float32), \
        is_icmp.astype(np.float32)
    f["is_other_l4"] = ((ipv > 0) & ~is_tcp & ~is_udp & ~is_icmp).astype(np.float32)
    for c in ("ip_df", "ip_mf", "ip_frag"):
        f[c] = g[c].astype(np.float32)
    for name, bit in _FLAG_BITS:
        f[name] = ((flags & bit) > 0).astype(np.float32)
    f["tcp_win"] = np.where(is_tcp, g["tcp_win"], 0).astype(np.float32)
    f["tcp_hdr_len"] = np.where(is_tcp, g["tcp_hdr_len"], 0).astype(np.float32)
    f["icmp_type"], f["icmp_code"] = g["icmp_type"].astype(np.float32), g["icmp_code"].astype(np.float32)
    sp, dp = g["sport"].astype(np.int64), g["dport"].astype(np.int64)
    f["sport_mqtt"] = np.isin(sp, MQTT_PORTS).astype(np.float32)
    f["dport_mqtt"] = np.isin(dp, MQTT_PORTS).astype(np.float32)
    f["sport_wellknown"] = ((sp >= 0) & (sp < 1024)).astype(np.float32)
    f["dport_wellknown"] = ((dp >= 0) & (dp < 1024)).astype(np.float32)
    mq = g["mqtt_type"].astype(np.int32)
    f["mqtt_connect"], f["mqtt_publish"] = (mq == 1).astype(np.float32), (mq == 3).astype(np.float32)
    f["mqtt_other"] = ((mq >= 0) & (mq != 1) & (mq != 3)).astype(np.float32)
    ts = g["ts"].astype(np.float64)
    iat = np.zeros(n, np.float64)
    if n > 1:
        iat[1:] = np.clip(np.diff(ts), 0, None)            # out-of-order timestamps clipped at 0
    f["log_iat_prev"] = np.log10(iat + 1e-7).astype(np.float32)
    f["same_src_prev"], f["same_dst_prev"] = _prev_equal(g["src_h"]), _prev_equal(g["dst_h"])
    f["same_sport_prev"], f["same_dport_prev"] = _prev_equal(sp), _prev_equal(dp)
    f["malformed"] = g["malformed"].astype(np.float32)

    # ---- context over the previous n_ctx packets (inclusive) ----
    idx = np.arange(n)
    start = np.maximum(idx - n_ctx + 1, 0)
    cnt = (idx - start + 1).astype(np.float64)
    L = f["frame_len"].astype(np.float64)
    s1, s2 = _window_sum(L, start), _window_sum(L * L, start)
    f["ctx_len_mean"] = s1 / cnt
    f["ctx_len_std"] = np.sqrt(np.clip(s2 / cnt - (s1 / cnt) ** 2, 0, None))
    f["ctx_len_sum"] = s1
    f["ctx_payload_mean"] = _window_sum(f["payload_len"].astype(np.float64), start) / cnt
    T = f["ttl"].astype(np.float64)
    t1, t2 = _window_sum(T, start), _window_sum(T * T, start)
    f["ctx_ttl_mean"] = t1 / cnt
    f["ctx_ttl_std"] = np.sqrt(np.clip(t2 / cnt - (t1 / cnt) ** 2, 0, None))
    # inter-arrival statistics of the packets *inside* the window (start+1 .. i)
    m = np.maximum(cnt - 1, 1)
    i1 = _window_sum(iat, np.minimum(start + 1, idx)) * (cnt > 1)
    i2 = _window_sum(iat * iat, np.minimum(start + 1, idx)) * (cnt > 1)
    imean = i1 / m
    istd = np.sqrt(np.clip(i2 / m - imean ** 2, 0, None))
    f["ctx_log_iat_mean"] = np.log10(imean + 1e-7)
    f["ctx_iat_cv"] = np.where(imean > 0, istd / np.maximum(imean, 1e-12), 0.0)
    dur = np.maximum(ts - ts[start], 1e-6)
    f["ctx_log_pkt_rate"] = np.log10((cnt - 1) / dur + 1.0)
    f["ctx_log_byte_rate"] = np.log10(s1 / dur + 1.0)
    for name, src in [("ctx_syn_ratio", "tcp_syn"), ("ctx_ack_ratio", "tcp_ack"), ("ctx_fin_ratio", "tcp_fin"),
                      ("ctx_rst_ratio", "tcp_rst"), ("ctx_psh_ratio", "tcp_psh"), ("ctx_tcp_ratio", "is_tcp"),
                      ("ctx_udp_ratio", "is_udp"), ("ctx_icmp_ratio", "is_icmp"),
                      ("ctx_mqtt_connect_ratio", "mqtt_connect"), ("ctx_mqtt_publish_ratio", "mqtt_publish")]:
        f[name] = _window_sum(f[src].astype(np.float64), start) / cnt
    f["ctx_other_ratio"] = 1.0 - f["ctx_tcp_ratio"] - f["ctx_udp_ratio"] - f["ctx_icmp_ratio"]
    # min / max / distinct counts via a gathered (n, n_ctx) index matrix, clipped to the segment start
    gi = np.maximum(idx[:, None] - np.arange(n_ctx)[None, :], start[:, None]).astype(np.int64)
    Lw = f["frame_len"][gi]
    f["ctx_len_min"], f["ctx_len_max"] = Lw.min(1), Lw.max(1)
    for name, arr in [("ctx_n_src", g["src_h"]), ("ctx_n_dst", g["dst_h"]), ("ctx_n_sport", sp), ("ctx_n_dport", dp)]:
        w = np.sort(arr[gi], axis=1)
        f[name] = 1.0 + (np.diff(w, axis=1) != 0).sum(1)
    # ---- long horizon, per endpoint: how many hosts are hitting the same victim (DoS vs DDoS) ----
    f.update(long_horizon_features(g["src_h"], g["dst_h"], ts, n_long))
    out = pd.DataFrame({c: np.asarray(f[c], dtype=np.float32) for c in TAB_FEATURES})
    return out


def windows_from_base(base, ends, n_ctx):
    """base: (n, F) array of SEQ_FEATURES; ends: target row indices -> (len(ends), n_ctx, F); zero-padded on the left."""
    base = np.asarray(base, dtype=np.float32)
    pad = np.zeros((n_ctx - 1, base.shape[1]), np.float32)
    padded = np.concatenate([pad, base], 0)
    idx = (np.asarray(ends)[:, None] + np.arange(n_ctx)[None, :])     # shifted by the padding
    return padded[idx]


class StreamFeaturizer:
    """Live-stream feature builder: keeps the last max(n_ctx, n_long) raw packets so every batch is computed exactly
    like the contiguous training blocks (short context AND long-horizon features). Packets whose history is not yet
    full are flagged as warm-up."""

    def __init__(self, n_ctx, n_long=DEFAULT_LONG_CONTEXT_N):
        self.n_ctx, self.n_long = int(n_ctx), int(n_long)
        self.history = max(self.n_ctx, self.n_long)
        self.carry = None
        self.seen = 0

    def transform(self, raw_batch):
        raw_batch = raw_batch.reset_index(drop=True)
        k = 0 if self.carry is None else len(self.carry)
        cat = raw_batch if k == 0 else pd.concat([self.carry, raw_batch], ignore_index=True)
        feats = build_features(cat, self.n_ctx, self.n_long)
        base = feats[SEQ_FEATURES].to_numpy(np.float32)
        ends = np.arange(k, len(cat))
        wins = windows_from_base(base, ends, self.n_ctx)
        gpos = self.seen + np.arange(len(raw_batch))
        # sequence windows that reach back before the stream start are zero-padded on the left
        for j in np.flatnonzero(gpos < self.n_ctx - 1):
            wins[j, : self.n_ctx - 1 - gpos[j]] = 0.0
        warm = gpos < self.history                    # short or long history not yet complete
        self.seen += len(raw_batch)
        self.carry = cat.iloc[-self.history:].reset_index(drop=True)
        return feats.iloc[k:].reset_index(drop=True), wins, warm


# ----------------------------------------------------------------------------------------------------------------
# calibration on probabilities (model-agnostic)
# ----------------------------------------------------------------------------------------------------------------
class ProbaPassthrough(ClassifierMixin, BaseEstimator):
    """Input X = an (n, K) probability matrix from any detector. Exposes log-probabilities as the decision function
    so CalibratedClassifierCV(method='sigmoid') performs Platt scaling on log-probabilities."""

    def __init__(self, n_classes=2):
        self.n_classes = n_classes

    def fit(self, X=None, y=None, sample_weight=None):
        self.classes_ = np.arange(self.n_classes)
        return self

    def predict_proba(self, X):
        P = np.clip(np.asarray(X, dtype=np.float64), 0, None)
        return P / np.clip(P.sum(1, keepdims=True), 1e-12, None)

    def decision_function(self, X):
        return np.log(np.clip(self.predict_proba(X), 1e-9, 1.0))

    def predict(self, X):
        return self.predict_proba(X).argmax(1)
