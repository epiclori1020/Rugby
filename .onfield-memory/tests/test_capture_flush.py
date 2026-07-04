#!/usr/bin/env python3
from __future__ import annotations

import json
import os
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


def test_capture_flush_redacts_and_compiles() -> None:
    reset_runtime()
    service_key_name = "SUPABASE" + "_SERVICE_ROLE_KEY"
    supabase_secret = "sb" + "_secret_" + "abcdefghijklmnopqrstuvwxyz"
    payload = f"OnField decision candidate. {service_key_name}={supabase_secret}"
    result = subprocess.run(
        [sys.executable, str(SCRIPTS / "session_capture.py"), "--event", "Stop", "--sync"],
        input=payload,
        text=True,
        capture_output=True,
        check=False,
    )
    assert result.returncode == 0
    assert "Memory Closeout" in result.stdout
    captures = list((ROOT / "captures").glob("**/*.json"))
    assert len(captures) == 1
    capture_text = captures[0].read_text(encoding="utf-8")
    assert "sb" + "_secret_" not in capture_text
    daily = list((ROOT / "daily").glob("*.md"))
    assert len(daily) == 1
    assert "sb" + "_secret_" not in daily[0].read_text(encoding="utf-8")
    state = json.loads((ROOT / "state.json").read_text(encoding="utf-8"))
    assert state["pending_compile"] is False
    assert state["last_compile_status"] == "compiled"


if __name__ == "__main__":
    test_capture_flush_redacts_and_compiles()
    print("test_capture_flush.py PASS")
