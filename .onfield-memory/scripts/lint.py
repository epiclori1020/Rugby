#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from common import atomic_write, load_config, load_state, runtime_path, utc_now
from redact import MEDICAL_CLEARANCE_PATTERN, SECRET_PATTERNS


LINK_RE = re.compile(r"\[[^\]]+\]\(([^)]+)\)")
SHA256_HEX_RE = re.compile(r"^[a-fA-F0-9]{64}$")


def add_issue(issues: dict[tuple[str, str, str], dict], severity: str, path: str, pattern_type: str, count: int = 1) -> None:
    key = (severity, path, pattern_type)
    if key not in issues:
        issues[key] = {
            "severity": severity,
            "path": path,
            "pattern_type": pattern_type,
            "count": 0,
        }
    issues[key]["count"] += count


def secret_pattern_counts(text: str) -> dict[str, int]:
    counts: dict[str, int] = {}
    for name, pattern in SECRET_PATTERNS:
        count = len(pattern.findall(text))
        if count:
            counts[name] = count
    return counts


def lint_text_segments(path: Path, text: str) -> list[str]:
    if path.suffix.lower() != ".json":
        return [text]

    try:
        value = json.loads(text)
    except json.JSONDecodeError:
        return [text]

    segments: list[str] = []

    def walk(node: object, field_path: tuple[str, ...]) -> None:
        if isinstance(node, dict):
            for key, child in node.items():
                walk(child, (*field_path, str(key)))
            return
        if isinstance(node, list):
            for child in node:
                walk(child, field_path)
            return
        if not isinstance(node, str):
            return
        if is_capture_sha256_field(path, field_path, node):
            return
        segments.append(node)

    walk(value, ())
    return segments or [text]


def is_capture_sha256_field(path: Path, field_path: tuple[str, ...], value: str) -> bool:
    if not field_path or field_path[-1] != "sha256" or not SHA256_HEX_RE.fullmatch(value):
        return False
    try:
        path.resolve().relative_to(runtime_path("captures").resolve())
    except ValueError:
        return False
    return True


def lint_memory() -> dict:
    grouped_issues: dict[tuple[str, str, str], dict] = {}
    knowledge_dir = runtime_path("knowledge")
    articles_dir = runtime_path("articles")
    index_path = knowledge_dir / "index.md"
    hot_path = knowledge_dir / "hot.md"
    state = load_state()
    config = load_config()

    for root_name in ("captures", "daily", "knowledge", "reports"):
        root = runtime_path(root_name)
        if not root.exists():
            continue
        for path in root.glob("**/*"):
            if not path.is_file():
                continue
            text = path.read_text(encoding="utf-8", errors="ignore")
            for segment in lint_text_segments(path, text):
                for pattern_type, count in secret_pattern_counts(segment).items():
                    add_issue(grouped_issues, "error", str(path), pattern_type, count)
                medical_count = len(MEDICAL_CLEARANCE_PATTERN.findall(segment))
                if medical_count:
                    add_issue(grouped_issues, "warning", str(path), "medical_clearance_wording", medical_count)

    if hot_path.exists():
        text = hot_path.read_text(encoding="utf-8")
        if len(text.splitlines()) > int(config.get("hot_cache_max_lines", 200)):
            add_issue(grouped_issues, "error", str(hot_path), "hot_cache_line_limit")
        if len(text.encode("utf-8")) > int(config.get("hot_cache_max_bytes", 12288)):
            add_issue(grouped_issues, "error", str(hot_path), "hot_cache_byte_limit")

    if articles_dir.exists() and index_path.exists():
        index_text = index_path.read_text(encoding="utf-8")
        for article in articles_dir.glob("*.md"):
            if article.name not in index_text:
                add_issue(grouped_issues, "error", str(index_path), "missing_article_in_index")

    for md in knowledge_dir.glob("**/*.md") if knowledge_dir.exists() else []:
        text = md.read_text(encoding="utf-8")
        for link in LINK_RE.findall(text):
            if link.startswith(("http://", "https://", "#", "mailto:")):
                continue
            target = (md.parent / link.split("#", 1)[0]).resolve()
            if not target.exists():
                add_issue(grouped_issues, "warning", str(md), "broken_local_link")

    daily_dir = runtime_path("daily")
    if daily_dir.exists():
        for daily in daily_dir.glob("*.md"):
            if state["daily_hashes"].get(daily.stem) != __import__("common").sha256_file(daily):
                add_issue(grouped_issues, "warning", str(daily), "daily_log_changed_since_compile")

    if state.get("pending_compile"):
        add_issue(grouped_issues, "warning", "state.json", "compile_pending")

    issues = sorted(grouped_issues.values(), key=lambda issue: (issue["severity"], issue["path"], issue["pattern_type"]))

    result = {
        "generated_at": utc_now(),
        "ok": not any(issue["severity"] == "error" for issue in issues),
        "issue_count": len(issues),
        "issues": issues,
    }
    atomic_write(runtime_path("reports") / "lint-report.json", json.dumps(result, indent=2, sort_keys=True) + "\n")
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    result = lint_memory()
    if args.json:
        print(json.dumps(result, indent=2, sort_keys=True))
    else:
        print(f"ok={result['ok']} issue_count={result['issue_count']}")
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
