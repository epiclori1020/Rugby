# Field Hub Progress Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the next Field Hub evolution: better player progress tracking, guided live-session data capture, structured planned-vs-actual training records, player-specific analysis, team statistics, and cleaner library/plan integration without overloading pitch-side use.

**Architecture:** Keep the current React/Vite PWA and Supabase/Dexie sync architecture. Preserve existing core tables as the MVP foundation, then add structured tables only where current free-text or fixed columns block useful analysis. The UX must separate live coaching, player detail, and analysis so the app remains fast on the field.

**Tech Stack:** React, TypeScript, Vite, Dexie/IndexedDB, Supabase Auth/Postgres/RLS, Supabase Storage only for private player photos, Vitest, existing CSV/JSON export/import.

---

## 1. Current Context

This roadmap continues the Rugby S&C Field Hub app under:

- `app/field-hub/`
- Supabase project: `rugby-snc-field-hub`
- Remote project ref known locally: `vpgqmykayreqlzfcvtat`

Start assumption:

- Sprint 1-10 are code-complete.
- Sprint 11 contains deployment/device-readiness work and may not be fully complete on real iPad/iPhone hardware.
- Before field-critical changes, verify current deploy, coach login, PWA install, offline pending retry, and iPad/iPhone sync status.

The app exists because Arwin needs a personal Rugby Donau S&C operations dashboard, not a player portal and not only a PDF archive.

Current core purpose:

- before training: today dashboard, expected players, warnings, material, briefing
- during training: check-in, attendance, traffic light, variants, quick observations
- after training: sRPE, pain/issue, E2 decision, progressions, follow-ups
- between sessions: carry-over of warnings, returner caps, consent status, next tasks

Current audience and domain:

- Rugby Union Donau Wien
- U22/development group plus selected returners
- amateur/semi-pro constraints
- two formal S&C exposures per week as default
- high injury-rate context, especially after senior competition level increased
- no medical clearance decisions by the app
- no diagnosis storage

## 2. Existing App Data Model

Do not replace these tables blindly. They already encode the most important MVP relationships.

Existing dynamic Supabase tables:

- `players`
- `session_logs`
- `player_session_entries`
- `progress_entries`
- `baseline_entries`
- `returner_entries`
- `public_checkin_links`
- `public_checkin_link_players`
- `public_checkin_submissions`

Existing local Dexie stores mirror these records plus pending writes, photo cache, pending photo uploads, and sync metadata.

Important current `player_session_entries` fields include more than the early MVP check-in fields:

- attendance/readiness/life flag/pain/returner/traffic light
- `session_reaction`
- `red_flag`
- `movement_concern`
- `traffic_light_suggestion`
- `traffic_light_was_manual`
- `training_variant`
- `limits`
- `checkin_source`
- `player_submitted_at`
- `coach_edited_at`
- `player_note`
- post-session fields such as sRPE, duration, generated session load, post-pain, E2, and next step

This matters because several future statistics can already be derived from existing data before new tables are added.

Known remote data counts from 2026-06-20:

- `players`: 29
- `session_logs`: 9
- `player_session_entries`: 66
- `progress_entries`: 2
- `baseline_entries`: 17
- `returner_entries`: 2
- `public_checkin_links`: 21
- `public_checkin_link_players`: 270
- `public_checkin_submissions`: 15

These counts are useful orientation, not hard-coded test expectations.

## 3. Existing App Flows To Preserve

Current main tabs:

- `Heute`
- `Spieler`
- `Check-in`
- `Training`
- `Nachbereitung`
- `Returner`
- `Bibliothek`
- `Export`
- `Einstellungen`

Current important source files:

- `app/field-hub/src/App.tsx`
- `app/field-hub/src/components/TodayDashboard.tsx`
- `app/field-hub/src/components/PlayersView.tsx`
- `app/field-hub/src/components/CheckInView.tsx`
- `app/field-hub/src/components/TrainingView.tsx`
- `app/field-hub/src/components/PostSessionView.tsx`
- `app/field-hub/src/components/ReturnerView.tsx`
- `app/field-hub/src/components/LibraryView.tsx`
- `app/field-hub/src/components/ExportView.tsx`
- `app/field-hub/src/content/sessions.ts`
- `app/field-hub/src/content/trainingReference.ts`
- `app/field-hub/src/content/library.ts`
- `app/field-hub/src/domain/checkIn.ts`
- `app/field-hub/src/domain/postSession.ts`
- `app/field-hub/src/domain/baseline.ts`
- `app/field-hub/src/domain/returners.ts`
- `app/field-hub/src/domain/training.ts`
- `app/field-hub/src/lib/localDb.ts`
- `app/field-hub/src/lib/syncRepository.ts`
- `app/field-hub/src/lib/backupRepository.ts`
- `app/field-hub/src/lib/csvExport.ts`

Current important planning/content sources:

- `docs/16_unit_1_v2_deep_playbook_2026-06-16.md`
- `docs/18_unit_2_deep_playbook_2026-06-18.md`
- `docs/19_kw26_tuesday_deep_playbook_2026-06-23.md`
- `plans/offseason_coach_sheets/`
- `templates/session_variants_abcd_quick_card.md`
- `templates/exercise_pool_offseason_mapping.md`
- `print_pdfs/00_manifest.txt`

## 4. Product Rule For The Whole Roadmap

The app must become more structured without becoming heavier during coaching.

Use this hierarchy:

1. **Live mode:** fast, guided, only today's decisions and exceptions.
2. **Player profile:** detailed player history after explicitly opening a player.
3. **Analysis:** team and position trends for planning between sessions.

Do not turn `Heute`, `Check-in`, or `Training` into dense analytics screens.

## 5. Data Capture Rule

Every new data point must answer three questions before implementation:

1. **Where is it captured?**
   - check-in
   - live training phase
   - post-session checklist
   - player profile correction
   - public/kiosk/self check-in

2. **When is it captured?**
   - before training
   - during a specific phase
   - immediately after training
   - later correction

3. **Why is it captured?**
   - today's training decision
   - player progress trend
   - team planning statistic
   - safety/follow-up
   - export/reporting

If a field cannot answer these, it should not be added.

## 6. Data Quality Rule

Use structured fields for anything that should become a chart, filter, statistic, or rule.

Good structured data:

- attendance
- readiness
- pain score
- pain location/body region
- traffic light
- session RPE
- duration
- session load
- E2 decision
- next step
- block completed/reduced/omitted
- exposure type
- test metric value
- exercise result
- returner cap

Good free text:

- context
- coach observations
- unusual circumstances
- short non-medical note
- reason for a manual override

Avoid hiding analyzable data in notes.

Pain/body-region note:

- Current pain location is mostly text-based and remains useful for coaching context.
- Do not promise body-region charts until structured body-region capture exists.
- Structured body-region capture requires its own future sprint because it affects check-in UI, public/kiosk flows, Supabase schema, Dexie, sync, export/import, CSV, and tests.
- Until then, charts may show pain score and pain-location text history, but not reliable body-region trend statistics.

## 7. Target Data Architecture

### 7.0 Hard Technical Constraints

Do not add high-cardinality synced tables until the sprint has explicitly handled sync scope.

Current sync reality:

- The app is offline-first and uses Dexie plus pending writes.
- Global/manual sync can still pull full user-scoped remote sets for some tables and compare `client_updated_at` locally.
- This is acceptable for current table sizes, but it becomes risky for dense fact tables such as per-player-per-block exposures.
- New fact tables must use either session-scoped pull, a compact row model, or a server-side delta/watermark strategy before they become large.

Implementation gate:

- Before `session_block_logs`, exposure records, metric results, or exercise results are added, define the exact pull scope and indexes.
- Avoid adding background full-poll sync for high-cardinality records.
- Keep push-only/local-first behavior after individual taps where possible.

### 7.0.1 Content Foundation Constraint

Current `SessionBlock` content has `time`, `title`, `work`, `dose`, and `note`, but not stable block identifiers.

Before block logs, live-session persistence, or automatic exposure generation, active session content must gain:

- stable `key`
- explicit `order`
- optional `exposureTags`
- optional `libraryRefs`

Never key historical block logs from array index or editable title text. Content edits must not orphan historical data.

### 7.1 Existing Tables Kept As Core

Keep:

- `players` as player identity and static status
- `session_logs` as the performed session instance
- `player_session_entries` as the central player-session fact table
- `returner_entries` as returner cap and decision record

Keep for compatibility, but gradually supersede:

- `baseline_entries` by flexible `metric_results`
- `progress_entries` by structured `exercise_results`

Cutover/read precedence:

- Do not delete or rewrite `baseline_entries` or `progress_entries` in the first implementation.
- Player charts should read new structured records first.
- If no new structured record exists for a historical session/player, fall back to legacy `baseline_entries` or `progress_entries`.
- Any one-time import from legacy to new tables must be planned and verified separately after Sprint 12 data audit.

### 7.2 New Dynamic Tables And Static Catalogues Proposed

The exact migrations should be created in the sprint that needs each table. Every table must include:

- `id uuid primary key`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz null`
- `client_updated_at timestamptz not null`
- RLS enabled
- own-user select/insert/update/delete policies
- authenticated grants only
- no broad anon access unless explicitly needed for public check-in
- Dexie store
- pending write sync handling
- JSON backup/import support
- relevant CSV export when useful

Every new dynamic table also needs this integration checklist:

- add to `PendingWriteTable` in `app/field-hub/src/lib/localDb.ts`
- add a Dexie version with useful compound indexes such as `[userId+sessionLogId]` or `[userId+clientUpdatedAt]`
- add pending retry handling in `resetErroredPendingWritesForRetry`
- add a repository-level sync overview
- add the repository to `getCombinedSyncOverview` when it affects global sync status
- define push order and pull scope in `syncAllUserData` or a dedicated orchestrator
- add backup creation, backup import validation, and import queuing in `backupRepository.ts`
- add CSV export only when the data is useful outside the app
- add RLS and grants in a migration
- add focused repository and domain tests

Proposed dynamic tables and static catalogues:

#### `session_block_logs`

Purpose: planned-vs-actual record for each session phase or block.

Important fields:

- `session_log_id`
- `session_definition_id`
- `block_key`
- `block_title`
- `block_order`
- `planned_time`
- `planned_work`
- `status`: `planned`, `done`, `reduced`, `changed`, `skipped`
- `reason`: `none`, `time`, `weather`, `group`, `safety`, `equipment`, `coach_decision`
- `coach_note`

Why: This connects plans/PDF-derived session structure with what actually happened.

#### `player_exposures` or compact exposure summary

Purpose: record which training stimuli each player actually received.

Model decision required before implementation:

- Option A: detailed row model, one row per player/session/block/exposure.
- Option B: compact summary model, one row per player/session with exposure statuses stored as structured JSON or compact columns.

Default recommendation for MVP:

- Prefer the compact summary model unless Sprint 18 proves block-level exposure detail is needed.
- The compact model reduces sync volume while still answering core questions such as "Who has not sprinted in 14 days?"

Important fields:

If the detailed row model is chosen:

- `player_id`
- `session_log_id`
- `session_block_log_id`
- `exposure_type`: `speed`, `acceleration`, `cod_decel`, `lower_strength`, `upper_strength`, `power`, `conditioning`, `contact_prep`, `neck_trunk`, `mobility`, `reconditioning`
- `status`: `completed`, `reduced`, `skipped`
- `source`: `block_default`, `coach_manual`, `limit_override`
- `intensity_note`
- `volume_note`

If the compact summary model is chosen:

- `player_id`
- `session_log_id`
- compact exposure status map keyed by exposure type
- source/override metadata for manually changed exposure statuses
- optional notes for intensity, volume, and reason

Why: This enables useful future questions such as "Who has not sprinted for two weeks?" or "How often did we actually deliver contact-prep?"

#### Static `metricDefinitions.ts` catalogue

Purpose: flexible test/metric catalogue as code/content, not a dynamic Supabase table for the MVP.

Important properties:

- `name`
- `category`: `power`, `speed`, `strength`, `conditioning`, `mobility`, `other`
- `unit`: `cm`, `m`, `s`, `kg`, `reps`, `score`
- `higher_is_better boolean`
- `active boolean`
- `description`

Why: Avoid schema changes every time a new test is added without adding unnecessary RLS/sync/backup overhead.

Initial definitions:

- Broad Jump, unit `cm`, category `power`, higher better
- Med-Ball Chest Pass, unit `m`, category `power`, higher better
- 10 m Sprint, unit `s`, category `speed`, lower better
- 30 m Sprint, unit `s`, category `speed`, lower better, optional/later

#### `metric_results`

Purpose: flexible player test result records.

Important fields:

- `metric_key`
- `player_id`
- `session_log_id`
- `value numeric`
- `attempt integer`
- `is_valid boolean`
- `body_side`: `none`, `left`, `right`
- `context_note`

Why: This supports charts and history per player without adding columns for each test.

Validation:

- `metric_key` must be validated in domain code against `metricDefinitions.ts`.
- Unknown metric keys should not be saved.
- Import should reject records with unknown metric keys unless a future import-mapping step is explicitly built.

#### Static `exerciseDefinitions.ts` catalogue

Purpose: structured exercise catalogue as code/content, linked with existing `trainingReference.ts` patterns where practical.

Important properties:

- `name`
- `pattern`: `squat`, `hinge`, `push`, `pull`, `carry`, `lunge`, `jump`, `sprint`, `cod`, `neck_trunk`, `conditioning`, `other`
- `default_unit`: `kg`, `bodyweight`, `m`, `s`, `reps`
- `active boolean`

Why: Enables exercise progress charts without forcing every entry into free text, while avoiding another dynamic catalogue table.

#### `exercise_results`

Purpose: structured per-player training result.

Important fields:

- `exercise_key`
- `player_id`
- `session_log_id`
- `session_block_log_id`
- `variant`: `A_plus`, `A`, `B`, `C`, `D`, `custom`
- `sets integer`
- `reps text`
- `load_value numeric null`
- `load_unit text`
- `rpe numeric null`
- `rir numeric null`
- `technique_quality`: `good`, `ok`, `limited`, `poor`, `not_recorded`
- `pain_response`: `none`, `same`, `worse`, `better`, `unclear`
- `note`

Why: Allows meaningful strength/progression history.

Validation:

- `exercise_key` must be validated in domain code against `exerciseDefinitions.ts`.
- Unknown exercise keys should not be saved.
- Import should reject records with unknown exercise keys unless a future import-mapping step is explicitly built.

### 7.3 Derived Data

Prefer derived frontend/domain selectors before adding stored summary tables.

Derived views can include:

- latest player traffic light
- latest limits
- latest E2 decision
- last attendance
- current open follow-ups
- latest returner cap summary
- exposure gaps
- latest metric values
- weekly load
- rolling 7-day and 28-day load
- load spike flags
- contact/contact-prep trend
- repeated yellow/red status
- pain score trend
- body-region trend only after a dedicated structured body-region sprint exists

Only add materialized/stored summary tables if performance requires it.

## 8. UX Architecture

### 8.1 `Heute`

Purpose: today's decisions, not deep analysis.

Show:

- selected/current session
- quick actions: Check-in, Training starten, Nachbereitung, Bibliothek
- expected/active player count
- open warnings
- missing post-session items from last completed or active session
- exposure gaps only when actionable today

Do not show:

- full player charts
- dense tables
- all historical values

### 8.2 `Spieler`

List screen:

- search
- filters: active, returner, traffic light, position/cluster, missing consent, open follow-up
- compact badges: last traffic light, returner, consent, open limit

Player detail screen after click:

- `Uebersicht`
- `Training`
- `Tests`
- `Load`
- `Issues`
- `Returner`
- `Bearbeiten`

This is where player-specific analysis belongs.

### 8.3 `Training`

Convert from generic training view to guided live-session mode.

Entry action:

- `Training starten`

Live structure:

- one current phase at a time
- previous/next step controls
- each phase can be marked done/reduced/changed/skipped
- default exposures generated by phase tags
- player-specific exceptions captured only when needed

### 8.4 `Nachbereitung`

Convert from generic form to guided closure checklist.

Show:

- missing sRPE
- missing post-pain for flagged players
- missing E2/next step for yellow/red/C/D/limits
- missing baseline/metric values where the phase was done
- missing progression values where strength block was done
- session status: open, partial, completed
- export/backup reminder

### 8.5 `Analyse`

Add a new tab only after data foundations exist.

Team analysis:

- attendance
- readiness
- traffic light distribution
- weekly load
- planned vs actual
- exposures per week
- position/cluster filters

Player analysis stays inside player detail.

### 8.6 `Bibliothek`

Clean structure:

- Heute relevant
- Aktive Plaene
- Varianten
- Exercise Mapping
- Consent/Datenschutz
- Archiv

Link library items to session blocks where useful.

## 9. Sprint Roadmap

### Sprint Status And Review Gate

Each sprint has a two-stage completion process.

Build sessions may mark only:

- `implemented_by_agent`

They must not mark:

- `reviewed_by_codex`
- `accepted_by_arwin`

Official completion requires:

1. Build session completes the sprint scope and documents changed files, tests, risks, and open questions.
2. A separate review session checks the work against this roadmap, code, UX, data model, tests, sync/export/RLS expectations, and safety rules.
3. Only after that review may the sprint be marked `reviewed_by_codex`.
4. Arwin gives final acceptance before `accepted_by_arwin` is checked.

Status template for each sprint:

```md
**Sprint status:**
- [ ] planned
- [ ] implemented_by_agent
- [ ] tests_reported_by_agent
- [ ] reviewed_by_codex
- [ ] accepted_by_arwin

**Implementation session:**
**Review session:**
**Review notes:**
```

Recommended execution limit:

- Default: one sprint per build session.
- Two sprints in one build session only when the first sprint is small, non-migratory, and the second sprint depends directly on it.
- Never bundle a migration-heavy sprint with another sprint unless a review session explicitly approves that plan first.

### Sprint 12: Data And UX Audit

**Goal:** Create a precise implementation baseline before adding new features.

**Sprint status:**

- [ ] planned
- [x] implemented_by_agent
- [x] tests_reported_by_agent
- [x] reviewed_by_codex
- [ ] accepted_by_arwin

**Implementation session:** 2026-06-21: Sprint-12-Audit-Dokument unter `docs/field-hub/progress_tracking_data_audit.md` erstellt. Keine App-Code-, UI- oder Supabase-Migrationsaenderung.

**Review session:** 2026-06-21: Self-audit gegen Sprint-12-Plan, Rugby-Field-Hub-Skill, AGENTS.md, Sicherheits-/MVP-Regeln und frische App-Checks durchgefuehrt. Keine blockierenden Findings.

**Review notes:** Dokumentpruefung, `git diff --check`, Secret-/Scope-Scan, `npm run typecheck`, `npm run lint`, `npm test` und `npm run build` ausgefuehrt. Browser-/Frontend-, Kiosk-E2E- und Supabase-Checks nicht erforderlich, weil Sprint 12 keine UI-, Auth-, RLS- oder Migrationsaenderung enthaelt. Einzelne Work-Checkboxen wurden in dieser Review-Session nachgezogen; `accepted_by_arwin` bleibt offen.

**Files likely touched:**

- Create: `docs/field-hub/progress_tracking_data_audit.md`
- Read only: `app/field-hub/src/domain/*.ts`
- Read only: `app/field-hub/src/lib/*.ts`
- Read only: `supabase/migrations/*.sql`
- Read only: `app/field-hub/src/components/*.tsx`

**Work:**

- [x] Map every currently collected data point to source screen, table, and purpose.
- [x] Mark each data point as live, post-session, correction, or analysis.
- [x] Define mandatory vs optional capture.
- [x] Identify which stats can already be derived from existing records.
- [x] Identify which proposed tables are needed before each later sprint.

**Must answer:**

- Which progress stats can be shown without migrations?
- Which fields are currently trapped in free text?
- Which screens create the highest risk of missed data?
- Which public/kiosk/self-check-in fields should feed player session entries?

**Acceptance criteria:**

- A new session can read `docs/field-hub/progress_tracking_data_audit.md` and know what exists, what is missing, and what should not be changed yet.
- No app code is changed.
- No Supabase migration is created.

**Verification:**

- Manual review of the document against:
  - `app/field-hub/README.md`
  - `app/ROADMAP.md`
  - `supabase/migrations/*.sql`
  - core domain files

### Sprint 13: Player Profile 2.0

**Goal:** Make the player detail screen the player-specific progress hub while keeping the player list light.

**Sprint status:**

- [x] planned
- [x] implemented_by_agent
- [x] tests_reported_by_agent
- [x] reviewed_by_codex
- [ ] accepted_by_arwin

**Implementation session:** 2026-06-21: Player Profile 2.0 ohne Migration umgesetzt. Spieler-Liste bleibt kompakt mit Suche/Filtern/Badges; Profil-Detail erscheint erst nach Klick und nutzt bestehende lokale Daten fuer Uebersicht, Training, Tests, Load, Issues, Returner und Bearbeiten.
**Review session:** 2026-06-21: Codex-Review gegen Sprint-13-Akzeptanzkriterien, Field-Hub-Skill, Audit-Dokument und lokale Checks durchgefuehrt. Keine blockierenden Findings.
**Review notes:** `git diff --check`, Secret-/Scope-Scan, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` und Dev-Server-HTTP-Check auf `http://127.0.0.1:5173/` ausgefuehrt. Browser-Screenshot/iPad-Visual-QA nicht ausgefuehrt, weil in dieser Session kein direktes Screenshot-Tool verfuegbar war. Spielerprofil nutzt bestehende lokale Stores und fuehrt keine Migration ein. Offener Designpunkt: lokale Profilableitung liest aktuell den lokalen Verlauf breit; fuer spaetere Analyse-Sprints bounded/historische Lesestrategie weiterhin beachten.

**Files likely touched:**

- Modify: `app/field-hub/src/components/PlayersView.tsx`
- Create or split: `app/field-hub/src/components/PlayerDetailView.tsx`
- Create or split: `app/field-hub/src/components/PlayerSummaryCards.tsx`
- Create: `app/field-hub/src/domain/playerProfile.ts`
- Test: `app/field-hub/src/components/PlayersView.test.tsx`
- Test: `app/field-hub/src/domain/playerProfile.test.ts`

**Data used:**

- existing `players`
- existing `player_session_entries`
- existing `session_logs`
- existing `baseline_entries`
- existing `progress_entries`
- existing `returner_entries`

**UX:**

- Player tab shows only list/search/filter/badges.
- Clicking a player opens detail.
- Detail segments:
  - `Uebersicht`
  - `Training`
  - `Tests`
  - `Load`
  - `Issues`
  - `Returner`
  - `Bearbeiten`

**Acceptance criteria:**

- Player list remains compact and usable with 20+ players.
- Player detail shows latest traffic light, last session, latest sRPE/load, latest baseline values, latest progress entry, latest returner cap, open follow-ups.
- Name, position, cluster, consent, returner status, notes remain editable from `Bearbeiten`.
- No new database table is required in this sprint.

**Verification:**

- `npm run typecheck`
- `npm run lint`
- `npm test -- PlayersView`
- Browser check at desktop, iPad, iPhone widths

### Sprint 14: Post-Session 2.0 Closure Checklist

**Goal:** Reduce forgotten documentation by making post-session a guided completion workflow.

**Sprint status:**

- [x] planned
- [x] implemented_by_agent
- [x] tests_reported_by_agent
- [x] reviewed_by_codex
- [ ] accepted_by_arwin

**Implementation session:** 2026-06-21: Closure Checklist ohne Migration umgesetzt. Nachbereitung zeigt offene Pflichtdaten und Hinweise pro Session; Heute zeigt eine kompakte Aktion fuer die letzte relevante lokale Nachbereitungsarbeit.
**Review session:** 2026-06-21: Codex-Review gegen Sprint-14-Akzeptanzkriterien, Field-Hub-Skill, Audit-Dokument und lokale Checks durchgefuehrt. Keine blockierenden Findings.
**Review notes:** `git diff --check`, Secret-/Scope-Scan, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` und Dev-Server-HTTP-Check auf `http://127.0.0.1:5173/` ausgefuehrt. Keine Migration, keine neue Tabelle und keine Sync-/Auth-/RLS-Architekturaenderung. Offener Designpunkt: Closure verwendet aktuell aktive Spieler als Erwartungsmenge; falls spaeter session-spezifische erwartete Spieler sauber modelliert werden, sollte die Checklist diese Menge verwenden.

**Files likely touched:**

- Modify: `app/field-hub/src/components/PostSessionView.tsx`
- Create: `app/field-hub/src/domain/postSessionCompletion.ts`
- Modify: `app/field-hub/src/components/TodayDashboard.tsx`
- Test: `app/field-hub/src/domain/postSessionCompletion.test.ts`
- Test: `app/field-hub/src/components/PostSessionView.test.tsx`
- Test: `app/field-hub/src/components/TodayDashboard.test.tsx`

**Data used:**

- existing `session_logs.status`
- existing `player_session_entries`
- existing `progress_entries`
- existing `baseline_entries`

**UX:**

- Show checklist per selected session:
  - attendance exists
  - missing sRPE count
  - missing post-pain for flagged players
  - missing E2/next step for yellow/red/limits
  - progress entries present where relevant
  - baseline/test values present where relevant
  - session can be marked completed
  - backup/export reminder shown after completion

**Acceptance criteria:**

- Session can be visibly `offen`, `teilweise abgeschlossen`, or `abgeschlossen`.
- Today dashboard shows unfinished post-session work for the latest relevant session.
- Existing save/sync behavior remains unchanged.
- No new table is required.

**Verification:**

- `npm run typecheck`
- `npm run lint`
- `npm test -- postSession`
- Manual test: create/edit a local session, leave sRPE missing, verify checklist and Heute warning.

### Sprint 15: Content And Sync Foundation

**Goal:** Add the missing content and sync foundations before live-stepper, block logs, exposures, metrics, or exercise results are implemented.

**Sprint status:**

- [x] planned
- [x] implemented_by_agent
- [x] tests_reported_by_agent
- [x] reviewed_by_codex
- [ ] accepted_by_arwin

**Implementation session:** 2026-06-21: Statische Content- und Sync-Foundation umgesetzt. `SessionBlock` hat stabile Keys, explizite Order-Werte, konservative Exposure-Tags und optionale Block-Library-Refs. Metric- und Exercise-Definitions wurden als statischer TypeScript-Content angelegt; Sync-Regel fuer spaetere dichte Fact-Daten wurde als Domain-Konstante dokumentiert. Keine Migration, keine neue dynamische Tabelle und keine neue sichtbare UI-Funktion.
**Review session:** 2026-06-21: Codex-Review gegen Sprint-15-Plan, Field-Hub-Skill, MVP-/Supabase-Grenzen und lokale Checks durchgefuehrt. Keine blockierenden Findings.
**Review notes:** `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `git diff --check`, Supabase-Pfad-Check und scoped Secret-/Migration-Signal-Scan ausgefuehrt. Keine Migration, keine neue dynamische Tabelle, kein Auth-/RLS-/Storage-/Realtime-/Edge-Function-Change. `accepted_by_arwin` bleibt offen.

**Files likely touched:**

- Modify: `app/field-hub/src/content/types.ts`
- Modify: `app/field-hub/src/content/sessions.ts`
- Modify: `app/field-hub/src/content/trainingReference.ts`
- Create: `app/field-hub/src/content/metricDefinitions.ts`
- Create: `app/field-hub/src/content/exerciseDefinitions.ts`
- Create: `app/field-hub/src/domain/syncPlanning.ts`
- Test: `app/field-hub/src/content/sessionBlockKeys.test.ts`
- Test: `app/field-hub/src/content/metricDefinitions.test.ts`
- Test: `app/field-hub/src/content/exerciseDefinitions.test.ts`

**Data used:**

- existing `SessionDefinition.timeline`
- existing static training/reference content
- existing sync repositories for constraints, not for feature changes

**UX:**

- No visible UX change is required.
- This sprint makes later UX safe by giving every training phase a stable key and exposure tags.

**Work:**

- [x] Add stable `key`, `order`, optional `exposureTags`, and optional `libraryRefs` to `SessionBlock`.
- [x] Tag active KW25-31 session blocks with conservative exposure tags.
- [x] Create static metric definitions for Broad Jump, Med-Ball Chest Pass, 10 m Sprint, and optional/later 30 m Sprint.
- [x] Create static exercise definitions aligned with current patterns in `trainingReference.ts`.
- [x] Document the sync rule for new fact data: session-scoped pull, compact model, or server-side delta before high-volume tables.

**Acceptance criteria:**

- Every active session block has a stable key that does not depend on array index or editable title.
- Exposure tags exist for blocks where automatic exposure generation is intended.
- Metric and exercise definitions are static TypeScript content, not Supabase tables.
- Future sprint plans can reference the exact keys/tags.
- No Supabase migration is created in this sprint.

**Verification:**

- `npm run typecheck`
- `npm run lint`
- `npm test -- sessionBlockKeys`
- Content review against active playbooks/PDF sources.

### Sprint 16: Planned Vs Actual Session Blocks

**Goal:** Persist whether planned training blocks were actually done, reduced, changed, or skipped.

**Sprint status:**

- [x] planned
- [x] implemented_by_agent
- [x] tests_reported_by_agent
- [x] reviewed_by_codex
- [ ] accepted_by_arwin

**Implementation session:** 2026-06-21: `session_block_logs` mit Supabase-RLS-Migration, Dexie/Pending-Queue, session-scoped Pull, Push, Backup/Import, CSV-Export und minimaler Blockstatus-Erfassung in der Training-Ansicht umgesetzt. Keine Sprint-17-Stepper-, Exposure-, Metrics- oder Exercise-Result-Funktion umgesetzt.
**Review session:** 2026-06-21: Codex-Review gegen Sprint-16-Akzeptanzkriterien, Field-Hub-Skill, Supabase-/RLS-Regeln, Sync-/Backup-/CSV-Integration und lokale Checks durchgefuehrt. Keine blockierenden Findings.
**Review notes:** `git diff --check`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` und Dev-Server-HTTP-Check auf `http://127.0.0.1:5173/` ausgefuehrt. `supabase db push --dry-run` konnte wegen fehlendem `SUPABASE_DB_PASSWORD`/401 nicht ausgefuehrt werden; Migration wurde statisch auf `user_id`, RLS, Grants, Unique Constraint, Status/Reason-Check und Indexes geprueft. Nicht-blockierende Hinweise: Training-UI hat keinen separaten Blockstatus-Retry-Button und reduzierte/geaenderte/gestrichene Bloecke speichern erst nach Grundauswahl oder Notiz-Blur. `accepted_by_arwin` bleibt offen.

**Files likely touched:**

- Create migration: `supabase/migrations/YYYYMMDDHHMMSS_session_block_logs.sql`
- Modify: `app/field-hub/src/lib/localDb.ts`
- Create: `app/field-hub/src/domain/sessionBlocks.ts`
- Create: `app/field-hub/src/lib/sessionBlockRepository.ts`
- Modify: `app/field-hub/src/lib/syncRepository.ts`
- Modify: `app/field-hub/src/lib/backupRepository.ts`
- Modify: `app/field-hub/src/components/TrainingView.tsx`
- Modify: `app/field-hub/src/components/PostSessionView.tsx`
- Test: `app/field-hub/src/domain/sessionBlocks.test.ts`
- Test: `app/field-hub/src/lib/sessionBlockRepository.test.ts`

**New table:**

- `session_block_logs`

**UX:**

- Each live phase has status:
  - planned
  - done
  - reduced
  - changed
  - skipped
- Reason is required for reduced/changed/skipped:
  - time
  - weather
  - group
  - safety
  - equipment
  - coach decision

**Acceptance criteria:**

- Each selected session can have one block log per timeline block.
- Block logs sync through Supabase and Dexie.
- JSON backup/import includes block logs.
- CSV export includes a session-block CSV or includes block status in a session export.
- RLS policies restrict rows to the authenticated user.

**Verification:**

- `supabase db push --dry-run`
- `npm run typecheck`
- `npm run lint`
- `npm test -- sessionBlock`
- Manual: mark Speed skipped, reload, verify persisted and synced.

### Sprint 17: Guided Live Session Mode

**Goal:** Turn the Training tab into a phase-by-phase live coaching mode backed by stable block keys and block log persistence.

**Sprint status:**

- [x] planned
- [x] implemented_by_agent
- [x] tests_reported_by_agent
- [x] reviewed_by_codex
- [ ] accepted_by_arwin

**Implementation session:** 2026-06-21: Guided Live Session Mode umgesetzt. Training-Ansicht hat `Training starten`, einen priorisierten Live-Stepper, Previous/Next als reinen UI-State, Blockstatus-Speicherung ueber bestehende `session_block_logs`, Pflichtgrund fuer `reduced/changed/skipped`, Blockstatus-Retry und kompakte Timeline-Statusanzeige. Keine neue Migration, keine Exposure-Automatik, keine Metrics-/Exercise-Results, keine Edge Functions, kein Realtime-Ausbau.
**Review session:** 2026-06-21: Codex-Review gegen Sprint-17-Akzeptanzkriterien, Field-Hub-Skill, Live-Stepper-Domainlogik, Phantom-Session-Grenze, Training-Integration und lokale Checks durchgefuehrt. Keine blockierenden Findings.
**Review notes:** `git diff --check`, scoped Secret-/Scope-/Migrationssignal-Scan, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` und Dev-Server-HTTP-Check auf `http://127.0.0.1:5173/` ausgefuehrt. Browser-Screenshot/iPad-Visual-QA mit 15-20 Spielern nicht ausgefuehrt, weil in dieser Session kein direktes Screenshot-Tool verfuegbar war. `accepted_by_arwin` bleibt offen.

**Files likely touched:**

- Modify: `app/field-hub/src/components/TrainingView.tsx`
- Create: `app/field-hub/src/components/LiveSessionStepper.tsx`
- Create: `app/field-hub/src/domain/liveSession.ts`
- Modify: `app/field-hub/src/lib/sessionBlockRepository.ts`
- Test: `app/field-hub/src/domain/liveSession.test.ts`
- Test: `app/field-hub/src/components/TrainingView.test.tsx`

**Data used:**

- keyed `SessionDefinition.timeline`
- existing `session_logs`
- existing `player_session_entries`
- new `session_block_logs`

**UX:**

- Button: `Training starten`
- Current phase card with:
  - phase title
  - planned work
  - safety notes
  - phase status
  - previous/next controls
- Player exceptions are visible but not required for all players.

**Acceptance criteria:**

- Coach can move through today's phases without leaving Training.
- Phase state persists through reload via `session_block_logs`.
- Existing quick actions still work: C, D, no sprint, no conditioning, no heavy lifting, Physio/Medical.
- Live observations can be attached to group or player.
- Loading Training does not create phantom session logs.

**Verification:**

- `npm run typecheck`
- `npm run lint`
- `npm test -- training`
- Browser check on iPad viewport with 15-20 players.

### Sprint 18: Exposure Tracking

**Goal:** Automatically record player training exposures from completed session blocks and player-specific limits.

**Sprint status:**

- [x] planned
- [x] implemented_by_agent
- [x] tests_reported_by_agent
- [x] reviewed_by_codex
- [ ] accepted_by_arwin

**Implementation session:** 2026-06-21: Kompaktes `player_exposure_summaries`-Modell gewaehlt und dokumentiert. Supabase-RLS-Migration, Dexie-Store, Pending Queue, session-scoped Push/Pull, begrenzter Player-Detail-Pull, JSON Backup/Import, CSV Export, Exposure-Review in Training/Nachbereitung und einfache Player-Detail-Historie umgesetzt. Keine Sprint-19-Metrics, keine Exercise Results, keine Edge Functions, kein Realtime-Ausbau.
**Review session:** 2026-06-21: Codex-Review gegen Sprint-18-Akzeptanzkriterien, Field-Hub-Skill, Supabase-/RLS-Regeln, Exposure-Domainlogik, Sync-/Backup-/CSV-Integration, Player-Detail-Anzeige und lokale Checks durchgefuehrt. Keine blockierenden Findings.
**Review notes:** Kompaktes `player_exposure_summaries`-Modell ist fuer den aktuellen MVP passend, weil es die spaetere Statistik-Arbeit vorbereitet, ohne pro Block/Spieler zu viel Datenmenge und UX-Komplexitaet zu erzeugen. Blockstatus, Anwesenheit, Limits und Returner-Caps werden konservativ zusammengefuehrt; manuelle Overrides bleiben erhalten und medizinische Freigabe-Formulierungen werden in Overrides blockiert. Lokale Verifikation: `git diff --check`, `npm run typecheck`, `npm run lint`, `npm test` und `npm run build` erfolgreich. Supabase CLI vorhanden, aber `supabase db push --dry-run` konnte wegen fehlender Remote-Credentials nicht ausgefuehrt werden (`SUPABASE_DB_PASSWORD`/401); vor Remote-Anwendung erneut dry-runnen.

**Files likely touched:**

- Create migration after model decision: `supabase/migrations/YYYYMMDDHHMMSS_player_exposures.sql` or `supabase/migrations/YYYYMMDDHHMMSS_player_exposure_summaries.sql`
- Modify: `app/field-hub/src/lib/localDb.ts`
- Create: `app/field-hub/src/domain/exposures.ts`
- Create: `app/field-hub/src/lib/exposureRepository.ts`
- Modify: `app/field-hub/src/content/types.ts`
- Modify: `app/field-hub/src/content/sessions.ts`
- Modify: `app/field-hub/src/lib/syncRepository.ts`
- Modify: `app/field-hub/src/lib/backupRepository.ts`
- Modify: `app/field-hub/src/lib/csvExport.ts`
- Test: `app/field-hub/src/domain/exposures.test.ts`
- Test: `app/field-hub/src/lib/exposureRepository.test.ts`

**New dynamic model:**

- `player_exposures`, or a compact player-session exposure summary if chosen during implementation planning

**Exposure types:**

- `speed`
- `acceleration`
- `cod_decel`
- `lower_strength`
- `upper_strength`
- `power`
- `conditioning`
- `contact_prep`
- `neck_trunk`
- `mobility`
- `reconditioning`

**Default rules:**

- If a block is done, active/present players receive its default exposures.
- A player with `kein_sprint` does not receive `speed`, `acceleration`, or `cod_decel` exposure from that block.
- A player with `kein_cond` does not receive `conditioning` exposure.
- A player with D/stop/klaeren receives `skipped` or no exposure depending on the block.
- Latest returner caps override default exposures:
  - speed cap can block or reduce `speed` and `acceleration`
  - COD/decel cap can block or reduce `cod_decel`
  - conditioning cap can block or reduce `conditioning`
  - contact cap can block or reduce `contact_prep`
- Returner exposure changes remain coaching documentation, not medical clearance.
- Coach can manually override exposure per player.

**Acceptance criteria:**

- Sprint plan explicitly chooses detailed rows or compact player-session summaries before code starts.
- Exposure records are created from block status and player attendance/limits.
- Exposure default generation respects latest returner caps.
- Exposure gaps can be calculated per player.
- Player detail can show recent exposure history in simple table form.
- No medical clearance is implied by exposure completion.

**Verification:**

- `supabase db push --dry-run`
- `npm run typecheck`
- `npm run lint`
- `npm test -- exposure`
- Manual: mark Speed done with one player `kein_sprint`; verify all eligible players get exposure except limited player.

### Sprint 19: Flexible Metrics

**Goal:** Replace fixed baseline thinking with flexible metric definitions and results.

**Sprint status:**

- [x] planned
- [x] implemented_by_agent
- [x] tests_reported_by_agent
- [x] reviewed_by_codex
- [ ] accepted_by_arwin

**Implementation session:** 2026-06-21: `metric_results` als ergaenzendes Modell zu bestehenden `baseline_entries` umgesetzt. Supabase-Migration mit RLS, expliziten Grants, FK-Ownership-Checks, Unique Constraint und Indexes erstellt; Dexie Version 10, Pending Queue, Metric-Domain, Repository, session-/player-gebundene Sync-Pulls, Nachbereitungs-Erfassung, Player-Profile-Historie, JSON Backup/Import und CSV Metrics Export ergaenzt. Bestehende Mini-Baseline-Anzeige und Exporte bleiben erhalten. Keine Sprint-20-`exercise_results`, keine Edge Functions, kein Realtime-Ausbau, keine Player-Accounts.
**Implementation notes:** Fokussierte Sprint-19-Tests fuer Domain, Repository, bounded Pull/Push, Check-in-Sync-Integration, Backup/Import, CSV und UI/Profile ergaenzt. Lokale Verifikation: `git diff --check`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` und headless Dev-Server-Smoke auf `http://127.0.0.1:5174/` erfolgreich. Follow-up-Audit 2026-06-21: `.env.supabase.local` lokal geladen, `supabase db push --dry-run` zeigte nur `20260621204025_metric_results.sql`, `supabase db push` hat diese Migration remote angewendet, anschliessender Dry-Run meldete `Remote database is up to date`; `supabase migration list` zeigt `20260621204025` lokal und remote. Direkte `supabase db query --linked` scheiterte mangels Management-Auth mit 401, direkte Pooler-Query mit Passwortauthentifizierung. Audit-Fix: Hook-Guard fuer geleerte bestehende Metric-Felder korrigiert, damit Repository-Soft-Delete erreicht wird; Regressionstest ergaenzt. Technische Abweichung: vollstaendiger Unique Constraint auf `(user_id, session_log_id, player_id, metric_key, attempt, body_side)` statt nur partial unique index, damit Supabase/PostgREST `upsert(... onConflict ...)` stabil funktioniert.
**Review session:** 2026-06-21: Codex-Review gegen Sprint-19-Akzeptanzkriterien, Field-Hub-Skill, Supabase-/RLS-Regeln, Metric-Domainlogik, Repository/Sync, Backup/Import, CSV, Nachbereitungs-UI, Player-Detail-Historie und lokale/remote Checks durchgefuehrt. Keine blockierenden Findings.
**Review notes:** `metric_results` ist korrekt als ergaenzendes Modell umgesetzt; `baseline_entries` bleibt erhalten und wird weiterhin angezeigt/exportiert. RLS, explizite Grants und FK-Ownership-Checks sind in der Migration vorhanden. Sync ist bounded und in den bestehenden Check-in-Sync integriert. Lokale Verifikation durch Codex: `git diff --check`, `npm run typecheck`, `npm run lint`, `npm test` mit 64/64 Testfiles und 378/378 Tests, `npm run build`, Dev-Server-Smoke via HTTP 200. Supabase-Verifikation mit geladener `.env.supabase.local`: `supabase migration list` zeigt `20260621204025` lokal und remote; `supabase db push --dry-run` meldet `Remote database is up to date`. Restrisiko: kein visueller iPad-Browser-Screenshot im Review; bei naechstem UI-Sprint mitpruefen.

**Files likely touched:**

- Create migration: `supabase/migrations/YYYYMMDDHHMMSS_metric_results.sql`
- Modify: `app/field-hub/src/lib/localDb.ts`
- Create: `app/field-hub/src/domain/metrics.ts`
- Create: `app/field-hub/src/lib/metricRepository.ts`
- Use existing static definitions from `app/field-hub/src/content/metricDefinitions.ts`
- Modify: `app/field-hub/src/components/PostSessionView.tsx`
- Modify: `app/field-hub/src/components/PlayersView.tsx` or `PlayerDetailView.tsx`
- Modify: `app/field-hub/src/lib/syncRepository.ts`
- Modify: `app/field-hub/src/lib/backupRepository.ts`
- Modify: `app/field-hub/src/lib/csvExport.ts`
- Test: `app/field-hub/src/domain/metrics.test.ts`
- Test: `app/field-hub/src/lib/metricRepository.test.ts`

**New dynamic table:**

- `metric_results`

**Initial metrics:**

- Broad Jump
- Med-Ball Chest Pass
- 10 m Sprint
- 30 m Sprint marked optional/later

**Migration/compatibility rule:**

- Do not delete `baseline_entries`.
- Continue reading `baseline_entries` in existing views until metric results are proven.
- Add a one-time migration helper or import path only after verifying current baseline data.

**Acceptance criteria:**

- Coach can record metric results from post-session or relevant phase.
- Player detail shows metric history.
- Existing baseline entries remain visible.
- Metric CSV export exists.

**Verification:**

- `supabase db push --dry-run`
- `npm run typecheck`
- `npm run lint`
- `npm test -- metrics`
- Manual: enter Broad Jump and Med-Ball for one player and verify player profile history.

### Sprint 20: Structured Exercise Progression

**Goal:** Make strength and exercise progression chartable instead of mostly free text.

**Sprint status:**

- [x] planned
- [x] implemented_by_agent
- [x] tests_reported_by_agent
- [x] reviewed_by_codex
- [ ] accepted_by_arwin

**Implementation session:** 2026-06-22: `exercise_results` als strukturierte Ergaenzung zu bestehenden `progress_entries` umgesetzt. Supabase-Migration mit expliziten Grants, RLS, Ownership-Policies, Unique Constraint und bounded Sync-Feldern erstellt; Dexie Version 11, Pending Queue, Exercise-Domain, Repository, Check-in-/Combined-Sync-Anbindung, Nachbereitungs-Schnelleingabe, Player-Profile-Historie, JSON Backup/Import und CSV Exercise Results Export ergaenzt. Bestehende Legacy-Progression bleibt erhalten und wird weiter exportiert. Keine Sprint-21-Analysis, keine Edge Functions, kein Realtime-Ausbau, keine Player-Accounts.
**Implementation notes:** Fokussierte Sprint-20-Tests fuer Domain, Repository, Sync, Backup/Import, CSV und UI/Profile ergaenzt. Audit-Fixes 2026-06-22: Remote-Pulls uebernehmen auch Soft-Delete-Tombstones, Uebungswechsel in der Nachbereitung ersetzt die alte sichtbare Uebung per Soft-Delete statt eine zweite aktive Row stehen zu lassen, und der gemeinsame Field-Data-Sync beruecksichtigt Exercise-only Pending Writes im Rerun-Guard. Lokale Verifikation nach Audit-Fixes: `git diff --check`, `npm run typecheck`, `npm run lint`, `npm test` mit 67/67 Testfiles und 404/404 Tests, `npm run build`, `supabase db push --dry-run` mit geladener `.env.supabase.local`, direkte Pooler-Kontrolle von Tabelle/RLS/Policies/Grants und headless Dev-Server-Smoke auf `http://127.0.0.1:5174/` erfolgreich. Supabase-Status: `20260622113554_exercise_results.sql` wurde am 2026-06-22 per `supabase db push --yes` remote angewendet; anschliessender Dry-Run meldete `Remote database is up to date`. MVP-Entscheidung: pro Spieler und Session wird ein aktives Resultat je Uebung stabil upsertbar gemacht; mehrere unterschiedliche Uebungen sind moeglich, mehrere gleiche Uebungen innerhalb derselben Session bleiben bewusst ausserhalb dieses Sprint-Scopes.
**Review session:** 2026-06-22: Codex-Review gegen Sprint-20-Akzeptanzkriterien, Field-Hub-Skill, Supabase-/RLS-Regeln, Exercise-Domainlogik, Repository/Sync, Backup/Import, CSV, Nachbereitungs-UI, Player-Detail-Historie und lokale/remote Checks durchgefuehrt. Keine blockierenden Findings.
**Review notes:** `exercise_results` ist korrekt als strukturierte Ergaenzung zu `progress_entries` umgesetzt; Legacy-Progression bleibt sichtbar und exportierbar. Migration enthaelt explizite Grants, RLS und Ownership-Policies; Supabase-Verifikation mit geladener `.env.supabase.local` meldet lokale und remote Migration `20260622113554` sowie `Remote database is up to date`. Lokale Verifikation durch Codex: `git diff --check`, `npm run typecheck`, `npm run lint`, `npm test` mit 67/67 Testfiles und 404/404 Tests, `npm run build`, Secret-Scan ohne echte Client-Secrets und Dev-Server-Smoke via HTTP 200. Restrisiken: kein visueller iPad-Screenshot im Review; Player-Detail zeigt eine Exercise-Historie, aber noch keine echte Trend-Zusammenfassung/Chart. Das ist fuer Sprint 20 akzeptabel, sollte aber in Sprint 22 bei Player Analysis Charts explizit nachgezogen werden.

**Files likely touched:**

- Create migration: `supabase/migrations/YYYYMMDDHHMMSS_exercise_results.sql`
- Modify: `app/field-hub/src/lib/localDb.ts`
- Create: `app/field-hub/src/domain/exercises.ts`
- Create: `app/field-hub/src/lib/exerciseRepository.ts`
- Use existing static definitions from `app/field-hub/src/content/exerciseDefinitions.ts`
- Modify: `app/field-hub/src/components/PostSessionView.tsx`
- Modify: `app/field-hub/src/components/TrainingView.tsx`
- Modify: `app/field-hub/src/components/PlayersView.tsx` or `PlayerDetailView.tsx`
- Modify: `app/field-hub/src/lib/syncRepository.ts`
- Modify: `app/field-hub/src/lib/backupRepository.ts`
- Modify: `app/field-hub/src/lib/csvExport.ts`
- Test: `app/field-hub/src/domain/exercises.test.ts`
- Test: `app/field-hub/src/lib/exerciseRepository.test.ts`

**New dynamic table:**

- `exercise_results`

**Initial exercise patterns:**

- squat
- hinge
- push
- pull
- carry
- lunge
- jump
- sprint
- cod
- neck_trunk
- conditioning

**Compatibility rule:**

- Do not remove `progress_entries`.
- Show existing progress entries as legacy/simple progress.
- New structured exercise results power future charts.

**Acceptance criteria:**

- Coach can record an exercise result with exercise, sets, reps, load, RPE/RIR, variant, technique quality, and pain response.
- Default capture is one main lift/result per player; multiple exercises are optional.
- Batch entry or copy-forward is preferred before requiring per-player repeated typing.
- Player detail shows exercise progression table.
- At least one simple chart or trend summary can be derived in player detail.
- Existing `progress_entries` still export.

**Verification:**

- `supabase db push --dry-run`
- `npm run typecheck`
- `npm run lint`
- `npm test -- exercise`
- Manual: enter Trap Bar Deadlift result and verify it appears in player profile.

### Sprint 21: Team Analysis Tab

**Goal:** Add team-level statistics for planning and review.

**Sprint status:**

- [x] planned
- [x] implemented_by_agent
- [x] tests_reported_by_agent
- [x] reviewed_by_codex
- [ ] accepted_by_arwin

**Implementation session:** 2026-06-22: Team-Analyse-Tab ohne Migration umgesetzt. Neue Navigation `Analyse`, lokale Dexie-Auswertung mit Default-Zeitraum letzte 8 Wochen, reine Domain-Berechnung fuer Attendance, Readiness, Ampeln, sRPE-Load, Rolling 7d/28d Load mit Coverage, einfache Load-Spike-Advisory, Exposures, Planned-vs-Actual und Datenabdeckung. Kein Remote-Pull beim Oeffnen, keine neue Supabase-Tabelle, keine Spieler-spezifischen Charts.
**Implementation notes:** Lokale Verifikation: `git diff --check`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, Dev-Server-HTTP-Smoke auf `http://127.0.0.1:5173/` und headless Desktop-/iPad-Visual-Smoke erfolgreich. Attendance nutzt bewusst den aktuell aktiven gefilterten Kader als Nenner; historische Kaderstaende werden in Sprint 21 nicht rekonstruiert. `player_exposure_summaries` werden lokal per `userId` gelesen und im Speicher auf `sessionDate` gefiltert, damit keine neue Dexie-/Supabase-Migration nur fuer Analyse noetig wird. Planned-vs-Actual ist eine Session-Level-Auswertung; Cluster-/Positionsfilter betreffen Spielerwerte, nicht geplante Session-Bloecke. `reviewed_by_codex` und `accepted_by_arwin` bleiben offen.
**Review session:** 2026-06-22: Codex-Review gegen Sprint-21-Akzeptanzkriterien, Field-Hub-Skill, lokale Dexie-Lesestrategie, Analysis-Domainlogik, Navigation/AppShell-Integration, Analysis-UI und lokale Checks durchgefuehrt. Keine blockierenden Findings.
**Review notes:** Analyse liest lokale IndexedDB-Daten mit begrenztem Zeitraum und startet beim Oeffnen keinen Remote-Pull. Keine neue Supabase-Migration wurde eingefuehrt. Domain-Tests decken Empty State, Wochenaggregation, Attendance/Readiness/Load, Rolling 7d/28d Load, Load-Spike-Advisory, Cluster-/Positions-/Exposure-Filter und Planned-vs-Actual ab. Lokale Verifikation durch Codex: `git diff --check`, `npm run typecheck`, `npm run lint`, `npm test` mit 68/68 Testfiles und 411/411 Tests, `npm run build`, Dev-Server-Smoke via HTTP 200. Restrisiken: Review hat keinen echten Screenshot-/Browser-Pixelcheck durchgefuehrt; Attendance nutzt wie geplant den aktuell aktiven gefilterten Kader als Nenner und rekonstruiert historische Kaderstaende nicht.

**Files likely touched:**

- Modify: `app/field-hub/src/App.tsx`
- Modify: `app/field-hub/src/components/MainNavigation.tsx`
- Create: `app/field-hub/src/components/AnalysisView.tsx`
- Create: `app/field-hub/src/domain/analysis.ts`
- Test: `app/field-hub/src/domain/analysis.test.ts`
- Test: `app/field-hub/src/components/MainNavigation.test.ts`

**Data used:**

- existing check-in/session data
- `session_block_logs`
- `player_exposure_summaries`
- `metric_results`
- `exercise_results`

**Historical read strategy required before implementation:**

- Define whether the analysis tab uses local-only cached data, explicit historical pull by date range, server-side `updated_at` watermark, or another bounded strategy.
- Do not make opening the analysis tab trigger an unbounded full remote pull during field use.
- Default UX should require or imply a bounded date range such as last 4 weeks, last 8 weeks, or selected block.
- Analysis can be heavier than live mode, but it must be deliberate and visible.

**Charts/tables first version:**

- attendance by week
- readiness trend
- traffic light distribution
- weekly sRPE load
- rolling 7-day and 28-day load
- load-spike advisory flags
- contact/contact-prep trend
- planned vs actual blocks
- exposures by week
- filters: date range, cluster, position, exposure type

**Acceptance criteria:**

- Analysis tab is useful with partial data.
- Empty states explain what data is missing.
- No analysis screen is required during live training.
- Charts/tables do not expose diagnoses.

**Verification:**

- `npm run typecheck`
- `npm run lint`
- `npm test -- analysis`
- Browser check on desktop and iPad.

### Sprint 22: Player Analysis Charts

**Goal:** Add player-specific charts inside the player detail view.

**Sprint status:**

- [x] planned
- [x] implemented_by_agent
- [x] tests_reported_by_agent
- [x] reviewed_by_codex
- [ ] accepted_by_arwin

**Implementation session:** 2026-06-22: Player-spezifische Analysis Charts in bestehende Spielerprofil-Tabs integriert. Neue lokale Domain-Aggregation fuer source-traceable Attendance, Readiness, Pain Scores, Pain-Location-Textliste, sRPE/Load, Rolling 7d/28d Load, Metrics, Exercises, Exposures/Gaps und Returner-Verlauf. Keine neue Supabase-Tabelle, keine Migration, keine Body-Region-Charts, kein unbounded Remote Pull.
**Implementation notes:** Lokale Verifikation: `git diff --check`, `npm run typecheck`, `npm run lint`, `npm test` mit 69/69 Testfiles und 418/418 Tests, `npm run build`, Dev-Server-HTTP-Smoke auf `http://127.0.0.1:5173/` sowie headless Desktop-/iPad-Smoke ohne Overflow und ohne Console-Errors erfolgreich. Source-Korrektur nutzt bestehende App-Navigation: bekannte `sessionDefinitionId` setzt die globale Session und oeffnet Check-in, Nachbereitung, Training oder Returner; unbekannte Quellen zeigen nur einen Source-Hinweis. Review-Fixes in dieser Session: Rolling Load rechnet aus allen lokalen Load-Eintraegen statt nur aus der Anzeige-Liste; Readiness-/Pain-/Metric-Bars haben pro Wert Source-Zeilen. Keine Supabase-Migration, keine neue Tabelle, keine Body-Region-Charts. `reviewed_by_codex` und `accepted_by_arwin` bleiben offen.
**Review session:** 2026-06-22: Codex-Review gegen Sprint-22-Akzeptanzkriterien, Field-Hub-Skill, lokale Player-Analysis-Domain, Source-Korrektur-Navigation, Spielerprofil-Integration und lokale Checks durchgefuehrt. Keine blockierenden Findings.
**Review notes:** Player-Analysis bleibt in Detail-Tabs und nicht in der Spielerliste; die Spieleruebersicht bleibt zuerst kompakt. Werte sind source-traceable und koennen bei bekannter `sessionDefinitionId` ueber bestehende Navigation in Check-in, Nachbereitung, Training oder Returner geoeffnet werden. Kein neuer Remote-Pull, keine neue Supabase-Migration, keine Body-Region-Charts. Lokale Verifikation durch Codex: `git diff --check`, `npm run typecheck`, `npm run lint`, `npm test` mit 69/69 Testfiles und 418/418 Tests, `npm run build`, scoped Secret-Scan ohne neue Client-Secrets und Dev-Server-Smoke via HTTP 200. Restrisiko: kein eigener Screenshot-/Pixelcheck durch Codex; Profilaggregation liest derzeit alle lokalen profilrelevanten Dexie-Tabellen fuer den User und skaliert fuer den MVP, kann spaeter bei grosser Historie bounded optimiert werden.

**Files likely touched:**

- Modify: `app/field-hub/src/components/PlayerDetailView.tsx`
- Create: `app/field-hub/src/components/PlayerAnalysisCharts.tsx`
- Modify: `app/field-hub/src/domain/playerProfile.ts`
- Test: `app/field-hub/src/domain/playerProfile.test.ts`
- Test: `app/field-hub/src/components/PlayersView.test.tsx`

**Player charts/tables:**

- attendance history
- readiness history
- pain score history
- pain-location text history
- body-region charts only after a separate structured body-region sprint exists
- sRPE/load history
- rolling load trend
- metric history
- exercise progression
- exposure history/gaps
- returner progression

**Acceptance criteria:**

- Opening a player shows high-signal summary first.
- Charts appear only in detail segments, not the list.
- Values can be traced back to source session.
- Source session can be opened for correction.

**Verification:**

- `npm run typecheck`
- `npm run lint`
- `npm test -- playerProfile`
- Browser check with long player names and empty data.

### Sprint 23: Library And Plan Integration Cleanup

**Goal:** Make the library support coaching instead of feeling like a chaotic PDF drawer.

**Sprint status:**

- [x] planned
- [x] implemented_by_agent
- [x] tests_reported_by_agent
- [x] reviewed_by_codex
- [ ] accepted_by_arwin

**Implementation session:** 2026-06-22: Library UX in bestehender statischer Content-/Frontend-Struktur auf Coach-Arbeitsrollen umgestellt. `Heute relevant` nutzt die aktuell gewaehlte Session mit PDF-Fallback und aktiven Basics; Training-Bloecke koennen vorhandene `libraryRefs` direkt in der Library oeffnen. Archiv bleibt sichtbar getrennt, ohne Archiv-PDFs als aktive Vorlagen einzubauen. Keine Supabase-Migration, keine neue dynamische Tabelle, kein Backend-Service, kein Coach-Insights-Scope.
**Implementation notes:** Lokale Verifikation: `git diff --check`, `npm run typecheck`, `npm run lint`, `npm test` mit 70/70 Testfiles und 424/424 Tests, `npm run build`, Dev-Server-HTTP-Smoke auf `http://127.0.0.1:5173/` sowie headless Desktop-/iPad-Smoke ohne horizontalen Overflow und ohne Console-Errors erfolgreich. Kiosk-E2E nicht ausgefuehrt, weil Sprint 23 keine Kiosk-/Auth-/RLS-Aenderung enthaelt und echte Test-Credentials erfordert. `reviewed_by_codex` und `accepted_by_arwin` bleiben offen.
**Review session:** 2026-06-22: Codex-Review gegen Sprint-23-Akzeptanzkriterien, Field-Hub-Skill, Library-UX, Session-/Block-Referenzen, PDF-Fallbacks, Archivtrennung, Content-Integritaet und lokale Checks durchgefuehrt. Keine blockierenden Findings.
**Review notes:** Die Library ist jetzt coach-orientiert nach Arbeitsrollen strukturiert: `Heute relevant`, aktive Plaene, Playbooks, Varianten, Exercise Mapping, Consent/Datenschutz, Quellen und Archiv. Heute kann sessionbezogene Unterlagen und PDFs schnell oeffnen; Trainingsbloecke verlinken ihre `libraryRefs` direkt in die Library. Aktive PDFs bleiben als Fallback erhalten, Archivmaterial wird sichtbar getrennt und nicht als aktive Vorlage promoted. Keine neue Supabase-Migration, keine neue dynamische Tabelle, kein Backend-Service und kein Sprint-24-Coach-Insights-Scope. Lokale Verifikation durch Codex: `git diff --check`, `npm run typecheck`, `npm run lint`, `npm test` mit 70/70 Testfiles und 424/424 Tests, `npm run build`, scoped Secret-Scan ohne neue Client-Secrets und Dev-Server-Smoke via HTTP 200. Restrisiko: kein eigener Screenshot-/Pixelcheck durch Codex; die Library-Item-Auswahl wird aus Initial-Props gesetzt und ist fuer aktuelle Tab-Wechsel passend, koennte spaeter bei In-Place-Deep-Links innerhalb der bereits gemounteten Library robuster synchronisiert werden.

**Files likely touched:**

- Modify: `app/field-hub/src/components/LibraryView.tsx`
- Modify: `app/field-hub/src/content/library.ts`
- Modify: `app/field-hub/src/content/pdfRefs.ts`
- Modify: `app/field-hub/src/content/sessions.ts`
- Test: `app/field-hub/src/components/LibraryView.test.tsx`

**UX:**

- Categories:
  - Heute relevant
  - Aktive Plaene
  - Varianten
  - Exercise Mapping
  - Consent/Datenschutz
  - Archiv
- Session blocks can link to relevant library/PDF references.
- Archive is visibly separated from active workflows.

**Acceptance criteria:**

- Today session can open its relevant plan/PDF quickly.
- Active plans are separate from archive.
- Search still works.
- PDF fallback remains available.

**Verification:**

- `npm run typecheck`
- `npm run lint`
- `npm test -- LibraryView`
- Manual: open session-specific PDF from Today and from Training block.

### Sprint 24: Coach Insights

**Goal:** Add rule-based coaching reminders derived from existing data.

**Sprint status:**

- [x] planned
- [x] implemented_by_agent
- [x] tests_reported_by_agent
- [x] reviewed_by_codex
- [ ] accepted_by_arwin

**Implementation session:** 2026-06-22: Regelbasierte Coach Insights aus bestehenden lokalen Field-Hub-Daten umgesetzt. Insights nutzen Spieler, Session Logs, Check-in-/Nachbereitungs-Eintraege, Returner-Eintraege, Blockstatus und Exposure-Summaries. Anzeige kompakt in Heute und vollstaendig in Analyse; Dismiss bleibt nur lokaler View-State. Keine Supabase-Migration, keine neue dynamische Tabelle, kein Backend, kein Realtime, keine Edge Functions und keine OpenAI/API-Integration.
**Implementation notes:** Lokale Verifikation: `git diff --check`, `npm run typecheck`, `npm run lint`, `npm test -- coachInsights CoachInsightsPanel AnalysisView TodayDashboard`, `npm test` mit 73/73 Testfiles und 439/439 Tests, `npm run build`, Dev-Server-HTTP-Smoke auf `http://127.0.0.1:5173/` sowie headless Desktop-/iPad-Visual-Smoke ohne horizontalen Overflow und ohne Console-/Page-Errors erfolgreich. Keine Supabase-Checks noetig, weil Sprint 24 keine Migration, keine neue Tabelle und keine RLS-/Storage-/Auth-Aenderung enthaelt. `reviewed_by_codex` und `accepted_by_arwin` bleiben offen.
**Review session:** 2026-06-22: Codex-Review gegen Sprint-24-Akzeptanzkriterien, Field-Hub-Skill, Coach-Insights-Domainlogik, lokale Datenquellen, Source-Navigation, Heute-/Analyse-Integration, Safety-Wording und lokale Checks durchgefuehrt. Keine blockierenden Findings.
**Review notes:** Coach Insights bleiben regelbasiert, advisory und lokal aus bestehenden Daten abgeleitet. Jede Regel aus dem Sprint-Scope ist implementiert und getestet: Speed-Gap, zwei Gelb/Rot-Teilnahmen, fehlendes sRPE nach abgeschlossener Session, Returner-Caps ohne Entscheidung, zweimal gestrichene geplante Speed-/Contact-/Conditioning-Bloecke, Post-Pain ohne E2/Next Step, 7d-vs-28d-Load-Spike sowie niedrige/dichte Contact-Prep-Exposure. Insights haben Source-Bezuege und koennen bei bekannter `sessionDefinitionId` in den passenden Tab fuehren; Dismiss ist nur lokaler View-State pro `dismissKey`. Keine neue Supabase-Migration, keine neue dynamische Tabelle, kein Backend, kein Realtime, keine Edge Functions und keine OpenAI/API-Integration. Lokale Verifikation durch Codex: `git diff --check`, `npm run typecheck`, `npm run lint`, `npm test -- coachInsights CoachInsightsPanel AnalysisView TodayDashboard` mit 4/4 Testfiles und 28/28 Tests, `npm test` mit 73/73 Testfiles und 441/441 Tests, `npm run build`, scoped Secret-/Safety-Wording-Scan ohne neue Client-Secrets oder Freigabe-/Diagnose-Wording und Dev-Server-Smoke via HTTP 200. Restrisiken: kein eigener Screenshot-/Pixelcheck durch Codex; die Insight-Hook liest wie die Analyse-Sprints alle lokalen insight-relevanten Dexie-Tabellen fuer den User und sollte bei grosser Historie spaeter bounded optimiert werden. Die Roadmap endet nach Sprint 24; danach ist kein weiterer nummerierter Sprint definiert.
**Release-hardening session:** 2026-06-22: Abschluss-Audit-Fixes fuer Sprint 12-24 umgesetzt, ohne einen neuen Feature-Sprint zu starten. Remote-Tombstones fuer Metrics, Exposures und Session Blocks bleiben beim Pull sichtbar, der gemeinsame Field-Data-Sync beruecksichtigt Session-Block-, Exposure-, Metric- und Exercise-only Pending Writes, Public Check-ins verwenden keinen Supabase-Realtime-Kanal und keinen Vollsync-Poll, Rolling-Load/Team-Analysis-/Coach-Insight-Berechnungen sind am aktuellen App-Tag statt an stale Historie verankert, Exercise Results duerfen historische anonymisierte FKs behalten, Export-/README-Copy dokumentiert alle aktuellen Backup-/CSV-Daten, und eine gezielte RLS-/Realtime-Hardening-Migration wurde ergaenzt. `accepted_by_arwin` bleibt offen.

**Files likely touched:**

- Create: `app/field-hub/src/domain/coachInsights.ts`
- Modify: `app/field-hub/src/components/TodayDashboard.tsx`
- Modify: `app/field-hub/src/components/PlayerDetailView.tsx`
- Modify: `app/field-hub/src/components/AnalysisView.tsx`
- Test: `app/field-hub/src/domain/coachInsights.test.ts`

**Initial insight rules:**

- Player has no speed exposure in the last 14 days.
- Player was yellow/red in two consecutive attended sessions.
- Session is completed but sRPE is missing for present players.
- Returner has caps completed but decision is missing.
- A planned speed/contact/conditioning block was skipped in two consecutive relevant sessions.
- Player has post-pain >= 3 and no E2/next step.
- Player or group has a sharp 7-day vs 28-day load spike.
- Contact/contact-prep exposure trend is unusually low or unusually dense for the current block.

**Acceptance criteria:**

- Insights are advisory, not medical clearance.
- Each insight links to source player/session.
- Insights can be dismissed only for the current view/session, not permanently hidden by accident.
- Empty state is quiet when no insights exist.

**Verification:**

- `npm run typecheck`
- `npm run lint`
- `npm test -- coachInsights`
- Manual: create fixture/local records that trigger each insight.

## 10. Recommended Execution Order

The full roadmap is large. Do not implement all sprints in one session.

Recommended first build sequence:

1. Sprint 12: Data And UX Audit
2. Sprint 13: Player Profile 2.0
3. Sprint 14: Post-Session 2.0 Closure Checklist
4. Sprint 15: Content And Sync Foundation

Reason:

- These deliver immediate value using mostly existing data.
- They reduce missed documentation.
- They reveal exactly which new structured tables are most useful and prevent fragile block/exposure modeling.

Recommended second build sequence:

1. Sprint 16: Planned Vs Actual Session Blocks
2. Sprint 17: Guided Live Session Mode
3. Sprint 18: Exposure Tracking
4. Sprint 19: Flexible Metrics
5. Sprint 20: Structured Exercise Progression

Reason:

- These build the structured data foundation for serious analysis.

Recommended third build sequence:

1. Sprint 21: Team Analysis Tab
2. Sprint 22: Player Analysis Charts
3. Sprint 23: Library And Plan Integration Cleanup
4. Sprint 24: Coach Insights

Reason:

- These turn the structured data into planning and coaching value.

## 11. Required Engineering Rules For Every Sprint

Every sprint must:

- preserve current Supabase/Dexie offline-first sync pattern
- avoid player accounts
- avoid new custom backend
- avoid Edge Functions unless a later explicit decision changes architecture
- avoid service-role secrets in frontend
- keep RLS enabled on all dynamic tables
- include `user_id` on all new dynamic tables
- include JSON backup/import for new dynamic tables
- include CSV export for user-facing analysis data where useful
- avoid new dynamic catalogue tables when static TypeScript content is enough
- define pull scope before adding high-cardinality fact records
- avoid global full-pull sync for dense player/session/block data
- prefer session-scoped pull, compact row models, or server-side delta/watermark strategies for future high-volume data
- define a bounded historical read strategy before building team/player analysis charts
- keep `Heute`, `Check-in`, and live `Training` low-friction
- keep medical/safety language conservative
- avoid diagnosis fields
- avoid body-region analytics until structured body-region capture is deliberately modeled
- avoid automatic medical clearance
- avoid forcing optional tests like 30 m

## 12. Test Commands

Use from `app/field-hub/`:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Use Supabase checks from project root when migrations are added:

```bash
supabase db push --dry-run
```

Run browser/iPad checks for UI-heavy sprints.

## 13. Handoff Checklist For A New Session

Before starting any sprint, read:

- `AGENTS.md`
- `app/README.md`
- `app/ROADMAP.md`
- `app/field-hub/README.md`
- `app/field-hub/QA_SPRINT_10.md`
- `app/field-hub/SPRINT_11_TUESDAY_READINESS.md`
- `docs/08_next_session_handover.md`
- this roadmap file

For code context, inspect:

- current git status
- relevant component
- relevant domain file
- relevant repository file
- matching tests
- Supabase migrations if data model changes

For every sprint, start with:

1. identify exact current behavior
2. write or update focused tests
3. implement minimal scoped change
4. run relevant tests
5. run full checks before claiming completion
6. document migration/sync/export impact

At the end of a build session:

- Do not mark `reviewed_by_codex`.
- Do not mark `accepted_by_arwin`.
- If the sprint scope is complete, mark only `implemented_by_agent` and `tests_reported_by_agent`.
- Leave concise notes for the separate review session: changed files, commands run, test results, risks, and anything intentionally deferred.

## 14. Self-Review Of This Roadmap

Coverage:

- Includes the original request: data model, tracking, progress display, visual/statistical analysis, future usability, and extra use cases.
- Includes the later UX requirement: player details only after clicking a player.
- Includes the live training idea: guided phases from the current training plan.
- Includes planned-vs-actual, exposures, flexible metrics, structured exercise progression, post-session guidance, analysis, library cleanup, and coach insights.
- Includes existing app context, files, tables, and safety constraints.
- Incorporates the Claude-Code review corrections: sync-scope gate, content foundation, static metric/exercise catalogues, exposure cardinality decision, legacy cutover rule, and injury/load analytics.
- Incorporates the second Claude-Code review corrections: bounded analysis read strategy, deferred structured body-region modeling, returner caps as exposure limiters, static key validation, and clearer exposure model options.

Known intentional limitation:

- This is a sprint roadmap and implementation handoff, not the final line-by-line code plan for each sprint. Before executing a specific sprint, create a smaller task-level implementation plan for that sprint if the change touches migrations, sync, or large UI.
- Sprint 18 still requires an explicit exposure-model decision before implementation: detailed block rows vs compact player-session summary.
- Structured body-region analytics are intentionally deferred until a dedicated sprint handles schema, UI, public/kiosk check-in, sync, export/import, and tests.
- Sprint 21 still requires a bounded historical read strategy before implementation.

Risk:

- The roadmap is broad. The safest first implementation is Sprint 12 plus Sprint 13, not all data-model migrations at once.
- High-cardinality data remains the main technical risk; this version gates that risk instead of pretending it does not exist.

Quality rating:

- Strategic context: 9/10.
- New-session handoff: 8.5/10.
- Data-model quality: 7.8/10.
- Technical feasibility: 7.8/10, provided the sync/content/analysis-read gates are respected.
- Direct code-execution detail: 6/10 by design, because each sprint should receive its own implementation plan before code changes.
