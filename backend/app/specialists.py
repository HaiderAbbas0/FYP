"""Compatibility import: implementation is in agents.investigator.specialists.agent."""
import sys
from agents.investigator.specialists import agent as _implementation
sys.modules[__name__] = _implementation
