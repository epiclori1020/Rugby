---
name: onfield-runtime-memory
description: Use when implementing, auditing, debugging, documenting, or verifying the OnField local Runtime Memory system in `.onfield-memory`, including Codex hooks, SessionStart hot cache, Stop/PreCompact capture, redaction, daily logs, compile/index/hot cache, lint/health checks, backups, or recovery.
---

# OnField Runtime Memory

Use this skill for work on the local Runtime Memory introduced in Sprint 0D.

## Required Context

Read before changing Runtime Memory files:

1. `AGENTS.md`
2. `docs/field-hub/memory/index.md`
3. `docs/field-hub/onfield_current_state.md`
4. `docs/field-hub/onfield_decision_log.md`
5. `docs/field-hub/onfield_memory_governance.md`
6. `docs/field-hub/onfield_runtime_memory_faq.md`
7. `.onfield-memory/README.md`

Read specific scripts/tests only for the subsystem being changed.

## Scope Rules

- Runtime Memory is local, ignored, and not canonical.
- Generated Knowledge may inform Memory Closeout but must not replace SSOTs.
- Do not write `onfield_current_state.md`, `onfield_decision_log.md`, roadmap docs, or SSOTs from Runtime scripts.
- Do not require or store service-role keys, real secrets, or sensitive player/health data.
- Do not start `codex exec` or other agent subprocesses from hooks.
- Keep hooks fail-open except clear existing `PostToolUse` secret blocks.
- Keep SessionStart small; never load all generated memories automatically.

## Workflow

1. Restate the Runtime Memory task and out-of-scope areas.
2. Inspect `.codex/hooks.json`, `.onfield-memory/config.json`, and only the relevant scripts/tests.
3. Preserve the authority hierarchy: AGENTS, Decision Log, Current State, SSOTs, generated Knowledge, Daily Logs, Captures.
4. Implement small, testable changes.
5. Run the relevant Runtime checks.
6. Remove local generated test artifacts unless the task explicitly needs them.
7. Run Memory Closeout and update durable docs only when Governance qualifies it.

## Verification

Use the narrowest relevant subset, then expand when hooks or shared helpers changed:

```bash
python3 -m compileall .onfield-memory/scripts .onfield-memory/tests
python3 .onfield-memory/tests/test_redact.py
python3 .onfield-memory/tests/test_capture_flush.py
python3 .onfield-memory/tests/test_compile_index_hot.py
python3 .onfield-memory/tests/test_lint_recover.py
python3 .onfield-memory/tests/test_hooks_smoke.py
python3 -m json.tool .codex/hooks.json
python3 -m json.tool .onfield-memory/config.json
python3 .onfield-memory/scripts/setup_check.py --json
python3 .onfield-memory/scripts/lint.py --json
git diff --check
```

If app code was not touched, app UI/browser/Supabase checks are normally not applicable. If hook changes might affect all Codex work, run the guardrail smoke:

```bash
bash .codex/hooks/onfield_guardrails.sh post-write-check
```

## Common Pitfalls

- Do not treat `knowledge/hot.md` as an SSOT.
- Do not add generated `daily/`, `captures/`, `knowledge/`, `reports/`, `backups/`, `orphans/`, `tmp/`, or `state.json` to Git.
- Do not leave fixture-generated Runtime data behind after tests.
- Do not weaken redaction to make tests pass.
- Do not broaden 0D into Claude parity, cloud sync, vector search, or LLM curation without a new sprint decision.
