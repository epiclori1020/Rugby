#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
from pathlib import Path

from common import atomic_write, runtime_path, utc_now


FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)


def read_frontmatter(path: Path) -> dict[str, str]:
    text = path.read_text(encoding="utf-8")
    match = FRONTMATTER_RE.match(text)
    data: dict[str, str] = {}
    if not match:
        return data
    for line in match.group(1).splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        data[key.strip()] = value.strip().strip('"')
    return data


def build_index() -> Path:
    articles_dir = runtime_path("articles")
    index_path = runtime_path("knowledge") / "index.md"
    articles = sorted(articles_dir.glob("*.md")) if articles_dir.exists() else []
    lines = [
        "# OnField Compiled Memory Index",
        "",
        f"Generated: {utc_now()}",
        "",
        "Compiled local memory is on-demand context. AGENTS, Decision Log, Current State, and SSOTs stay authoritative.",
        "",
        "## Articles",
        "",
    ]
    if not articles:
        lines.append("- No compiled articles yet.")
    for article in articles:
        fm = read_frontmatter(article)
        title = fm.get("title", article.stem)
        article_type = fm.get("type", "workflow_note")
        status = fm.get("status", "generated")
        lines.append(f"- [{title}](articles/{article.name}) - `{article_type}`, `{status}`")
    lines.append("")
    atomic_write(index_path, "\n".join(lines))
    return index_path


def main() -> int:
    build_index()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
