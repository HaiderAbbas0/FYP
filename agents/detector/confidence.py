"""Compatibility shim: confidence helpers re-exported from the PCAP detector.

The controller and specialist agents import `detector_window_log`,
`window_stream_payload` and `event_confidence_fields` from here. They are
backed by the trained joblib bundle in `Detector_Run_2`.
"""

from __future__ import annotations

from typing import Any

from . import detector_window_log, event_confidence_fields, window_stream_payload  # noqa: F401


__all__ = ["detector_window_log", "window_stream_payload", "event_confidence_fields"]
