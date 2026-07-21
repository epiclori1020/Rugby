# OnField KW30 Active Sessions Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Subagent-driven execution is unavailable for this task, so execute inline with TDD checkpoints.

**Goal:** OnField zeigt am Dienstag, 21. Juli 2026, die tatsaechlich auszufuehrende Session 4B und am Donnerstag, 23. Juli 2026, den neuen kontrollierten KW30-Entwicklungsreiz inklusive beider vollstaendiger PDF-Pakete und Deep Playbooks.

**Architecture:** Die vorhandenen stabilen `SessionDefinition`-IDs bleiben bestehen. Statische TypeScript-Inhalte unter `src/content` liefern Session und Bibliothek; lokale PDF-Assets unter `public/library` werden vom bestehenden Library-Viewer und PWA-Precache genutzt. Es entstehen keine neue UI, kein Parser und keine Datenmigration.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Vitest 4, Vite PWA, bestehende OnField-Content- und Library-Komponenten.

## Global Constraints

- `kw30-di-2026-07-21` und `kw30-do-2026-07-23` bleiben als kanonische IDs stabil.
- Heute zeigt Session 4B, nicht die alte Session 5A.
- Donnerstag bildet den aktuellen 90-Minuten-Plan mit acht semantischen Bloecken ab.
- Deep Playbook steht in beiden Session-PDF-Listen an erster Stelle.
- Alle PDFs liegen lokal unter `/library/` und bleiben offline precachebar.
- Keine Markdown-/PDF-Parser-Pipeline, kein Backend, keine neue Navigation und kein Datenmodellwechsel.
- iPhone und iPad haben Funktions- und Inhaltsparitaet.
- Keine medizinische Freigabe-Sprache; Concussion-Verdacht bedeutet Stopp, medizinische Abklaerung und keine Rueckkehr am selben Tag.

---

### Task 1: KW30-Contentvertrag test-first festschreiben

**Files:**
- Create: `app/field-hub/src/content/kw30ActiveSessions.test.ts`
- Modify: `app/field-hub/src/content/sessionBlockKeys.test.ts`
- Test: `app/field-hub/src/content/kw30ActiveSessions.test.ts`

**Interfaces:**
- Consumes: `sessionDefinitions`, `libraryItems`, `pdfRefs`.
- Produces: Ein fehlschlagender Vertrag fuer heutige 4B, Donnerstag-Entwicklungsreiz, PDF-Reihenfolge und Bibliotheksreferenzen.

- [ ] **Step 1: Write the failing content test**

```ts
import { describe, expect, it } from 'vitest'
import { libraryItems } from './library'
import { pdfRefs } from './pdfRefs'
import { sessionDefinitions } from './sessions'

describe('KW30 active sessions', () => {
  it('shows Session 4B as the active plan for Tuesday 21 July', () => {
    const session = sessionDefinitions.find((item) => item.id === 'kw30-di-2026-07-21')
    expect(session?.title).toBe('Dienstag 21. Juli: Session 4B')
    expect(session?.summary).toContain('zwei saubere Kraftsaetze')
    expect(session?.pdfRefs).toEqual([
      pdfRefs.kw29ThursdayDeepPlaybook,
      pdfRefs.kw29ThursdayTrainingCompact,
      pdfRefs.kw29ThursdayCheckIn,
    ])
    expect(session?.libraryRefs).toContain('kw29-thursday-active-pack')
    expect(session?.timeline.map((block) => block.title)).toEqual([
      'Check-in + RAMP',
      'Track + Speedqualitaet',
      'Power-Primer',
      'Kraft-Konsolidierung',
      'Cluster + Robustheit',
      'Optionales Tempo + Abschluss',
    ])
  })

  it('shows the detailed Thursday development session and PDF pack', () => {
    const session = sessionDefinitions.find((item) => item.id === 'kw30-do-2026-07-23')
    expect(session?.summary).toContain('kontrollierter Off-Season-Entwicklungsreiz')
    expect(session?.pdfRefs).toEqual([
      pdfRefs.kw30ThursdayDeepPlaybook,
      pdfRefs.kw30ThursdayTrainingCompact,
      pdfRefs.kw30ThursdayCheckIn,
    ])
    expect(session?.libraryRefs).toContain('kw30-thursday-active-pack')
    expect(session?.timeline.map((block) => block.time)).toEqual([
      '0-5', '5-14', '14-22', '22-35', '35-43', '43-69', '69-79', '79-90',
    ])
    expect(session?.timeline.find((block) => block.title === 'Speed / COD')?.work).toContain('Build 20/Fly 10')
    expect(session?.timeline.find((block) => block.title === 'Kraft-Pods')?.work).toContain('3x4 @ RPE 7')
    expect(session?.timeline.find((block) => block.title === 'Ball-in-Play + Abschluss')?.work).toContain('2 Serien')
    expect(session?.safetyNotes.join(' ')).toContain('keine Rueckkehr am selben Tag')
  })

  it('exposes both active packs from the static library', () => {
    expect(libraryItems.find((item) => item.id === 'kw29-thursday-active-pack')?.pdfRefs).toHaveLength(3)
    expect(libraryItems.find((item) => item.id === 'kw30-thursday-active-pack')?.pdfRefs).toHaveLength(3)
  })
})
```

- [ ] **Step 2: Update expected stable block slugs before implementation**

```ts
'kw30-di-2026-07-21': [
  'check-in-ramp',
  'track-speed-quality',
  'power-primer',
  'strength-consolidation',
  'cluster-robustness',
  'tempo-closeout',
],
'kw30-do-2026-07-23': [
  'check-in',
  'ramp-mobility',
  'track-cod-prep',
  'speed-cod',
  'power',
  'strength-pods',
  'cluster-robustness',
  'conditioning-closeout',
],
```

- [ ] **Step 3: Run the focused tests and verify RED**

Run:

```bash
npm test -- src/content/kw30ActiveSessions.test.ts src/content/sessionBlockKeys.test.ts
```

Expected: FAIL because the new PDF-ref properties and active library packs do not exist and both KW30 sessions still carry their generic old content.

---

### Task 2: PDF-Referenzen und aktive Bibliothekspakete integrieren

**Files:**
- Modify: `app/field-hub/src/content/pdfRefs.ts`
- Modify: `app/field-hub/src/content/library.ts`
- Create: `app/field-hub/public/library/kw30_thursday_2026-07-23_training_kompakt.pdf`
- Create: `app/field-hub/public/library/kw30_thursday_2026-07-23_checkin_beobachtung.pdf`
- Create: `app/field-hub/public/library/kw30_thursday_2026-07-23_deep_playbook.pdf`
- Test: `app/field-hub/src/content/libraryIntegrity.test.ts`

**Interfaces:**
- Consumes: vorhandene `PdfRef`-Form und `LibraryItem`-Struktur.
- Produces: sechs erreichbare PDF-Refs fuer KW29 4B und KW30 Donnerstag sowie zwei aktive Library-Items.

- [ ] **Step 1: Add typed refs for the existing 4B files and new Thursday files**

```ts
kw29ThursdayDeepPlaybook: {
  label: 'Heute: Session 4B Deep Playbook',
  href: '/library/kw29_thursday_2026-07-16_deep_playbook.pdf',
  sourcePath: 'docs/22_kw29_thursday_deep_playbook_2026-07-16.md',
},
kw29ThursdayTrainingCompact: {
  label: 'Heute: Session 4B Training kompakt',
  href: '/library/kw29_thursday_2026-07-16_training_kompakt.pdf',
  sourcePath: 'plans/offseason_coach_sheets/KW29_thursday_training_compact_2026-07-16.md',
},
kw29ThursdayCheckIn: {
  label: 'Heute: Session 4B Check-in + Beobachtung',
  href: '/library/kw29_thursday_2026-07-16_checkin_beobachtung.pdf',
  sourcePath: 'templates/kw29_thursday_checkin_observation_2026-07-16.md',
},
kw30ThursdayDeepPlaybook: {
  label: 'Do 23.07 Deep Playbook',
  href: '/library/kw30_thursday_2026-07-23_deep_playbook.pdf',
  sourcePath: 'docs/26_kw30_thursday_deep_playbook_2026-07-23.md',
},
kw30ThursdayTrainingCompact: {
  label: 'Do 23.07 Training kompakt',
  href: '/library/kw30_thursday_2026-07-23_training_kompakt.pdf',
  sourcePath: 'plans/offseason_coach_sheets/KW30_thursday_training_compact_2026-07-23.md',
},
kw30ThursdayCheckIn: {
  label: 'Do 23.07 Check-in + Beobachtung',
  href: '/library/kw30_thursday_2026-07-23_checkin_beobachtung.pdf',
  sourcePath: 'templates/kw30_thursday_checkin_observation_2026-07-23.md',
},
```

- [ ] **Step 2: Add the two active library items**

`kw29-thursday-active-pack` beschreibt 4B als Qualitaetskonsolidierung mit A-Skip, kontrolliertem Speed, kurzem Power-Primer, zwei Kraftsaetzen und optionalem Tempo. `kw30-thursday-active-pack` beschreibt die acht Bloecke, Hauptdosen, Returner-Caps und Kuertzungslogik. Beide listen das Deep Playbook zuerst.

- [ ] **Step 3: Copy the new binary assets into the public library**

```bash
cp print_pdfs/DONNERSTAG_2026-07-23_DRUCKEN/03_deep_playbook_optional_ipad.pdf app/field-hub/public/library/kw30_thursday_2026-07-23_deep_playbook.pdf
cp print_pdfs/DONNERSTAG_2026-07-23_DRUCKEN/01_training_kompakt_pflicht.pdf app/field-hub/public/library/kw30_thursday_2026-07-23_training_kompakt.pdf
cp print_pdfs/DONNERSTAG_2026-07-23_DRUCKEN/02_checkin_beobachtung_pflicht_2seiten.pdf app/field-hub/public/library/kw30_thursday_2026-07-23_checkin_beobachtung.pdf
```

- [ ] **Step 4: Run library integrity and keep the focused suite RED only on session content**

Run:

```bash
npm test -- src/content/libraryIntegrity.test.ts src/content/kw30ActiveSessions.test.ts
```

Expected: library integrity PASS; KW30 session assertions remain FAIL until Task 3.

---

### Task 3: Heutige 4B und Donnerstag-Entwicklungsreiz in `sessions.ts` abbilden

**Files:**
- Modify: `app/field-hub/src/content/sessions.ts`
- Test: `app/field-hub/src/content/kw30ActiveSessions.test.ts`
- Test: `app/field-hub/src/content/sessionBlockKeys.test.ts`

**Interfaces:**
- Consumes: sechs neue `pdfRefs` und die Library-IDs `kw29-thursday-active-pack`, `kw30-thursday-active-pack`.
- Produces: zwei detaillierte, stabile KW30-SessionDefinitions fuer alle Coach-Routen.

- [ ] **Step 1: Replace Tuesday 5A with today's six-block 4B definition**

Setze den Titel auf `Dienstag 21. Juli: Session 4B`, verweise `primarySource` auf den KW29-Donnerstag-Kompaktplan, ordne PDFs als Deep/Compact/Check-in und nutze sechs Bloecke fuer 0-90 Minuten. Der Kraftblock nennt `2x4 @ RPE 6-7`; Tempo bleibt optional und wird zuerst gestrichen.

- [ ] **Step 2: Replace Thursday generic 5B with the eight-block current plan**

Nutze exakte Zeiten und Dosen aus `KW30_thursday_training_compact_2026-07-23.md`. Fuege `kw30-thursday-active-pack` in Session und relevante Block-Refs ein, behalte Exercise Mapping und Varianten, und kodiere Concussion-/Returner-/Kontaktregeln ohne Freigabesprache.

- [ ] **Step 3: Run focused tests and verify GREEN**

```bash
npm test -- src/content/kw30ActiveSessions.test.ts src/content/sessionBlockKeys.test.ts src/content/libraryIntegrity.test.ts src/pwaConfig.test.ts
```

Expected: all focused tests PASS.

- [ ] **Step 4: Refactor only duplicated content ordering if needed**

Keep `sessions.ts`, `pdfRefs.ts` and `library.ts` in their established roles. Do not introduce a parser, generic content factory or new component.

- [ ] **Step 5: Re-run focused tests after refactor**

Expected: all focused tests PASS with no warnings.

---

### Task 4: Full verification and responsive app evidence

**Files:**
- Verify: `app/field-hub/src/content/*`
- Verify: `app/field-hub/public/library/*.pdf`
- Verify: `app/field-hub/src/components/LibraryView.tsx`
- Verify: `app/field-hub/src/components/TrainingView.tsx`

**Interfaces:**
- Consumes: completed static content integration.
- Produces: build evidence and visible iPhone/iPad proof for Session, Today-relevant library and Deep Playbook.

- [ ] **Step 1: Run code quality and local QA**

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run qa:local
```

Expected: every command exits 0. `qa:local` may report only documented non-beta limitations; no test or build failure is accepted.

- [ ] **Step 2: Start the local app**

```bash
npm run dev -- --host 127.0.0.1
```

Expected: Vite serves OnField Coach on `http://127.0.0.1:5173/` or the next available local port.

- [ ] **Step 3: Verify iPhone and iPad**

Open the app at 393 x 852 and 1194 x 834. Verify Tuesday 4B, Thursday eight-block session, `Heute relevant`, the Deep-Playbook-first ordering and the embedded PDF viewer without clipping.

- [ ] **Step 4: Inspect the three new PDFs directly**

Confirm HTTP 200 and expected first-page text for compact, check-in and Deep Playbook. Confirm the Deep Playbook has 16 pages.

---

### Task 5: Memory closeout, commit and push

**Files:**
- Review: `docs/field-hub/onfield_current_state.md`
- Review: `docs/field-hub/onfield_decision_log.md`
- Review: `docs/field-hub/memory/gotchas.md`
- Modify only if Memory Governance qualifies the information.

**Interfaces:**
- Consumes: verified implementation and QA evidence.
- Produces: durable repository state on `origin/main` and an opened verified app.

- [ ] **Step 1: Run Memory Closeout**

Content additions that are directly obvious from code normally need no Memory update. Update Current State only if its statement about active static training coverage becomes materially inaccurate.

- [ ] **Step 2: Review the complete diff and secret hygiene**

```bash
git status --short
git diff --check
git diff --stat
git diff -- app/field-hub/src/content app/field-hub/public/library docs/field-hub
```

Expected: only intended training sources, PDFs, app content, tests, spec/plan and qualified Memory changes. No credentials, player data or unrelated app changes.

- [ ] **Step 3: Commit the completed integration**

```bash
git add app/field-hub/src/content app/field-hub/public/library docs/25_training_history_audit_2026-07-21.md docs/26_kw30_thursday_deep_playbook_2026-07-23.md docs/26_kw30_thursday_deep_playbook_2026-07-23.styled.pdf plans/offseason_coach_sheets/KW30_thursday_training_compact_2026-07-23.md print_pdfs/DONNERSTAG_2026-07-23_DRUCKEN scripts/build_deep_playbook_pdf.py scripts/build_kw30_thursday_print_pack.py templates/kw30_thursday_checkin_observation_2026-07-23.md docs/superpowers/specs/2026-07-21-onfield-kw30-thursday-integration-design.md docs/superpowers/plans/2026-07-21-onfield-kw30-active-sessions-integration.md
git commit -m "feat(onfield): integrate KW30 active training sessions"
```

- [ ] **Step 4: Push main and verify remote head**

```bash
git push origin main
git ls-remote --heads origin main
```

Expected: remote `main` resolves to the new local commit.

- [ ] **Step 5: Leave the verified app visible**

Navigate the app to today's Training route or the current Deep Playbook viewer, whichever most directly proves the requested content is present.
