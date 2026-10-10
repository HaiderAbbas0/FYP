"""Formatting shared by reasoning agents."""
import json
from typing import Any

def json_block(data: dict[str, Any]) -> str:
    return json.dumps(data, indent=2, default=str)
