#!/usr/bin/env python3
from __future__ import annotations

import json
import shutil
import subprocess
import sys

from test_support import SCRIPTS, make_runtime_root, runtime_env

ROOT = make_runtime_root()
ENV = runtime_env(ROOT)


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
    uuid = "123e4567-e89b-12d3-a456-426614174000"
    url_token = "abcdef0123456789abcdef0123456789"
    valid_test_card = "4111 1111 1111 1111"
    payload = "\n".join(
        [
            f"OnField decision candidate. {service_key_name}={supabase_secret}",
            f"request_id={uuid}",
            f"https://example.test/callback?access_token={url_token}",
            f"payment test card {valid_test_card}",
            "Neutral OnField workflow context remains readable.",
        ]
    )
    result = subprocess.run(
        [sys.executable, str(SCRIPTS / "session_capture.py"), "--event", "Stop", "--sync"],
        input=payload,
        text=True,
        capture_output=True,
        check=False,
        env=ENV,
    )
    assert result.returncode == 0
    assert "Memory Closeout" in result.stdout
    captures = list((ROOT / "captures").glob("**/*.json"))
    assert len(captures) == 1
    capture_text = captures[0].read_text(encoding="utf-8")
    assert "sb" + "_secret_" not in capture_text
    assert uuid not in capture_text
    assert url_token not in capture_text
    assert valid_test_card not in capture_text
    assert "Neutral OnField workflow context remains readable." in capture_text
    daily = list((ROOT / "daily").glob("*.md"))
    assert len(daily) == 1
    daily_text = daily[0].read_text(encoding="utf-8")
    assert "sb" + "_secret_" not in daily_text
    assert uuid not in daily_text
    assert url_token not in daily_text
    assert valid_test_card not in daily_text
    assert "Neutral OnField workflow context remains readable." in daily_text
    state = json.loads((ROOT / "state.json").read_text(encoding="utf-8"))
    assert state["pending_compile"] is False
    assert state["last_compile_status"] == "compiled"


if __name__ == "__main__":
    test_capture_flush_redacts_and_compiles()
    print("test_capture_flush.py PASS")
