#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

from common import CONFIG_PATH, MEMORY_DIR, REPO_ROOT, load_config, runtime_path, utc_now


def git_check_ignore(path: Path) -> bool:
    rel = path.relative_to(REPO_ROOT)
    result = subprocess.run(["git", "check-ignore", "-q", str(rel)], cwd=REPO_ROOT)
    return result.returncode == 0


def git_check_ignore_runtime_dir(path: Path) -> bool:
    return git_check_ignore(path / ".onfield-memory-ignore-check")


def run_check() -> dict:
    checks = []
    config = load_config()
    checks.append({"name": "config exists", "ok": CONFIG_PATH.exists()})
    for script in ("common.py", "redact.py", "session_capture.py", "flush.py", "compile.py", "build_index.py", "session_start.py", "lint.py", "recover.py"):
        checks.append({"name": f"script tracked path {script}", "ok": (MEMORY_DIR / "scripts" / script).exists()})
    for key in ("captures", "daily", "knowledge", "backups", "orphans", "reports", "tmp"):
        checks.append({"name": f"ignored runtime {key}", "ok": git_check_ignore_runtime_dir(runtime_path(key))})
    checks.append({"name": "ignored state", "ok": git_check_ignore(MEMORY_DIR / "state.json")})
    checks.append({"name": "schema version", "ok": config.get("schema_version") == 1})
    return {
        "generated_at": utc_now(),
        "ok": all(check["ok"] for check in checks),
        "checks": checks,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    result = run_check()
    if args.json:
        print(json.dumps(result, indent=2, sort_keys=True))
    else:
        for check in result["checks"]:
            print(f"{'PASS' if check['ok'] else 'FAIL'} {check['name']}")
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
