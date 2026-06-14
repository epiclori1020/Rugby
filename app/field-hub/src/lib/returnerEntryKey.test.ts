import { describe, expect, it } from 'vitest'
import { returnerEntryKeyBase } from './returnerEntryKey'

// Guards the returner data-loss fix. The card's inputs are uncontrolled and keyed by this
// base; the key must stay stable across re-renders for the same (player, session) so typed
// caps/notes are not dropped on a sync/isLoading re-render, but must change on session
// switch so the fields refresh instead of showing the previous session's values.
describe('returnerEntryKeyBase', () => {
  it('is stable across renders for the same player and session', () => {
    expect(returnerEntryKeyBase('player-1', 'kw25-di-2026-06-16')).toBe(
      returnerEntryKeyBase('player-1', 'kw25-di-2026-06-16'),
    )
  })

  it('changes when the session changes so fields refresh on session switch', () => {
    expect(returnerEntryKeyBase('player-1', 'kw25-di-2026-06-16')).not.toBe(
      returnerEntryKeyBase('player-1', 'kw25-do-2026-06-18'),
    )
  })

  it('differs per player', () => {
    expect(returnerEntryKeyBase('player-1', 'kw25-di-2026-06-16')).not.toBe(
      returnerEntryKeyBase('player-2', 'kw25-di-2026-06-16'),
    )
  })
})
