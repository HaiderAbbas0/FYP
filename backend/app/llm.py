"""LLM access with an explicit failure contract.

Design rule from the pipeline document: the LLM is a reasoning component, not
the system. Every caller of this module must be able to continue without it.
`LLMClient.complete_json` therefore never raises - it returns `None`, and the
calling agent takes its deterministic path.

Four layers of protection, innermost first:

1. **Key rotation** - each provider has a pool of keys. A 429 or 401 rotates to
   the next key rather than failing the call. Free-tier inference endpoints
   rate-limit per key, and one incident can fire several agent calls.
2. **Provider failover** - if every key for the preferred provider is exhausted,
   the next provider in the chain is tried with the same prompt.
3. **Circuit breaker** - after N consecutive whole-chain failures the circuit
   opens. During an outage the pipeline runs deterministically at full speed
   instead of paying the timeout on every call.
4. **Schema validation** - a malformed or hallucinated response is treated
   exactly like a failure. Downstream agents see a valid object or nothing.
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
from typing import Any

import httpx

from .config import Provider, settings

log = logging.getLogger(__name__)

#: statuses that mean "this key is spent, try the next one" rather than
#: "this provider is broken"
ROTATE_STATUSES = {401, 402, 403, 429}


class CircuitBreaker:
    def __init__(self, threshold: int, cooldown_s: float) -> None:
        self.threshold = threshold
        self.cooldown_s = cooldown_s
        self.failures = 0
        self.opened_at: float | None = None

    @property
    def is_open(self) -> bool:
        if self.opened_at is None:
            return False
        if time.time() - self.opened_at >= self.cooldown_s:
            # half-open: allow one probe through
            self.opened_at = None
            self.failures = self.threshold - 1
            return False
        return True

    def record_success(self) -> None:
        self.failures = 0
        self.opened_at = None

    def record_failure(self) -> None:
        self.failures += 1
        if self.failures >= self.threshold and self.opened_at is None:
            self.opened_at = time.time()
            log.warning("LLM circuit breaker OPEN after %s consecutive failures", self.failures)


class KeyPool:
    """Round-robin over one provider's keys, with per-key cooldown.

    A key that returns 429 is parked for `cooldown_s` rather than removed, so a
    temporary rate limit does not permanently shrink the pool.
    """

    def __init__(self, provider: Provider, cooldown_s: float = 60.0) -> None:
        self.provider = provider
        self.cooldown_s = cooldown_s
        self.cursor = 0
        self.parked: dict[str, float] = {}

    def available(self) -> list[str]:
        now = time.time()
        return [k for k in self.provider.keys if self.parked.get(k, 0) <= now]

    def next_key(self) -> str | None:
        keys = self.available()
        if not keys:
            return None
        key = keys[self.cursor % len(keys)]
        self.cursor += 1
        return key

    def park(self, key: str) -> None:
        self.parked[key] = time.time() + self.cooldown_s
        log.warning("Parked %s key ...%s for %ss", self.provider.name, key[-6:], self.cooldown_s)


class LLMClient:
    """Provider-agnostic JSON completion client.

    `force_unavailable` exists so the simulation UI can inject an
    LLM-provider-down fault without touching real credentials.
    """

    def __init__(self, force_unavailable: bool = False) -> None:
        self.cfg = settings.llm
        self.force_unavailable = force_unavailable
        self.breaker = CircuitBreaker(self.cfg.circuit_breaker_threshold, self.cfg.circuit_breaker_cooldown_s)
        self.pools = {p.name: KeyPool(p) for p in self.cfg.active}
        self.calls = 0
        self.failures = 0
        self.rotations = 0
        self.failovers = 0
        self.total_latency_ms = 0
        self.last_provider: str | None = None
        self.last_error: str | None = None

    @property
    def available(self) -> bool:
        return self.cfg.configured and not self.force_unavailable and not self.breaker.is_open

    # ------------------------------------------------------------------ #
    async def complete_json(
        self,
        system: str,
        user: str,
        *,
        max_tokens: int = 900,
    ) -> dict[str, Any] | None:
        """Return a parsed JSON object, or None if no provider could serve it.

        None is a normal, expected outcome - not an error condition.
        """
        if not self.available:
            return None

        chain = self.cfg.active
        for idx, provider in enumerate(chain):
            pool = self.pools[provider.name]
            # one attempt per available key, plus the configured retries
            budget = len(pool.available()) + self.cfg.max_retries
            for _ in range(budget):
                key = pool.next_key()
                if key is None:
                    break  # whole pool parked - fail over to the next provider

                started = time.perf_counter()
                try:
                    raw = await self._request(provider, key, system, user, max_tokens)
                    parsed = _extract_json(raw)
                    if parsed is None:
                        raise ValueError("model returned no parseable JSON object")
                    self.breaker.record_success()
                    self.calls += 1
                    self.last_provider = provider.name
                    self.total_latency_ms += int((time.perf_counter() - started) * 1000)
                    return parsed

                except httpx.HTTPStatusError as exc:
                    self.failures += 1
                    self.last_error = f"{provider.name} HTTP {exc.response.status_code}"
                    if exc.response.status_code in ROTATE_STATUSES:
                        pool.park(key)
                        self.rotations += 1
                        continue  # next key
                    log.warning("%s failed: %s", provider.name, self.last_error)
                    break  # server-side problem - fail over

                except Exception as exc:  # noqa: BLE001 - deliberate catch-all
                    self.failures += 1
                    self.last_error = f"{provider.name}: {type(exc).__name__}: {exc}".rstrip(": ")
                    log.warning("LLM attempt failed: %s", self.last_error)
                    await asyncio.sleep(0.2)
                    continue

            if idx + 1 < len(chain):
                self.failovers += 1
                log.warning("Failing over from %s to %s", provider.name, chain[idx + 1].name)

        # every provider and every key exhausted
        self.breaker.record_failure()
        return None

    # ------------------------------------------------------------------ #
    async def _request(self, provider: Provider, key: str, system: str, user: str, max_tokens: int) -> str:
        timeout = provider.timeout_s or self.cfg.timeout_s
        async with httpx.AsyncClient(timeout=timeout) as client:
            if provider.name in ("groq", "openai"):
                # Groq is OpenAI-compatible, so one branch serves both.
                body: dict[str, Any] = {
                    "model": provider.model,
                    "max_tokens": max_tokens,
                    "temperature": 0.2,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                }
                if provider.json_mode:
                    body["response_format"] = {"type": "json_object"}
                r = await client.post(
                    provider.endpoint,
                    headers={"Authorization": f"Bearer {key}", "content-type": "application/json"},
                    json=body,
                )
                r.raise_for_status()
                return r.json()["choices"][0]["message"]["content"] or ""

            if provider.name == "gemini":
                gen: dict[str, Any] = {
                    # reasoning tokens are billed against this budget too
                    "maxOutputTokens": max_tokens + 600 if provider.thinking_level else max_tokens,
                    "temperature": 0.2,
                    "responseMimeType": "application/json",
                }
                if provider.thinking_level:
                    # Otherwise the model spends the output budget reasoning and
                    # the answer comes back truncated mid-object.
                    gen["thinkingConfig"] = {"thinkingLevel": provider.thinking_level}
                r = await client.post(
                    f"{provider.endpoint}/{provider.model}:generateContent",
                    headers={"x-goog-api-key": key, "content-type": "application/json"},
                    json={
                        "systemInstruction": {"parts": [{"text": system}]},
                        "contents": [{"role": "user", "parts": [{"text": user}]}],
                        "generationConfig": gen,
                    },
                )
                r.raise_for_status()
                data = r.json()
                cands = data.get("candidates") or []
                if not cands:
                    raise ValueError(f"gemini returned no candidate ({data.get('promptFeedback')})")
                cand = cands[0]
                parts = (cand.get("content") or {}).get("parts") or []
                text = "".join(p["text"] for p in parts if isinstance(p, dict) and "text" in p)
                if not text:
                    raise ValueError(f"gemini returned no text (finishReason={cand.get('finishReason')})")
                return text

            if provider.name == "anthropic":
                r = await client.post(
                    provider.endpoint,
                    headers={"x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json"},
                    json={
                        "model": provider.model,
                        "max_tokens": max_tokens,
                        "system": system,
                        "messages": [{"role": "user", "content": user}],
                    },
                )
                r.raise_for_status()
                return r.json()["content"][0]["text"]

        raise RuntimeError(f"unknown LLM provider {provider.name!r}")

    def stats(self) -> dict[str, Any]:
        return {
            "chain": list(self.cfg.chain),
            "configured": self.cfg.configured,
            "available": self.available,
            "providers": [
                {
                    "name": p.name,
                    "model": p.model,
                    "keys_total": len(p.keys),
                    "keys_available": len(self.pools[p.name].available()),
                }
                for p in self.cfg.active
            ],
            "calls": self.calls,
            "failures": self.failures,
            "key_rotations": self.rotations,
            "provider_failovers": self.failovers,
            "avg_latency_ms": int(self.total_latency_ms / self.calls) if self.calls else 0,
            "last_provider": self.last_provider,
            "last_error": self.last_error,
            "circuit_open": self.breaker.is_open,
        }


def _extract_json(text: str) -> dict[str, Any] | None:
    """Pull the first JSON object out of a model response.

    Models sometimes wrap JSON in prose or a fenced block; we tolerate that but
    we do not tolerate anything that is not a valid object.
    """
    text = (text or "").strip()
    if text.startswith("```"):
        parts = text.split("```")
        if len(parts) > 1:
            text = parts[1]
            text = text[4:] if text.lower().startswith("json") else text
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end <= start:
        return None
    try:
        parsed = json.loads(text[start : end + 1])
    except json.JSONDecodeError:
        return None
    return parsed if isinstance(parsed, dict) else None
