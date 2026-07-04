---
name: rugby-field-hub-implementation
description: Use when implementing, reviewing, or planning the OnField Coach app for Arwin. Triggers: OnField, OnField Coach, OnField Rugby, OnField Performance, Rugby Field Hub, S&C app, Field Hub app, iPad coach dashboard, iPhone coach app, check-in app, player tracking app, app/field-hub.
---

# OnField Coach Implementation

Use this skill for all work on the app in `app/field-hub`. Rugby S&C Field Hub / Field Hub is the old working name. The current product direction is **OnField Coach**, with **OnField Rugby** as the first sport-specific configuration.

## Required Context

Before changing product architecture, UI, navigation, branding, or sprint scope, read:

1. `AGENTS.md`
2. `docs/field-hub/memory/index.md`
3. `docs/field-hub/onfield_current_state.md`
4. `docs/field-hub/onfield_decision_log.md`
5. Relevant sprint sections or SSOTs routed by the Memory Index.

For implementation work, also read the files relevant to the current sprint:

- `app/field-hub/README.md`
- affected files under `app/field-hub/src`
- relevant tests next to the affected domain, hook, lib, or component files

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

Build **OnField Coach**: a field-ready training-operations app for coaches. It is not primarily a player portal, a PDF archive, or a generic SaaS dashboard.

Brand architecture:

- **OnField**: main brand.
- **OnField Coach**: current app.
- **OnField Performance**: later SaaS/platform direction.
- **OnField Rugby**: first sport-specific configuration.

The app must support:

- before training: today dashboard, briefing, open warnings, material, expected players.
- during training: check-in, attendance, traffic light, variants, quick observations.
- after training: sRPE, duration, session load, pain/issue, E2 decision, progression and follow-ups.
- between sessions: carry-over of warnings, returner caps, consent status and next tasks.
- later multi-sport configuration without hard-coding Rugby into generic product architecture.

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
- a native rewrite before information architecture, core workflows, design system, and PWA quality are stable.

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
- iPhone and iPad must have feature parity. Differences may be layout, navigation, density, and sheet/pane behavior only.
- iPad should use a sidebar plus content area and optional detail pane.
- iPhone should use a visible bottom tab bar for the 5 top-level areas.
- Top-level navigation target: `Heute`, `Einheit`, `Spieler`, `Analyse`, `Mehr`.
- `Check-in`, `Training`, and `Nachbereitung` belong under `Einheit`.
- `Bibliothek`, `Export/Backup`, and `Einstellungen` belong under `Mehr`.
- Use large tap targets and low-friction forms.
- Keep screens practical and quiet, not marketing-like.
- Marketing or hero-style branding is allowed on welcome, login, onboarding, PWA install, app icon/splash, empty demo states, kiosk welcome, and landing surfaces. Live coaching flows must stay operational and low-noise.
- Use OnField naming consistently. Rugby-specific terminology belongs to the OnField Rugby configuration or rugby content, not generic component architecture.
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

Follow the OnField roadmap sprint order in `docs/superpowers/plans/2026-07-04-onfield-ux-branding-transformation-roadmap.md`.

For each sprint:

1. Restate the sprint goal briefly.
2. Read the required OnField memory and relevant SSOT docs.
3. Implement only the sprint scope.
4. Run the relevant build/typecheck/test command once available.
5. For UI changes, start the dev server and use the Browser plugin for iPhone/iPad visual checks when practical.
6. Summarize changed files, verification and open risks.

## Review Expectations

Before calling work complete, verify:

- the app uses Supabase only for the planned Auth/Postgres/RLS sync layer.
- no custom server, Edge Functions, Realtime or broad Storage dependency was introduced accidentally.
- no real player data is committed.
- no service-role secret is present in client code or committed files.
- RLS expectations are documented for all dynamic tables.
- export/backup remains visible once dynamic data exists.
- sync status remains visible once dynamic data exists.
- UI works for 15-20 players and remains usable on both iPhone and iPad.
- no feature is accidentally iPad-only.
- medical/safety copy does not imply diagnosis or return-to-play clearance.

## Memory Closeout

Before the final response:

1. Check whether `docs/field-hub/onfield_current_state.md` needs an update.
2. Check whether `docs/field-hub/onfield_decision_log.md` needs an update for a durable decision.
3. Check whether `docs/field-hub/memory/gotchas.md` needs an update for a repeatable lesson or trap.
4. Update only the matching memory file when `docs/field-hub/onfield_memory_governance.md` says the information qualifies.
5. In the final response, state one of:
   - `Memory updated: <file>`
   - `No memory update needed`
