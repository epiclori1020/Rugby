#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import shutil
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from build_index import build_index
from common import (
    atomic_write,
    append_text,
    load_config,
    load_state,
    log_failure,
    runtime_path,
    save_state,
    sha256_file,
    today_key,
    utc_now,
)
from redact import redact_text


def slugify(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower()).strip("-")
    return cleaned[:80] or "memory-note"


def backup_knowledge() -> Path | None:
    knowledge_dir = runtime_path("knowledge")
    if not knowledge_dir.exists():
        return None
    base = runtime_path("backups") / f"knowledge-{time.strftime('%Y%m%d-%H%M%S')}"
    backup_dir = base
    counter = 1
    while backup_dir.exists():
        backup_dir = Path(f"{base}-{counter}")
        counter += 1
    shutil.copytree(knowledge_dir, backup_dir)
    return backup_dir


def daily_files() -> list[Path]:
    daily_dir = runtime_path("daily")
    if not daily_dir.exists():
        return []
    return sorted(daily_dir.glob("*.md"))


def should_compile(force: bool) -> tuple[bool, str]:
    if force:
        return True, "forced"
    config = load_config()
    state = load_state()
    if not daily_files():
        return False, "no daily logs"
    changed = False
    for path in daily_files():
        key = path.stem
        current = sha256_file(path)
        if state["daily_hashes"].get(key) != current or state.get("pending_compile"):
            changed = True
            break
    if not changed:
        return False, "no changes"
    last_compile_at = state.get("last_compile_at")
    if last_compile_at:
        try:
            previous_dt = datetime.fromisoformat(last_compile_at.replace("Z", "+00:00"))
            if previous_dt.tzinfo is None:
                previous_dt = previous_dt.replace(tzinfo=timezone.utc)
            previous_epoch = previous_dt.timestamp()
            throttle = int(config.get("compile_throttle_seconds", 300))
            if time.time() - previous_epoch < throttle:
                return False, "throttled"
        except Exception:
            pass
    return True, "changed"


def extract_entries(text: str) -> list[str]:
    chunks = re.split(r"\n## \d{4}-\d{2}-\d{2}T", text)
    entries: list[str] = []
    for chunk in chunks:
        body = chunk.strip()
        if not body or body.startswith("# OnField Daily Memory Log"):
            continue
        entries.append(body)
    return entries


def classify_entry(entry: str) -> str:
    lowered = entry.lower()
    if "decision" in lowered or "entscheidung" in lowered:
        return "decision_candidate"
    if "gotcha" in lowered or "risk" in lowered or "falle" in lowered:
        return "gotcha_candidate"
    if "pattern" in lowered or "muster" in lowered:
        return "pattern"
    return "workflow_note"


def article_for_daily(path: Path) -> tuple[str, str, str]:
    raw = path.read_text(encoding="utf-8")
    redacted = redact_text(raw)
    entries = extract_entries(redacted.text)
    title = f"OnField Runtime Memory {path.stem}"
    article_type = "workflow_note"
    if entries:
        article_type = classify_entry("\n".join(entries[-3:]))
    summary_lines = []
    for entry in entries[-5:]:
        compact = " ".join(line.strip() for line in entry.splitlines() if line.strip())
        if compact:
            summary_lines.append(f"- {compact[:700]}")
    if not summary_lines:
        summary_lines.append("- No high-signal entries yet.")
    body = [
        "---",
        f'title: "{title}"',
        f"type: {article_type}",
        f"created_at: {utc_now()}",
        f"updated_at: {utc_now()}",
        f"source_daily_logs: {path.name}",
        "confidence: generated",
        "status: generated",
        "---",
        "",
        f"# {title}",
        "",
        "Generated from local redacted daily logs. This article is not an SSOT.",
        "",
        "## Recent Signals",
        "",
        *summary_lines,
        "",
        "## SSOT Proposal Policy",
        "",
        "If a signal should become durable OnField truth, add it manually via Memory Closeout to Current State, Decision Log, or Gotchas.",
        "",
    ]
    return slugify(title), "\n".join(body), article_type


def update_hot_cache() -> Path:
    index_path = runtime_path("knowledge") / "index.md"
    hot_path = runtime_path("knowledge") / "hot.md"
    articles = sorted(runtime_path("articles").glob("*.md")) if runtime_path("articles").exists() else []
    lines = [
        "# OnField Runtime Hot Cache",
        "",
        f"Generated: {utc_now()}",
        "",
        "Load AGENTS, Decision Log, Current State, and the Memory Index first. This hot cache is only compact local runtime context.",
        "",
        f"Knowledge index: `{index_path.relative_to(runtime_path('knowledge').parent)}`",
        "",
        "## Current Generated Signals",
        "",
    ]
    if not articles:
        lines.append("- No compiled runtime memory yet.")
    for article in articles[-10:]:
        text = article.read_text(encoding="utf-8")
        title_match = re.search(r'^title:\s*"?(.*?)"?$', text, flags=re.MULTILINE)
        title = title_match.group(1) if title_match else article.stem
        lines.append(f"- {title}: `knowledge/articles/{article.name}`")
    text = "\n".join(lines) + "\n"
    config = load_config()
    max_lines = int(config.get("hot_cache_max_lines", 200))
    max_bytes = int(config.get("hot_cache_max_bytes", 12288))
    limited_lines = text.splitlines()[:max_lines]
    text = "\n".join(limited_lines) + "\n"
    encoded = text.encode("utf-8")
    if len(encoded) > max_bytes:
        text = encoded[:max_bytes].decode("utf-8", errors="ignore") + "\n[truncated]\n"
    atomic_write(hot_path, text)
    return hot_path


def compile_memory(force: bool = False) -> str:
    should_run, reason = should_compile(force)
    state = load_state()
    if not should_run:
        state["last_compile_status"] = reason
        if reason == "no daily logs":
            state["pending_compile"] = False
        save_state(state)
        return reason

    backup_knowledge()
    articles_dir = runtime_path("articles")
    articles_dir.mkdir(parents=True, exist_ok=True)
    for daily in daily_files():
        slug, article, article_type = article_for_daily(daily)
        article_path = articles_dir / f"{slug}.md"
        atomic_write(article_path, article)
        append_ssot_proposals(article_path, article_type, daily)
        state["daily_hashes"][daily.stem] = sha256_file(daily)

    index_path = build_index()
    hot_path = update_hot_cache()
    state["knowledge_hashes"] = {}
    for path in sorted(runtime_path("knowledge").glob("**/*.md")):
        state["knowledge_hashes"][str(path.relative_to(runtime_path("knowledge")))] = sha256_file(path)
    state["last_compile_at"] = utc_now()
    state["last_compile_status"] = "compiled"
    state["pending_compile"] = False
    save_state(state)
    return f"compiled {index_path} {hot_path}"


def append_ssot_proposals(path: Path, article_type: str, source_daily: Path) -> None:
    if article_type not in {"decision_candidate", "gotcha_candidate"}:
        return
    proposal_path = runtime_path("reports") / "ssot-proposals.md"
    if not proposal_path.exists():
        append_text(
            proposal_path,
            "# OnField Runtime SSOT Proposals\n\n"
            "Generated suggestions only. The agent must manually apply Memory Governance before editing Current State, Decision Log, Gotchas, Roadmap, or SSOTs.\n",
        )
    append_text(
        proposal_path,
        f"\n## {utc_now()} - {article_type}\n\n"
        f"- source_daily_log: `{source_daily.name}`\n"
        f"- generated_article: `knowledge/articles/{path.name}`\n"
        "- required_action: review during Memory Closeout; do not auto-apply.\n",
    )


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args(argv[1:])
    try:
        result = compile_memory(force=args.force)
        print(result)
    except Exception as exc:
        state = load_state()
        state["last_compile_status"] = "failed"
        state["pending_compile"] = True
        save_state(state)
        log_failure("compile", exc)
        print(f"compile failed fail-open: {exc}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
