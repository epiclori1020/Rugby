import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { PlayerSyncOverview } from '../domain/sync'
import type { AuthSessionState } from '../lib/auth'
import { SyncStatusBadge } from './SyncStatusBadge'

const signedInAuthState = {
  status: 'signed-in',
  session: { user: { id: 'user-1', email: 'coach@example.com' } },
  user: { id: 'user-1', email: 'coach@example.com' },
  error: null,
} as AuthSessionState

function renderBadge(playerSync: PlayerSyncOverview) {
  return renderToStaticMarkup(
    createElement(SyncStatusBadge, {
      authState: signedInAuthState,
      playerSync,
    }),
  )
}

describe('SyncStatusBadge copy', () => {
  it('uses coach-facing sync language in the global compact status', () => {
    const markup = renderBadge({
      isOnline: true,
      status: 'pending',
      pendingCount: 2,
      lastSuccessfulSyncAt: null,
      errorMessage: null,
    })

    expect(markup).toContain('wartet auf Sync')
    expect(markup).toContain('2 Aenderungen lokal gespeichert')
    expect(markup).not.toContain('client_updated_at')
    expect(markup).not.toContain('last-write-wins')
    expect(markup).not.toContain('Konflikt-MVP')
    expect(markup).not.toContain('Jetzt synchronisieren')
  })

  it('stays visible when everything is already synced', () => {
    const markup = renderBadge(
      {
        isOnline: true,
        status: 'synced',
        pendingCount: 0,
        lastSuccessfulSyncAt: '2026-06-18T20:00:00.000Z',
        errorMessage: null,
      },
    )

    expect(markup).toContain('synchronisiert')
    expect(markup).toContain('zuletzt synchronisiert')
  })
})
