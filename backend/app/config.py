"""Runtime configuration.

Every knob that changes agent behaviour lives here so the panel demo, the
evaluation harness and production all read from one place.

API keys are read from the environment (or a local .env). Nothing in this
package hard-codes a key, and the system is designed to run with NO key at
all - in that case `LLMClient` reports itself unavailable and every agent
takes its deterministic fallback path.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

try:  # optional convenience, not required
    from dotenv import load_dotenv

    load_dotenv()
except Exception:  # pragma: no cover
    pass

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

# ---------------------------------------------------------------------------
# PCAP detector configuration (Detector_Run_2, joblib-trained models)
# ---------------------------------------------------------------------------
# Root of the FYP repo (one level above backend/)
_PROJECT_ROOT = BASE_DIR.parent

#: Detector run directory containing the trained joblib bundle
DETECTOR_RUN_DIR = _PROJECT_ROOT / "agents" / "Detector_Run_2" / "run_c53a51becb"

#: Deployment artifact - the trained detector bundle (joblib)
DETECTOR_BUNDLE_PATH = DETECTOR_RUN_DIR / "models" / "detector_bundle.joblib"

#: Directory holding the bundle + iomt_runtime.py / iomt_inference.py
DETECTOR_MODELS_DIR = DETECTOR_RUN_DIR / "models"

#: PCAP test captures used for replay / live detection
PCAP_TEST_DIR = _PROJECT_ROOT / "data" / "pcap_test"

#: Detector mode: "pcap" (joblib bundle over PCAP files), "legacy", "multiclass", "fixture"
DETECTOR_MODE = os.getenv("IDS_DETECTOR", "pcap")


@dataclass(frozen=True)
class Thresholds:
    """Reuse gates.

    Deliberately conservative. In a hospital the same attack family against a
    different device class can require a completely different response, so a
    high similarity score alone never authorises reuse.
    """

    high_similarity: float = 0.92
    partial_similarity: float = 0.75
    min_reliability: float = 0.80
    fast_path_confidence: float = 0.95
    #: below this the detector is not trusted enough to skip investigation
    min_action_confidence: float = 0.80


def _keys(name: str) -> tuple[str, ...]:
    """Read a comma-separated key pool from the environment."""
    return tuple(k.strip() for k in os.getenv(name, "").split(",") if k.strip())


@dataclass(frozen=True)
class Provider:
    """One LLM provider plus its key pool.

    Multiple keys per provider are not redundancy theatre: free-tier inference
    endpoints rate-limit per key, and an agent chain can fire several calls per
    incident. Rotating across the pool is what keeps a burst of incidents from
    knocking the whole reasoning layer offline.
    """

    name: str
    keys: tuple[str, ...]
    model: str
    endpoint: str
    #: Some models reject the provider's strict JSON mode when they emit
    #: reasoning tokens first (Groq's gpt-oss returns json_validate_failed).
    #: We rely on the prompt plus a tolerant extractor for those instead.
    json_mode: bool = True
    #: Thinking models spend part of the output budget reasoning before they
    #: answer, which truncates the actual response. Gemini 3.x will not accept a
    #: zero budget, so we cap the level instead and leave headroom in max_tokens.
    thinking_level: str | None = None
    #: per-provider timeout override; thinking models need longer than the default
    timeout_s: float | None = None

    @property
    def configured(self) -> bool:
        return bool(self.keys)


@dataclass(frozen=True)
class LLMSettings:
    #: providers are tried in this order; within a provider, keys rotate
    chain: tuple[str, ...] = tuple(
        p.strip() for p in os.getenv("LLM_PROVIDER_CHAIN", "groq,gemini").split(",") if p.strip()
    )
    timeout_s: float = float(os.getenv("LLM_TIMEOUT_S", "12"))
    max_retries: int = int(os.getenv("LLM_MAX_RETRIES", "1"))
    #: consecutive failures across the whole chain before the circuit opens
    circuit_breaker_threshold: int = int(os.getenv("LLM_CB_THRESHOLD", "4"))
    #: seconds the circuit stays open before a probe request is allowed
    circuit_breaker_cooldown_s: float = float(os.getenv("LLM_CB_COOLDOWN_S", "30"))

    providers: dict[str, Provider] = field(
        default_factory=lambda: {
            "groq": Provider(
                name="groq",
                keys=_keys("GROQ_API_KEYS") or _keys("GROQ_API_KEY"),
                model=os.getenv("GROQ_MODEL", "openai/gpt-oss-120b"),
                endpoint="https://api.groq.com/openai/v1/chat/completions",
                json_mode=False,
            ),
            "gemini": Provider(
                name="gemini",
                keys=_keys("GEMINI_API_KEYS") or _keys("GEMINI_API_KEY"),
                model=os.getenv("GEMINI_MODEL", "gemini-3.6-flash"),
                endpoint="https://generativelanguage.googleapis.com/v1beta/models",
                thinking_level="low",
                timeout_s=float(os.getenv("GEMINI_TIMEOUT_S", "30")),
            ),
            "anthropic": Provider(
                name="anthropic",
                keys=_keys("ANTHROPIC_API_KEYS") or _keys("ANTHROPIC_API_KEY"),
                model=os.getenv("ANTHROPIC_MODEL", "claude-sonnet-5"),
                endpoint="https://api.anthropic.com/v1/messages",
            ),
            "openai": Provider(
                name="openai",
                keys=_keys("OPENAI_API_KEYS") or _keys("OPENAI_API_KEY"),
                model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                endpoint="https://api.openai.com/v1/chat/completions",
            ),
        }
    )

    @property
    def active(self) -> list[Provider]:
        """Configured providers, in preference order."""
        return [p for n in self.chain if (p := self.providers.get(n)) and p.configured]

    @property
    def configured(self) -> bool:
        return bool(self.active)

    @property
    def total_keys(self) -> int:
        return sum(len(p.keys) for p in self.active)


@dataclass(frozen=True)
class Settings:
    thresholds: Thresholds = field(default_factory=Thresholds)
    llm: LLMSettings = field(default_factory=LLMSettings)
    # Prior cases are useful for retrieval and comparison, but cannot skip
    # investigation until the detector is calibrated and both outcome metrics
    # are measured by the lab gateway.
    enable_verified_reuse: bool = os.getenv("ENABLE_VERIFIED_REUSE", "false").lower() in ("1", "true", "yes")
    cases_path: Path = DATA_DIR / "cases.json"
    #: pristine 7-case store; live runs append to cases.json, so demos reset from here
    cases_seed_path: Path = DATA_DIR / "cases.seed.json"
    #: hard ceiling on unattended action duration (seconds)
    max_unattended_action_s: int = 300
    #: specialist worker budget before the Investigator gives up on it
    specialist_timeout_s: float = float(os.getenv('SPECIALIST_TIMEOUT_S', '8'))
    #: how many times the supervisor restarts a crashed planner
    planner_max_restarts: int = 3
    #: dev-server origins allowed to call this service; 8443 is the Vite port
    #: configured in vite.config.ts, 5173/5178 are the plain Vite defaults
    cors_origins: tuple[str, ...] = (
        "http://localhost:5173",
        "http://localhost:5178",
        "http://localhost:8443",
        "http://127.0.0.1:8443",
    )


settings = Settings()
