#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from common import atomic_write, load_config, load_state, runtime_path, utc_now
from redact import MEDICAL_CLEARANCE_PATTERN, SECRET_PATTERNS


LINK_RE = re.compile(r"\[[^\]]+\]\(([^)]+)\)")


def has_secret(text: str) -> bool:
    return any(pattern.search(text) for _name, pattern in SECRET_PATTERNS)


def lint_memory() -> dict:
    issues: list[dict] = []
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
            if has_secret(text):
                issues.append({"severity": "error", "path": str(path), "message": "possible secret leakage"})
            if MEDICAL_CLEARANCE_PATTERN.search(text):
                issues.append({"severity": "warning", "path": str(path), "message": "possible medical clearance wording"})

    if hot_path.exists():
        text = hot_path.read_text(encoding="utf-8")
        if len(text.splitlines()) > int(config.get("hot_cache_max_lines", 200)):
            issues.append({"severity": "error", "path": str(hot_path), "message": "hot cache has too many lines"})
        if len(text.encode("utf-8")) > int(config.get("hot_cache_max_bytes", 12288)):
            issues.append({"severity": "error", "path": str(hot_path), "message": "hot cache exceeds byte cap"})

    if articles_dir.exists() and index_path.exists():
        index_text = index_path.read_text(encoding="utf-8")
        for article in articles_dir.glob("*.md"):
            if article.name not in index_text:
                issues.append({"severity": "error", "path": str(index_path), "message": f"missing article in index: {article.name}"})

    for md in knowledge_dir.glob("**/*.md") if knowledge_dir.exists() else []:
        text = md.read_text(encoding="utf-8")
        for link in LINK_RE.findall(text):
            if link.startswith(("http://", "https://", "#", "mailto:")):
                continue
            target = (md.parent / link.split("#", 1)[0]).resolve()
            if not target.exists():
                issues.append({"severity": "warning", "path": str(md), "message": f"broken local link: {link}"})

    daily_dir = runtime_path("daily")
    if daily_dir.exists():
        for daily in daily_dir.glob("*.md"):
            if state["daily_hashes"].get(daily.stem) != __import__("common").sha256_file(daily):
                issues.append({"severity": "warning", "path": str(daily), "message": "daily log changed since last compile"})

    if state.get("pending_compile"):
        issues.append({"severity": "warning", "path": "state.json", "message": "compile pending"})

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
