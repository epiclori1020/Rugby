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

function renderBadge(playerSync: PlayerSyncOverview, syncNotice: string | null = null) {
  return renderToStaticMarkup(
    createElement(SyncStatusBadge, {
      authState: signedInAuthState,
      isManualSyncing: false,
      onManualSync: () => undefined,
      playerSync,
      syncNotice,
    }),
  )
}

describe('SyncStatusBadge copy', () => {
  it('uses coach-facing sync language instead of implementation terms', () => {
    const markup = renderBadge({
      isOnline: true,
      status: 'pending',
      pendingCount: 2,
      lastSuccessfulSyncAt: null,
      errorMessage: null,
    })

    expect(markup).toContain('Online · Aenderungen offen')
    expect(markup).toContain('Bei Unterschieden zwischen Geraeten zaehlt die zuletzt gespeicherte Version.')
    expect(markup).not.toContain('client_updated_at')
    expect(markup).not.toContain('last-write-wins')
    expect(markup).not.toContain('Konflikt-MVP')
  })

  it('renders manual sync success feedback when provided', () => {
    const markup = renderBadge(
      {
        isOnline: true,
        status: 'synced',
        pendingCount: 0,
        lastSuccessfulSyncAt: null,
        errorMessage: null,
      },
      'Synchronisiert.',
    )

    expect(markup).toContain('Synchronisiert.')
  })
})
