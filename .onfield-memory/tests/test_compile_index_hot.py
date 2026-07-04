#!/usr/bin/env python3
from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"


def reset_runtime() -> None:
    for name in ("captures", "daily", "knowledge", "backups", "orphans", "reports", "tmp"):
        shutil.rmtree(ROOT / name, ignore_errors=True)
    state = ROOT / "state.json"
    if state.exists():
        state.unlink()


def test_compile_index_hot_cache() -> None:
    reset_runtime()
    daily = ROOT / "daily" / "2026-07-04.md"
    daily.parent.mkdir(parents=True, exist_ok=True)
    daily.write_text(
        "# OnField Daily Memory Log - 2026-07-04\n\n"
        "## 2026-07-04T10:00:00Z - Stop\n\n"
        "Decision candidate: Runtime Memory may suggest but not overwrite SSOTs.\n",
        encoding="utf-8",
    )
    result = subprocess.run([sys.executable, str(SCRIPTS / "compile.py"), "--force"], text=True, capture_output=True, check=False)
    assert result.returncode == 0
    assert (ROOT / "knowledge" / "index.md").exists()
    assert (ROOT / "knowledge" / "hot.md").exists()
    articles = list((ROOT / "knowledge" / "articles").glob("*.md"))
    assert articles
    index = (ROOT / "knowledge" / "index.md").read_text(encoding="utf-8")
    assert articles[0].name in index
    hot = (ROOT / "knowledge" / "hot.md").read_text(encoding="utf-8")
    assert len(hot.splitlines()) <= 200
    proposals = ROOT / "reports" / "ssot-proposals.md"
    assert proposals.exists()
    assert "decision_candidate" in proposals.read_text(encoding="utf-8")
    state = json.loads((ROOT / "state.json").read_text(encoding="utf-8"))
    assert state["pending_compile"] is False


if __name__ == "__main__":
    test_compile_index_hot_cache()
    print("test_compile_index_hot.py PASS")
