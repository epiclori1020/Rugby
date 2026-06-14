---
name: rugby-field-hub-implementation
description: Use when implementing, reviewing, or planning the Rugby S&C Field Hub app for Arwin. Triggers: Rugby Field Hub, S&C app, Field Hub app, iPad coach dashboard, check-in app, player tracking app, app/field-hub.
---

# Rugby Field Hub Implementation

Use this skill for all work on the Rugby S&C Field Hub app.

## Required Context

Before changing code or scaffolding the app, read:

1. `AGENTS.md`
2. `app/README.md`
3. `app/ROADMAP.md`
4. `app/CODEX_SETUP_AUDIT.md`
5. `app/SUPABASE_SETUP_GUIDE.md`
6. `print_pdfs/00_manifest.txt`

For content and domain rules, read only the files relevant to the current sprint. Common sources:

- `templates/unit_1_simplified_player_checkin_values_2026-06-16.md`
- `templates/progression_tracker_field_compact.md`
- `templates/returner_tracking_template.md`
- `templates/monitoring_template.md`
- `templates/session_variants_abcd_quick_card.md`
- `templates/exercise_pool_offseason_mapping.md`
- `templates/unit_1_slim_consent_2026-06-16.md`
- `templates/kw25_coach_script_2026-06-16_18.md`
- `plans/offseason_coach_sheets/KW25_tuesday_training_plan_clear_2026-06-16.md`
- `plans/offseason_coach_sheets/KW25_thursday_training_plan_clear_2026-06-18.md`
- `plans/offseason_coach_sheets/kw25_27_one_page_field_cards.md`
- `plans/offseason_coach_sheets/kw28_31_one_page_field_cards.md`

## Product Definition

Build a personal training-operations dashboard for Arwin, not a player portal and not a PDF archive.

The app must support:

- before training: today dashboard, briefing, open warnings, material, expected players.
- during training: check-in, attendance, traffic light, variants, quick observations.
- after training: sRPE, duration, session load, pain/issue, E2 decision, progression and follow-ups.
- between sessions: carry-over of warnings, returner caps, consent status and next tasks.

## MVP Architecture

Use:

- Vite + React + TypeScript.
- PWA for iPad/iPhone.
- Supabase Auth + Postgres + Row Level Security as the canonical sync layer for iPad/iPhone.
- Supabase Storage only for private player profile photos after explicit photo consent.
- local offline cache and pending-write queue with IndexedDB, preferably Dexie.
- simple hand-authored TypeScript/JSON static content for KW25-31.
- CSV/JSON export and import.

Do not use in the MVP unless the user explicitly changes the architecture:

- a custom server/backend.
- Supabase Edge Functions.
- Supabase Storage beyond private player profile photos.
- Supabase Realtime.
- player accounts.
- OpenAI API or Agents SDK.
- Expo/native app.
- digital consent signature flow.
- automatic Markdown/PDF parser pipeline.
- large dashboard templates or chart libraries.

Supabase rules:

- Use the Supabase skill/docs before implementing Auth, schema, RLS or migrations.
- Use `app/SUPABASE_SETUP_GUIDE.md` to guide Arwin step by step through Supabase dashboard setup, URL/key collection, `.env`, Auth and RLS.
- Tell Arwin exactly which page to open, what value to copy, and where to paste it.
- Use only browser-safe publishable/anon keys in the client.
- Never expose a `service_role` key.
- Every dynamic table must include `user_id`.
- Every dynamic table in an exposed schema must have RLS enabled.
- Policies must restrict access to the authenticated user's own rows.
- For player photos, use a private `player-photos` bucket, store only `photo_path` on `players`, and restrict Storage policies to the authenticated user's own `{user_id}` path.
- Do not upload medical documents, IDs, consent PDFs, or arbitrary files to Storage.
- Keep static training content in TypeScript/JSON, not in Supabase, unless the user explicitly asks for remote content management.

## UI Rules

- Start screen is the `Heute` dashboard, never a landing page.
- iPad-first and touch-first.
- Use large tap targets and low-friction forms.
- Keep screens practical and quiet, not marketing-like.
- Make key actions available without searching:
  - Check-in.
  - Training.
  - Varianten.
  - Nachbereitung.
  - Returner.
  - Bibliothek.
  - Export.

## Domain Safety Rules

- The app can suggest, never medically clear.
- Concussion suspicion: stop, no same-day return, medical process.
- Head, neck, neurological symptoms, acute instability or strong new pain: no normal training and no automatic bike/ISO alternative.
- Returners need separate caps for speed, COD/deceleration, conditioning and contact.
- Consent in MVP is only a status: vorhanden / offen / unklar.
- Do not store diagnoses or medical documents.
- Do not make 30 m or Bronco mandatory in KW25.

## Implementation Process

Follow `app/ROADMAP.md` sprint order.

For each sprint:

1. Restate the sprint goal briefly.
2. Implement only the sprint scope.
3. Run the relevant build/typecheck/test command once available.
4. For UI changes, start the dev server and use the Browser plugin for visual checks when practical.
5. Summarize changed files, verification and open risks.

## Review Expectations

Before calling work complete, verify:

- the app uses Supabase only for the planned Auth/Postgres/RLS sync layer.
- no custom server, Edge Functions, Realtime or broad Storage dependency was introduced accidentally.
- no real player data is committed.
- no service-role secret is present in client code or committed files.
- RLS expectations are documented for all dynamic tables.
- export/backup remains visible once dynamic data exists.
- sync status remains visible once dynamic data exists.
- UI works for 15-20 players and remains usable on iPad-sized screens.
