"""Compatibility import: implementation is in agents.controller.agent."""
import sys
from agents.controller import agent as _implementation
sys.modules[__name__] = _implementation
