import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { AppShell } from './components/AppShell'
import { AnalysisView } from './components/AnalysisView'
import { CheckInView } from './components/CheckInView'
import { ExportView } from './components/ExportView'
import { KioskCheckInView } from './components/KioskCheckInView'
import { LibraryView } from './components/LibraryView'
import { PostSessionView } from './components/PostSessionView'
import { PublicCheckInView } from './components/PublicCheckInView'
import { PwaUpdateNotice } from './components/PwaUpdateNotice'
import { PlayersView } from './components/PlayersView'
import { ReturnerView } from './components/ReturnerView'
import { SettingsView } from './components/SettingsView'
import type { SelfCheckInSubmissionInput } from './components/SelfCheckInFlow'
import { TodayDashboard } from './components/TodayDashboard'
import { TrainingView } from './components/TrainingView'
import { getRelevantSessions, sessionDefinitions } from './content/sessions'
import type { LibraryCategory, PdfRef, SessionDefinition } from './content/types'
import { shouldShowBackupReminder } from './domain/backupReminder'
import { deriveRedFlagFromPainLocation, type CheckInEntryPatch, type SessionLog } from './domain/checkIn'
import type { CoachInsightSource } from './domain/coachInsights'
import type { PlayerAnalysisSource } from './domain/playerAnalysis'
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
import { buildManualSyncFeedback, combineSyncOverviews, syncAllUserData, type ManualSyncFeedback } from './lib/syncRepository'

export type HubTab =
  | 'heute'
  | 'spieler'
  | 'check-in'
  | 'training'
  | 'nachbereitung'
  | 'returner'
  | 'analysis'
  | 'bibliothek'
  | 'export'
  | 'einstellungen'

const selectedSessionStorageKey = 'fieldHub:selectedSessionId'
const kioskSessionStorageKey = 'fieldHub:kioskSessionId'

function toLocalDateKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function findSessionById(sessionId: string | null) {
  return sessionDefinitions.find((session) => session.id === sessionId) ?? null
}

function isCurrentOrFutureSession(sessionId: string | null, todayKey = toLocalDateKey(new Date())) {
  const session = findSessionById(sessionId)
  return Boolean(session && session.date >= todayKey)
}

function getPublicCheckInTokenFromHash() {
  if (typeof window === 'undefined') {
    return null
  }

  const match = window.location.hash.match(/^#\/checkin\/([^/?#]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

function getInitialSessionState(fallbackSessionId: string, todayKey = toLocalDateKey(new Date())) {
  if (typeof window === 'undefined') {
    return { selectedSessionId: fallbackSessionId, kioskSessionId: null }
  }

  const storedKioskSessionId = window.localStorage.getItem(kioskSessionStorageKey)
  const storedSelectedSessionId = window.localStorage.getItem(selectedSessionStorageKey)
  const storedKioskSession = findSessionById(storedKioskSessionId)
  const storedSelectedSession = findSessionById(storedSelectedSessionId)
  const kioskSessionIsCurrent = Boolean(storedKioskSession && isCurrentOrFutureSession(storedKioskSessionId, todayKey))
  const selectedSessionIsStaleKiosk =
    Boolean(storedKioskSessionId) && !kioskSessionIsCurrent && storedSelectedSessionId === storedKioskSessionId

  if (storedKioskSessionId && !kioskSessionIsCurrent) {
    window.localStorage.removeItem(kioskSessionStorageKey)
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
  const [activeTab, setActiveTab] = useState<HubTab>('heute')
  const [isManualSyncing, setIsManualSyncing] = useState(false)
  const [manualSyncFeedback, setManualSyncFeedback] = useState<ManualSyncFeedback | null>(null)
  const [libraryInitialPdfHref, setLibraryInitialPdfHref] = useState<string | undefined>(undefined)
  const [libraryInitialCategory, setLibraryInitialCategory] = useState<LibraryCategory | undefined>(undefined)
  const [libraryInitialItemId, setLibraryInitialItemId] = useState<string | undefined>(undefined)
  const [libraryReturnTab, setLibraryReturnTab] = useState<HubTab | null>(null)
  const [transientNotice, setTransientNotice] = useState<string | null>(null)
  const [appTodayKey, setAppTodayKey] = useState(() => toLocalDateKey(new Date()))
  const {
    needRefresh: [needsAppRefresh],
    updateServiceWorker,
  } = useRegisterSW()
  const [lastExportAt, setLastExportAtState] = useState<string | null>(null)
  const [latestCompletedSession, setLatestCompletedSession] = useState<SessionLog | null>(null)
  const storagePersistence = useStoragePersistence()
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
  const postSessionOverview = usePostSessionCompletionOverview({
    activePlayers,
    lastExportAt,
    refreshKey: [
      activeTab,
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
      ]),
    [
      baselineActions.syncOverview,
      checkInActions.syncOverview,
      exerciseActions.syncOverview,
      metricActions.syncOverview,
      playerActions.syncOverview,
      returnerActions.syncOverview,
      sessionBlockActions.syncOverview,
      exposureActions.syncOverview,
    ],
  )
  const coachInsightRefreshKey = [
    activeTab,
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

  const showTransientNotice = useCallback((message: string) => {
    setTransientNotice(message)
  }, [])
  const currentCheckInSessionLogId = checkInActions.sessionLog?.id ?? null

  const handleTabChange = useCallback((tab: HubTab) => {
    setLibraryInitialPdfHref(undefined)
    setLibraryInitialCategory(undefined)
    setLibraryInitialItemId(undefined)
    setLibraryReturnTab(null)
    setActiveTab(tab)
  }, [])

  const handleOpenPdf = useCallback((pdf: PdfRef) => {
    setLibraryInitialPdfHref(pdf.href)
    setLibraryInitialCategory(undefined)
    setLibraryInitialItemId(undefined)
    setLibraryReturnTab('heute')
    setActiveTab('bibliothek')
  }, [])

  const handleOpenLibraryForSession = useCallback((session: SessionDefinition) => {
    setSelectedSessionId(session.id)
    setLibraryInitialPdfHref(undefined)
    setLibraryInitialCategory('Heute relevant')
    setLibraryInitialItemId(undefined)
    setLibraryReturnTab('heute')
    setActiveTab('bibliothek')
  }, [])

  const handleOpenLibraryItem = useCallback((itemId: string) => {
    setLibraryInitialPdfHref(undefined)
    setLibraryInitialCategory(undefined)
    setLibraryInitialItemId(itemId)
    setLibraryReturnTab('training')
    setActiveTab('bibliothek')
  }, [])

  const handleReturnFromLibrary = useCallback(() => {
    setLibraryInitialPdfHref(undefined)
    setLibraryInitialCategory(undefined)
    setLibraryInitialItemId(undefined)
    setActiveTab(libraryReturnTab ?? 'heute')
    setLibraryReturnTab(null)
  }, [libraryReturnTab])

  const handleLibraryPdfClose = useCallback(() => {
    setLibraryInitialPdfHref(undefined)
  }, [])

  const handleResetToTodaySession = useCallback(() => {
    setSelectedSessionId(featuredSession.id)
  }, [featuredSession.id])

  const handleOpenPlayerSourceSession = useCallback((source: PlayerAnalysisSource) => {
    if (!source.sessionDefinitionId || !findSessionById(source.sessionDefinitionId)) {
      return
    }

    setSelectedSessionId(source.sessionDefinitionId)
    setActiveTab(source.correctionTarget)
  }, [])
  const canOpenPlayerSourceSession = useCallback((source: PlayerAnalysisSource) => {
    return Boolean(source.sessionDefinitionId && findSessionById(source.sessionDefinitionId))
  }, [])
  const handleOpenCoachInsightSource = useCallback(
    (source: CoachInsightSource) => {
      if (!source.sessionDefinitionId || !findSessionById(source.sessionDefinitionId)) {
        return
      }

      setSelectedSessionId(source.sessionDefinitionId)
      setActiveTab(source.correctionTarget)
      showTransientNotice('Quelle geöffnet.')
    },
    [showTransientNotice],
  )

  const handleStartKiosk = useCallback(() => {
    window.localStorage.setItem(kioskSessionStorageKey, selectedSession.id)
    window.localStorage.setItem(selectedSessionStorageKey, selectedSession.id)
    setSelectedSessionId(selectedSession.id)
    setActiveKioskSessionId(selectedSession.id)
  }, [selectedSession.id])

  const handleExitKiosk = useCallback(() => {
    window.localStorage.removeItem(kioskSessionStorageKey)
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
    const [storedLastExportAt, completedSession] = await Promise.all([
      getLastExportAt(userId),
      getLatestCompletedSession(userId),
    ])
    setLastExportAtState(storedLastExportAt)
    setLatestCompletedSession(completedSession)
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

  useEffect(() => {
    window.localStorage.setItem(selectedSessionStorageKey, selectedSession.id)
  }, [selectedSession.id])

  useEffect(() => {
    Promise.resolve()
      .then(refreshAllLocalData)
      .catch(() => undefined)
  }, [refreshAllLocalData, selectedSession.id])

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
      returnerFlag: input.returnerFlag,
      sessionReaction: input.sessionReaction,
      playerNote: input.playerNote,
    }
    const result = await checkInActions.saveKioskEntry(player, patch)

    if (!result.ok) {
      throw new Error(result.error)
    }
  }

  if (authState.status === 'signed-in' && activeKioskSessionId === selectedSession.id) {
    return (
      <>
        {needsAppRefresh ? <PwaUpdateNotice onReload={() => void updateServiceWorker(true)} /> : null}
        <KioskCheckInView
          errorMessage={checkInActions.errorMessage}
          onExit={handleExitKiosk}
          onSubmitKioskEntry={handleSubmitKioskEntry}
          players={kioskPlayerOptions}
          selectedSession={selectedSession}
        />
      </>
    )
  }

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={handleTabChange}
      authState={authState}
      playerSync={syncOverview}
      transientNotice={transientNotice}
    >
      {needsAppRefresh ? <PwaUpdateNotice onReload={() => void updateServiceWorker(true)} /> : null}
      {activeTab === 'heute' ? (
        <TodayDashboard
          checkInActions={checkInActions}
          coachInsights={coachInsightActions.insights}
          featuredSession={featuredSession}
          isSignedIn={authState.status === 'signed-in'}
          onActionFeedback={showTransientNotice}
          onOpenCoachInsightSource={handleOpenCoachInsightSource}
          onNavigate={handleTabChange}
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
          todayDate={todayDate}
          upcomingSessions={upcomingSessions}
        />
      ) : activeTab === 'spieler' ? (
        <PlayersView
          authState={authState}
          canOpenSourceSession={canOpenPlayerSourceSession}
          metricActions={metricActions}
          metricSessionLabel={`${selectedSession.title} · ${selectedSession.date}`}
          onOpenSourceSession={handleOpenPlayerSourceSession}
          playerActions={playerActions}
          todayKey={appTodayKey}
        />
      ) : activeTab === 'check-in' ? (
        <CheckInView
          authState={authState}
          checkInActions={checkInActions}
          onNavigate={handleTabChange}
          onSessionChange={setSelectedSessionId}
          onStartKiosk={handleStartKiosk}
          playerActions={playerActions}
          returnerCaps={returnerActions.returnerCaps}
          selectedSession={selectedSession}
          selectedSessionId={selectedSession.id}
          sessions={sessionDefinitions}
        />
      ) : activeTab === 'training' ? (
        <TrainingView
          authState={authState}
          checkInActions={checkInActions}
          exerciseActions={exerciseActions}
          exposureActions={exposureActions}
          metricActions={metricActions}
          onOpenLibraryItem={handleOpenLibraryItem}
          onNavigate={handleTabChange}
          onSessionChange={setSelectedSessionId}
          returnerCaps={returnerActions.returnerCaps}
          selectedSession={selectedSession}
          selectedSessionId={selectedSession.id}
          sessionBlockActions={sessionBlockActions}
          sessions={sessionDefinitions}
        />
      ) : activeTab === 'nachbereitung' ? (
        <PostSessionView
          authState={authState}
          onNavigate={handleTabChange}
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
        />
      ) : activeTab === 'returner' ? (
        <ReturnerView
          authState={authState}
          onNavigate={handleTabChange}
          onSessionChange={setSelectedSessionId}
          returnerActions={returnerActions}
          selectedSession={selectedSession}
          selectedSessionId={selectedSession.id}
          sessions={sessionDefinitions}
        />
      ) : activeTab === 'analysis' ? (
        <AnalysisView
          coachInsights={coachInsightActions.insights}
          onOpenCoachInsightSource={handleOpenCoachInsightSource}
          players={playerActions.players}
          sessions={sessionDefinitions}
          todayKey={appTodayKey}
          userId={userId}
        />
      ) : activeTab === 'bibliothek' ? (
        <LibraryView
          initialCategory={libraryInitialCategory}
          initialItemId={libraryInitialItemId}
          initialPdfHref={libraryInitialPdfHref}
          onPdfClose={handleLibraryPdfClose}
          onReturn={libraryReturnTab ? handleReturnFromLibrary : undefined}
          returnLabel={
            libraryReturnTab === 'heute'
              ? 'Zurück zu Heute'
              : libraryReturnTab === 'training'
                ? 'Zurück zu Training'
                : undefined
          }
          selectedSession={selectedSession}
        />
      ) : activeTab === 'export' ? (
        <ExportView
          authState={authState}
          lastExportAt={lastExportAt}
          onDataChanged={refreshAllLocalData}
          onExportComplete={setLastExportAtState}
        />
      ) : activeTab === 'einstellungen' ? (
        <SettingsView
          authState={authState}
          backupRecommended={showBackupReminder}
          isManualSyncing={isManualSyncing}
          lastExportAt={lastExportAt}
          latestCompletedSession={latestCompletedSession}
          needsAppRefresh={needsAppRefresh}
          onManualSync={runManualSync}
          onNavigate={handleTabChange}
          onReloadApp={() => void updateServiceWorker(true)}
          storagePersistence={storagePersistence}
          syncFeedback={manualSyncFeedback}
          syncOverview={syncOverview}
        />
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
