#!/usr/bin/env python3
from __future__ import annotations

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


def test_lint_and_recovery() -> None:
    reset_runtime()
    daily = ROOT / "daily" / "2026-07-04.md"
    daily.parent.mkdir(parents=True, exist_ok=True)
    daily.write_text(
        "# OnField Daily Memory Log - 2026-07-04\n\n"
        "## 2026-07-04T10:00:00Z - Stop\n\n"
        "Pattern: use hot cache only for compact runtime context.\n",
        encoding="utf-8",
    )
    subprocess.run([sys.executable, str(SCRIPTS / "compile.py"), "--force"], check=True)
    subprocess.run([sys.executable, str(SCRIPTS / "compile.py"), "--force"], check=True)
    lint = subprocess.run([sys.executable, str(SCRIPTS / "lint.py"), "--json"], text=True, capture_output=True, check=False)
    assert lint.returncode == 0, lint.stdout + lint.stderr
    backups = subprocess.run([sys.executable, str(SCRIPTS / "recover.py"), "--list"], text=True, capture_output=True, check=False)
    backup_ids = [line.strip() for line in backups.stdout.splitlines() if line.strip()]
    assert backup_ids
    restore = subprocess.run(
        [sys.executable, str(SCRIPTS / "recover.py"), "--restore", backup_ids[-1], "--yes"],
        text=True,
        capture_output=True,
        check=False,
    )
    assert restore.returncode == 0
    assert (ROOT / "knowledge" / "index.md").exists()


if __name__ == "__main__":
    test_lint_and_recovery()
    print("test_lint_recover.py PASS")
