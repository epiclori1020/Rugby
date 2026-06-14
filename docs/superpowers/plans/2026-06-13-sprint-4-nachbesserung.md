# Sprint 4 Nachbesserung Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the Sprint-4 audit findings so the Rugby S&C Field Hub check-in is safer, more complete, and ready for a real coach-login smoke test.

**Architecture:** Keep the existing Vite/React/TypeScript PWA, Dexie offline cache, and Supabase Auth/Postgres/RLS sync layer. Do not add Edge Functions, Realtime, player accounts, a custom server, broad Storage use, or a parser pipeline. Use one small additive Supabase migration only for traffic-light audit fields that must survive iPad/iPhone sync.

**Tech Stack:** React 19, TypeScript, Vite, Dexie, Supabase JS, Vitest, existing CSS.

---

## Scope Boundaries

Implement only these Sprint-4 repair items:

- Stop creating local `session_logs` just by opening Today/Check-in.
- Complete manual session selection for Today and Check-in, and keep the selected session after reload.
- Derive the "zuletzt dabei" player group from the latest previous session when available, with active players as fallback.
- Show save/sync errors visibly instead of swallowing them.
- Persist traffic-light suggestion and manual override metadata to Supabase.
- Normalize harmless Life-Flag text so `"nein"`/`"ok"` does not trigger Gelb.
- Run the real Coach E2E smoke if credentials are entered by the user during verification.

Do not implement Sprint 5+:

- no Training timeline editing,
- no variants quick actions beyond navigation,
- no sRPE/E2/progression UI,
- no Returner module,
- no export/import expansion.

## Files To Touch

- Modify: `app/field-hub/src/domain/checkIn.ts`
  - Add Life-Flag normalization helper.
  - Keep Ampel logic deterministic and testable.

- Modify: `app/field-hub/src/domain/checkIn.test.ts`
  - Add tests for harmless Life-Flag values.
  - Add tests confirming manual override preserves suggestion metadata.

- Modify: `app/field-hub/src/lib/checkInRepository.ts`
  - Add `findSessionLog`.
  - Make warning lookup work without creating a current session log.
  - Add expected-player lookup from previous session.
  - Persist `traffic_light_suggestion` and `traffic_light_was_manual`.
  - Export the player-session row mappers for focused audit-metadata tests.

- Create or modify: `app/field-hub/src/lib/checkInRepository.test.ts`
  - Use `fake-indexeddb/auto` to test Dexie behavior.
  - Verify read-only session lookup does not queue pending writes.
  - Verify `ensureSessionLog` still creates one pending write only when saving needs it.
  - Verify expected players come from the latest previous session.

- Modify: `app/field-hub/src/hooks/useCheckIns.ts`
  - Stop calling `ensureSessionLog` during refresh.
  - Expose `expectedPlayerIds` and `errorMessage`.
  - Surface save/sync errors.

- Create: `app/field-hub/src/components/SessionPicker.tsx`
  - Shared touch-friendly session selector.

- Modify: `app/field-hub/src/App.tsx`
  - Hold `selectedSessionId`.
  - Persist selected session in `localStorage`.
  - Pass selected session and selector callback into Today/Check-in.

- Modify: `app/field-hub/src/components/TodayDashboard.tsx`
  - Use selected session from props.
  - Show session picker.
  - Show "Zuletzt dabei" count from the latest previous session when available; otherwise show active player fallback clearly.

- Modify: `app/field-hub/src/components/CheckInView.tsx`
  - Show session picker.
  - Order expected players first.
  - Show visible error panel.
  - Remove `.catch(() => undefined)` save swallowing.

- Modify: `app/field-hub/src/lib/localDb.ts`
  - Bump Dexie version only if an index is needed. Do not bump if only adding non-indexed object properties.

- Create: `supabase/migrations/<generated>_add_player_session_traffic_audit.sql`
  - Add two columns to `public.player_session_entries`.

- Modify: `app/field-hub/src/lib/checkInRepository.test.ts`
  - Add mapper tests for `traffic_light_suggestion` and `traffic_light_was_manual`.

- Modify: `app/field-hub/src/index.css`
  - Add compact styles for session picker, expected badge, and error panel.

- Modify after verification: `app/ROADMAP.md`, `app/field-hub/README.md`, `docs/08_next_session_handover.md`
  - Document the completed Nachbesserung and honest E2E result.

## Task 1: Normalize Life-Flag Logic

**Files:**
- Modify: `app/field-hub/src/domain/checkIn.ts`
- Modify: `app/field-hub/src/domain/checkIn.test.ts`

- [ ] **Step 1: Add failing tests for harmless Life-Flag text**

Add tests to `app/field-hub/src/domain/checkIn.test.ts`:

```ts
it.each(['nein', 'Nein', 'ok', 'okay', 'unauffaellig', 'unauffällig', 'keine', 'nichts', '-', '  ok  '])(
  'treats harmless life flag "%s" as no yellow flag',
  (lifeFlag) => {
    expect(
      suggestTrafficLight({
        ...emptyCheckInDraft,
        lifeFlag,
        painScore: 0,
        readiness: 5,
        returnerFlag: 'nein',
      }),
    ).toBe('green')
  },
)

it('still treats specific life concerns as yellow', () => {
  expect(
    suggestTrafficLight({
      ...emptyCheckInDraft,
      lifeFlag: 'schlecht geschlafen, viel Stress',
      painScore: 0,
      readiness: 5,
      returnerFlag: 'nein',
    }),
  ).toBe('yellow')
})
```

- [ ] **Step 2: Run the targeted test and verify it fails**

Run from `app/field-hub/`:

```bash
npm test -- src/domain/checkIn.test.ts
```

Expected before implementation: at least the harmless-value test fails because any non-empty `lifeFlag` currently counts as a yellow flag.

- [ ] **Step 3: Implement normalization**

In `app/field-hub/src/domain/checkIn.ts`, add:

```ts
const harmlessLifeFlagValues = new Set([
  '-',
  'kein',
  'keine',
  'nein',
  'nichts',
  'no',
  'none',
  'ok',
  'okay',
  'unauffaellig',
  'unauffällig',
])

export function hasLifeFlagConcern(lifeFlag: string) {
  const normalized = lifeFlag.trim().toLocaleLowerCase('de-AT')

  return normalized.length > 0 && !harmlessLifeFlagValues.has(normalized)
}
```

Then replace:

```ts
input.lifeFlag.trim().length > 0,
```

with:

```ts
hasLifeFlagConcern(input.lifeFlag),
```

- [ ] **Step 4: Verify**

Run:

```bash
npm test -- src/domain/checkIn.test.ts
```

Expected: all domain tests pass.

## Task 2: Stop Phantom Session Logs

**Files:**
- Modify: `app/field-hub/src/lib/checkInRepository.ts`
- Modify: `app/field-hub/src/hooks/useCheckIns.ts`
- Create/modify: `app/field-hub/src/lib/checkInRepository.test.ts`
- Modify: `app/field-hub/package.json`

- [ ] **Step 1: Add `fake-indexeddb` for repository tests**

Run from `app/field-hub/`:

```bash
npm install -D fake-indexeddb
```

Expected: `package.json` and `package-lock.json` update. No runtime dependency is added.

- [ ] **Step 2: Add failing repository tests**

Create `app/field-hub/src/lib/checkInRepository.test.ts`:

```ts
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { SessionDefinition } from '../content/types'
import { localDb } from './localDb'
import { ensureSessionLog, findSessionLog, getCheckInSyncOverview } from './checkInRepository'

const userId = '00000000-0000-4000-8000-000000000001'

const sessionDefinition: SessionDefinition = {
  id: 'test-session',
  date: '2026-06-16',
  kw: 'KW25',
  title: 'Test Session',
  type: 'training',
  summary: 'Test',
  primarySource: 'test.md',
  pdfRefs: [],
  goals: [],
  timeline: [],
  materials: [],
  safetyNotes: [],
  coachScriptRefs: [],
  libraryRefs: [],
}

describe('checkInRepository session logs', () => {
  beforeEach(async () => {
    await localDb.delete()
    await localDb.open()
  })

  it('findSessionLog reads without creating pending writes', async () => {
    expect(await findSessionLog(userId, sessionDefinition.id)).toBeNull()
    await expect(localDb.sessionLogs.count()).resolves.toBe(0)
    await expect(localDb.pendingWrites.count()).resolves.toBe(0)

    const overview = await getCheckInSyncOverview(userId)
    expect(overview.pendingCount).toBe(0)
  })

  it('ensureSessionLog creates one pending session log only when explicitly needed', async () => {
    const sessionLog = await ensureSessionLog(userId, sessionDefinition)

    expect(sessionLog.sessionDefinitionId).toBe(sessionDefinition.id)
    await expect(localDb.sessionLogs.count()).resolves.toBe(1)
    await expect(localDb.pendingWrites.count()).resolves.toBe(1)
  })
})
```

Expected before implementation: TypeScript/Vitest fails because `findSessionLog` does not exist.

- [ ] **Step 3: Add read-only `findSessionLog`**

In `app/field-hub/src/lib/checkInRepository.ts`, add above `ensureSessionLog`:

```ts
export async function findSessionLog(userId: string, sessionDefinitionId: string) {
  return (
    (await localDb.sessionLogs
      .where('userId')
      .equals(userId)
      .and((sessionLog) => sessionLog.sessionDefinitionId === sessionDefinitionId && !sessionLog.deletedAt)
      .first()) ?? null
  )
}
```

Then update `ensureSessionLog` to reuse it:

```ts
export async function ensureSessionLog(userId: string, sessionDefinition: SessionDefinition) {
  const existing = await findSessionLog(userId, sessionDefinition.id)

  if (existing) {
    return existing
  }

  // keep the existing creation block unchanged
}
```

- [ ] **Step 4: Make warning lookup accept no current session**

Change the signature:

```ts
export async function listLatestWarnings(userId: string, currentSessionLogId: string | null) {
```

Change the Dexie filter:

```ts
.and((entry) => (!currentSessionLogId || entry.sessionLogId !== currentSessionLogId) && !entry.deletedAt)
```

- [ ] **Step 5: Update `useCheckIns.refreshLocalCheckIns`**

In `app/field-hub/src/hooks/useCheckIns.ts`, import `findSessionLog` and remove `ensureSessionLog` from the refresh path:

```ts
const sessionLog = await findSessionLog(userId, sessionDefinition.id)
const [localEntries, localWarnings, overview] = await Promise.all([
  sessionLog ? listCheckInEntries(userId, sessionLog.id) : Promise.resolve([]),
  listLatestWarnings(userId, sessionLog?.id ?? null),
  getCheckInSyncOverview(userId),
])
setSessionLogId(sessionLog?.id ?? null)
```

Keep `ensureSessionLog` only in `saveEntry`, because saving is the first real write.

- [ ] **Step 6: Make preview rows not look pending**

In `getEntryForPlayer`, keep using `buildEmptyEntry`, but override sync metadata for unsaved previews:

```ts
const preview = buildEmptyEntry(userId ?? 'local-preview', sessionLogId ?? 'session-preview', player)

return {
  ...preview,
  syncStatus: 'synced',
  syncError: null,
}
```

- [ ] **Step 7: Verify**

Run:

```bash
npm test -- src/lib/checkInRepository.test.ts
npm run typecheck
```

Expected: repository tests and typecheck pass. Opening Check-in without edits must no longer increase pending writes.

## Task 3: Add Manual Session Selection

**Files:**
- Create: `app/field-hub/src/components/SessionPicker.tsx`
- Modify: `app/field-hub/src/App.tsx`
- Modify: `app/field-hub/src/components/TodayDashboard.tsx`
- Modify: `app/field-hub/src/components/CheckInView.tsx`
- Modify: `app/field-hub/src/index.css`

- [ ] **Step 1: Create shared session picker**

Create `app/field-hub/src/components/SessionPicker.tsx`:

```tsx
import { CalendarDays } from 'lucide-react'
import type { SessionDefinition } from '../content/types'

type SessionPickerProps = {
  sessions: SessionDefinition[]
  selectedSessionId: string
  onSessionChange: (sessionId: string) => void
}

function formatSessionDate(date: string) {
  return new Intl.DateTimeFormat('de-AT', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(`${date}T12:00:00`))
}

export function SessionPicker({ onSessionChange, selectedSessionId, sessions }: SessionPickerProps) {
  return (
    <label className="session-picker">
      <span>
        <CalendarDays className="nav-icon" aria-hidden />
        Einheit
      </span>
      <select value={selectedSessionId} onChange={(event) => onSessionChange(event.currentTarget.value)}>
        {sessions.map((session) => (
          <option key={session.id} value={session.id}>
            {formatSessionDate(session.date)} · {session.title}
          </option>
        ))}
      </select>
    </label>
  )
}
```

- [ ] **Step 2: Hold and persist selected session in `App.tsx`**

In `app/field-hub/src/App.tsx`, update the React import:

```ts
import { useEffect, useState } from 'react'
```

Import `sessionDefinitions`:

```ts
import { getRelevantSessions, sessionDefinitions } from './content/sessions'
```

Add this helper above `combineSyncOverview`:

```ts
const selectedSessionStorageKey = 'fieldHub:selectedSessionId'

function getInitialSelectedSessionId(fallbackSessionId: string) {
  if (typeof window === 'undefined') {
    return fallbackSessionId
  }

  const storedSessionId = window.localStorage.getItem(selectedSessionStorageKey)
  const storedSessionExists = sessionDefinitions.some((session) => session.id === storedSessionId)

  return storedSessionExists && storedSessionId ? storedSessionId : fallbackSessionId
}
```

Replace:

```ts
const { featuredSession } = getRelevantSessions()
```

with:

```ts
const { featuredSession } = getRelevantSessions()
const [selectedSessionId, setSelectedSessionId] = useState(() => getInitialSelectedSessionId(featuredSession.id))
const selectedSession = sessionDefinitions.find((session) => session.id === selectedSessionId) ?? featuredSession
```

Pass `selectedSession` into `useCheckIns` instead of `featuredSession`.

Add this effect after `selectedSession` is defined:

```ts
useEffect(() => {
  window.localStorage.setItem(selectedSessionStorageKey, selectedSession.id)
}, [selectedSession.id])
```

- [ ] **Step 3: Pass picker props**

Pass to `TodayDashboard` and `CheckInView`:

```tsx
selectedSession={selectedSession}
selectedSessionId={selectedSession.id}
sessions={sessionDefinitions}
onSessionChange={setSelectedSessionId}
```

- [ ] **Step 4: Update component prop types**

Add these props to both `TodayDashboardProps` and `CheckInViewProps`:

```ts
selectedSession: SessionDefinition
selectedSessionId: string
sessions: SessionDefinition[]
onSessionChange: (sessionId: string) => void
```

Import `SessionDefinition` and `SessionPicker`.

- [ ] **Step 5: Use selected session in Today**

In `TodayDashboard`, remove the local `featuredSession` call and use `selectedSession` for title, summary, tags, timeline, materials, safety notes. Keep:

```ts
const { upcomingSessions } = getRelevantSessions()
const featuredSession = selectedSession
```

Render `<SessionPicker />` in the first panel under the tag row.

- [ ] **Step 6: Use selected session in Check-in**

Render `<SessionPicker />` in the Check-in header next to the Sync button.

- [ ] **Step 7: Add CSS**

In `app/field-hub/src/index.css`, add:

```css
.session-picker {
  display: grid;
  gap: 0.45rem;
  min-width: min(100%, 22rem);
}

.session-picker > span {
  align-items: center;
  color: var(--muted);
  display: inline-flex;
  font-size: 0.82rem;
  font-weight: 700;
  gap: 0.4rem;
  text-transform: uppercase;
}

.session-picker select {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  font: inherit;
  min-height: 44px;
  padding: 0.65rem 0.75rem;
}
```

- [ ] **Step 8: Verify**

Run:

```bash
npm run typecheck
npm run lint
```

Expected: both pass. Manual session selection changes the session shown on Today and the session used by Check-in.

## Task 4: "Zuletzt Dabei" Players From Latest Previous Session

**Files:**
- Modify: `app/field-hub/src/lib/checkInRepository.ts`
- Modify: `app/field-hub/src/lib/checkInRepository.test.ts`
- Modify: `app/field-hub/src/hooks/useCheckIns.ts`
- Modify: `app/field-hub/src/components/TodayDashboard.tsx`
- Modify: `app/field-hub/src/components/CheckInView.tsx`

- [ ] **Step 1: Add failing repository test**

Modify the imports in `app/field-hub/src/lib/checkInRepository.test.ts`:

```ts
import { emptyCheckInDraft } from '../domain/checkIn'
import { ensureSessionLog, findSessionLog, getCheckInSyncOverview, listExpectedPlayerIds } from './checkInRepository'
```

Then append this test:

```ts

it('returns present players from the latest previous session', async () => {
  await localDb.sessionLogs.bulkPut([
    {
      id: 'older-session',
      userId,
      sessionDefinitionId: 'older',
      date: '2026-06-10',
      status: 'completed',
      coach: '',
      groupSize: null,
      weatherOrHeatNote: '',
      planChanged: false,
      durationMinutes: null,
      contactIndex: '',
      speedExposureNote: '',
      coachReview: '',
      createdAt: '2026-06-10T18:00:00.000Z',
      updatedAt: '2026-06-10T18:00:00.000Z',
      deletedAt: null,
      clientUpdatedAt: '2026-06-10T18:00:00.000Z',
      syncStatus: 'synced',
      syncError: null,
    },
    {
      id: 'latest-session',
      userId,
      sessionDefinitionId: 'latest',
      date: '2026-06-13',
      status: 'completed',
      coach: '',
      groupSize: null,
      weatherOrHeatNote: '',
      planChanged: false,
      durationMinutes: null,
      contactIndex: '',
      speedExposureNote: '',
      coachReview: '',
      createdAt: '2026-06-13T18:00:00.000Z',
      updatedAt: '2026-06-13T18:00:00.000Z',
      deletedAt: null,
      clientUpdatedAt: '2026-06-13T18:00:00.000Z',
      syncStatus: 'synced',
      syncError: null,
    },
  ])

  await localDb.playerSessionEntries.bulkPut([
    {
      ...emptyCheckInDraft,
      id: 'entry-a',
      userId,
      sessionLogId: 'older-session',
      playerId: 'player-old',
      present: true,
      createdAt: '2026-06-10T18:00:00.000Z',
      updatedAt: '2026-06-10T18:00:00.000Z',
      deletedAt: null,
      clientUpdatedAt: '2026-06-10T18:00:00.000Z',
      syncStatus: 'synced',
      syncError: null,
    },
    {
      ...emptyCheckInDraft,
      id: 'entry-b',
      userId,
      sessionLogId: 'latest-session',
      playerId: 'player-present',
      present: true,
      createdAt: '2026-06-13T18:00:00.000Z',
      updatedAt: '2026-06-13T18:00:00.000Z',
      deletedAt: null,
      clientUpdatedAt: '2026-06-13T18:00:00.000Z',
      syncStatus: 'synced',
      syncError: null,
    },
    {
      ...emptyCheckInDraft,
      id: 'entry-c',
      userId,
      sessionLogId: 'latest-session',
      playerId: 'player-absent',
      present: false,
      createdAt: '2026-06-13T18:00:00.000Z',
      updatedAt: '2026-06-13T18:00:00.000Z',
      deletedAt: null,
      clientUpdatedAt: '2026-06-13T18:00:00.000Z',
      syncStatus: 'synced',
      syncError: null,
    },
  ])

  await expect(listExpectedPlayerIds(userId, '2026-06-16')).resolves.toEqual(['player-present'])
})
```

- [ ] **Step 2: Implement `listExpectedPlayerIds`**

Add to `app/field-hub/src/lib/checkInRepository.ts`:

```ts
export async function listExpectedPlayerIds(userId: string, currentSessionDate: string) {
  const previousSessions = await localDb.sessionLogs
    .where('userId')
    .equals(userId)
    .and((sessionLog) => !sessionLog.deletedAt && sessionLog.date < currentSessionDate)
    .toArray()

  const latestPreviousSession = previousSessions.sort((a, b) => b.date.localeCompare(a.date))[0]

  if (!latestPreviousSession) {
    return []
  }

  const entries = await localDb.playerSessionEntries
    .where('userId')
    .equals(userId)
    .and((entry) => entry.sessionLogId === latestPreviousSession.id && entry.present && !entry.deletedAt)
    .toArray()

  return entries.map((entry) => entry.playerId)
}
```

- [ ] **Step 3: Wire hook state**

In `useCheckIns.ts`, add state:

```ts
const [expectedPlayerIds, setExpectedPlayerIds] = useState<string[]>([])
```

Import `listExpectedPlayerIds` and include it in refresh:

```ts
const [localEntries, localWarnings, expectedIds, overview] = await Promise.all([
  sessionLog ? listCheckInEntries(userId, sessionLog.id) : Promise.resolve([]),
  listLatestWarnings(userId, sessionLog?.id ?? null),
  listExpectedPlayerIds(userId, sessionDefinition.date),
  getCheckInSyncOverview(userId),
])
setExpectedPlayerIds(expectedIds)
```

Reset it to `[]` when logged out, and return it from the hook.

- [ ] **Step 4: Use expected count in Today**

In `TodayDashboard`, compute a precise metric label and value:

```ts
const expectedPlayerSet = new Set(checkInActions.expectedPlayerIds)
const expectedCount = expectedPlayerSet.size > 0 ? activePlayers.filter((player) => expectedPlayerSet.has(player.id)).length : activePlayers.length
const expectedMetricLabel = expectedPlayerSet.size > 0 ? 'Zuletzt dabei' : 'Aktiv'
```

Use `expectedMetricLabel` and `expectedCount` in the first player metric. Do not label this as guaranteed attendance:

```tsx
<span>{expectedMetricLabel}</span>
<strong>{expectedCount}</strong>
```

- [ ] **Step 5: Order expected players first in Check-in**

In `CheckInView`, compute:

```ts
const expectedPlayerSet = new Set(checkInActions.expectedPlayerIds)
const orderedPlayers = [...activePlayers].sort((a, b) => {
  const aExpected = expectedPlayerSet.has(a.id)
  const bExpected = expectedPlayerSet.has(b.id)

  if (aExpected === bExpected) {
    return a.name.localeCompare(b.name, 'de-AT')
  }

  return aExpected ? -1 : 1
})
```

Map `orderedPlayers` instead of `activePlayers`. Pass `isExpected={expectedPlayerSet.has(player.id)}` to the row and show:

```tsx
{isExpected ? <span className="tag compact">Zuletzt dabei</span> : null}
```

- [ ] **Step 6: Verify**

Run:

```bash
npm test -- src/lib/checkInRepository.test.ts
npm run typecheck
```

Expected: tests pass, Today falls back to active player count when no previous session exists, and the UI copy says `Zuletzt dabei` only when the list actually comes from a previous session.

## Task 5: Make Save/Sync Errors Visible

**Files:**
- Modify: `app/field-hub/src/hooks/useCheckIns.ts`
- Modify: `app/field-hub/src/components/CheckInView.tsx`
- Modify: `app/field-hub/src/index.css`

- [ ] **Step 1: Add hook error state**

In `useCheckIns.ts`, add:

```ts
const [errorMessage, setErrorMessage] = useState<string | null>(null)
```

When logged out, reset it:

```ts
setErrorMessage(null)
```

- [ ] **Step 2: Surface sync errors**

Change `runSync` to return the overview and set the message without throwing into click handlers:

```ts
const overview = await syncCheckIns(userId)
setSyncOverview(overview)
setErrorMessage(overview.status === 'error' ? overview.errorMessage ?? 'Check-in-Sync fehlgeschlagen.' : null)
await refreshLocalCheckIns()
return overview
```

In `catch`, return an error overview:

```ts
const message = caughtError instanceof Error ? caughtError.message : 'Check-in-Sync fehlgeschlagen.'
const overview = {
  ...(await getCheckInSyncOverview(userId)),
  status: 'error' as const,
  errorMessage: message,
}
setSyncOverview(overview)
setErrorMessage(message)
return overview
```

- [ ] **Step 3: Surface save errors while preserving local-first behavior**

Wrap `saveEntry`:

```ts
try {
  setErrorMessage(null)
  const sessionLog = sessionLogId ? { id: sessionLogId } : await ensureSessionLog(userId, sessionDefinition)
  await saveCheckInEntry(userId, sessionLog.id, player, patch, manualTrafficLight)
  await refreshLocalCheckIns()

  if (navigator.onLine) {
    const overview = await runSync()
    if (overview?.status === 'error') {
      setErrorMessage(`Lokal gespeichert, Sync offen: ${overview.errorMessage ?? 'Unbekannter Sync-Fehler.'}`)
    }
  }
} catch (caughtError) {
  const message = caughtError instanceof Error ? caughtError.message : 'Check-in konnte nicht gespeichert werden.'
  setErrorMessage(message)
}
```

- [ ] **Step 4: Return `errorMessage` and `clearError`**

Return:

```ts
errorMessage,
clearError: () => setErrorMessage(null),
```

- [ ] **Step 5: Render error panel**

In `CheckInView`, read `errorMessage` and `clearError`. Above the sync strip, render:

```tsx
{errorMessage ? (
  <div className="panel error-panel" role="alert">
    <strong>Check-in nicht vollstaendig synchronisiert</strong>
    <span>{errorMessage}</span>
    <button className="secondary-action" type="button" onClick={clearError}>
      Schliessen
    </button>
  </div>
) : null}
```

- [ ] **Step 6: Stop swallowing save errors**

Replace:

```tsx
saveEntry(selectedPlayer, patch, manualTrafficLight).catch(() => undefined)
```

with:

```tsx
void saveEntry(selectedPlayer, patch, manualTrafficLight)
```

The hook now owns visible error state.

- [ ] **Step 7: Add CSS**

Add to `index.css`:

```css
.error-panel {
  border-color: rgba(180, 35, 24, 0.45);
  background: rgba(180, 35, 24, 0.08);
  color: var(--text);
  display: grid;
  gap: 0.5rem;
}

.error-panel strong {
  color: #8f1d17;
}
```

- [ ] **Step 8: Verify**

Run:

```bash
npm run typecheck
npm run lint
```

Expected: both pass. During manual QA, temporarily disconnect network or unset Supabase env to verify the error panel appears.

## Task 6: Persist Traffic-Light Audit Fields

**Files:**
- Create: `supabase/migrations/<generated>_add_player_session_traffic_audit.sql`
- Modify: `app/field-hub/src/lib/checkInRepository.ts`
- Modify: `app/field-hub/src/lib/checkInRepository.test.ts`
- Modify: `app/field-hub/src/domain/checkIn.test.ts`

- [ ] **Step 1: Run Supabase preflight before schema work**

Run from `/Users/arwinfarajpoory/Desktop/Rugby`:

```bash
supabase --version
supabase migration --help
supabase db push --help
```

Expected:

- Supabase CLI is available.
- `migration new` is listed under migration commands.
- `db push` supports `--dry-run`.

Before applying a remote schema change, also check current official Supabase guidance:

```text
Read https://supabase.com/changelog.md and scan for breaking-change entries affecting CLI migrations, db push, Postgres RLS, or Data API grants.
Read the current Supabase CLI migration docs if the local --help output differs from this plan.
```

If a breaking change or CLI mismatch affects `supabase migration new` or `supabase db push --dry-run`, stop and update this plan before continuing.

- [ ] **Step 2: Create migration file with CLI**

Run from `/Users/arwinfarajpoory/Desktop/Rugby`:

```bash
supabase migration new add_player_session_traffic_audit
```

Expected: a timestamped file appears in `supabase/migrations/`.

- [ ] **Step 3: Add SQL**

Put this SQL in the generated migration file:

```sql
alter table public.player_session_entries
add column traffic_light_suggestion text null check (
  traffic_light_suggestion is null
  or traffic_light_suggestion in ('green', 'yellow', 'red')
),
add column traffic_light_was_manual boolean not null default false;
```

RLS does not need a new policy because this only adds columns to an existing RLS-protected table. Do not add grants, new tables, functions, views, Edge Functions, or Realtime.

- [ ] **Step 4: Add failing mapper tests for traffic-light audit metadata**

Modify the existing import from `./checkInRepository` at the top of `app/field-hub/src/lib/checkInRepository.test.ts` so it includes the mapper functions and type:

```ts
import {
  ensureSessionLog,
  entryFromRow,
  findSessionLog,
  getCheckInSyncOverview,
  listExpectedPlayerIds,
  rowFromEntry,
  type PlayerSessionEntryRow,
} from './checkInRepository'
```

Then append these tests:

```ts
const remoteEntryRow: PlayerSessionEntryRow = {
  id: 'entry-remote',
  user_id: userId,
  session_log_id: 'session-remote',
  player_id: 'player-remote',
  present: true,
  readiness: 5,
  life_flag: '',
  pain_score: 0,
  pain_location: '',
  returner_flag: 'nein',
  traffic_light: 'yellow',
  traffic_light_suggestion: 'green',
  traffic_light_was_manual: true,
  limits: [],
  observation: 'manual override smoke',
  created_at: '2026-06-16T18:00:00.000Z',
  updated_at: '2026-06-16T18:05:00.000Z',
  deleted_at: null,
  client_updated_at: '2026-06-16T18:05:00.000Z',
}

it('preserves remote traffic-light suggestion and manual override metadata', () => {
  const entry = entryFromRow(remoteEntryRow)

  expect(entry.trafficLightSuggestion).toBe('green')
  expect(entry.trafficLight).toBe('yellow')
  expect(entry.trafficLightWasManual).toBe(true)
  expect(entry.observation).toBe('manual override smoke')
})

it('writes traffic-light suggestion and manual override metadata to Supabase rows', () => {
  const entry = entryFromRow(remoteEntryRow)
  const row = rowFromEntry(entry)

  expect(row.traffic_light_suggestion).toBe('green')
  expect(row.traffic_light).toBe('yellow')
  expect(row.traffic_light_was_manual).toBe(true)
})
```

Run:

```bash
npm test -- src/lib/checkInRepository.test.ts
```

Expected before implementation: the test fails because the mapper functions/type are not exported yet and `PlayerSessionEntryRow` lacks the new audit columns.

- [ ] **Step 5: Export row type and mapping functions for focused tests**

In `checkInRepository.ts`, change:

```ts
type PlayerSessionEntryRow = {
```

to:

```ts
export type PlayerSessionEntryRow = {
```

Change:

```ts
function entryFromRow(row: PlayerSessionEntryRow, syncStatus: SyncStatus = 'synced'): PlayerSessionEntry {
```

to:

```ts
export function entryFromRow(row: PlayerSessionEntryRow, syncStatus: SyncStatus = 'synced'): PlayerSessionEntry {
```

Change:

```ts
function rowFromEntry(entry: PlayerSessionEntry): PlayerSessionEntryRow {
```

to:

```ts
export function rowFromEntry(entry: PlayerSessionEntry): PlayerSessionEntryRow {
```

- [ ] **Step 6: Update row type**

In `checkInRepository.ts`, extend `PlayerSessionEntryRow`:

```ts
traffic_light_suggestion: TrafficLight | null
traffic_light_was_manual: boolean
```

- [ ] **Step 7: Map row to entry accurately**

In `entryFromRow`, replace the hard-coded manual fields:

```ts
trafficLightSuggestion: row.traffic_light_suggestion,
trafficLightWasManual: row.traffic_light_was_manual,
```

Return:

```ts
const withSuggestion = row.traffic_light_suggestion
  ? {
      ...draft,
      trafficLightSuggestion: row.traffic_light_suggestion,
      trafficLight: row.traffic_light,
    }
  : applySuggestedTrafficLight(draft)

return {
  ...withSuggestion,
  trafficLight: row.traffic_light ?? withSuggestion.trafficLightSuggestion,
  trafficLightWasManual: row.traffic_light_was_manual,
  id: row.id,
  userId: row.user_id,
  sessionLogId: row.session_log_id,
  playerId: row.player_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  deletedAt: row.deleted_at,
  clientUpdatedAt: row.client_updated_at,
  syncStatus,
  syncError: null,
}
```

- [ ] **Step 8: Map entry to row**

In `rowFromEntry`, add:

```ts
traffic_light_suggestion: entry.trafficLightSuggestion,
traffic_light_was_manual: entry.trafficLightWasManual,
```

- [ ] **Step 9: Select the new columns from Supabase**

In `refreshRemoteCheckIns`, update the select list:

```ts
'id,user_id,session_log_id,player_id,present,readiness,life_flag,pain_score,pain_location,returner_flag,traffic_light,traffic_light_suggestion,traffic_light_was_manual,limits,observation,created_at,updated_at,deleted_at,client_updated_at',
```

- [ ] **Step 10: Add domain test for manual metadata**

Add to `checkIn.test.ts`:

```ts
it('keeps the suggested traffic light when coach overrides manually', () => {
  const suggested = applySuggestedTrafficLight({
    ...emptyCheckInDraft,
    painScore: 0,
    readiness: 5,
    returnerFlag: 'nein',
  })

  const overridden = applyManualTrafficLight(suggested, 'yellow')

  expect(overridden.trafficLightSuggestion).toBe('green')
  expect(overridden.trafficLight).toBe('yellow')
  expect(overridden.trafficLightWasManual).toBe(true)
})
```

- [ ] **Step 11: Verify locally and remotely**

Run:

```bash
npm test -- src/lib/checkInRepository.test.ts
npm test -- src/domain/checkIn.test.ts
npm run typecheck
supabase migration list
supabase db push --dry-run
```

If dry-run is clean and the user approves applying the additive schema change, run:

```bash
supabase db push
```

Expected after push: app can upsert/select the two new columns without Supabase errors.

## Task 7: Coach E2E Smoke And Offline Smoke

**Files:**
- No code file required unless verification exposes a bug.
- Update docs after completion.

- [ ] **Step 1: Start dev server**

Run from `app/field-hub/`:

```bash
npm run dev -- --host 127.0.0.1 --port 5176
```

Open:

```text
http://127.0.0.1:5176/
```

- [ ] **Step 2: User enters Coach credentials manually**

The user must type the Coach login into the browser. Do not ask for the password in chat. Do not store credentials in files.

- [ ] **Step 3: Player create/reload/sync**

In the app:

1. Open `Spieler`.
2. Create a smoke player named `Smoke Sprint4 <date-time>`.
3. Set position/cluster, consent status, returner status `nein`.
4. If testing photo: set photo consent to allowed and upload a non-real test image, not a real player photo.
5. Click Sync.
6. Reload browser.
7. Verify the player remains visible.

- [ ] **Step 4: Check-in with manual session selection**

1. Open `Heute`.
2. Change session in the session picker.
3. Verify Today title/timeline changes.
4. Open `Check-in`.
5. Verify the same selected session is active.
6. Mark smoke player present.
7. Set readiness 5, pain 0, Life `ok`.
8. Verify suggestion is Gruen.
9. Manually set Gelb.
10. Verify UI shows `Coach korrigiert`.
11. Sync.

- [ ] **Step 5: Second browser context**

Open a second browser context or device at the same URL. Prefer the Codex in-app Browser for one context and a second browser profile/window for the other if available. Sign in with the same Coach account. Verify:

1. smoke player is visible,
2. selected check-in entry is visible after selecting the same session,
3. traffic-light suggestion remains Gruen,
4. final Ampel remains Gelb,
5. manual correction indicator is accurate.

- [ ] **Step 6: Offline smoke**

Use browser network offline mode if available:

1. Set browser offline.
2. Change the smoke player check-in note to `offline smoke`.
3. Verify pending count increases and no hard error blocks local use.
4. Set browser online.
5. Click Sync.
6. Verify pending count returns to 0.
7. Verify second context/device sees `offline smoke` after Sync.

If browser network offline mode is not available in the current tooling, document this exact limitation in `docs/08_next_session_handover.md` and do not claim offline E2E completion.

## Task 8: Documentation Updates

**Files:**
- Modify: `app/ROADMAP.md`
- Modify: `app/field-hub/README.md`
- Modify: `docs/08_next_session_handover.md`

- [ ] **Step 1: Update Roadmap Sprint 4 note**

In `app/ROADMAP.md`, add a short note under Sprint 4:

```md
Nachbesserung:

- Phantom-Session-Logs beim reinen Laden verhindert.
- Manuelle Session-Auswahl fuer Heute/Check-in ergaenzt und nach Reload beibehalten.
- Spieler aus der letzten vorherigen Einheit werden als "Zuletzt dabei" vorgezogen, aktive Spieler bleiben Fallback.
- Save-/Sync-Fehler werden sichtbar gemeldet.
- Traffic-Light-Vorschlag und manuelle Korrektur werden synchronisiert.
- Life-Flag-Freitext normalisiert harmlose Werte wie "nein" oder "ok".
```

- [ ] **Step 2: Update README**

In `app/field-hub/README.md`, document:

```md
### Sprint 4 Nachbesserung

Der Check-in erzeugt keine Session-Logs mehr beim reinen Laden. Eine Session wird erst angelegt, wenn der Coach wirklich speichert. Die aktuelle Einheit kann manuell ausgewaehlt werden und bleibt nach Reload erhalten. Spieler aus der letzten vorherigen Einheit werden als "Zuletzt dabei" vorgezogen. Traffic-Light-Vorschlag und Coach-Korrektur werden als Audit-Metadaten mit Supabase synchronisiert.
```

- [ ] **Step 3: Update Handover**

In `docs/08_next_session_handover.md`, replace the Sprint-4 audit limitations with the verified result. Keep any limitation that remains, especially if Coach E2E or offline smoke could not run.

## Task 9: Final Verification

**Files:**
- No planned source change.

- [ ] **Step 1: Inspect scripts**

Run:

```bash
cat package.json
```

from `app/field-hub/` and confirm these scripts still exist:

- `typecheck`
- `lint`
- `test`
- `build`

- [ ] **Step 2: Run app checks**

Run from `app/field-hub/`:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm audit --audit-level=moderate
```

Expected:

- typecheck passes,
- lint passes,
- all Vitest tests pass,
- production build passes,
- audit reports 0 moderate-or-higher vulnerabilities.

- [ ] **Step 3: Run Supabase checks**

Run from `/Users/arwinfarajpoory/Desktop/Rugby`:

```bash
supabase migration list
supabase db push --dry-run
```

Expected:

- migration list shows local and remote migration history aligned after push,
- dry-run reports remote database up to date.

- [ ] **Step 4: Secret and architecture check**

Run:

```bash
rg -n "service_role|SUPABASE_SERVICE|DB_PASSWORD|JWT_SECRET|PASSWORD=" app supabase docs .agents
rg -n "Edge Function|Realtime|createClient|service_role" app supabase docs .agents
```

Expected:

- no real secrets in code,
- no client `service_role`,
- no Edge Functions or Realtime introduced.

- [ ] **Step 5: Browser QA with in-app Browser**

Start the dev server if it is not already running:

```bash
npm run dev -- --host 127.0.0.1 --port 5176
```

Use the Codex in-app Browser against:

```text
http://127.0.0.1:5176/
```

Verify desktop, iPad width, and mobile width. For each viewport, check the browser console and visual layout:

- Today dashboard renders without horizontal overflow.
- Session picker is touch-usable.
- Check-in renders without overlap for long player names.
- Error panel does not break layout.
- Check-in list remains usable for 15-20 players.
- No Vite overlay appears.
- No console errors appear during Today -> Check-in -> session picker -> Sync button interactions.
- The selected session remains selected after reload.

## Self-Review Checklist

- Spec coverage:
  - P1 Phantom session log: Task 2.
  - P1 Coach E2E: Task 7.
  - P2 manual session selection plus reload persistence: Task 3.
  - P2 "zuletzt dabei" players from previous session: Task 4.
  - P2 offline smoke: Task 7.
  - P2 visible save/sync errors: Task 5.
  - P2 traffic-light audit plus direct mapper tests: Task 6.
  - P3 Life-Flag normalization: Task 1.

- MVP check:
  - No custom backend.
  - No Edge Functions.
  - No Realtime.
  - No player accounts.
  - No parser pipeline.
  - One additive migration is justified because otherwise iPad/iPhone cannot preserve manual Ampel metadata.
  - `localStorage` is used only for selected session preference, not for secrets or player data.

- Security check:
  - Existing RLS table is reused.
  - No new exposed table.
  - No `service_role`.
  - No real player data in tests; smoke player is clearly synthetic.
  - Supabase preflight and official-doc/changelog check happen before remote schema work.
  - Browser QA includes console check, iPad/mobile widths, and reload persistence.
