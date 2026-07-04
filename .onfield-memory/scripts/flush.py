#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

from common import append_text, load_state, runtime_path, save_state, sha256_file, today_key, utc_now


def capture_to_daily_entry(capture: dict) -> str:
    payload = capture.get("redacted_payload", "")
    summary = payload.strip()
    if len(summary) > 2400:
        summary = summary[:2400] + "\n[truncated]"
    event = capture.get("event", "unknown")
    capture_id = capture.get("capture_id", "unknown")
    source = capture.get("source", "codex")
    timestamp = capture.get("created_at", utc_now())
    return (
        f"\n## {timestamp} - {event}\n\n"
        f"- capture_id: `{capture_id}`\n"
        f"- source: `{source}`\n\n"
        "### Redacted Session Material\n\n"
        "```text\n"
        f"{summary}\n"
        "```\n"
    )


def flush_capture(capture_path: Path) -> Path:
    with capture_path.open("r", encoding="utf-8") as handle:
        capture = json.load(handle)

    capture_id = capture["capture_id"]
    state = load_state()
    existing = state["captures"].get(capture_id)
    if existing and existing.get("status") == "flushed":
        return runtime_path("daily") / f"{today_key()}.md"

    daily_path = runtime_path("daily") / f"{today_key()}.md"
    if not daily_path.exists():
        append_text(daily_path, f"# OnField Daily Memory Log - {today_key()}\n")
        append_text(daily_path, "\nLocal redacted raw material. This file is not an SSOT.\n")

    append_text(daily_path, capture_to_daily_entry(capture))
    state["captures"][capture_id] = {
        "event": capture.get("event", "unknown"),
        "created_at": capture.get("created_at", utc_now()),
        "sha256": capture.get("sha256", ""),
        "status": "flushed",
    }
    state["daily_hashes"][today_key()] = sha256_file(daily_path)
    state["pending_compile"] = True
    save_state(state)
    return daily_path


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("Usage: flush.py <capture-path>", file=sys.stderr)
        return 2
    flush_capture(Path(argv[1]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
