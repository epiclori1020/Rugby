// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const publicRouteState = vi.hoisted(() => ({
  nextMountId: 0,
}))

const syncOverview = {
  isOnline: true,
  status: 'synced' as const,
  pendingCount: 0,
  lastSuccessfulSyncAt: null,
  errorMessage: null,
}

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [false],
    updateServiceWorker: vi.fn(),
  }),
}))

vi.mock('./components/AppShell', async () => {
  const React = await import('react')
  return {
    AppShell: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'coach-app' }, children),
  }
})

vi.mock('./components/TodayDashboard', async () => {
  const React = await import('react')
  return {
    TodayDashboard: () => React.createElement('div', { 'data-testid': 'today-dashboard' }, 'Heute'),
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
  return { SettingsView: () => React.createElement('div') }
})

vi.mock('./components/TrainingView', async () => {
  const React = await import('react')
  return { TrainingView: () => React.createElement('div') }
})

vi.mock('./content/sessions', () => {
  const session = {
    id: 'session-1',
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

  return {
    getRelevantSessions: () => ({ featuredSession: session, upcomingSessions: [] }),
    sessionDefinitions: [session],
  }
})

vi.mock('./domain/backupReminder', () => ({
  shouldShowBackupReminder: () => false,
}))

vi.mock('./hooks/useAuthSession', () => ({
  useAuthSession: () => ({ status: 'signed-out', error: null }),
}))

vi.mock('./hooks/useBaselines', () => ({
  useBaselines: () => ({ syncOverview, refreshBaselines: vi.fn(async () => undefined) }),
}))

vi.mock('./hooks/useCheckIns', () => ({
  useCheckIns: () => ({
    activePlayers: [],
    entries: [],
    expectedPlayerIds: [],
    observations: [],
    warnings: [],
    syncOverview,
    isLoading: false,
    publicCheckInLinks: [],
    publicCheckInSubmissions: [],
    publicCheckInNotice: null,
    refreshLocalCheckIns: vi.fn(async () => undefined),
  }),
}))

vi.mock('./hooks/usePlayers', () => ({
  usePlayers: () => ({
    players: [],
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

vi.mock('./lib/syncRepository', () => ({
  buildManualSyncFeedback: () => ({ kind: 'success', message: 'Synchronisiert.' }),
  combineSyncOverviews: () => syncOverview,
  syncAllUserData: vi.fn(async () => syncOverview),
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
    publicRouteState.nextMountId = 0
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
})
