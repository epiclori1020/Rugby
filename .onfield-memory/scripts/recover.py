#!/usr/bin/env python3
from __future__ import annotations

import argparse
import shutil
from pathlib import Path

from common import atomic_write, runtime_path, utc_now


def backups() -> list[Path]:
    root = runtime_path("backups")
    if not root.exists():
        return []
    return sorted([p for p in root.iterdir() if p.is_dir()])


def list_backups() -> None:
    for backup in backups():
        print(backup.name)


def restore_backup(backup_id: str, yes: bool) -> int:
    if not yes:
        print("Refusing restore without --yes")
        return 2
    backup = runtime_path("backups") / backup_id
    if not backup.exists() or not backup.is_dir():
        print(f"Backup not found: {backup_id}")
        return 1
    knowledge = runtime_path("knowledge")
    if knowledge.exists():
        safety = runtime_path("backups") / f"pre-restore-{utc_now().replace(':', '').replace('Z', '')}"
        shutil.copytree(knowledge, safety)
        shutil.rmtree(knowledge)
    shutil.copytree(backup, knowledge)
    atomic_write(runtime_path("reports") / "recovery.log", f"[{utc_now()}] restored {backup_id}\n")
    print(f"restored {backup_id}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--list", action="store_true")
    parser.add_argument("--restore")
    parser.add_argument("--yes", action="store_true")
    args = parser.parse_args()
    if args.list:
        list_backups()
        return 0
    if args.restore:
        return restore_backup(args.restore, args.yes)
    parser.print_help()
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
