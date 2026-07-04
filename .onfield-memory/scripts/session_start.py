#!/usr/bin/env python3
from __future__ import annotations

from common import load_config, load_state, runtime_path


def hot_cache_text() -> str:
    hot_path = runtime_path("knowledge") / "hot.md"
    state = load_state()
    if not hot_path.exists():
        return (
            "\n---\n"
            "OnField Runtime Memory: kein Hot Cache vorhanden.\n"
            "Lade weiter AGENTS.md, Memory Index, Current State und Decision Log nach OnField-Regeln.\n"
            "---\n"
        )
    text = hot_path.read_text(encoding="utf-8")
    config = load_config()
    max_lines = int(config.get("hot_cache_max_lines", 200))
    max_bytes = int(config.get("hot_cache_max_bytes", 12288))
    limited = "\n".join(text.splitlines()[:max_lines])
    encoded = limited.encode("utf-8")
    if len(encoded) > max_bytes:
        limited = encoded[:max_bytes].decode("utf-8", errors="ignore") + "\n[truncated]"
    pending = ""
    if state.get("pending_compile"):
        pending = "\n\nHinweis: Runtime Memory Compile ist pending; nutze SSOTs als hoeherwertige Quelle.\n"
    return f"\n---\n{limited}{pending}\n---\n"


def main() -> int:
    print(hot_cache_text())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
