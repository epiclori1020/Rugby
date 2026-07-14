// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const publicRouteState = vi.hoisted(() => ({
  nextMountId: 0,
  authState: { status: 'signed-out' as 'signed-out' | 'signed-in', user: { id: 'user-1' } },
  lastKioskProps: null as null | {
    disabledReason?: string
    isCheckInDisabled?: boolean
    players: Array<Record<string, unknown>>
    onSubmitKioskEntry?: (input: {
      playerId: string
      readiness: number
      lifeFlag: string
      painScore: number
      painLocation: string
      sessionReaction: 'none' | 'new_or_worse' | 'unsure'
      playerNote: string
    }) => Promise<unknown>
    onExit?: () => void
  },
  lastReturnerProps: null as null | {
    focusedPlayer?: { id: string } | null
    onReturn?: () => void
  },
  lastPlayersProps: null as null | {
    initialDetailTab?: string
    initialSelectedPlayerId?: string | null
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
  const { routeKey, routes } = await import('./navigation')
  return {
    AppShell: ({
      activeRoute,
      children,
      onNavigate,
    }: {
      activeRoute: Parameters<typeof routeKey>[0]
      children: React.ReactNode
      onNavigate: (route: Parameters<typeof routeKey>[0]) => void
    }) =>
      React.createElement(
        'div',
        { 'data-testid': 'coach-app', 'data-active-route': routeKey(activeRoute) },
        React.createElement(
          'button',
          { type: 'button', 'data-testid': 'open-settings', onClick: () => onNavigate(routes.moreSettings) },
          'Settings',
        ),
        children,
      ),
  }
})

vi.mock('./components/TodayDashboard', async () => {
  const React = await import('react')
  return {
    TodayDashboard: ({ onOpenReturner, selectedSessionId }: { onOpenReturner?: (playerId: string) => void; selectedSessionId: string }) =>
      React.createElement(
        'div',
        { 'data-testid': 'today-dashboard', 'data-selected-session-id': selectedSessionId },
        'Heute',
        React.createElement('button', { type: 'button', 'data-testid': 'today-open-returner', onClick: () => onOpenReturner?.('player-1') }, 'Returner'),
      ),
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
  return { CheckInView: () => React.createElement('div', { 'data-testid': 'checkin-view' }) }
})

vi.mock('./components/KioskCheckInView', async () => {
  const React = await import('react')
  return {
    KioskCheckInView: (props: {
      disabledReason?: string
      isCheckInDisabled?: boolean
      players: Array<Record<string, unknown>>
      onSubmitKioskEntry?: (input: {
        playerId: string
        readiness: number
        lifeFlag: string
        painScore: number
        painLocation: string
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
        props.isCheckInDisabled ? React.createElement('p', { 'data-testid': 'kiosk-disabled-reason' }, props.disabledReason) : null,
        React.createElement('button', { type: 'button', onClick: () => props.onExit?.() }, 'Kiosk beenden'),
      )
    },
  }
})

vi.mock('./components/ExportView', async () => {
  const React = await import('react')
  return { ExportView: () => React.createElement('div', { 'data-testid': 'export-view' }) }
})

vi.mock('./components/LibraryView', async () => {
  const React = await import('react')
  return { LibraryView: () => React.createElement('div', { 'data-testid': 'library-view' }) }
})

vi.mock('./components/PostSessionView', async () => {
  const React = await import('react')
  return { PostSessionView: () => React.createElement('div', { 'data-testid': 'post-session-view' }) }
})

vi.mock('./components/PwaUpdateNotice', async () => {
  const React = await import('react')
  return { PwaUpdateNotice: () => React.createElement('div') }
})

vi.mock('./components/PlayersView', async () => {
  const React = await import('react')
  return {
    PlayersView: (props: {
      initialDetailTab?: string
      initialSelectedPlayerId?: string | null
      onOpenReturner?: (playerId: string) => void
    }) => {
      publicRouteState.lastPlayersProps = props
      return React.createElement(
        'div',
        { 'data-testid': 'players-view' },
        React.createElement(
          'button',
          { type: 'button', 'data-testid': 'players-open-returner', onClick: () => props.onOpenReturner?.('player-1') },
          'Returner',
        ),
      )
    },
  }
})

vi.mock('./components/ReturnerView', async () => {
  const React = await import('react')
  return {
    ReturnerView: (props: { focusedPlayer?: { id: string } | null; onReturn?: () => void }) => {
      publicRouteState.lastReturnerProps = props
      return React.createElement(
        'div',
        { 'data-testid': 'returner-view' },
        React.createElement('button', { type: 'button', 'data-testid': 'returner-return', onClick: props.onReturn }, 'Zurück'),
      )
    },
  }
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
  return { TrainingView: () => React.createElement('div', { 'data-testid': 'training-view' }) }
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

vi.mock('./hooks/useMetrics', () => ({
  useMetrics: () => ({
    entries: [],
    syncOverview,
    refreshMetrics: vi.fn(async () => undefined),
  }),
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

vi.mock('./hooks/useCoachInsights', () => ({
  useCoachInsights: () => ({
    insights: [],
    isLoading: false,
    refreshCoachInsights: vi.fn(async () => undefined),
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
  useReturners: () => ({
    activeReturnerPlayers: [],
    entries: [],
    returnerCaps: [],
    returnerTaskStates: [],
    syncOverview,
    refreshReturners: vi.fn(async () => undefined),
  }),
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
  getSyncDetailSummary: vi.fn(async () => ({
    groups: [],
    pendingCount: 0,
    errorCount: 0,
    conflictCount: 0,
  })),
  syncAllUserData: syncRepositoryMocks.syncAllUserData,
}))

vi.mock('./lib/publicCheckInRepository', () => ({
  getPublicCheckInSyncOverview: vi.fn(async () => syncOverview),
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

async function flushLazyScreens() {
  await act(async () => {
    await Promise.resolve()
  })
}

describe('App public check-in routing', () => {
  let root: Root | null = null

  beforeEach(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-18T12:00:00.000+02:00'))
    publicRouteState.nextMountId = 0
    publicRouteState.authState.status = 'signed-in'
    publicRouteState.lastKioskProps = null
    publicRouteState.lastPlayersProps = null
    publicRouteState.lastReturnerProps = null
    publicRouteState.saveKioskEntry.mockClear()
    publicRouteState.signOutCoach.mockClear()
    syncRepositoryMocks.syncAllUserData.mockClear()
    window.history.replaceState(null, '', '/')
    window.localStorage.clear()
    window.sessionStorage.clear()
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

  it('routes signed-out coach entry to the hidden branded welcome surface', async () => {
    publicRouteState.authState.status = 'signed-out'
    window.history.replaceState(null, '', '#/unit/training')
    const rendered = await renderApp()
    root = rendered.root

    expect(window.location.hash).toBe('#/welcome')
    expect(rendered.container.textContent).toContain('Trainingstag vorbereiten')
    expect(rendered.container.textContent).toContain('1. Login')
    expect(window.sessionStorage.getItem('fieldHub:intendedCoachRoute')).toBe('#/unit/training')
  })

  it('keeps later signed-out hash changes behind welcome and refreshes their canonical intent', async () => {
    publicRouteState.authState.status = 'signed-out'
    const rendered = await renderApp()
    root = rendered.root

    await dispatchHashChange('#/nachbereitung')

    expect(window.location.hash).toBe('#/welcome')
    expect(rendered.container.textContent).toContain('Trainingstag vorbereiten')
    expect(window.sessionStorage.getItem('fieldHub:intendedCoachRoute')).toBe('#/unit/post-session')
  })

  it('restores the intended coach route after login', async () => {
    publicRouteState.authState.status = 'signed-out'
    window.history.replaceState(null, '', '#/unit/training')
    const rendered = await renderApp()
    root = rendered.root

    publicRouteState.authState.status = 'signed-in'
    await act(async () => {
      root?.render(<App />)
    })

    expect(window.location.hash).toBe('#/unit/training')
    expect(rendered.container.querySelector<HTMLElement>('[data-testid="coach-app"]')?.dataset.activeRoute).toBe(
      'unit/training',
    )
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

  it('opens the coach app on the canonical initial hash route', async () => {
    window.history.replaceState(null, '', '/#/unit/training')

    const rendered = await renderApp()
    root = rendered.root
    await flushLazyScreens()

    const coachApp = rendered.container.querySelector<HTMLElement>('[data-testid="coach-app"]')
    expect(coachApp?.dataset.activeRoute).toBe('unit/training')
    expect(rendered.container.querySelector('[data-testid="training-view"]')).not.toBeNull()
    expect(window.location.hash).toBe('#/unit/training')
  })

  it('updates the active coach route when the hash changes', async () => {
    const rendered = await renderApp()
    root = rendered.root

    await dispatchHashChange('#/more/export')
    await flushLazyScreens()

    const coachApp = rendered.container.querySelector<HTMLElement>('[data-testid="coach-app"]')
    expect(coachApp?.dataset.activeRoute).toBe('more/export')
    expect(rendered.container.querySelector('[data-testid="export-view"]')).not.toBeNull()
  })

  it('updates the active coach route on browser popstate navigation', async () => {
    const rendered = await renderApp()
    root = rendered.root

    await dispatchPopState('/#/unit/post-session')
    await flushLazyScreens()

    const coachApp = rendered.container.querySelector<HTMLElement>('[data-testid="coach-app"]')
    expect(coachApp?.dataset.activeRoute).toBe('unit/post-session')
    expect(rendered.container.querySelector('[data-testid="post-session-view"]')).not.toBeNull()
  })

  it('normalizes legacy coach hashes without treating them as successful public routes', async () => {
    window.history.replaceState(null, '', '/#/nachbereitung')

    const rendered = await renderApp()
    root = rendered.root
    await flushLazyScreens()

    const coachApp = rendered.container.querySelector<HTMLElement>('[data-testid="coach-app"]')
    expect(coachApp?.dataset.activeRoute).toBe('unit/post-session')
    expect(window.location.hash).toBe('#/unit/post-session')
    expect(rendered.container.querySelector('[data-testid="public-checkin-view"]')).toBeNull()
  })

  it('pushes canonical coach hashes when navigating inside the shell', async () => {
    const rendered = await renderApp()
    root = rendered.root

    await act(async () => {
      rendered.container.querySelector<HTMLButtonElement>('[data-testid="open-settings"]')?.click()
    })
    await flushLazyScreens()

    const coachApp = rendered.container.querySelector<HTMLElement>('[data-testid="coach-app"]')
    expect(coachApp?.dataset.activeRoute).toBe('more/settings')
    expect(window.location.hash).toBe('#/more/settings')
  })

  it('keeps contextual Returner focus ephemeral and returns to its origin route', async () => {
    const rendered = await renderApp()
    root = rendered.root

    await act(async () => {
      rendered.container.querySelector<HTMLButtonElement>('[data-testid="today-open-returner"]')?.click()
    })
    await flushLazyScreens()

    const coachApp = rendered.container.querySelector<HTMLElement>('[data-testid="coach-app"]')
    expect(coachApp?.dataset.activeRoute).toBe('unit/returners')
    expect(window.location.hash).toBe('#/unit/returners')
    expect(publicRouteState.lastReturnerProps?.focusedPlayer?.id).toBe('player-1')

    await act(async () => {
      rendered.container.querySelector<HTMLButtonElement>('[data-testid="returner-return"]')?.click()
    })

    expect(coachApp?.dataset.activeRoute).toBe('today')
    expect(window.location.hash).toBe('#/today')
  })

  it('restores the selected player and Returner tab after returning to Players', async () => {
    const rendered = await renderApp()
    root = rendered.root

    await dispatchHashChange('#/players')
    await flushLazyScreens()
    await act(async () => {
      rendered.container.querySelector<HTMLButtonElement>('[data-testid="players-open-returner"]')?.click()
    })
    await flushLazyScreens()
    await act(async () => {
      rendered.container.querySelector<HTMLButtonElement>('[data-testid="returner-return"]')?.click()
    })

    expect(window.location.hash).toBe('#/players')
    expect(publicRouteState.lastPlayersProps?.initialSelectedPlayerId).toBe('player-1')
    expect(publicRouteState.lastPlayersProps?.initialDetailTab).toBe('returner')
  })

  it('restores the signed-in kiosk mode from local storage', async () => {
    publicRouteState.authState.status = 'signed-in'
    window.localStorage.setItem('fieldHub:kioskSessionId', 'session-current')

    const rendered = await renderApp()
    root = rendered.root

    expect(rendered.container.querySelector('[data-testid="coach-app"]')).toBeNull()
    expect(rendered.container.textContent).toContain('Training Check-in')
  })

  it('keeps coach routes locked behind kiosk mode while the lock is active', async () => {
    publicRouteState.authState.status = 'signed-in'
    window.history.replaceState(null, '', '/#/more/export')
    window.localStorage.setItem('fieldHub:kioskSessionId', 'session-current')

    const rendered = await renderApp()
    root = rendered.root

    expect(rendered.container.querySelector('[data-testid="kiosk-view"]')).not.toBeNull()
    expect(rendered.container.querySelector('[data-testid="coach-app"]')).toBeNull()

    await dispatchHashChange('#/analysis')
    await flushLazyScreens()

    expect(rendered.container.querySelector('[data-testid="kiosk-view"]')).not.toBeNull()
    expect(rendered.container.querySelector('[data-testid="coach-app"]')).toBeNull()

    await dispatchPopState('/#/more/settings')
    await flushLazyScreens()

    expect(rendered.container.querySelector('[data-testid="kiosk-view"]')).not.toBeNull()
    expect(rendered.container.querySelector('[data-testid="coach-app"]')).toBeNull()
  })

  it('keeps a restored kiosk lock fail-closed when the coach session is not signed in', async () => {
    publicRouteState.authState.status = 'signed-out'
    window.localStorage.setItem('fieldHub:kioskSessionId', 'session-current')

    const rendered = await renderApp()
    root = rendered.root

    expect(rendered.container.querySelector('[data-testid="kiosk-view"]')).not.toBeNull()
    expect(rendered.container.querySelector('[data-testid="coach-app"]')).toBeNull()
    expect(publicRouteState.lastKioskProps?.isCheckInDisabled).toBe(true)
    expect(rendered.container.textContent).toContain('Coach-Session prüfen')
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
