"""Memory Agent - adaptive case store.

This is the component that makes the system improve over time. It does NOT
retrain the detector and it does NOT fine-tune a model. It stores what actually
happened - evidence, action, and the *measured* outcome - and retrieves it when
a comparable incident arrives.

Two properties matter for a hospital deployment:

* **Similarity never authorises reuse on its own.** A case must also be
  context-compatible (same device class constraints) and its prior outcome must
  have proven reliable. A 0.97-similar case whose action was recorded HARMFUL is
  worse than no case at all.
* **Nothing is stored without a measured outcome.** An action whose effect we
  could not observe teaches us nothing and must not become precedent.

Similarity is a weighted structured score by default, with an optional
embedding term. The structured part is transparent and auditable, which matters
more here than raw recall: a reviewer can see exactly why two cases matched.

Memory is two-tier:

* **Primary** - the full case store. Authoritative, and scored against every
  case, so its cost grows with the store.
* **Secondary** - a bounded TTL cache of recently-useful case copies. Checked
  first, so a repeat attack family answers in constant time instead of paying
  for a full scan. See `CaseCache`.

The cache is a performance tier, never a safety one: cached entries pass the
same reuse gate as primary hits.
"""

from __future__ import annotations

import json
import math
import time
from collections import OrderedDict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

from app.config import settings
from app.schemas import CaseRecord, DetectorEvent, Outcome, RetrievedCase, SimilarityBand

# Field weights for structured similarity. They sum to 1.0.
WEIGHTS = {
    "attack_subtype": 0.30,
    "attack_family": 0.15,
    "device_type": 0.20,
    "device_criticality": 0.15,
    "source_cardinality": 0.12,
    "rate_band": 0.08,
}

#: device classes where an irreversible action can interrupt patient care
LIFE_CRITICAL_CLASSES = {"patient-monitor-gateway", "infusion-pump", "ventilator", "telemetry-hub"}

#: actions that must never run against a life-critical class, whatever the model says
IRREVERSIBLE_ACTIONS = ("device_isolate", "vlan_quarantine", "port_shutdown")


def _rate_band(pps: float) -> str:
    if pps < 5_000:
        return "low"
    if pps < 15_000:
        return "mid"
    return "high"


def _criticality_distance(a: str, b: str) -> float:
    order = {"Low": 0, "Medium": 1, "High": 2, "Critical": 3}
    return abs(order.get(a, 0) - order.get(b, 0)) / 3.0


# --------------------------------------------------------------------------- #
# Secondary memory - the recall cache
# --------------------------------------------------------------------------- #
@dataclass
class CacheEntry:
    """One cached case copy, with the TTL that keeps it there."""

    case: CaseRecord
    #: attacks remaining before eviction; refreshed to TTL_ATTACKS on every hit
    ttl: int
    hits: int = 0
    inserted_at_incident: int = 0
    last_hit_at_incident: int = 0
    promoted_by: str = ""

    def to_json(self) -> dict[str, Any]:
        return {
            "case_id": self.case.case_id,
            "attack_subtype": self.case.attack_subtype,
            "device_type": self.case.device_type,
            "device_criticality": self.case.device_criticality,
            "outcome": self.case.outcome.value,
            "reliability": self.case.reliability,
            "ttl_attacks_remaining": self.ttl,
            "hits": self.hits,
            "inserted_at_incident": self.inserted_at_incident,
            "last_hit_at_incident": self.last_hit_at_incident,
            "promoted_by": self.promoted_by,
        }


class CaseCache:
    """Secondary memory: a bounded, TTL-limited queue of recently-useful cases.

    Primary memory is the full case store. Answering from it means scoring the
    incident against **every** case, so its cost grows with the store - fine at
    seven cases, not fine at ten thousand.

    Secondary memory bounds that work. When primary confirms a match (incident B
    matched stored case A), a **copy of A** is promoted here. The next incident
    checks these <= 10 entries first; only on a miss does it pay for the full
    scan. Lookup cost becomes constant instead of linear in the store size.

    Lifetime is measured in attacks, not seconds: an entry survives
    `TTL_ATTACKS` incidents, and every hit refreshes it back to full. A case that
    stops being relevant ages out on its own, without anyone deciding to evict it.

    The cache is a *performance* tier, never a *safety* one. Entries are copies
    of already-validated cases and they go through exactly the same reuse gate -
    similarity, context compatibility and reliability - as a primary hit. A
    cached case can never authorise something the primary store would refuse.
    """

    CAPACITY = 10
    TTL_ATTACKS = 5

    def __init__(self) -> None:
        self.entries: OrderedDict[str, CacheEntry] = OrderedDict()
        self.incident_counter = 0
        self.lookups = 0
        self.hits = 0
        self.promotions = 0
        self.evictions_ttl = 0
        self.evictions_capacity = 0
        self.last_lookup_us = 0
        self.last_tier = "-"

    # ------------------------------------------------------------------ #
    def lookup(
        self,
        event: DetectorEvent,
        cardinality: str,
        similarity: Callable[[DetectorEvent, CaseRecord, str], float],
        compatible: Callable[[DetectorEvent, CaseRecord], tuple[bool, str | None]],
    ) -> tuple[RetrievedCase | None, list[RetrievedCase]]:
        """Score the incident against the cached copies only.

        Returns the best gate-passing entry (or None) plus everything it looked
        at, so the audit trail shows what the cache considered rather than only
        what it returned.
        """
        started = time.perf_counter()
        self.lookups += 1
        considered: list[RetrievedCase] = []
        best: RetrievedCase | None = None

        for entry in self.entries.values():
            sim = similarity(event, entry.case, cardinality)
            ok, reason = compatible(event, entry.case)
            if ok and sim < settings.thresholds.partial_similarity:
                ok, reason = False, (
                    f"similarity {sim} is below the reuse floor of "
                    f"{settings.thresholds.partial_similarity}"
                )
            rc = RetrievedCase(
                case=entry.case, similarity=sim, context_compatible=ok,
                incompatibility_reason=reason, tier="cache",
            )
            considered.append(rc)
            if ok and (best is None or sim > best.similarity):
                best = rc

        self.last_lookup_us = int((time.perf_counter() - started) * 1_000_000)
        if best is not None:
            self.hits += 1
            self.last_tier = "cache"
            hit = self.entries[best.case.case_id]
            hit.hits += 1
            hit.ttl = self.TTL_ATTACKS  # a hit buys another full lifetime
            hit.last_hit_at_incident = self.incident_counter
            self.entries.move_to_end(best.case.case_id)
        else:
            self.last_tier = "primary"

        considered.sort(key=lambda r: r.similarity, reverse=True)
        return best, considered

    # ------------------------------------------------------------------ #
    def promote(self, case: CaseRecord, promoted_by: str) -> dict[str, Any]:
        """Put a copy of a confirmed-match case into the cache."""
        existing = self.entries.get(case.case_id)
        if existing is not None:
            existing.ttl = self.TTL_ATTACKS
            self.entries.move_to_end(case.case_id)
            return {"promoted": case.case_id, "action": "refreshed", "ttl": existing.ttl}

        evicted = None
        if len(self.entries) >= self.CAPACITY:
            # queue discipline: the least recently useful entry leaves first
            evicted, _ = self.entries.popitem(last=False)
            self.evictions_capacity += 1

        # a copy - primary memory stays the single source of truth
        self.entries[case.case_id] = CacheEntry(
            case=case.model_copy(deep=True),
            ttl=self.TTL_ATTACKS,
            inserted_at_incident=self.incident_counter,
            promoted_by=promoted_by,
        )
        self.promotions += 1
        return {
            "promoted": case.case_id,
            "action": "inserted",
            "ttl": self.TTL_ATTACKS,
            "evicted_for_capacity": evicted,
            "size": len(self.entries),
        }

    # ------------------------------------------------------------------ #
    def age(self, hit_case_id: str | None) -> list[str]:
        """Count this incident against every entry that did not help.

        Called once per incident. An entry that was hit has already been
        refreshed; everything else loses one life and is dropped at zero.
        """
        current = self.incident_counter
        self.incident_counter += 1
        expired: list[str] = []
        for case_id, entry in list(self.entries.items()):
            if case_id == hit_case_id:
                continue
            if entry.inserted_at_incident == current:
                # promoted during this very incident - it gets the full five
                # attacks starting from the next one, not four
                continue
            entry.ttl -= 1
            if entry.ttl <= 0:
                del self.entries[case_id]
                expired.append(case_id)
                self.evictions_ttl += 1
        return expired

    def clear(self) -> None:
        self.entries.clear()
        self.incident_counter = 0
        self.lookups = self.hits = self.promotions = 0
        self.evictions_ttl = self.evictions_capacity = 0
        self.last_lookup_us = 0
        self.last_tier = "-"

    # ------------------------------------------------------------------ #
    def stats(self) -> dict[str, Any]:
        return {
            "capacity": self.CAPACITY,
            "size": len(self.entries),
            "ttl_attacks": self.TTL_ATTACKS,
            "incidents_seen": self.incident_counter,
            "lookups": self.lookups,
            "hits": self.hits,
            "hit_rate_pct": round(100 * self.hits / self.lookups, 1) if self.lookups else None,
            "promotions": self.promotions,
            "evictions_ttl": self.evictions_ttl,
            "evictions_capacity": self.evictions_capacity,
            "last_lookup_us": self.last_lookup_us,
            "last_tier": self.last_tier,
            # newest first, so the UI reads like a queue
            "entries": [e.to_json() for e in reversed(self.entries.values())],
        }


#: Process-wide, because the cache is runtime state that must survive from one
#: incident to the next - a TTL measured in attacks means nothing otherwise.
CACHE = CaseCache()


class MemoryAgent:
    def __init__(
        self,
        cases_path: Path | None = None,
        embedder: Callable[[str], list[float]] | None = None,
        available: bool = True,
    ) -> None:
        self.path = cases_path or settings.cases_path
        self.database_backed = cases_path is None
        self.store = None
        if self.database_backed:
            from app.run_store import RUNS
            self.store = RUNS
        self.embedder = embedder
        self.available = available
        self.outbox: list[CaseRecord] = []  # write-backs waiting for the store to return
        self.cases: list[CaseRecord] = self._load()
        #: secondary memory is process-wide: a TTL counted in attacks only means
        #: something if the cache outlives a single request
        self.cache = CACHE
        # A cached copy cannot overrule newer shared-store evidence.
        authoritative = {case.case_id: case for case in self.cases}
        for case_id in list(self.cache.entries):
            if case_id not in authoritative:
                del self.cache.entries[case_id]
            else:
                self.cache.entries[case_id].case = authoritative[case_id].model_copy(deep=True)
        self.last_primary_lookup_us = 0

    # ------------------------------------------------------------------ #
    def _load(self) -> list[CaseRecord]:
        if not self.available:
            return []
        if self.database_backed:
            self.store.drain_case_outbox()
            # JSON is seed import only; concurrent runtime writes use transactions.
            seed = settings.cases_seed_path
            if seed.exists():
                self.store.seed_cases(json.loads(seed.read_text(encoding='utf-8')))
            return [CaseRecord.model_validate(c) for c in self.store.load_cases()]
        if not self.path.exists():
            return []
        raw = json.loads(self.path.read_text(encoding="utf-8"))
        return [CaseRecord(**c) for c in raw]

    def _persist(self) -> None:
        if self.database_backed:
            raise RuntimeError('shared memory requires per-case transactional writes')
        self.path.write_text(
            json.dumps([c.model_dump(mode="json") for c in self.cases], indent=2),
            encoding="utf-8",
        )

    # ------------------------------------------------------------------ #
    def similarity(self, event: DetectorEvent, case: CaseRecord, cardinality: str) -> float:
        """Weighted structured similarity in [0, 1].

        Every term is explainable, which is what lets an operator audit why a
        prior case was considered comparable.

        Fields the current incident cannot supply are **dropped and the
        remaining weights renormalised**, rather than scored as a mismatch.
        Source cardinality is the live example: the CICIoMT2024 feature schema
        has no addresses, so scoring it 0 would penalise every case equally and
        push a genuinely identical incident below the reuse floor for a reason
        that has nothing to do with how similar it is. The comparison is instead
        made over the evidence that exists, and `compared_fields` records which
        those were.
        """
        terms: list[tuple[str, float]] = [
            ("attack_subtype", 1.0 if event.attack_subtype == case.attack_subtype else 0.0),
            ("attack_family", 1.0 if event.attack_family == case.attack_family else 0.0),
            ("device_type", 1.0 if event.device_type == case.device_type else 0.0),
            ("device_criticality",
             1.0 - _criticality_distance(event.device_criticality, case.device_criticality)),
            ("rate_band",
             1.0 if _rate_matches(event.packets_per_sec, case.peak_rate) else 0.0),
        ]
        if cardinality != "unknown":
            terms.append(("source_cardinality", 1.0 if cardinality == case.source_cardinality else 0.0))

        total_weight = sum(WEIGHTS[name] for name, _ in terms)
        s = sum(WEIGHTS[name] * value for name, value in terms) / total_weight

        if self.embedder is not None:
            # Optional semantic term over the behavioural signature. Blended,
            # never dominant: an embedding cannot outvote the structured facts.
            a = self.embedder(f"{event.attack_subtype} {' '.join(event.top_features)}")
            b = self.embedder(case.behavioral_signature)
            s = 0.75 * s + 0.25 * _cosine(a, b)

        return round(min(1.0, max(0.0, s)), 3)

    def compared_fields(self, cardinality: str) -> list[str]:
        """Which similarity terms were actually available for this incident."""
        fields = ["attack_subtype", "attack_family", "device_type", "device_criticality", "rate_band"]
        if cardinality != "unknown":
            fields.append("source_cardinality")
        return fields

    # ------------------------------------------------------------------ #
    def context_compatible(self, event: DetectorEvent, case: CaseRecord) -> tuple[bool, str | None]:
        """The gate that similarity is not allowed to bypass."""
        if case.outcome is not Outcome.SUCCESS:
            return False, (
                f"prior outcome {case.outcome.value} (reliability {case.reliability}) - "
                f"executed action {case.executed_response} is blacklisted for reuse"
            )
        if case.reliability < settings.thresholds.min_reliability:
            return False, f"prior reliability {case.reliability} is below the {settings.thresholds.min_reliability} floor"
        if event.device_type in LIFE_CRITICAL_CLASSES and case.device_type not in LIFE_CRITICAL_CLASSES:
            return False, (
                f"device class differs: target {event.device_type} is life-critical, "
                f"prior case ran against {case.device_type}; allowed action sets differ"
            )
        if any(a in case.executed_response for a in IRREVERSIBLE_ACTIONS) and event.device_type in LIFE_CRITICAL_CLASSES:
            return False, "prior action is irreversible and the target device class forbids it"
        return True, None

    # ------------------------------------------------------------------ #
    def retrieve(self, event: DetectorEvent, cardinality: str, k: int = 3,
                 eligibility: Callable[[CaseRecord], bool] | None = None) -> list[RetrievedCase]:
        """Top-k retrieval, gated before truncation.

        Ranking by raw similarity and *then* cutting to k is wrong here: an
        unproven near-duplicate (reliability 0.5, written by a recent run) scores
        higher than the validated case it was derived from, so a naive top-k can
        push the only reusable case out of the window and silently downgrade the
        route. We therefore partition first and keep the best usable cases, plus
        a couple of blocked ones so the audit trail still shows what was rejected
        and why.
        """
        if not self.available:
            return []
        started = time.perf_counter()
        usable: list[RetrievedCase] = []
        blocked: list[RetrievedCase] = []
        for case in self.cases:
            sim = self.similarity(event, case, cardinality)
            ok, reason = self.context_compatible(event, case)
            if ok and eligibility is not None and not eligibility(case):
                ok, reason = False, 'case does not meet operational measured-evidence eligibility'
            if ok and sim < settings.thresholds.partial_similarity:
                ok, reason = False, f"similarity {sim} is below the reuse floor of {settings.thresholds.partial_similarity}"
            entry = RetrievedCase(
                case=case, similarity=sim, context_compatible=ok,
                incompatibility_reason=reason, tier="primary",
            )
            (usable if ok else blocked).append(entry)

        self.last_primary_lookup_us = int((time.perf_counter() - started) * 1_000_000)
        usable.sort(key=lambda r: r.similarity, reverse=True)
        blocked.sort(key=lambda r: r.similarity, reverse=True)
        return usable[:k] + blocked[: max(0, (k + 2) - min(len(usable), k))][:2]

    # ------------------------------------------------------------------ #
    def recall(self, event: DetectorEvent, cardinality: str, k: int = 3,
               eligibility: Callable[[CaseRecord], bool] | None = None) -> dict[str, Any]:
        """Two-tier retrieval: secondary cache first, primary store on a miss.

        Returns everything the UI and the audit log need to show *which* tier
        answered and what it cost, because "the cache made this faster" is a
        claim that should come with a measurement.
        """
        if not self.available:
            return {
                "tier": "unavailable", "retrieved": [], "cache_considered": [],
                "cache_hit": None, "promotion": None, "expired": [],
                "primary_us": None, "cache_us": None,
            }

        def compatible(current, case):
            ok, reason = self.context_compatible(current, case)
            if ok and eligibility is not None and not eligibility(case):
                return False, 'case does not meet operational measured-evidence eligibility'
            return ok, reason

        cache_hit, cache_considered = self.cache.lookup(event, cardinality, self.similarity, compatible)

        if cache_hit is not None:
            # Secondary answered. Primary is not scanned at all - that saving is
            # the entire point of the tier.
            expired = self.cache.age(cache_hit.case.case_id)
            return {
                "tier": "cache",
                "retrieved": [cache_hit],
                "cache_considered": cache_considered,
                "cache_hit": cache_hit.case.case_id,
                "promotion": None,
                "expired": expired,
                "primary_us": None,
                "cache_us": self.cache.last_lookup_us,
                "primary_scan_skipped": len(self.cases),
            }

        retrieved = self.retrieve(event, cardinality, k, eligibility)
        _, best = self.classify(retrieved)

        # A confirmed primary match earns a copy in secondary memory, so the
        # next comparable attack does not repeat the scan.
        promotion = None
        if best is not None:
            promotion = self.cache.promote(best.case, promoted_by=event.incident_id)
        expired = self.cache.age(None)

        return {
            "tier": "primary",
            "retrieved": retrieved,
            "cache_considered": cache_considered,
            "cache_hit": None,
            "promotion": promotion,
            "expired": expired,
            "primary_us": self.last_primary_lookup_us,
            "cache_us": self.cache.last_lookup_us,
            "primary_cases_scanned": len(self.cases),
        }

    def classify(self, retrieved: list[RetrievedCase]) -> tuple[SimilarityBand, RetrievedCase | None]:
        t = settings.thresholds
        usable = [r for r in retrieved if r.reusable(t.min_reliability, t.partial_similarity)]
        if not usable:
            return SimilarityBand.NONE, None
        best = usable[0]
        if best.similarity >= t.high_similarity:
            return SimilarityBand.HIGH, best
        return SimilarityBand.PARTIAL, best

    # ------------------------------------------------------------------ #
    def write_back(self, case: CaseRecord, reused: RetrievedCase | None = None) -> dict[str, Any]:
        """Store a validated case and update the reliability of what was reused.

        Reliability is the honest part of the loop: a reused case that worked
        gains a little trust, one that only partly worked loses more than it
        would have gained. Trust is slow to build and fast to lose, which is the
        right asymmetry when the downside is patient harm.
        """
        if case.outcome is Outcome.UNVALIDATED:
            return {"stored": False, "reason": "outcome was never measured - refusing to create precedent"}

        if case.source_mode != 'live_lab':
            return {'stored': False, 'reason': 'fixture/replay/stub outcomes cannot become measured live precedent'}

        if self.database_backed:
            prior_id = reused.case.case_id if reused else None
            if not self.available:
                self.store.queue_case(case.model_dump(mode='json'), prior_id)
                return {'stored': False, 'queued': True, 'durable': True, 'case_id': case.case_id}
            result = self.store.write_case(case.model_dump(mode='json'), prior_id)
            self.cases = self._load()
            self.cache.clear()
            return result

        if not self.available:
            self.outbox.append(case)
            return {"stored": False, "queued": True, "outbox_depth": len(self.outbox)}

        self.cases.append(case)
        delta: dict[str, Any] = {"stored": True, "case_id": case.case_id}

        if reused is not None:
            prior = reused.case
            before = prior.reliability
            if case.outcome is Outcome.SUCCESS:
                prior.reliability = round(min(0.99, prior.reliability + 0.02), 2)
            elif case.outcome is Outcome.PARTIAL:
                prior.reliability = round(max(0.0, prior.reliability - 0.06), 2)
            else:
                prior.reliability = round(max(0.0, prior.reliability - 0.25), 2)
            prior.reuse_count += 1
            prior.last_validated = datetime.now(timezone.utc).isoformat()
            delta["reused_case"] = {
                "case_id": prior.case_id,
                "reliability": [before, prior.reliability],
                "reuse_count": prior.reuse_count,
            }

        self._persist()
        return delta

    def drain_outbox(self) -> int:
        """Replay queued write-backs once the store is reachable again."""
        if self.database_backed:
            return self.store.drain_case_outbox() if self.available else 0
        if not self.available or not self.outbox:
            return 0
        n = len(self.outbox)
        self.cases.extend(self.outbox)
        self.outbox.clear()
        self._persist()
        return n

    # ------------------------------------------------------------------ #
    def coverage(self) -> dict[str, Any]:
        """What the store currently knows - the adaptation surface."""
        families: dict[str, int] = {}
        devices: dict[str, int] = {}
        for c in self.cases:
            families[c.attack_subtype] = families.get(c.attack_subtype, 0) + 1
            devices[c.device_type] = devices.get(c.device_type, 0) + 1
        trusted = [c for c in self.cases if c.reliability >= settings.thresholds.min_reliability]
        return {
            "total_cases": len(self.cases),
            "trusted_cases": len(trusted),
            "blacklisted_cases": len([c for c in self.cases if c.outcome is Outcome.HARMFUL]),
            "attack_subtypes_covered": families,
            "device_types_covered": devices,
        }


def _parse_rate(rate: str) -> float:
    """'15k msg/s' -> 15000.0"""
    num = "".join(ch for ch in rate if ch.isdigit() or ch == ".")
    if not num:
        return 0.0
    val = float(num)
    return val * 1000 if "k" in rate.lower() else val


def _rate_matches(pps: float, prior: str) -> bool:
    bands = {'<1k': (0, 1000), '1k-10k': (1000, 10000),
             '10k-100k': (10000, 100000), '>=100k': (100000, float('inf'))}
    if prior in bands:
        low, high = bands[prior]
        return low <= pps < high
    return _rate_band(pps) == _rate_band(_parse_rate(prior))


def _cosine(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    return dot / (na * nb) if na and nb else 0.0
