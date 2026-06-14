# Field Hub UX Interactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the Field Hub navigation, player-entry flow, save/selection feedback, and Check-in Ampel/Safety defaults so the app feels usable on iPad/iPhone without accidental preselected states.

**Architecture:** Keep the existing React/Vite/PWA architecture. Remove the bottom navigation pattern entirely, keep a persistent left sidebar on tablet/desktop, and use a left off-canvas drawer only on narrow phones. Implement interaction feedback as small shared utilities plus local visible feedback, without changing Supabase schema.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, CSS, Dexie/Supabase existing repositories.

---

## Research Notes

- NN/g reports that hidden navigation reduces discoverability and increases interaction cost; visible or partially visible navigation performs better, and desktop/tablet should not hide navigation when there is enough space. Source: https://www.nngroup.com/articles/hamburger-menus/
- NN/g's mobile-navigation pattern summary says hamburger/drawer navigation can handle many options but is less discoverable; tab/bottom bars work best only for a small number of destinations. Source: https://www.nngroup.com/articles/mobile-navigation-patterns/
- WCAG 2.2 target-size guidance recommends controls that are easy to activate and notes that sufficient size/spacing reduces accidental activation on touch devices. Source: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html

## Product Decision

I do not recommend a bottom bar that appears/disappears on scroll. It is harder to discover, hard to make stable with eight destinations, and the current app already has overflow risk there. Recommended implementation:

- iPad/desktop: persistent left sidebar with all eight destinations visible.
- iPhone/narrow screens: a top-left menu button opens a left-side drawer with the same vertical navigation. Drawer closes on tab selection, backdrop tap, or Escape.
- No bottom navigation.

## File Map

- Modify `app/field-hub/src/components/AppShell.tsx`: remove bottom tab markup, add mobile drawer state, menu button, drawer close behavior.
- Modify `app/field-hub/src/components/AppShell.test.tsx`: test no bottom nav, mobile drawer controls exist, tab-specific title remains.
- Modify `app/field-hub/src/components/PlayersView.tsx`: make Kader list the default full-width state, keep editor as sheet only, add persistent save notice and submit guard.
- Create `app/field-hub/src/lib/interactionFeedback.ts`: safe haptic feedback helper.
- Create `app/field-hub/src/lib/interactionFeedback.test.ts`: verify haptic helper is safe and calls `navigator.vibrate` only when available.
- Modify `app/field-hub/src/hooks/useCheckIns.ts`: return an explicit success boolean from `saveEntry` so button feedback cannot show false success after local save errors.
- Modify `app/field-hub/src/lib/checkInRepository.ts`: serialize concurrent local check-in saves per player/session so duplicate entries are not created by fast repeated actions.
- Modify `app/field-hub/src/lib/checkInRepository.test.ts`: cover concurrent check-in save dedupe.
- Modify `app/field-hub/src/components/CheckInView.tsx`: add local per-row action feedback, remove visual preselection for automatic Ampel suggestions, make Safety `none` neutral.
- Modify `app/field-hub/src/components/CheckInView.test.tsx`: assert auto Ampel is suggestion-only and Safety none is not danger-active.
- Modify `app/field-hub/src/index.css`: remove bottom-bar CSS, add drawer/sidebar responsive CSS, make player list full-width, add action-feedback styles.
- Update `app/field-hub/UX_INTERACTION_AUDIT_2026-06-14.md`: append implementation status after changes.
- Update `docs/08_next_session_handover.md`: record UX/navigation/save-state decisions and the remaining PWA update-control risk for future Codex sessions.

## Task 1: Navigation Reset To Left Sidebar/Drawer

**Files:**
- Modify: `app/field-hub/src/components/AppShell.tsx`
- Modify: `app/field-hub/src/components/AppShell.test.tsx`
- Modify: `app/field-hub/src/index.css`

- [x] **Step 1: Write failing AppShell navigation tests**

Add tests that render `AppShell` and expect:

```ts
expect(markup).toContain('aria-label="Navigation oeffnen"')
expect(markup).toContain('aria-controls="app-sidebar"')
expect(markup).not.toContain('bottom-tab-bar')
expect(markup).toContain('Hauptnavigation')
```

- [x] **Step 2: Verify tests fail**

Run:

```bash
npm test -- src/components/AppShell.test.tsx
```

Expected: failure because current markup still renders `.bottom-tab-bar` and has no menu button.

- [x] **Step 3: Implement navigation markup**

Change `AppShell.tsx` to:

- import `Menu` and `X` from `lucide-react`
- add `isNavigationOpen` state
- close drawer on tab change, backdrop click, and Escape
- remove `<div className="bottom-tab-bar">`
- add top-left `.mobile-menu-button`
- give sidebar `id="app-sidebar"` and `className={isNavigationOpen ? 'sidebar sidebar-open' : 'sidebar'}`
- render a `.sidebar-backdrop` only when open

- [x] **Step 4: Implement responsive CSS**

Change `index.css`:

- remove `.bottom-tab-bar` rules and mobile bottom padding
- add `.mobile-menu-button { display:none; }`
- keep `.app-shell` two-column above `760px`
- below `760px`, make sidebar `position: fixed; transform: translateX(-110%);`
- `.sidebar.sidebar-open { transform: translateX(0); }`
- `.sidebar-backdrop` covers screen below `760px`
- keep nav labels visible in the drawer

- [x] **Step 5: Verify**

Run:

```bash
npm test -- src/components/AppShell.test.tsx
```

Expected: pass.

## Task 2: Player Screen List-First And Visible Save Result

**Files:**
- Modify: `app/field-hub/src/components/PlayersView.tsx`
- Modify: `app/field-hub/src/index.css`

- [x] **Step 1: Add or extend a PlayersView rendering test**

If no PlayersView test exists, create `src/components/PlayersView.test.tsx`. Test that signed-in markup:

```ts
expect(markup).toContain('Spielerliste')
expect(markup).not.toContain('Spieler auswaehlen oder neu anlegen')
```

- [x] **Step 2: Verify test fails**

Run:

```bash
npm test -- src/components/PlayersView.test.tsx
```

Expected: failure because the empty detail panel currently renders.

- [x] **Step 3: Remove default empty detail panel**

Change `PlayersView.tsx` so `player-empty-detail` is not rendered. The `Neu` button in the toolbar remains the entry point.

- [x] **Step 4: Add visible save notice and submit guard**

Add:

```ts
const [viewNotice, setViewNotice] = useState<string | null>(null)
const [isSubmitting, setIsSubmitting] = useState(false)
```

Use `viewNotice` in the main player sidebar/header area with `aria-live="polite"`. Disable Save while submitting and keep the notice visible after the sheet closes.

- [x] **Step 5: Update player CSS**

Make `.players-layout` single-column/list-first by default and `.player-list` a responsive grid with no forced internal scroll.

- [x] **Step 6: Verify**

Run:

```bash
npm test -- src/components/PlayersView.test.tsx
```

Expected: pass.

## Task 3: Shared Haptic/Interaction Feedback Utility

**Files:**
- Create: `app/field-hub/src/lib/interactionFeedback.ts`
- Create: `app/field-hub/src/lib/interactionFeedback.test.ts`

- [x] **Step 1: Write failing tests**

Test:

```ts
expect(triggerHapticFeedback('selection', { vibrate: vi.fn() })).toBe(true)
expect(triggerHapticFeedback('selection', {})).toBe(false)
```

- [x] **Step 2: Verify tests fail**

Run:

```bash
npm test -- src/lib/interactionFeedback.test.ts
```

Expected: module missing.

- [x] **Step 3: Implement utility**

Create:

```ts
export type HapticFeedbackKind = 'selection' | 'success' | 'warning'

const patterns: Record<HapticFeedbackKind, number | number[]> = {
  selection: 8,
  success: [8, 24, 12],
  warning: [18, 36, 18],
}

export function triggerHapticFeedback(
  kind: HapticFeedbackKind,
  target: Pick<Navigator, 'vibrate'> | undefined = typeof navigator === 'undefined' ? undefined : navigator,
) {
  if (!target || typeof target.vibrate !== 'function') {
    return false
  }

  return target.vibrate(patterns[kind])
}
```

- [x] **Step 4: Verify**

Run:

```bash
npm test -- src/lib/interactionFeedback.test.ts
```

Expected: pass.

## Task 4: Check-in Ampel/Safety Visual State And Per-Row Feedback

**Files:**
- Modify: `app/field-hub/src/components/CheckInView.tsx`
- Modify: `app/field-hub/src/components/CheckInView.test.tsx`
- Modify: `app/field-hub/src/hooks/useCheckIns.ts`
- Modify: `app/field-hub/src/lib/checkInRepository.ts`
- Modify: `app/field-hub/src/lib/checkInRepository.test.ts`
- Modify: `app/field-hub/src/index.css`

- [x] **Step 1: Write failing tests**

Add tests that render one active player with an automatic green suggestion:

```ts
expect(markup).toContain('Vorschlag')
expect(markup).not.toContain('traffic-chip green active')
```

And with `redFlag: 'none'`:

```ts
expect(markup).not.toContain('Keine Red Flag</button>')
expect(markup).not.toContain('segmented active danger')
```

- [x] **Step 2: Verify tests fail**

Run:

```bash
npm test -- src/components/CheckInView.test.tsx
```

Expected: failure because current markup marks auto Ampel active and Safety none as active danger.

- [x] **Step 3: Implement visual-state fix**

In `CheckInPlayerRow`:

- traffic chip gets `active` only when `entry.trafficLightWasManual && entry.trafficLight === trafficLight`
- Safety `none` never gets `danger`; only real red flags get `danger active`
- keep row border based on suggestion/current traffic signal

- [x] **Step 4: Implement per-row feedback**

In `CheckInPlayerRow`:

- add local `feedbackText`
- wrap click handlers in async helper that sets "Speichert..." then "Gespeichert"
- call `triggerHapticFeedback('selection')`
- render `<p className="action-feedback" aria-live="polite">...</p>`

- [x] **Step 5: Verify**

Run:

```bash
npm test -- src/components/CheckInView.test.tsx
```

Expected: pass.

## Task 5: Broad Verification And Visual QA

**Files:**
- Modify: `app/field-hub/UX_INTERACTION_AUDIT_2026-06-14.md`

- [x] **Step 1: Run static checks**

Run:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Expected: all pass.

- [x] **Step 2: Browser QA**

Start Vite and inspect:

- desktop/iPad width: left sidebar visible, no bottom bar
- iPhone width: menu button opens left drawer, drawer closes after tab click
- Spieler: no default right form panel; list gets the screen
- Check-in: auto Ampel shows as suggestion, not active Coach selection
- Safety: "Keine Red Flag" not danger-active

- [x] **Step 3: Update audit status**

Append a short "Umsetzungsstatus" section to `UX_INTERACTION_AUDIT_2026-06-14.md` with implemented items, known remaining limitations, and test commands.
