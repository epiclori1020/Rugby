# OnField Local Runtime Memory

This directory contains the local, Codex-first runtime memory for OnField.

Tracked files are scripts, tests, and configuration. Generated memory outputs are local-only and ignored by Git:

- `captures/`: redacted hook payload snapshots.
- `daily/`: append-only redacted daily raw material.
- `knowledge/`: generated articles, index, and hot cache.
- `backups/`: generated knowledge snapshots before replacement.
- `orphans/`: invalid or unparsable captures.
- `reports/`: lint, setup, and compile reports.
- `state.json`: local runtime state.

Authority order stays unchanged:

1. `AGENTS.md`
2. `docs/field-hub/onfield_decision_log.md`
3. `docs/field-hub/onfield_current_state.md`
4. OnField SSOTs
5. compiled local memory knowledge
6. daily logs
7. raw redacted captures

Generated memory is not an SSOT. It may suggest durable updates in `reports/ssot-proposals.md`, but it must not write or replace OnField SSOT files.

For operational guidance, see `docs/field-hub/onfield_runtime_memory_faq.md` and `.agents/skills/onfield-runtime-memory/SKILL.md`.
