#!/usr/bin/env python3
from __future__ import annotations

import json
import shutil
import subprocess
import sys
import importlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))

compile_module = importlib.import_module("compile")


def reset_runtime() -> None:
    for name in ("captures", "daily", "knowledge", "backups", "orphans", "reports", "tmp"):
        shutil.rmtree(ROOT / name, ignore_errors=True)
    state = ROOT / "state.json"
    if state.exists():
        state.unlink()


def test_compile_index_hot_cache() -> None:
    reset_runtime()
    daily = ROOT / "daily" / "2026-07-04.md"
    daily.parent.mkdir(parents=True, exist_ok=True)
    daily.write_text(
        "# OnField Daily Memory Log - 2026-07-04\n\n"
        "## 2026-07-04T10:00:00Z - Stop\n\n"
        "Decision candidate: Runtime Memory may suggest but not overwrite SSOTs.\n",
        encoding="utf-8",
    )
    result = subprocess.run([sys.executable, str(SCRIPTS / "compile.py"), "--force"], text=True, capture_output=True, check=False)
    assert result.returncode == 0
    assert (ROOT / "knowledge" / "index.md").exists()
    assert (ROOT / "knowledge" / "hot.md").exists()
    articles = list((ROOT / "knowledge" / "articles").glob("*.md"))
    assert articles
    index = (ROOT / "knowledge" / "index.md").read_text(encoding="utf-8")
    assert articles[0].name in index
    hot = (ROOT / "knowledge" / "hot.md").read_text(encoding="utf-8")
    assert len(hot.splitlines()) <= 200
    proposals = ROOT / "reports" / "ssot-proposals.md"
    assert proposals.exists()
    assert "decision_candidate" in proposals.read_text(encoding="utf-8")
    state = json.loads((ROOT / "state.json").read_text(encoding="utf-8"))
    assert state["pending_compile"] is False


def test_hot_cache_respects_configured_line_and_byte_caps() -> None:
    reset_runtime()
    config_path = ROOT / "config.json"
    original_config = json.loads(config_path.read_text(encoding="utf-8"))
    original_load_config = compile_module.load_config
    try:
        config = dict(original_config)
        config["hot_cache_max_lines"] = 8
        config["hot_cache_max_bytes"] = 360
        compile_module.load_config = lambda: config
        articles = ROOT / "knowledge" / "articles"
        articles.mkdir(parents=True, exist_ok=True)
        for index in range(20):
            title = "OnField Runtime Memory " + ("Very Long Generated Signal " * 8) + str(index)
            (articles / f"article-{index}.md").write_text(
                "---\n"
                f'title: "{title}"\n'
                "type: workflow_note\n"
                "status: generated\n"
                "---\n\n"
                "# Body\n",
                encoding="utf-8",
            )

        hot_path = compile_module.update_hot_cache()
        hot = hot_path.read_text(encoding="utf-8")
        assert len(hot.splitlines()) <= config["hot_cache_max_lines"]
        assert len(hot.encode("utf-8")) <= config["hot_cache_max_bytes"]
        assert "Knowledge index:" in hot
    finally:
        compile_module.load_config = original_load_config


if __name__ == "__main__":
    test_compile_index_hot_cache()
    test_hot_cache_respects_configured_line_and_byte_caps()
    print("test_compile_index_hot.py PASS")
