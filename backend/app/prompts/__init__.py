"""Versioned prompt assets.

Prompts are application code (CLAUDE.md / Engineering Handbook rule): they
live here as files under version control, never as inline strings. Framework
templates (the structured IP library) live separately in app/frameworks/.
"""

from functools import lru_cache
from pathlib import Path

_DIR = Path(__file__).parent


@lru_cache(maxsize=None)
def load_prompt(name: str) -> str:
    path = _DIR / f"{name}.md"
    if not path.is_file() or path.parent != _DIR:
        raise KeyError(f"Unknown prompt: {name}")
    return path.read_text(encoding="utf-8").strip()
