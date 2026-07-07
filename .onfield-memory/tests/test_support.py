from __future__ import annotations

import atexit
import os
import shutil
import tempfile
from pathlib import Path


PROJECT_MEMORY_ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = PROJECT_MEMORY_ROOT / "scripts"


def make_runtime_root() -> Path:
    root = Path(tempfile.mkdtemp(prefix="onfield-memory-test-"))
    shutil.copy2(PROJECT_MEMORY_ROOT / "config.json", root / "config.json")
    atexit.register(lambda: shutil.rmtree(root, ignore_errors=True))
    return root


def runtime_env(root: Path) -> dict[str, str]:
    env = os.environ.copy()
    env["ONFIELD_MEMORY_DIR"] = str(root)
    return env
