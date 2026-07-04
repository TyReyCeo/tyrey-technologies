"""TyRey framework IP library.

Every AI generation injects one of these structured JSON frameworks — the
engine never freeform-prompts (Phase 5 moat design).
"""

import json
from functools import lru_cache
from pathlib import Path

_DIR = Path(__file__).parent


@lru_cache(maxsize=None)
def list_frameworks() -> list[dict]:
    """Return summary metadata for every framework in the library."""
    items = []
    for path in sorted(_DIR.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        items.append(
            {
                "name": data["name"],
                "title": data["title"],
                "category": data["category"],
                "description": data["description"],
                "trademark": data.get("trademark", False),
            }
        )
    return items


@lru_cache(maxsize=None)
def load_framework(name: str) -> dict:
    path = _DIR / f"{name}.json"
    if not path.is_file() or path.parent != _DIR:
        raise KeyError(f"Unknown framework: {name}")
    return json.loads(path.read_text(encoding="utf-8"))


def framework_names() -> list[str]:
    return [f["name"] for f in list_frameworks()]


def build_prompt(framework: dict, context: dict[str, str]) -> tuple[str, str]:
    """Compile a framework + project context into (system, user) prompts."""
    system = framework["system_role"]

    lines: list[str] = []
    lines.append(f"TASK:\n{framework['task']}")

    lines.append("\nINPUT:")
    for key, value in context.items():
        if value:
            lines.append(f"- {key.replace('_', ' ').title()}: {value}")

    lines.append("\nRULES:")
    for rule in framework["rules"]:
        lines.append(f"- {rule}")

    scoring = framework.get("scoring")
    if scoring:
        lines.append(f"\nSCORING SYSTEM:\nScale: {scoring['scale']}")
        for dim in scoring["dimensions"]:
            lines.append(f"- {dim['name']}: {dim['guidance']}")

    lines.append("\nREQUIRED STRUCTURE (use these exact section headings, in order):")
    for section in framework["sections"]:
        lines.append(f"## {section['heading']}\n   Guidance: {section['guidance']}")

    lines.append(f"\nOUTPUT FORMAT:\n{framework['output_format']}")

    return system, "\n".join(lines)
