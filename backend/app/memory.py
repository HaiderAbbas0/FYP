"""Compatibility import: implementation is in agents.memory.agent."""
import sys
from agents.memory import agent as _implementation
sys.modules[__name__] = _implementation
