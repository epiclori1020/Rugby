import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { AppShell } from './components/AppShell'
import { CheckInView } from './components/CheckInView'
import { KioskCheckInView } from './components/KioskCheckInView'
import { PostSessionView } from './components/PostSessionView'
import { PublicCheckInView } from './components/PublicCheckInView'
import { PwaUpdateNotice } from './components/PwaUpdateNotice'
import { PlayersView } from './components/PlayersView'
import { SessionWorkspace } from './components/SessionWorkspace'
import type { SelfCheckInSubmissionInput } from './components/SelfCheckInFlow'
import { SyncStatusBadge } from './components/SyncStatusBadge'
import { TodayDashboard } from './components/TodayDashboard'
import { TrainingView } from './components/TrainingView'
import { getRelevantSessions, sessionDefinitions } from './content/sessions'
import type { LibraryCategory, PdfRef, SessionDefinition } from './content/types'
import { shouldShowBackupReminder } from './domain/backupReminder'
import { deriveRedFlagFromPainLocation, type CheckInEntryPatch, type SessionLog } from './domain/checkIn'
import type { CoachInsightSource } from './domain/coachInsights'
import type { PlayerAnalysisSource } from './domain/playerAnalysis'
import { derivePostSessionCompletion } from './domain/postSessionCompletion'
import type { PlayerSyncOverview, SyncDetailSummary } from './domain/sync'
import { defaultPlayerSyncOverview } from './domain/sync'
import { useAuthSession } from './hooks/useAuthSession'
import { useBaselines } from './hooks/useBaselines'
import { useCheckIns } from './hooks/useCheckIns'
import { useCoachInsights } from './hooks/useCoachInsights'
import { useExercises } from './hooks/useExercises'
import { useExposures } from './hooks/useExposures'
import { useMetrics } from './hooks/useMetrics'
import { usePlayers } from './hooks/usePlayers'
import { usePostSessionCompletionOverview } from './hooks/usePostSessionCompletionOverview'
import { usePostSession } from './hooks/usePostSession'
import { useReturners } from './hooks/useReturners'
import { useSessionBlocks } from './hooks/useSessionBlocks'
import { useStoragePersistence } from './hooks/useStoragePersistence'
import { getLastExportAt, getLatestCompletedSession } from './lib/backupRepository'
import { flushBackgroundSyncs } from './lib/backgroundSync'
import {
  clearKioskLock,
  readKioskLock,
  writeKioskLock,
} from './lib/kioskLock'
import { getPublicCheckInSyncOverview } from './lib/publicCheckInRepository'
import { publicSubmissionErrorMessage } from './lib/publicCheckInErrors'
import {
  buildManualSyncFeedback,
  combineSyncOverviews,
  getSyncDetailSummary,
  syncAllUserData,
  type ManualSyncFeedback,
} from './lib/syncRepository'
import {
  applyThemePreference,
  getStoredThemePreference,
  setStoredThemePreference,
  subscribeToSystemThemePreferenceChanges,
  themePreferenceStorageKey,
  type ThemePreference,
} from './lib/themePreference'
import {
  defaultRouteForSection,
  legacyTargetToRoute,
  parseHashRoute,
  routeForUnit,
  routeKey,
  routeToHash,
  routes,
  routesEqual,
  type AppRoute,
  type AppSection,
  type MoreRoute,
  type UnitRoute,
} from './navigation'

const AnalysisView = lazy(() =>
  import('./components/AnalysisView').then((module) => ({ default: module.AnalysisView })),
)
const ExportView = lazy(() => import('./components/ExportView').then((module) => ({ default: module.ExportView })))
const LibraryView = lazy(() =>
  import('./components/LibraryView').then((module) => ({ default: module.LibraryView })),
)
const ReturnerView = lazy(() =>
  import('./components/ReturnerView').then((module) => ({ default: module.ReturnerView })),
)
const SettingsView = lazy(() =>
  import('./components/SettingsView').then((module) => ({ default: module.SettingsView })),
)

const selectedSessionStorageKey = 'fieldHub:selectedSessionId'
type PwaDisplayMode = 'browser' | 'standalone'

type LazyScreenBoundaryProps = {
  children: ReactNode
  resetKey: string
  screenName: string
}

type LazyScreenBoundaryState = {
  hasError: boolean
}

export class LazyScreenBoundary extends Component<LazyScreenBoundaryProps, LazyScreenBoundaryState> {
  state: LazyScreenBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidUpdate(previousProps: LazyScreenBoundaryProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="screen-load-state screen-load-state-error" role="alert">
          <h3>{this.props.screenName} konnte nicht geladen werden.</h3>
          <p>App neu laden oder Verbindung prüfen.</p>
          <button className="secondary-action" type="button" onClick={() => window.location.reload()}>
            App neu laden
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

function ScreenLoadingFallback({ screenName }: { screenName: string }) {
  return (
    <div className="screen-load-state" role="status" aria-live="polite">
      <p>{screenName} wird geladen...</p>
    </div>
  )
}

function LazyScreen({ children, resetKey, screenName }: LazyScreenBoundaryProps) {
  return (
    <LazyScreenBoundary resetKey={resetKey} screenName={screenName}>
      <Suspense fallback={<ScreenLoadingFallback screenName={screenName} />}>{children}</Suspense>
    </LazyScreenBoundary>
  )
}

function toLocalDateKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function findSessionById(sessionId: string | null) {
  return sessionDefinitions.find((session) => session.id === sessionId) ?? null
}

function getPwaDisplayMode(): PwaDisplayMode {
  if (typeof window === 'undefined') {
    return 'browser'
  }

  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean }
  const isIosStandalone = navigatorWithStandalone.standalone === true
  const isDisplayModeStandalone =
    typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches

  return isIosStandalone || isDisplayModeStandalone ? 'standalone' : 'browser'
}

function usePwaDisplayMode() {
  const [displayMode, setDisplayMode] = useState<PwaDisplayMode>(getPwaDisplayMode)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined
    }

    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const legacyMediaQuery = mediaQuery as MediaQueryList & {
      addListener?: (listener: (event: MediaQueryListEvent) => void) => void
      removeListener?: (listener: (event: MediaQueryListEvent) => void) => void
    }
    const updateDisplayMode = () => setDisplayMode(getPwaDisplayMode())

    updateDisplayMode()
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateDisplayMode)

      return () => mediaQuery.removeEventListener('change', updateDisplayMode)
    }

    legacyMediaQuery.addListener?.(updateDisplayMode)

    return () => legacyMediaQuery.removeListener?.(updateDisplayMode)
  }, [])

  return displayMode
}

function isCurrentOrFutureSession(sessionId: string | null, todayKey = toLocalDateKey(new Date())) {
  const session = findSessionById(sessionId)
  return Boolean(session && session.date >= todayKey)
}

function getPublicCheckInTokenFromHash() {
  if (typeof window === 'undefined') {
    return null
  }

  const parsedRoute = parseHashRoute(window.location.hash)
  return parsedRoute.kind === 'public-check-in' ? parsedRoute.token : null
}

function getInitialCoachRoute() {
  if (typeof window === 'undefined') {
    return routes.today
  }

  const parsedRoute = parseHashRoute(window.location.hash)
  if (parsedRoute.kind === 'coach') {
    return parsedRoute.route
  }

  return routes.today
}

function getInitialSessionState(fallbackSessionId: string, todayKey = toLocalDateKey(new Date())) {
  if (typeof window === 'undefined') {
    return { selectedSessionId: fallbackSessionId, kioskSessionId: null }
  }

  const storedKioskSessionId = readKioskLock()?.sessionId ?? null
  const storedSelectedSessionId = window.localStorage.getItem(selectedSessionStorageKey)
  const storedKioskSession = findSessionById(storedKioskSessionId)
  const storedSelectedSession = findSessionById(storedSelectedSessionId)
  const kioskSessionIsCurrent = Boolean(storedKioskSession && isCurrentOrFutureSession(storedKioskSessionId, todayKey))
  const selectedSessionIsStaleKiosk =
    Boolean(storedKioskSessionId) && !kioskSessionIsCurrent && storedSelectedSessionId === storedKioskSessionId

  if (storedKioskSessionId && !kioskSessionIsCurrent) {
    clearKioskLock()
  }

  if (kioskSessionIsCurrent && storedKioskSessionId) {
    return { selectedSessionId: storedKioskSessionId, kioskSessionId: storedKioskSessionId }
  }

  return {
    selectedSessionId:
      !selectedSessionIsStaleKiosk && storedSelectedSession && storedSelectedSessionId
        ? storedSelectedSessionId
        : fallbackSessionId,
    kioskSessionId: null,
  }
}

function CoachApp() {
  const [activeRoute, setActiveRoute] = useState<AppRoute>(getInitialCoachRoute)
  const [themePreference, setThemePreference] = useState<ThemePreference>(getStoredThemePreference)
  const [rememberedUnitRoute, setRememberedUnitRoute] = useState<UnitRoute>(() => {
    const initialRoute = getInitialCoachRoute()
    return initialRoute.section === 'unit' ? initialRoute.unitRoute : 'check-in'
  })
  const [rememberedMoreRoute, setRememberedMoreRoute] = useState<MoreRoute>(() => {
    const initialRoute = getInitialCoachRoute()
    return initialRoute.section === 'more' ? initialRoute.moreRoute : 'library'
  })
  const [isManualSyncing, setIsManualSyncing] = useState(false)
  const [manualSyncFeedback, setManualSyncFeedback] = useState<ManualSyncFeedback | null>(null)
  const [libraryInitialPdfHref, setLibraryInitialPdfHref] = useState<string | undefined>(undefined)
  const [libraryInitialCategory, setLibraryInitialCategory] = useState<LibraryCategory | undefined>(undefined)
  const [libraryInitialItemId, setLibraryInitialItemId] = useState<string | undefined>(undefined)
  const [libraryReturnRoute, setLibraryReturnRoute] = useState<AppRoute | null>(null)
  const [transientNotice, setTransientNotice] = useState<string | null>(null)
  const [appTodayKey, setAppTodayKey] = useState(() => toLocalDateKey(new Date()))
  const {
    needRefresh: [needsAppRefresh],
    updateServiceWorker,
  } = useRegisterSW()
  const [lastExportAt, setLastExportAtState] = useState<string | null>(null)
  const [latestCompletedSession, setLatestCompletedSession] = useState<SessionLog | null>(null)
  const [publicSyncOverview, setPublicSyncOverview] = useState<PlayerSyncOverview | null>(null)
  const [syncDetails, setSyncDetails] = useState<SyncDetailSummary | null>(null)
  const storagePersistence = useStoragePersistence()
  const pwaDisplayMode = usePwaDisplayMode()
  const authState = useAuthSession()
  const playerActions = usePlayers(authState.status === 'signed-in' ? authState.user.id : null)
  const todayDate = useMemo(() => new Date(`${appTodayKey}T12:00:00`), [appTodayKey])
  const { featuredSession, upcomingSessions } = useMemo(() => getRelevantSessions(todayDate), [todayDate])
  const [initialSessionState] = useState(() => getInitialSessionState(featuredSession.id))
  const [activeKioskSessionId, setActiveKioskSessionId] = useState<string | null>(initialSessionState.kioskSessionId)
  const [selectedSessionId, setSelectedSessionId] = useState(initialSessionState.selectedSessionId)
  const selectedSession = sessionDefinitions.find((session) => session.id === selectedSessionId) ?? featuredSession
  const checkInActions = useCheckIns(
    authState.status === 'signed-in' ? authState.user.id : null,
    selectedSession,
    playerActions.players,
  )
  const postSessionActions = usePostSession(
    authState.status === 'signed-in' ? authState.user.id : null,
    selectedSession,
    playerActions.players,
  )
  const baselineActions = useBaselines(
    authState.status === 'signed-in' ? authState.user.id : null,
    selectedSession,
    playerActions.players,
  )
  const metricActions = useMetrics(
    authState.status === 'signed-in' ? authState.user.id : null,
    selectedSession,
    playerActions.players,
  )
  const exerciseActions = useExercises(
    authState.status === 'signed-in' ? authState.user.id : null,
    selectedSession,
    playerActions.players,
  )
  const returnerActions = useReturners(
    authState.status === 'signed-in' ? authState.user.id : null,
    selectedSession,
    playerActions.players,
    checkInActions.entries,
  )
  const sessionBlockActions = useSessionBlocks(authState.status === 'signed-in' ? authState.user.id : null, selectedSession)
  const exposureActions = useExposures(authState.status === 'signed-in' ? authState.user.id : null, selectedSession)
  const postSessionEntriesForOverview = postSessionActions.entries ?? []
  const progressEntriesForOverview = postSessionActions.progressEntries ?? []
  const baselineEntriesForOverview = baselineActions.entries ?? []
  const metricEntriesForOverview = metricActions.entries ?? []
  const returnerEntriesForInsights = returnerActions.entries ?? []
  const sessionBlockLogsForInsights = sessionBlockActions.blockLogs ?? []
  const exposureSummariesForInsights = exposureActions.summaries ?? []
  const activePlayers = useMemo(() => playerActions.players.filter((player) => player.active), [playerActions.players])
  const activeRouteKey = routeKey(activeRoute)
  const postSessionOverview = usePostSessionCompletionOverview({
    activePlayers,
    lastExportAt,
    refreshKey: [
      activeRouteKey,
      selectedSession.id,
      postSessionActions.sessionLog?.clientUpdatedAt ?? '',
      postSessionEntriesForOverview.map((entry) => entry.clientUpdatedAt).join('|'),
      progressEntriesForOverview.map((entry) => entry.clientUpdatedAt).join('|'),
      baselineEntriesForOverview.map((entry) => entry.clientUpdatedAt).join('|'),
      metricEntriesForOverview.map((entry) => entry.clientUpdatedAt).join('|'),
    ].join('::'),
    sessions: sessionDefinitions,
    todayKey: appTodayKey,
    userId: authState.status === 'signed-in' ? authState.user.id : null,
  })
  const userId = authState.status === 'signed-in' ? authState.user.id : null
  const syncOverview = useMemo(
    () =>
      combineSyncOverviews([
        playerActions.syncOverview,
        checkInActions.syncOverview,
        baselineActions.syncOverview,
        exerciseActions.syncOverview,
        metricActions.syncOverview,
        returnerActions.syncOverview,
        sessionBlockActions.syncOverview,
        exposureActions.syncOverview,
        userId && publicSyncOverview ? publicSyncOverview : defaultPlayerSyncOverview,
      ]),
    [
      baselineActions.syncOverview,
      checkInActions.syncOverview,
      exerciseActions.syncOverview,
      metricActions.syncOverview,
      playerActions.syncOverview,
      publicSyncOverview,
      returnerActions.syncOverview,
      sessionBlockActions.syncOverview,
      exposureActions.syncOverview,
      userId,
    ],
  )
  const coachInsightRefreshKey = [
    activeRouteKey,
    selectedSession.id,
    playerActions.players.map((player) => `${player.id}:${player.clientUpdatedAt}`).join('|'),
    checkInActions.entries.map((entry) => `${entry.id}:${entry.clientUpdatedAt}`).join('|'),
    postSessionEntriesForOverview.map((entry) => `${entry.id}:${entry.clientUpdatedAt}`).join('|'),
    returnerEntriesForInsights.map((entry) => `${entry.id}:${entry.clientUpdatedAt}`).join('|'),
    sessionBlockLogsForInsights.map((entry) => `${entry.id}:${entry.clientUpdatedAt}`).join('|'),
    exposureSummariesForInsights.map((entry) => `${entry.id}:${entry.clientUpdatedAt}`).join('|'),
    syncOverview.lastSuccessfulSyncAt ?? '',
  ].join('::')
  const coachInsightActions = useCoachInsights(
    userId,
    playerActions.players,
    sessionDefinitions,
    appTodayKey,
    coachInsightRefreshKey,
  )
  const refreshLocalPlayers = playerActions.refreshLocalPlayers
  const refreshLocalCheckIns = checkInActions.refreshLocalCheckIns
  const refreshPostSession = postSessionActions.refreshPostSession
  const refreshBaselines = baselineActions.refreshBaselines
  const refreshExercises = exerciseActions.refreshExercises
  const refreshMetrics = metricActions.refreshMetrics
  const refreshReturners = returnerActions.refreshReturners
  const refreshSessionBlocks = sessionBlockActions.refreshSessionBlocks
  const refreshExposures = exposureActions.refreshExposures
  const refreshLocalDataRef = useRef({
    refreshExposures,
    refreshBaselines,
    refreshExercises,
    refreshMetrics,
    refreshLocalCheckIns,
    refreshLocalPlayers,
    refreshPostSession,
    refreshReturners,
    refreshSessionBlocks,
  })
  useEffect(() => {
    refreshLocalDataRef.current = {
      refreshExposures,
      refreshBaselines,
      refreshExercises,
      refreshMetrics,
      refreshLocalCheckIns,
      refreshLocalPlayers,
      refreshPostSession,
      refreshReturners,
      refreshSessionBlocks,
    }
  }, [
    refreshBaselines,
    refreshExercises,
    refreshExposures,
    refreshMetrics,
    refreshLocalCheckIns,
    refreshLocalPlayers,
    refreshPostSession,
    refreshReturners,
    refreshSessionBlocks,
  ])
  const backupReminderKey = latestCompletedSession
    ? `${latestCompletedSession.id}:${latestCompletedSession.clientUpdatedAt}`
    : null
  const showBackupReminder = shouldShowBackupReminder({
    completedSessionClientUpdatedAt: latestCompletedSession?.clientUpdatedAt ?? null,
    dismissedReminderKey: null,
    lastExportAt,
    reminderKey: backupReminderKey,
  })
  const currentPostSessionCompletion = derivePostSessionCompletion({
    activePlayers,
    baselineEntries: baselineEntriesForOverview,
    entries: postSessionEntriesForOverview,
    lastExportAt,
    progressEntries: progressEntriesForOverview,
    sessionLog: postSessionActions.sessionLog,
    sessionType: selectedSession.type,
  })

  const showTransientNotice = useCallback((message: string) => {
    setTransientNotice(message)
  }, [])
  const currentCheckInSessionLogId = checkInActions.sessionLog?.id ?? null

  const clearLibraryInitialState = useCallback(() => {
    setLibraryInitialPdfHref(undefined)
    setLibraryInitialCategory(undefined)
    setLibraryInitialItemId(undefined)
  }, [])

  const rememberNavigationRoute = useCallback((route: AppRoute) => {
    if (route.section === 'unit') {
      setRememberedUnitRoute(route.unitRoute)
    }

    if (route.section === 'more') {
      setRememberedMoreRoute(route.moreRoute)
    }
  }, [])

  const navigateToRoute = useCallback(
    (route: AppRoute, options: { replace?: boolean; resetLibrary?: boolean } = {}) => {
      const { replace = false, resetLibrary = true } = options

      if (resetLibrary) {
        clearLibraryInitialState()
        setLibraryReturnRoute(null)
      }

      rememberNavigationRoute(route)
      setActiveRoute((currentRoute) => (routesEqual(currentRoute, route) ? currentRoute : route))

      if (typeof window !== 'undefined') {
        const hash = routeToHash(route)
        if (window.location.hash !== hash) {
          const historyMethod = replace ? 'replaceState' : 'pushState'
          window.history[historyMethod](null, '', hash)
        }
      }
    },
    [clearLibraryInitialState, rememberNavigationRoute],
  )

  useEffect(() => {
    function syncRouteFromHash() {
      const parsedRoute = parseHashRoute(window.location.hash)
      if (parsedRoute.kind === 'public-check-in') {
        return
      }

      if (window.location.hash !== parsedRoute.canonicalHash) {
        window.history.replaceState(null, '', parsedRoute.canonicalHash)
      }

      clearLibraryInitialState()
      setLibraryReturnRoute(null)
      rememberNavigationRoute(parsedRoute.route)
      setActiveRoute((currentRoute) => (routesEqual(currentRoute, parsedRoute.route) ? currentRoute : parsedRoute.route))
    }

    syncRouteFromHash()
    window.addEventListener('hashchange', syncRouteFromHash)
    window.addEventListener('popstate', syncRouteFromHash)

    return () => {
      window.removeEventListener('hashchange', syncRouteFromHash)
      window.removeEventListener('popstate', syncRouteFromHash)
    }
  }, [clearLibraryInitialState, rememberNavigationRoute])

  const handleSectionChange = useCallback(
    (section: AppSection) => {
      const targetRoute = defaultRouteForSection(section, {
        moreRoute: rememberedMoreRoute,
        unitRoute: rememberedUnitRoute,
      })
      navigateToRoute(targetRoute)
    },
    [navigateToRoute, rememberedMoreRoute, rememberedUnitRoute],
  )

  const handleOpenPdf = useCallback(
    (pdf: PdfRef) => {
      setLibraryInitialPdfHref(pdf.href)
      setLibraryInitialCategory(undefined)
      setLibraryInitialItemId(undefined)
      setLibraryReturnRoute(routes.today)
      navigateToRoute(routes.moreLibrary, { resetLibrary: false })
    },
    [navigateToRoute],
  )

  const handleOpenLibraryForSession = useCallback(
    (session: SessionDefinition) => {
      setSelectedSessionId(session.id)
      setLibraryInitialPdfHref(undefined)
      setLibraryInitialCategory('Heute relevant')
      setLibraryInitialItemId(undefined)
      setLibraryReturnRoute(routes.today)
      navigateToRoute(routes.moreLibrary, { resetLibrary: false })
    },
    [navigateToRoute],
  )

  const handleOpenLibraryItem = useCallback(
    (itemId: string) => {
      setLibraryInitialPdfHref(undefined)
      setLibraryInitialCategory(undefined)
      setLibraryInitialItemId(itemId)
      setLibraryReturnRoute(routes.unitTraining)
      navigateToRoute(routes.moreLibrary, { resetLibrary: false })
    },
    [navigateToRoute],
  )

  const handleReturnFromLibrary = useCallback(() => {
    clearLibraryInitialState()
    const targetRoute = libraryReturnRoute ?? routes.today
    setLibraryReturnRoute(null)
    navigateToRoute(targetRoute)
  }, [clearLibraryInitialState, libraryReturnRoute, navigateToRoute])

  const handleLibraryPdfClose = useCallback(() => {
    setLibraryInitialPdfHref(undefined)
  }, [])

  const handleResetToTodaySession = useCallback(() => {
    setSelectedSessionId(featuredSession.id)
  }, [featuredSession.id])

  const handleOpenPlayerSourceSession = useCallback(
    (source: PlayerAnalysisSource) => {
      if (!source.sessionDefinitionId || !findSessionById(source.sessionDefinitionId)) {
        return
      }

      setSelectedSessionId(source.sessionDefinitionId)
      navigateToRoute(legacyTargetToRoute(source.correctionTarget))
    },
    [navigateToRoute],
  )
  const canOpenPlayerSourceSession = useCallback((source: PlayerAnalysisSource) => {
    return Boolean(source.sessionDefinitionId && findSessionById(source.sessionDefinitionId))
  }, [])
  const handleOpenCoachInsightSource = useCallback(
    (source: CoachInsightSource) => {
      if (!source.sessionDefinitionId || !findSessionById(source.sessionDefinitionId)) {
        return
      }

      setSelectedSessionId(source.sessionDefinitionId)
      navigateToRoute(legacyTargetToRoute(source.correctionTarget))
      showTransientNotice('Quelle geöffnet.')
    },
    [navigateToRoute, showTransientNotice],
  )

  const handleStartKiosk = useCallback(() => {
    writeKioskLock(selectedSession.id)
    window.localStorage.setItem(selectedSessionStorageKey, selectedSession.id)
    setSelectedSessionId(selectedSession.id)
    setActiveKioskSessionId(selectedSession.id)
  }, [selectedSession.id])

  const handleExitKiosk = useCallback(() => {
    clearKioskLock()
    setActiveKioskSessionId(null)
  }, [])

  const refreshAllLocalData = useCallback(async () => {
    if (!userId) {
      return
    }
    const {
      refreshBaselines: refreshBaselinesNow,
      refreshExercises: refreshExercisesNow,
      refreshExposures: refreshExposuresNow,
      refreshLocalCheckIns: refreshLocalCheckInsNow,
      refreshLocalPlayers: refreshLocalPlayersNow,
      refreshPostSession: refreshPostSessionNow,
      refreshReturners: refreshReturnersNow,
      refreshSessionBlocks: refreshSessionBlocksNow,
    } = refreshLocalDataRef.current

    await Promise.all([
      refreshLocalPlayersNow(),
      refreshLocalCheckInsNow(),
      refreshPostSessionNow(),
      refreshBaselinesNow(),
      refreshExercisesNow(),
      refreshReturnersNow(),
      refreshSessionBlocksNow(),
      refreshExposuresNow(currentCheckInSessionLogId),
    ])
    const [storedLastExportAt, completedSession, refreshedPublicSyncOverview, refreshedSyncDetails] = await Promise.all([
      getLastExportAt(userId),
      getLatestCompletedSession(userId),
      getPublicCheckInSyncOverview(userId),
      getSyncDetailSummary(userId),
    ])
    setLastExportAtState(storedLastExportAt)
    setLatestCompletedSession(completedSession)
    setPublicSyncOverview(refreshedPublicSyncOverview)
    setSyncDetails(refreshedSyncDetails)
  }, [currentCheckInSessionLogId, userId])

  const runManualSync = useCallback(async () => {
    if (!userId) {
      return
    }

    setManualSyncFeedback(null)
    setIsManualSyncing(true)
    try {
      const overview = await syncAllUserData(userId, { publicSessionDefinition: selectedSession })
      await refreshAllLocalData()
      setManualSyncFeedback(buildManualSyncFeedback(overview))
    } catch (caughtError) {
      setManualSyncFeedback({
        kind: 'error',
        message: caughtError instanceof Error ? `Sync fehlgeschlagen: ${caughtError.message}` : 'Sync fehlgeschlagen.',
      })
    } finally {
      setIsManualSyncing(false)
    }
  }, [refreshAllLocalData, selectedSession, userId])

  const handleThemePreferenceChange = useCallback((nextThemePreference: ThemePreference) => {
    setThemePreference(nextThemePreference)
    setStoredThemePreference(nextThemePreference)
    applyThemePreference(nextThemePreference)
  }, [])

  useEffect(() => {
    applyThemePreference(themePreference)
  }, [themePreference])

  useEffect(() => {
    if (themePreference !== 'system') {
      return undefined
    }

    return subscribeToSystemThemePreferenceChanges(() => {
      applyThemePreference('system')
    })
  }, [themePreference])

  useEffect(() => {
    function handleStorageChange(event: StorageEvent) {
      if (event.key !== themePreferenceStorageKey) {
        return
      }

      const nextThemePreference = getStoredThemePreference()
      setThemePreference(nextThemePreference)
      applyThemePreference(nextThemePreference)
    }

    window.addEventListener('storage', handleStorageChange)

    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  useEffect(() => {
    window.localStorage.setItem(selectedSessionStorageKey, selectedSession.id)
  }, [selectedSession.id])

  useEffect(() => {
    Promise.resolve()
      .then(refreshAllLocalData)
      .catch(() => undefined)
  }, [refreshAllLocalData, selectedSession.id])

  useEffect(() => {
    if (!userId) {
      return undefined
    }

    let isCurrent = true
    Promise.resolve()
      .then(() => getSyncDetailSummary(userId))
      .then((refreshedSyncDetails) => {
        if (isCurrent) {
          setSyncDetails(refreshedSyncDetails)
        }
      })
      .catch(() => undefined)

    return () => {
      isCurrent = false
    }
  }, [syncOverview.errorMessage, syncOverview.pendingCount, syncOverview.status, userId])

  useEffect(() => {
    if (!manualSyncFeedback) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => setManualSyncFeedback(null), 4000)
    return () => window.clearTimeout(timeoutId)
  }, [manualSyncFeedback])

  useEffect(() => {
    if (!transientNotice) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => setTransientNotice(null), 2200)
    return () => window.clearTimeout(timeoutId)
  }, [transientNotice])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setAppTodayKey((currentKey) => {
        const nextKey = toLocalDateKey(new Date())
        return nextKey === currentKey ? currentKey : nextKey
      })
    }, 60_000)

    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    function flushBeforeHidden() {
      void flushBackgroundSyncs()
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        flushBeforeHidden()
      }
    }

    window.addEventListener('pagehide', flushBeforeHidden)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('pagehide', flushBeforeHidden)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const kioskPlayerOptions = activePlayers.map((player) => ({ id: player.id, displayName: player.name }))

  async function handleSubmitKioskEntry(input: SelfCheckInSubmissionInput) {
    const player = activePlayers.find((candidate) => candidate.id === input.playerId)

    if (!player) {
      throw new Error('Spieler nicht gefunden.')
    }

    const patch: CheckInEntryPatch = {
      present: true,
      readiness: input.readiness,
      lifeFlag: input.lifeFlag,
      painScore: input.painScore,
      painLocation: input.painLocation,
      redFlag: deriveRedFlagFromPainLocation(input.painLocation),
      sessionReaction: input.sessionReaction,
      playerNote: input.playerNote,
    }
    const result = await checkInActions.saveKioskEntry(player, patch)

    if (!result.ok) {
      throw new Error(publicSubmissionErrorMessage(new Error(result.error)))
    }
  }

  if (activeKioskSessionId === selectedSession.id) {
    const kioskIsSignedOut = authState.status !== 'signed-in'
    const kioskHasNoPlayers = authState.status === 'signed-in' && kioskPlayerOptions.length === 0
    const kioskDisabledReason = kioskIsSignedOut
      ? 'Coach-Session prüfen. Der Kiosk bleibt gesperrt.'
      : kioskHasNoPlayers
        ? 'Keine aktiven Spieler verfügbar. Coach-Modus öffnen und Roster prüfen.'
        : undefined

    return (
      <>
        {needsAppRefresh ? <PwaUpdateNotice onReload={() => void updateServiceWorker(true)} /> : null}
        <KioskCheckInView
          disabledReason={kioskDisabledReason}
          errorMessage={checkInActions.errorMessage}
          isCheckInDisabled={Boolean(kioskDisabledReason)}
          onExit={handleExitKiosk}
          onSubmitKioskEntry={handleSubmitKioskEntry}
          players={kioskPlayerOptions}
          selectedSession={selectedSession}
        />
      </>
    )
  }

  const syncStatusSlot = (
    <SyncStatusBadge
      authState={authState}
      backupRecommended={showBackupReminder}
      isManualSyncing={isManualSyncing}
      lastExportAt={lastExportAt}
      onManualSync={runManualSync}
      playerSync={syncOverview}
      syncDetails={syncDetails}
      syncFeedback={manualSyncFeedback}
    />
  )

  return (
    <AppShell
      activeRoute={activeRoute}
      onSectionChange={handleSectionChange}
      onNavigate={navigateToRoute}
      authState={authState}
      backupRecommended={showBackupReminder}
      isManualSyncing={isManualSyncing}
      lastExportAt={lastExportAt}
      onManualSync={runManualSync}
      playerSync={syncOverview}
      syncDetails={syncDetails}
      syncFeedback={manualSyncFeedback}
      syncStatusSlot={syncStatusSlot}
      topbarMode={activeRouteKey === 'today' ? 'screen-owned' : 'standard'}
      transientNotice={transientNotice}
    >
      {needsAppRefresh ? <PwaUpdateNotice onReload={() => void updateServiceWorker(true)} /> : null}
      {activeRouteKey === 'today' ? (
        <TodayDashboard
          checkInActions={checkInActions}
          coachInsights={coachInsightActions.insights}
          featuredSession={featuredSession}
          isLoading={playerActions.isLoading || checkInActions.isLoading}
          isSignedIn={authState.status === 'signed-in'}
          onActionFeedback={showTransientNotice}
          onOpenCoachInsightSource={handleOpenCoachInsightSource}
          onNavigate={navigateToRoute}
          onOpenLibrary={handleOpenLibraryForSession}
          onOpenPdf={handleOpenPdf}
          onResetToTodaySession={handleResetToTodaySession}
          onSessionChange={setSelectedSessionId}
          players={playerActions.players}
          postSessionWork={postSessionOverview.latestWork}
          selectedSession={selectedSession}
          selectedSessionId={selectedSession.id}
          sessions={sessionDefinitions}
          storagePersistence={storagePersistence}
          syncStatusSlot={syncStatusSlot}
          todayDate={todayDate}
          upcomingSessions={upcomingSessions}
        />
      ) : activeRouteKey === 'players' ? (
        <PlayersView
          authState={authState}
          canOpenSourceSession={canOpenPlayerSourceSession}
          metricActions={metricActions}
          metricSessionLabel={`${selectedSession.title} · ${selectedSession.date}`}
          onOpenSourceSession={handleOpenPlayerSourceSession}
          playerActions={playerActions}
          todayKey={appTodayKey}
        />
      ) : activeRouteKey === 'unit/check-in' ? (
        <SessionWorkspace
          activeUnitRoute="check-in"
          entries={checkInActions.entries}
          onSessionChange={setSelectedSessionId}
          onUnitRouteChange={(unitRoute) => navigateToRoute(routeForUnit(unitRoute))}
          postSessionCompletion={currentPostSessionCompletion}
          returnerCaps={returnerActions.returnerCaps}
          selectedSession={selectedSession}
          selectedSessionId={selectedSession.id}
          sessions={sessionDefinitions}
          syncOverview={syncOverview}
          warnings={checkInActions.warnings}
        >
          <CheckInView
            authState={authState}
            checkInActions={checkInActions}
            onNavigate={navigateToRoute}
            onSessionChange={setSelectedSessionId}
            onStartKiosk={handleStartKiosk}
            playerActions={playerActions}
            returnerCaps={returnerActions.returnerCaps}
            selectedSession={selectedSession}
            selectedSessionId={selectedSession.id}
            sessions={sessionDefinitions}
            showSessionPicker={false}
          />
        </SessionWorkspace>
      ) : activeRouteKey === 'unit/training' ? (
        <SessionWorkspace
          activeUnitRoute="training"
          entries={checkInActions.entries}
          onSessionChange={setSelectedSessionId}
          onUnitRouteChange={(unitRoute) => navigateToRoute(routeForUnit(unitRoute))}
          postSessionCompletion={currentPostSessionCompletion}
          returnerCaps={returnerActions.returnerCaps}
          selectedSession={selectedSession}
          selectedSessionId={selectedSession.id}
          sessions={sessionDefinitions}
          syncOverview={syncOverview}
          warnings={checkInActions.warnings}
        >
          <TrainingView
            authState={authState}
            checkInActions={checkInActions}
            exerciseActions={exerciseActions}
            exposureActions={exposureActions}
            metricActions={metricActions}
            onOpenLibraryItem={handleOpenLibraryItem}
            onNavigate={navigateToRoute}
            onSessionChange={setSelectedSessionId}
            returnerCaps={returnerActions.returnerCaps}
            selectedSession={selectedSession}
            selectedSessionId={selectedSession.id}
            sessionBlockActions={sessionBlockActions}
            sessions={sessionDefinitions}
            showSessionPicker={false}
          />
        </SessionWorkspace>
      ) : activeRouteKey === 'unit/post-session' ? (
        <SessionWorkspace
          activeUnitRoute="post-session"
          entries={checkInActions.entries}
          onSessionChange={setSelectedSessionId}
          onUnitRouteChange={(unitRoute) => navigateToRoute(routeForUnit(unitRoute))}
          postSessionCompletion={currentPostSessionCompletion}
          returnerCaps={returnerActions.returnerCaps}
          selectedSession={selectedSession}
          selectedSessionId={selectedSession.id}
          sessions={sessionDefinitions}
          syncOverview={syncOverview}
          warnings={checkInActions.warnings}
        >
          <PostSessionView
            authState={authState}
            onNavigate={navigateToRoute}
            onSessionChange={setSelectedSessionId}
            baselineActions={baselineActions}
            exposureActions={exposureActions}
            exposureBlockLogs={sessionBlockActions.blockLogs}
            exerciseActions={exerciseActions}
            lastExportAt={lastExportAt}
            metricActions={metricActions}
            postSessionActions={postSessionActions}
            returnerCaps={returnerActions.returnerCaps}
            selectedSession={selectedSession}
            selectedSessionId={selectedSession.id}
            sessions={sessionDefinitions}
            showSessionPicker={false}
          />
        </SessionWorkspace>
      ) : activeRouteKey === 'more/returners' ? (
        <LazyScreen resetKey={activeRouteKey} screenName="Returner">
          <ReturnerView
            authState={authState}
            onNavigate={navigateToRoute}
            onSessionChange={setSelectedSessionId}
            returnerActions={returnerActions}
            selectedSession={selectedSession}
            selectedSessionId={selectedSession.id}
            sessions={sessionDefinitions}
          />
        </LazyScreen>
      ) : activeRouteKey === 'analysis' ? (
        <LazyScreen resetKey={activeRouteKey} screenName="Analyse">
          <AnalysisView
            coachInsights={coachInsightActions.insights}
            onOpenCoachInsightSource={handleOpenCoachInsightSource}
            players={playerActions.players}
            sessions={sessionDefinitions}
            todayKey={appTodayKey}
            userId={userId}
          />
        </LazyScreen>
      ) : activeRouteKey === 'more/library' ? (
        <LazyScreen resetKey={activeRouteKey} screenName="Bibliothek">
          <LibraryView
            initialCategory={libraryInitialCategory}
            initialItemId={libraryInitialItemId}
            initialPdfHref={libraryInitialPdfHref}
            onPdfClose={handleLibraryPdfClose}
            onReturn={libraryReturnRoute ? handleReturnFromLibrary : undefined}
            returnLabel={
              libraryReturnRoute && routeKey(libraryReturnRoute) === 'today'
                ? 'Zurück zu Heute'
                : libraryReturnRoute && routeKey(libraryReturnRoute) === 'unit/training'
                  ? 'Zurück zu Training'
                  : undefined
            }
            selectedSession={selectedSession}
          />
        </LazyScreen>
      ) : activeRouteKey === 'more/export' ? (
        <LazyScreen resetKey={activeRouteKey} screenName="Export & Backup">
          <ExportView
            authState={authState}
            lastExportAt={lastExportAt}
            onDataChanged={refreshAllLocalData}
            onExportComplete={setLastExportAtState}
          />
        </LazyScreen>
      ) : activeRouteKey === 'more/settings' ? (
        <LazyScreen resetKey={activeRouteKey} screenName="Einstellungen">
          <SettingsView
            authState={authState}
            backupRecommended={showBackupReminder}
            isManualSyncing={isManualSyncing}
            lastExportAt={lastExportAt}
            latestCompletedSession={latestCompletedSession}
            needsAppRefresh={needsAppRefresh}
            pwaDisplayMode={pwaDisplayMode}
            onManualSync={runManualSync}
            onNavigate={navigateToRoute}
            onReloadApp={() => void updateServiceWorker(true)}
            onThemePreferenceChange={handleThemePreferenceChange}
            storagePersistence={storagePersistence}
            syncFeedback={manualSyncFeedback}
            syncOverview={syncOverview}
            themePreference={themePreference}
          />
        </LazyScreen>
      ) : (
        null
      )}
    </AppShell>
  )
}

function App() {
  const [publicCheckInToken, setPublicCheckInToken] = useState(getPublicCheckInTokenFromHash)

  useEffect(() => {
    function updatePublicCheckInToken() {
      setPublicCheckInToken(getPublicCheckInTokenFromHash())
    }

    window.addEventListener('hashchange', updatePublicCheckInToken)
    window.addEventListener('popstate', updatePublicCheckInToken)

    return () => {
      window.removeEventListener('hashchange', updatePublicCheckInToken)
      window.removeEventListener('popstate', updatePublicCheckInToken)
    }
  }, [])

  if (publicCheckInToken) {
    return <PublicCheckInView key={publicCheckInToken} token={publicCheckInToken} />
  }

  return <CoachApp />
}

export default App
