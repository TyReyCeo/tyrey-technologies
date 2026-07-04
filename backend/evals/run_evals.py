"""Golden-set eval runner for the TyRey Intelligence Engine.

Usage (from backend/, with ANTHROPIC_API_KEY set in .env):
    python -m evals.run_evals            # run all cases
    python -m evals.run_evals bp-saas-idea genome-early-saas   # specific cases

Checks per case:
  1. Generation completes without error
  2. Every required framework section is present (validate_structure)
  3. Any expect_patterns regexes match the output (e.g. genome scores)

Run this BEFORE shipping any prompt, framework, or model-version change.
Exit code 0 = all pass; 1 = failures (CI-friendly).
"""

import json
import re
import sys
import time
from pathlib import Path

from app.ai_engine import generate, validate_structure
from app.frameworks import load_framework

GOLDEN = Path(__file__).parent / "golden_set.json"
RESULTS_DIR = Path(__file__).parent / "results"


def run(case_ids: list[str] | None = None) -> int:
    spec = json.loads(GOLDEN.read_text(encoding="utf-8"))
    cases = spec["cases"]
    if case_ids:
        cases = [c for c in cases if c["id"] in case_ids]

    RESULTS_DIR.mkdir(exist_ok=True)
    failures = []

    for case in cases:
        cid, module = case["id"], case["module"]
        started = time.time()
        try:
            content = generate(module, case["context"])
            framework = load_framework(module)
            missing = validate_structure(framework, content)
            pattern_missing = [
                p for p in case.get("expect_patterns", [])
                if not re.search(p, content, re.IGNORECASE)
            ]
            elapsed = time.time() - started

            (RESULTS_DIR / f"{cid}.md").write_text(content, encoding="utf-8")

            if missing or pattern_missing:
                failures.append(cid)
                print(
                    f"FAIL  {cid:<24} missing sections: {missing or '-'} | "
                    f"missing patterns: {pattern_missing or '-'}"
                )
            else:
                print(f"PASS  {cid:<24} ({elapsed:.1f}s, {len(content)} chars)")
        except Exception as e:
            failures.append(cid)
            print(f"ERROR {cid:<24} {type(e).__name__}: {e}")

    print(f"\n{len(cases) - len(failures)}/{len(cases)} passed")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(run(sys.argv[1:] or None))
