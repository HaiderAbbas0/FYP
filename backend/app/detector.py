"""Compatibility import: implementation is in agents.detector.agent."""
import sys
from agents.detector import agent as _implementation
sys.modules[__name__] = _implementation
