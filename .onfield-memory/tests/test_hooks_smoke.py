#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"


def reset_runtime() -> None:
    for name in ("captures", "daily", "knowledge", "backups", "orphans", "reports", "tmp"):
        shutil.rmtree(ROOT / name, ignore_errors=True)
    state = ROOT / "state.json"
    if state.exists():
        state.unlink()


def test_session_start_and_lock_fail_open() -> None:
    reset_runtime()
    start = subprocess.run([sys.executable, str(SCRIPTS / "session_start.py")], text=True, capture_output=True, check=False)
    assert start.returncode == 0
    assert "kein Hot Cache" in start.stdout

    tmp = ROOT / "tmp"
    tmp.mkdir(exist_ok=True)
    (tmp / "memory.lock").write_text("locked\n", encoding="utf-8")
    captured = subprocess.run(
        [sys.executable, str(SCRIPTS / "session_capture.py"), "--event", "PreCompact", "--sync"],
        input="Important OnField context",
        text=True,
        capture_output=True,
        check=False,
    )
    assert captured.returncode == 0
    assert "Memory Closeout" in captured.stdout
    assert not list((ROOT / "captures").glob("**/*.json"))
    (tmp / "memory.lock").unlink()


def test_stale_lock_is_recovered() -> None:
    reset_runtime()
    tmp = ROOT / "tmp"
    tmp.mkdir(exist_ok=True)
    lock = tmp / "memory.lock"
    lock.write_text("stale\n", encoding="utf-8")
    old = time.time() - 300
    os.utime(lock, (old, old))
    captured = subprocess.run(
        [sys.executable, str(SCRIPTS / "session_capture.py"), "--event", "Stop", "--sync"],
        input="Important OnField context after stale lock",
        text=True,
        capture_output=True,
        check=False,
    )
    assert captured.returncode == 0
    assert list((ROOT / "captures").glob("**/*.json"))


def test_pending_compile_message() -> None:
    reset_runtime()
    state = {
        "schema_version": 1,
        "captures": {},
        "daily_hashes": {},
        "knowledge_hashes": {},
        "last_compile_at": None,
        "last_compile_status": "failed",
        "pending_compile": True,
    }
    (ROOT / "state.json").write_text(json.dumps(state), encoding="utf-8")
    hot = ROOT / "knowledge" / "hot.md"
    hot.parent.mkdir(parents=True, exist_ok=True)
    hot.write_text("# OnField Runtime Hot Cache\n", encoding="utf-8")
    start = subprocess.run([sys.executable, str(SCRIPTS / "session_start.py")], text=True, capture_output=True, check=False)
    assert start.returncode == 0
    assert "pending" in start.stdout


if __name__ == "__main__":
    test_session_start_and_lock_fail_open()
    test_stale_lock_is_recovered()
    test_pending_compile_message()
    print("test_hooks_smoke.py PASS")
