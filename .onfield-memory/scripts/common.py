#!/usr/bin/env python3
from __future__ import annotations

import contextlib
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator


SCHEMA_VERSION = 1


def memory_dir() -> Path:
    override = os.environ.get("ONFIELD_MEMORY_DIR")
    if override:
        return Path(override).expanduser().resolve()
    return Path(__file__).resolve().parents[1]


MEMORY_DIR = memory_dir()


def repo_root() -> Path:
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            cwd=MEMORY_DIR,
            text=True,
            capture_output=True,
            check=True,
        )
        return Path(result.stdout.strip()).resolve()
    except Exception:
        return MEMORY_DIR.parent.resolve()


REPO_ROOT = repo_root()
CONFIG_PATH = MEMORY_DIR / "config.json"
STATE_PATH = MEMORY_DIR / "state.json"


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def today_key() -> str:
    return datetime.now().strftime("%Y-%m-%d")


def load_config() -> dict[str, Any]:
    with CONFIG_PATH.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def runtime_path(name: str) -> Path:
    config = load_config()
    rel = config["runtime_dirs"][name]
    return MEMORY_DIR / rel


def ensure_runtime_dirs() -> None:
    for key in load_config()["runtime_dirs"].values():
        (MEMORY_DIR / key).mkdir(parents=True, exist_ok=True)


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_state() -> dict[str, Any]:
    if not STATE_PATH.exists():
        return {
            "schema_version": SCHEMA_VERSION,
            "captures": {},
            "daily_hashes": {},
            "knowledge_hashes": {},
            "last_compile_at": None,
            "last_compile_status": "never",
            "pending_compile": False,
        }
    try:
        with STATE_PATH.open("r", encoding="utf-8") as handle:
            state = json.load(handle)
    except Exception:
        broken = MEMORY_DIR / "reports" / f"state-broken-{int(time.time())}.json"
        broken.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(STATE_PATH, broken)
        return load_state_default("state_recovered")
    return normalize_state(state)


def load_state_default(status: str = "never") -> dict[str, Any]:
    return {
        "schema_version": SCHEMA_VERSION,
        "captures": {},
        "daily_hashes": {},
        "knowledge_hashes": {},
        "last_compile_at": None,
        "last_compile_status": status,
        "pending_compile": False,
    }


def normalize_state(state: dict[str, Any]) -> dict[str, Any]:
    default = load_state_default()
    default.update({k: v for k, v in state.items() if k in default})
    if default.get("schema_version") != SCHEMA_VERSION:
        default["schema_version"] = SCHEMA_VERSION
    for key in ("captures", "daily_hashes", "knowledge_hashes"):
        if not isinstance(default.get(key), dict):
            default[key] = {}
    if not isinstance(default.get("pending_compile"), bool):
        default["pending_compile"] = bool(default.get("pending_compile"))
    return default


def atomic_write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=str(path.parent))
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as handle:
            handle.write(text)
        os.replace(tmp_name, path)
    except Exception:
        with contextlib.suppress(FileNotFoundError):
            os.unlink(tmp_name)
        raise


def atomic_write_json(path: Path, value: dict[str, Any]) -> None:
    atomic_write(path, json.dumps(value, indent=2, sort_keys=True) + "\n")


def save_state(state: dict[str, Any]) -> None:
    atomic_write_json(STATE_PATH, normalize_state(state))


def append_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8", newline="\n") as handle:
        handle.write(text)


def report(name: str, text: str) -> Path:
    ensure_runtime_dirs()
    path = runtime_path("reports") / name
    append_text(path, text)
    return path


def log_failure(context: str, exc: BaseException | str) -> None:
    report("hook-failures.log", f"[{utc_now()}] {context}: {exc}\n")


@contextlib.contextmanager
def memory_lock() -> Iterator[bool]:
    ensure_runtime_dirs()
    lock_path = runtime_path("tmp") / "memory.lock"
    stale_seconds = int(load_config().get("lock_stale_seconds", 120))
    fd = -1
    try:
        fd = os.open(str(lock_path), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    except FileExistsError:
        try:
            age = time.time() - lock_path.stat().st_mtime
            if age > stale_seconds:
                lock_path.unlink()
                report("skipped.log", f"[{utc_now()}] removed stale lock age={age:.1f}s\n")
                fd = os.open(str(lock_path), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            else:
                report("skipped.log", f"[{utc_now()}] skipped: lock exists\n")
                yield False
                return
        except FileExistsError:
            report("skipped.log", f"[{utc_now()}] skipped: lock exists\n")
            yield False
            return
        except Exception as exc:
            log_failure("memory lock", exc)
            yield False
            return
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            handle.write(f"{os.getpid()} {utc_now()}\n")
        yield True
    finally:
        with contextlib.suppress(FileNotFoundError):
            lock_path.unlink()


def rel_to_repo(path: Path) -> str:
    try:
        return str(path.resolve().relative_to(REPO_ROOT))
    except ValueError:
        return str(path)


def read_stdin_text() -> str:
    try:
        return sys.stdin.read()
    except Exception:
        return ""


def truncate_text(text: str, max_chars: int) -> str:
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + "\n[truncated]\n"


@dataclass(frozen=True)
class HookResult:
    ok: bool
    message: str


def print_fail_open(message: str) -> None:
    print(message)


def exit_success() -> None:
    raise SystemExit(0)
