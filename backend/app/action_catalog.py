"""Canonical bounded action names shared by recommender and policy gate."""

from __future__ import annotations

import re

from .schemas import ResponseRecommendation

ACTION_NAMES = frozenset({
    "upstream_rate_limit",
    "upstream_prefix_ratelimit",
    "temp_source_block",
    "connection_cap",
    "device_isolate",
    "alert_escalate",
})


def format_action(name: str, duration_s: int) -> str:
    """Return the canonical display/legacy wire representation."""
    return "alert_escalate()" if name == "alert_escalate" else f"{name}({duration_s}s)"


def recommendation_action_is_catalogued(rec: ResponseRecommendation) -> bool:
    """Check both the action name and its legacy formatted representation."""
    name = rec.params.get("base_action")
    if not isinstance(name, str) or name not in ACTION_NAMES:
        return False
    if name == "alert_escalate":
        return rec.action == "alert_escalate()"
    return rec.action == format_action(name, rec.duration_s)


def parse_action(action: str) -> tuple[str, int] | None:
    """Parse only the exact canonical form accepted by the policy gate."""
    if action == "alert_escalate()":
        return "alert_escalate", 0
    match = re.fullmatch(r"([a-z_]+)\(([0-9]+)s\)", action)
    if not match or match.group(1) not in ACTION_NAMES:
        return None
    return match.group(1), int(match.group(2))
