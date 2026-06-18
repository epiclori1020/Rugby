// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const publicRouteState = vi.hoisted(() => ({
  nextMountId: 0,
  authState: { status: 'signed-out' as 'signed-out' | 'signed-in', user: { id: 'user-1' } },
  lastKioskProps: null as null | {
    players: Array<Record<string, unknown>>
    onSubmitKioskEntry?: (input: {
      playerId: string
      readiness: number
      lifeFlag: string
      painScore: number
      painLocation: string
      returnerFlag: 'nein' | 'ja' | 'offen'
      sessionReaction: 'none' | 'new_or_worse' | 'unsure'
      playerNote: string
    }) => Promise<unknown>
    onExit?: () => void
  },
  saveKioskEntry: vi.fn(async () => ({ ok: true as const })),
  signOutCoach: vi.fn(async () => undefined),
}))

const syncOverview = {
  isOnline: true,
  status: 'synced' as const,
  pendingCount: 0,
  lastSuccessfulSyncAt: null,
  errorMessage: null,
}

const syncRepositoryMocks = vi.hoisted(() => ({
  syncAllUserData: vi.fn(async () => ({
    isOnline: true,
    status: 'synced' as const,
    pendingCount: 0,
    lastSuccessfulSyncAt: null,
    errorMessage: null,
  })),
}))

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [false],
    updateServiceWorker: vi.fn(),
  }),
}))

vi.mock('./components/AppShell', async () => {
  const React = await import('react')
  return {
    AppShell: ({
      children,
      onTabChange,
    }: {
      children: React.ReactNode
      onTabChange: (tab: 'einstellungen') => void
    }) =>
      React.createElement(
        'div',
        { 'data-testid': 'coach-app' },
        React.createElement(
          'button',
          { type: 'button', 'data-testid': 'open-settings', onClick: () => onTabChange('einstellungen') },
          'Settings',
        ),
        children,
      ),
  }
})

vi.mock('./components/TodayDashboard', async () => {
  const React = await import('react')
  return {
    TodayDashboard: ({ selectedSessionId }: { selectedSessionId: string }) =>
      React.createElement('div', { 'data-testid': 'today-dashboard', 'data-selected-session-id': selectedSessionId }, 'Heute'),
  }
})

vi.mock('./components/PublicCheckInView', async () => {
  const React = await import('react')
  return {
    PublicCheckInView: ({ token }: { token: string }) => {
      const [mountId] = React.useState(() => {
        publicRouteState.nextMountId += 1
        return publicRouteState.nextMountId
      })

      return React.createElement(
        'div',
        { 'data-testid': 'public-checkin-view', 'data-mount-id': mountId, 'data-token': token },
        token,
      )
    },
  }
})

vi.mock('./components/CheckInView', async () => {
  const React = await import('react')
  return { CheckInView: () => React.createElement('div') }
})

vi.mock('./components/KioskCheckInView', async () => {
  const React = await import('react')
  return {
    KioskCheckInView: (props: {
      players: Array<Record<string, unknown>>
      onSubmitKioskEntry?: (input: {
        playerId: string
        readiness: number
        lifeFlag: string
        painScore: number
        painLocation: string
        returnerFlag: 'nein' | 'ja' | 'offen'
        sessionReaction: 'none' | 'new_or_worse' | 'unsure'
        playerNote: string
      }) => Promise<unknown>
      onExit?: () => void
    }) => {
      publicRouteState.lastKioskProps = props
      return React.createElement(
        'div',
        { 'data-testid': 'kiosk-view' },
        'Training Check-in',
        React.createElement('button', { type: 'button', onClick: () => props.onExit?.() }, 'Kiosk beenden'),
      )
    },
  }
})

vi.mock('./components/ExportView', async () => {
  const React = await import('react')
  return { ExportView: () => React.createElement('div') }
})

vi.mock('./components/LibraryView', async () => {
  const React = await import('react')
  return { LibraryView: () => React.createElement('div') }
})

vi.mock('./components/PostSessionView', async () => {
  const React = await import('react')
  return { PostSessionView: () => React.createElement('div') }
})

vi.mock('./components/PwaUpdateNotice', async () => {
  const React = await import('react')
  return { PwaUpdateNotice: () => React.createElement('div') }
})

vi.mock('./components/PlayersView', async () => {
  const React = await import('react')
  return { PlayersView: () => React.createElement('div') }
})

vi.mock('./components/ReturnerView', async () => {
  const React = await import('react')
  return { ReturnerView: () => React.createElement('div') }
})

vi.mock('./components/SettingsView', async () => {
  const React = await import('react')
  return {
    SettingsView: ({ onManualSync }: { onManualSync: () => Promise<void> }) =>
      React.createElement(
        'button',
        { type: 'button', 'data-testid': 'manual-sync', onClick: onManualSync },
        'Jetzt synchronisieren',
      ),
  }
})

vi.mock('./components/TrainingView', async () => {
  const React = await import('react')
  return { TrainingView: () => React.createElement('div') }
})

vi.mock('./content/sessions', () => {
  const staleSession = {
    id: 'session-stale',
    date: '2026-06-16',
    kw: 'KW25',
    title: 'Dienstag',
    type: 'training',
    summary: '',
    primarySource: '',
    pdfRefs: [],
    goals: [],
    timeline: [],
    materials: [],
    safetyNotes: [],
    coachNotes: [],
    libraryRefs: [],
  }
  const session = {
    ...staleSession,
    id: 'session-current',
    date: '2026-06-18',
    title: 'Donnerstag',
  }

  return {
    getRelevantSessions: () => ({ featuredSession: session, upcomingSessions: [] }),
    sessionDefinitions: [staleSession, session],
  }
})

vi.mock('./domain/backupReminder', () => ({
  shouldShowBackupReminder: () => false,
}))

vi.mock('./hooks/useAuthSession', () => ({
  useAuthSession: () =>
    publicRouteState.authState.status === 'signed-in'
      ? { status: 'signed-in', user: publicRouteState.authState.user, error: null }
      : { status: 'signed-out', error: null },
}))

vi.mock('./hooks/useBaselines', () => ({
  useBaselines: () => ({ syncOverview, refreshBaselines: vi.fn(async () => undefined) }),
}))

vi.mock('./hooks/useCheckIns', () => ({
  useCheckIns: () => ({
    activePlayers: [],
    entries: [],
    errorMessage: null,
    expectedPlayerIds: [],
    observations: [],
    warnings: [],
    syncOverview,
    isLoading: false,
    sessionLogId: null,
    publicCheckInLinks: [],
    publicCheckInSubmissions: [],
    publicCheckInNotice: null,
    refreshLocalCheckIns: vi.fn(async () => undefined),
    saveKioskEntry: publicRouteState.saveKioskEntry,
  }),
}))

vi.mock('./hooks/usePlayers', () => ({
  usePlayers: () => ({
    players: [
      {
        id: 'player-1',
        userId: 'user-1',
        name: 'Max Muster',
        position: 'Back Row',
        cluster: 'back_row',
        active: true,
        consentStatus: 'vorhanden',
        photoConsentStatus: 'not_asked',
        photoPath: null,
        photoUpdatedAt: null,
        returnerStatus: 'nein',
        notes: '',
        createdAt: '2026-06-16T18:00:00.000Z',
        updatedAt: '2026-06-16T18:00:00.000Z',
        deletedAt: null,
        clientUpdatedAt: '2026-06-16T18:00:00.000Z',
        syncStatus: 'synced',
        syncError: null,
      },
      {
        id: 'player-inactive',
        userId: 'user-1',
        name: 'Inactive Player',
        position: 'Lock',
        cluster: 'locks',
        active: false,
        consentStatus: 'vorhanden',
        photoConsentStatus: 'not_asked',
        photoPath: null,
        photoUpdatedAt: null,
        returnerStatus: 'nein',
        notes: 'private inactive notes',
        createdAt: '2026-06-16T18:00:00.000Z',
        updatedAt: '2026-06-16T18:00:00.000Z',
        deletedAt: null,
        clientUpdatedAt: '2026-06-16T18:00:00.000Z',
        syncStatus: 'synced',
        syncError: null,
      },
    ],
    syncOverview,
    isLoading: false,
    refreshLocalPlayers: vi.fn(async () => undefined),
  }),
}))

vi.mock('./hooks/usePostSession', () => ({
  usePostSession: () => ({ refreshPostSession: vi.fn(async () => undefined) }),
}))

vi.mock('./hooks/useReturners', () => ({
  useReturners: () => ({ returnerCaps: [], syncOverview, refreshReturners: vi.fn(async () => undefined) }),
}))

vi.mock('./hooks/useStoragePersistence', () => ({
  useStoragePersistence: () => ({ status: 'persisted' }),
}))

vi.mock('./lib/backupRepository', () => ({
  getLastExportAt: vi.fn(async () => null),
  getLatestCompletedSession: vi.fn(async () => null),
}))

vi.mock('./lib/backgroundSync', () => ({
  flushBackgroundSyncs: vi.fn(async () => undefined),
}))

vi.mock('./lib/auth', () => ({
  signOutCoach: publicRouteState.signOutCoach,
}))

vi.mock('./lib/syncRepository', () => ({
  buildManualSyncFeedback: () => ({ kind: 'success', message: 'Synchronisiert.' }),
  combineSyncOverviews: () => syncOverview,
  syncAllUserData: syncRepositoryMocks.syncAllUserData,
}))

async function renderApp() {
  const container = document.createElement('div')
  const root = createRoot(container)

  await act(async () => {
    root.render(<App />)
  })

  return { container, root }
}

async function dispatchHashChange(hash: string) {
  window.location.hash = hash
  await act(async () => {
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
}

async function dispatchPopState(path: string) {
  window.history.pushState(null, '', path)
  await act(async () => {
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
}

describe('App public check-in routing', () => {
  let root: Root | null = null

  beforeEach(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-18T12:00:00.000+02:00'))
    publicRouteState.nextMountId = 0
    publicRouteState.authState.status = 'signed-out'
    publicRouteState.lastKioskProps = null
    publicRouteState.saveKioskEntry.mockClear()
    publicRouteState.signOutCoach.mockClear()
    syncRepositoryMocks.syncAllUserData.mockClear()
    window.history.replaceState(null, '', '/')
    window.localStorage.clear()
  })

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount()
      })
      root = null
    }
    vi.useRealTimers()
  })

  it('switches between coach app and public check-in when the hash changes', async () => {
    const rendered = await renderApp()
    root = rendered.root

    expect(rendered.container.querySelector('[data-testid="coach-app"]')).not.toBeNull()
    expect(rendered.container.querySelector('[data-testid="public-checkin-view"]')).toBeNull()

    await dispatchHashChange('#/checkin/token-a')
    const publicViewA = rendered.container.querySelector<HTMLElement>('[data-testid="public-checkin-view"]')
    expect(publicViewA?.dataset.token).toBe('token-a')
    expect(publicViewA?.dataset.mountId).toBe('1')

    await dispatchHashChange('#/checkin/token-b')
    const publicViewB = rendered.container.querySelector<HTMLElement>('[data-testid="public-checkin-view"]')
    expect(publicViewB?.dataset.token).toBe('token-b')
    expect(publicViewB?.dataset.mountId).toBe('2')

    await dispatchHashChange('#/anderer-hash')
    expect(rendered.container.querySelector('[data-testid="coach-app"]')).not.toBeNull()
    expect(rendered.container.querySelector('[data-testid="public-checkin-view"]')).toBeNull()
  })

  it('updates the public check-in route on browser popstate navigation', async () => {
    const rendered = await renderApp()
    root = rendered.root

    await dispatchPopState('/#/checkin/token-pop')

    const publicView = rendered.container.querySelector<HTMLElement>('[data-testid="public-checkin-view"]')
    expect(publicView?.dataset.token).toBe('token-pop')
  })

  it('restores the signed-in kiosk mode from local storage', async () => {
    publicRouteState.authState.status = 'signed-in'
    window.localStorage.setItem('fieldHub:kioskSessionId', 'session-current')

    const rendered = await renderApp()
    root = rendered.root

    expect(rendered.container.querySelector('[data-testid="coach-app"]')).toBeNull()
    expect(rendered.container.textContent).toContain('Training Check-in')
  })

  it('does not restore an old kiosk session and removes the kiosk key', async () => {
    publicRouteState.authState.status = 'signed-in'
    window.localStorage.setItem('fieldHub:kioskSessionId', 'session-stale')
    window.localStorage.setItem('fieldHub:selectedSessionId', 'session-stale')

    const rendered = await renderApp()
    root = rendered.root

    expect(rendered.container.querySelector('[data-testid="coach-app"]')).not.toBeNull()
    expect(rendered.container.querySelector('[data-testid="kiosk-view"]')).toBeNull()
    expect(window.localStorage.getItem('fieldHub:kioskSessionId')).toBeNull()
    expect(rendered.container.querySelector<HTMLElement>('[data-testid="today-dashboard"]')?.dataset.selectedSessionId).toBe(
      'session-current',
    )
  })

  it('passes only minimal active player options into kiosk mode', async () => {
    publicRouteState.authState.status = 'signed-in'
    window.localStorage.setItem('fieldHub:kioskSessionId', 'session-current')

    const rendered = await renderApp()
    root = rendered.root

    expect(publicRouteState.lastKioskProps?.players).toEqual([{ id: 'player-1', displayName: 'Max Muster' }])
    expect(publicRouteState.lastKioskProps?.players[0]).not.toHaveProperty('name')
    expect(publicRouteState.lastKioskProps?.players[0]).not.toHaveProperty('notes')
  })

  it('exits kiosk mode without signing out the coach', async () => {
    publicRouteState.authState.status = 'signed-in'
    window.localStorage.setItem('fieldHub:kioskSessionId', 'session-current')

    const rendered = await renderApp()
    root = rendered.root

    await act(async () => {
      Array.from(rendered.container.querySelectorAll<HTMLButtonElement>('button'))
        .find((button) => button.textContent === 'Kiosk beenden')
        ?.click()
    })

    expect(publicRouteState.signOutCoach).not.toHaveBeenCalled()
    expect(window.localStorage.getItem('fieldHub:kioskSessionId')).toBeNull()
    expect(rendered.container.querySelector('[data-testid="coach-app"]')).not.toBeNull()
  })

  it('resolves the full active player only when kiosk submits', async () => {
    publicRouteState.authState.status = 'signed-in'
    window.localStorage.setItem('fieldHub:kioskSessionId', 'session-current')

    const rendered = await renderApp()
    root = rendered.root

    await act(async () => {
      await publicRouteState.lastKioskProps?.onSubmitKioskEntry?.({
        playerId: 'player-1',
        readiness: 4,
        lifeFlag: 'Stress',
        painScore: 1,
        painLocation: 'Kopf/Nacken',
        returnerFlag: 'nein',
        sessionReaction: 'none',
        playerNote: 'direkt von Arbeit',
      })
    })

    expect(publicRouteState.saveKioskEntry).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'player-1', name: 'Max Muster' }),
      {
        present: true,
        readiness: 4,
        lifeFlag: 'Stress',
        painScore: 1,
        painLocation: 'Kopf/Nacken',
        returnerFlag: 'nein',
        sessionReaction: 'none',
        redFlag: 'head_neck_neuro',
        playerNote: 'direkt von Arbeit',
      },
    )
  })

  it('does not save kiosk submissions for inactive players', async () => {
    publicRouteState.authState.status = 'signed-in'
    window.localStorage.setItem('fieldHub:kioskSessionId', 'session-current')

    const rendered = await renderApp()
    root = rendered.root

    await expect(
      publicRouteState.lastKioskProps?.onSubmitKioskEntry?.({
        playerId: 'player-inactive',
        readiness: 4,
        lifeFlag: '',
        painScore: 0,
        painLocation: '',
        returnerFlag: 'nein',
        sessionReaction: 'none',
        playerNote: '',
      }),
    ).rejects.toThrow('Spieler nicht gefunden.')
    expect(publicRouteState.saveKioskEntry).not.toHaveBeenCalled()
  })

  it('passes the selected session into manual sync for public check-in import', async () => {
    publicRouteState.authState.status = 'signed-in'

    const rendered = await renderApp()
    root = rendered.root

    await act(async () => {
      rendered.container.querySelector<HTMLButtonElement>('[data-testid="open-settings"]')?.click()
    })
    await act(async () => {
      rendered.container.querySelector<HTMLButtonElement>('[data-testid="manual-sync"]')?.click()
      await Promise.resolve()
    })

    expect(syncRepositoryMocks.syncAllUserData).toHaveBeenCalledWith('user-1', {
      publicSessionDefinition: expect.objectContaining({ id: 'session-current' }),
    })
  })
})
