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
    subprocess.run([sys.executable, str(SCRIPTS / "compile.py"), "--force"], check=True, env=ENV)
    subprocess.run([sys.executable, str(SCRIPTS / "compile.py"), "--force"], check=True, env=ENV)
    lint = subprocess.run(
        [sys.executable, str(SCRIPTS / "lint.py"), "--json"],
        text=True,
        capture_output=True,
        check=False,
        env=ENV,
    )
    assert lint.returncode == 0, lint.stdout + lint.stderr
    backups = subprocess.run(
        [sys.executable, str(SCRIPTS / "recover.py"), "--list"],
        text=True,
        capture_output=True,
        check=False,
        env=ENV,
    )
    backup_ids = [line.strip() for line in backups.stdout.splitlines() if line.strip()]
    assert backup_ids
    restore = subprocess.run(
        [sys.executable, str(SCRIPTS / "recover.py"), "--restore", backup_ids[-1], "--yes"],
        text=True,
        capture_output=True,
        check=False,
        env=ENV,
    )
    assert restore.returncode == 0
    assert (ROOT / "knowledge" / "index.md").exists()


def test_compile_clears_pending_without_daily_logs() -> None:
    reset_runtime()
    (ROOT / "state.json").write_text(
        json.dumps(
            {
                "schema_version": 1,
                "captures": {},
                "daily_hashes": {},
                "knowledge_hashes": {},
                "last_compile_at": None,
                "last_compile_status": "failed",
                "pending_compile": True,
            }
        )
        + "\n",
        encoding="utf-8",
    )
    result = subprocess.run(
        [sys.executable, str(SCRIPTS / "compile.py")],
        text=True,
        capture_output=True,
        check=False,
        env=ENV,
    )
    assert result.returncode == 0
    assert "no daily logs" in result.stdout
    state = json.loads((ROOT / "state.json").read_text(encoding="utf-8"))
    assert state["pending_compile"] is False


def test_lint_reports_pattern_counts_without_raw_secret_values() -> None:
    reset_runtime()
    fake_secret = "sk" + "-proj-" + "abcdefghijklmnopqrstuvwxyz123456"
    report = ROOT / "reports" / "raw.log"
    report.parent.mkdir(parents=True, exist_ok=True)
    report.write_text(
        f"failed request value {fake_secret}\n"
        "neutral OnField note stays visible\n",
        encoding="utf-8",
    )
    lint = subprocess.run(
        [sys.executable, str(SCRIPTS / "lint.py"), "--json"],
        text=True,
        capture_output=True,
        check=False,
        env=ENV,
    )
    assert lint.returncode == 1
    assert fake_secret not in lint.stdout
    payload = json.loads(lint.stdout)
    assert payload["ok"] is False
    assert {
        "count": 1,
        "path": str(report.resolve()),
        "pattern_type": "openai_project_key",
        "severity": "error",
    } in payload["issues"]
    report_payload = json.loads((ROOT / "reports" / "lint-report.json").read_text(encoding="utf-8"))
    assert fake_secret not in json.dumps(report_payload)


def test_lint_ignores_capture_sha256_but_scans_payload() -> None:
    reset_runtime()
    capture = ROOT / "captures" / "2026-07-07" / "capture.json"
    capture.parent.mkdir(parents=True, exist_ok=True)
    capture.write_text(
        json.dumps(
            {
                "capture_id": "cap_20260707T100000Z",
                "kind": "note",
                "source": "test",
                "redacted_payload": "neutral OnField runtime note",
                "sha256": "a" * 64,
            },
            sort_keys=True,
        )
        + "\n",
        encoding="utf-8",
    )
    lint = subprocess.run(
        [sys.executable, str(SCRIPTS / "lint.py"), "--json"],
        text=True,
        capture_output=True,
        check=False,
        env=ENV,
    )
    assert lint.returncode == 0, lint.stdout + lint.stderr

    fake_secret = "sk" + "-proj-" + "abcdefghijklmnopqrstuvwxyz123456"
    capture.write_text(
        json.dumps(
            {
                "capture_id": "cap_20260707T100001Z",
                "kind": "note",
                "source": "test",
                "redacted_payload": f"failed request value {fake_secret}",
                "sha256": "b" * 64,
            },
            sort_keys=True,
        )
        + "\n",
        encoding="utf-8",
    )
    lint = subprocess.run(
        [sys.executable, str(SCRIPTS / "lint.py"), "--json"],
        text=True,
        capture_output=True,
        check=False,
        env=ENV,
    )
    assert lint.returncode == 1
    assert fake_secret not in lint.stdout
    payload = json.loads(lint.stdout)
    assert payload["ok"] is False
    assert {
        "count": 1,
        "path": str(capture.resolve()),
        "pattern_type": "openai_project_key",
        "severity": "error",
    } in payload["issues"]


def test_lint_scans_sha256_fields_outside_captures() -> None:
    reset_runtime()
    report = ROOT / "reports" / "external.json"
    report.parent.mkdir(parents=True, exist_ok=True)
    report.write_text(json.dumps({"sha256": "c" * 64}, sort_keys=True) + "\n", encoding="utf-8")
    lint = subprocess.run(
        [sys.executable, str(SCRIPTS / "lint.py"), "--json"],
        text=True,
        capture_output=True,
        check=False,
        env=ENV,
    )
    assert lint.returncode == 1
    payload = json.loads(lint.stdout)
    assert payload["ok"] is False
    assert {
        "count": 1,
        "path": str(report.resolve()),
        "pattern_type": "long_opaque",
        "severity": "error",
    } in payload["issues"]


def test_lint_scans_backups_orphans_and_tmp_text_files() -> None:
    reset_runtime()
    fake_secret = "sk" + "-proj-" + "abcdefghijklmnopqrstuvwxyz123456"
    backup = ROOT / "backups" / "backup.md"
    orphan = ROOT / "orphans" / "orphan.md"
    tmp_note = ROOT / "tmp" / "note.txt"
    tmp_lock = ROOT / "tmp" / "memory.lock"
    for path in (backup, orphan, tmp_note, tmp_lock):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(f"failed request value {fake_secret}\n", encoding="utf-8")

    lint = subprocess.run(
        [sys.executable, str(SCRIPTS / "lint.py"), "--json"],
        text=True,
        capture_output=True,
        check=False,
        env=ENV,
    )
    assert lint.returncode == 1
    payload = json.loads(lint.stdout)
    paths = {issue["path"] for issue in payload["issues"]}
    assert str(backup.resolve()) in paths
    assert str(orphan.resolve()) in paths
    assert str(tmp_note.resolve()) in paths
    assert str(tmp_lock.resolve()) not in paths


if __name__ == "__main__":
    test_lint_and_recovery()
    test_compile_clears_pending_without_daily_logs()
    test_lint_reports_pattern_counts_without_raw_secret_values()
    test_lint_ignores_capture_sha256_but_scans_payload()
    test_lint_scans_sha256_fields_outside_captures()
    test_lint_scans_backups_orphans_and_tmp_text_files()
    print("test_lint_recover.py PASS")
