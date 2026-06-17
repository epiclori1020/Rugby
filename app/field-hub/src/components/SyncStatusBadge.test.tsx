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
  it('uses coach-facing sync language only when sync needs attention', () => {
    const markup = renderBadge({
      isOnline: true,
      status: 'pending',
      pendingCount: 2,
      lastSuccessfulSyncAt: null,
      errorMessage: null,
    })

    expect(markup).toContain('Online · Aenderungen offen')
    expect(markup).not.toContain('client_updated_at')
    expect(markup).not.toContain('last-write-wins')
    expect(markup).not.toContain('Konflikt-MVP')
    expect(markup).not.toContain('Jetzt synchronisieren')
  })

  it('does not render in the topbar when everything is already synced', () => {
    const markup = renderBadge(
      {
        isOnline: true,
        status: 'synced',
        pendingCount: 0,
        lastSuccessfulSyncAt: null,
        errorMessage: null,
      },
    )

    expect(markup).toBe('')
  })
})
