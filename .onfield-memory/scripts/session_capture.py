#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path

from common import (
    append_text,
    atomic_write_json,
    exit_success,
    load_config,
    log_failure,
    memory_lock,
    print_fail_open,
    read_stdin_text,
    runtime_path,
    sha256_text,
    today_key,
    truncate_text,
    utc_now,
)
from flush import flush_capture
from redact import redact_text


VALID_EVENTS = {"Stop", "PreCompact", "Manual"}


def safe_event(value: str) -> str:
    return value if value in VALID_EVENTS else "Manual"


def write_orphan(event: str, reason: str, payload: str) -> Path:
    orphan_id = sha256_text(f"{event}:{reason}:{payload}")[:12]
    path = runtime_path("orphans") / f"{datetime.now().strftime('%Y%m%d-%H%M%S')}-{event}-{orphan_id}.json"
    atomic_write_json(
        path,
        {
            "event": event,
            "created_at": utc_now(),
            "reason": reason,
            "redacted_payload": truncate_text(payload, 12000),
        },
    )
    return path


def write_capture(event: str, raw_payload: str) -> Path:
    redacted = redact_text(raw_payload)
    if not redacted.text.strip():
        raise ValueError("empty payload")

    created_at = utc_now()
    capture_hash = sha256_text(f"{event}:{created_at}:{redacted.text}")[:12]
    capture_id = f"{datetime.now().strftime('%Y%m%d-%H%M%S')}-{event}-{capture_hash}"
    capture_dir = runtime_path("captures") / today_key()
    capture_path = capture_dir / f"{capture_id}.json"
    atomic_write_json(
        capture_path,
        {
            "capture_id": capture_id,
            "event": event,
            "created_at": created_at,
            "source": "codex",
            "sha256": sha256_text(redacted.text),
            "redaction_count": redacted.redaction_count,
            "medical_flag_count": redacted.medical_flag_count,
            "redacted_payload": truncate_text(redacted.text, 24000),
        },
    )
    return capture_path


def run_compile_if_needed(sync: bool) -> None:
    compile_script = Path(__file__).with_name("compile.py")
    if sync:
        subprocess.run([sys.executable, str(compile_script)], check=False)
        return
    try:
        subprocess.Popen(
            [sys.executable, str(compile_script)],
            cwd=str(Path(__file__).resolve().parents[1]),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True,
        )
    except Exception as exc:
        log_failure("compile spawn", exc)


def memory_reminder() -> str:
    return (
        "\n---\n"
        "OnField Memory Closeout pruefen:\n"
        "- Current State aktualisieren, wenn Sprint-Status, Hook-/Workflow-Status oder App-Zustand dauerhaft anders ist.\n"
        "- Decision Log aktualisieren, wenn eine dauerhafte Produkt-, Architektur- oder Workflow-Entscheidung getroffen wurde.\n"
        "- Gotchas aktualisieren, wenn eine wiederholbare Falle entdeckt wurde.\n"
        "- Runtime Memory ist lokales Rohmaterial; SSOT-Updates bleiben Agentenentscheidung nach Governance.\n"
        "---\n"
    )


def capture_event(event: str, sync: bool = False) -> None:
    with memory_lock() as acquired:
        if not acquired:
            print_fail_open(memory_reminder())
            return
        payload = read_stdin_text()
        if not payload.strip():
            write_orphan(event, "empty stdin payload", "")
            print_fail_open(memory_reminder())
            return
        try:
            capture_path = write_capture(event, payload)
            daily_path = flush_capture(capture_path)
            append_text(runtime_path("reports") / "capture.log", f"[{utc_now()}] {event} -> {capture_path} -> {daily_path}\n")
            run_compile_if_needed(sync)
        except Exception as exc:
            redacted = redact_text(payload).text
            write_orphan(event, f"capture failed: {exc}", redacted)
            log_failure("session capture", exc)
        print_fail_open(memory_reminder())


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--event", default=os.environ.get("ONFIELD_MEMORY_EVENT", "Manual"))
    parser.add_argument("--sync", action="store_true", help="Run compile synchronously for tests.")
    args = parser.parse_args(argv[1:])
    event = safe_event(args.event)
    capture_event(event, sync=args.sync)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
