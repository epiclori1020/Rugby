import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { AppShell } from './components/AppShell'
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
import type { PdfRef } from './content/types'
import { shouldShowBackupReminder } from './domain/backupReminder'
import type { CheckInEntryPatch, SessionLog } from './domain/checkIn'
import { useAuthSession } from './hooks/useAuthSession'
import { useBaselines } from './hooks/useBaselines'
import { useCheckIns } from './hooks/useCheckIns'
import { usePlayers } from './hooks/usePlayers'
import { usePostSession } from './hooks/usePostSession'
import { useReturners } from './hooks/useReturners'
import { useStoragePersistence } from './hooks/useStoragePersistence'
import { getLastExportAt, getLatestCompletedSession } from './lib/backupRepository'
import { flushBackgroundSyncs } from './lib/backgroundSync'
import { signOutCoach } from './lib/auth'
import { buildManualSyncFeedback, combineSyncOverviews, syncAllUserData, type ManualSyncFeedback } from './lib/syncRepository'

export type HubTab =
  | 'heute'
  | 'spieler'
  | 'check-in'
  | 'training'
  | 'nachbereitung'
  | 'returner'
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

function getPublicCheckInTokenFromHash() {
  if (typeof window === 'undefined') {
    return null
  }

  const match = window.location.hash.match(/^#\/checkin\/([^/?#]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

function getInitialSelectedSessionId(fallbackSessionId: string) {
  if (typeof window === 'undefined') {
    return fallbackSessionId
  }

  const storedKioskSessionId = window.localStorage.getItem(kioskSessionStorageKey)
  const storedKioskSessionExists = sessionDefinitions.some((session) => session.id === storedKioskSessionId)

  if (storedKioskSessionExists && storedKioskSessionId) {
    return storedKioskSessionId
  }

  const storedSessionId = window.localStorage.getItem(selectedSessionStorageKey)
  const storedSessionExists = sessionDefinitions.some((session) => session.id === storedSessionId)

  return storedSessionExists && storedSessionId ? storedSessionId : fallbackSessionId
}

function getInitialKioskSessionId() {
  if (typeof window === 'undefined') {
    return null
  }

  const storedSessionId = window.localStorage.getItem(kioskSessionStorageKey)
  const storedSessionExists = sessionDefinitions.some((session) => session.id === storedSessionId)

  return storedSessionExists && storedSessionId ? storedSessionId : null
}

function CoachApp() {
  const [activeTab, setActiveTab] = useState<HubTab>('heute')
  const [isManualSyncing, setIsManualSyncing] = useState(false)
  const [manualSyncFeedback, setManualSyncFeedback] = useState<ManualSyncFeedback | null>(null)
  const [libraryInitialPdfHref, setLibraryInitialPdfHref] = useState<string | undefined>(undefined)
  const [libraryReturnTab, setLibraryReturnTab] = useState<HubTab | null>(null)
  const [transientNotice, setTransientNotice] = useState<string | null>(null)
  const [appTodayKey, setAppTodayKey] = useState(() => toLocalDateKey(new Date()))
  const [activeKioskSessionId, setActiveKioskSessionId] = useState<string | null>(getInitialKioskSessionId)
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
  const [selectedSessionId, setSelectedSessionId] = useState(() => getInitialSelectedSessionId(featuredSession.id))
  const selectedSession = sessionDefinitions.find((session) => session.id === selectedSessionId) ?? featuredSession
  const checkInActions = useCheckIns(
    authState.status === 'signed-in' ? authState.user.id : null,
    selectedSession,
    playerActions.players,
    activeTab === 'check-in',
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
  const returnerActions = useReturners(
    authState.status === 'signed-in' ? authState.user.id : null,
    selectedSession,
    playerActions.players,
    checkInActions.entries,
  )
  const userId = authState.status === 'signed-in' ? authState.user.id : null
  const syncOverview = useMemo(
    () =>
      combineSyncOverviews([
        playerActions.syncOverview,
        checkInActions.syncOverview,
        baselineActions.syncOverview,
        returnerActions.syncOverview,
      ]),
    [
      baselineActions.syncOverview,
      checkInActions.syncOverview,
      playerActions.syncOverview,
      returnerActions.syncOverview,
    ],
  )
  const refreshLocalPlayers = playerActions.refreshLocalPlayers
  const refreshLocalCheckIns = checkInActions.refreshLocalCheckIns
  const refreshPostSession = postSessionActions.refreshPostSession
  const refreshBaselines = baselineActions.refreshBaselines
  const refreshReturners = returnerActions.refreshReturners
  const refreshLocalDataRef = useRef({
    refreshBaselines,
    refreshLocalCheckIns,
    refreshLocalPlayers,
    refreshPostSession,
    refreshReturners,
  })
  useEffect(() => {
    refreshLocalDataRef.current = {
      refreshBaselines,
      refreshLocalCheckIns,
      refreshLocalPlayers,
      refreshPostSession,
      refreshReturners,
    }
  }, [refreshBaselines, refreshLocalCheckIns, refreshLocalPlayers, refreshPostSession, refreshReturners])
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

  const handleTabChange = useCallback((tab: HubTab) => {
    setLibraryInitialPdfHref(undefined)
    setLibraryReturnTab(null)
    setActiveTab(tab)
  }, [])

  const handleOpenPdf = useCallback((pdf: PdfRef) => {
    setLibraryInitialPdfHref(pdf.href)
    setLibraryReturnTab('heute')
    setActiveTab('bibliothek')
  }, [])

  const handleReturnFromLibrary = useCallback(() => {
    setLibraryInitialPdfHref(undefined)
    setLibraryReturnTab(null)
    setActiveTab('heute')
  }, [])

  const handleLibraryPdfClose = useCallback(() => {
    setLibraryInitialPdfHref(undefined)
    setLibraryReturnTab(null)
  }, [])

  const handleResetToTodaySession = useCallback(() => {
    setSelectedSessionId(featuredSession.id)
  }, [featuredSession.id])

  const handleStartKiosk = useCallback(() => {
    window.localStorage.setItem(kioskSessionStorageKey, selectedSession.id)
    window.localStorage.setItem(selectedSessionStorageKey, selectedSession.id)
    setSelectedSessionId(selectedSession.id)
    setActiveKioskSessionId(selectedSession.id)
  }, [selectedSession.id])

  const handleExitKiosk = useCallback(async () => {
    try {
      await signOutCoach()
      window.localStorage.removeItem(kioskSessionStorageKey)
      setActiveKioskSessionId(null)
    } catch {
      showTransientNotice('Kiosk bleibt aktiv: Logout fehlgeschlagen.')
    }
  }, [showTransientNotice])

  const refreshAllLocalData = useCallback(async () => {
    if (!userId) {
      return
    }
    const {
      refreshBaselines: refreshBaselinesNow,
      refreshLocalCheckIns: refreshLocalCheckInsNow,
      refreshLocalPlayers: refreshLocalPlayersNow,
      refreshPostSession: refreshPostSessionNow,
      refreshReturners: refreshReturnersNow,
    } = refreshLocalDataRef.current

    await Promise.all([
      refreshLocalPlayersNow(),
      refreshLocalCheckInsNow(),
      refreshPostSessionNow(),
      refreshBaselinesNow(),
      refreshReturnersNow(),
    ])
    const [storedLastExportAt, completedSession] = await Promise.all([
      getLastExportAt(userId),
      getLatestCompletedSession(userId),
    ])
    setLastExportAtState(storedLastExportAt)
    setLatestCompletedSession(completedSession)
  }, [userId])

  const runManualSync = useCallback(async () => {
    if (!userId) {
      return
    }

    setManualSyncFeedback(null)
    setIsManualSyncing(true)
    try {
      const overview = await syncAllUserData(userId)
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
  }, [refreshAllLocalData, userId])

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

  const activeKioskPlayers = playerActions.players.filter((player) => player.active)
  const kioskPlayerOptions = activeKioskPlayers.map((player) => ({ id: player.id, displayName: player.name }))

  async function handleSubmitKioskEntry(input: SelfCheckInSubmissionInput) {
    const player = activeKioskPlayers.find((candidate) => candidate.id === input.playerId)

    if (!player) {
      throw new Error('Spieler nicht gefunden.')
    }

    const patch: CheckInEntryPatch = {
      present: true,
      readiness: input.readiness,
      lifeFlag: input.lifeFlag,
      painScore: input.painScore,
      painLocation: input.painLocation,
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
          featuredSession={featuredSession}
          isSignedIn={authState.status === 'signed-in'}
          onActionFeedback={showTransientNotice}
          onNavigate={handleTabChange}
          onOpenPdf={handleOpenPdf}
          onResetToTodaySession={handleResetToTodaySession}
          onSessionChange={setSelectedSessionId}
          players={playerActions.players}
          selectedSession={selectedSession}
          selectedSessionId={selectedSession.id}
          sessions={sessionDefinitions}
          storagePersistence={storagePersistence}
          todayDate={todayDate}
          upcomingSessions={upcomingSessions}
        />
      ) : activeTab === 'spieler' ? (
        <PlayersView authState={authState} baselineActions={baselineActions} playerActions={playerActions} />
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
          onNavigate={handleTabChange}
          onSessionChange={setSelectedSessionId}
          returnerCaps={returnerActions.returnerCaps}
          selectedSession={selectedSession}
          selectedSessionId={selectedSession.id}
          sessions={sessionDefinitions}
        />
      ) : activeTab === 'nachbereitung' ? (
        <PostSessionView
          authState={authState}
          onNavigate={handleTabChange}
          onSessionChange={setSelectedSessionId}
          baselineActions={baselineActions}
          postSessionActions={postSessionActions}
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
      ) : activeTab === 'bibliothek' ? (
        <LibraryView
          initialPdfHref={libraryInitialPdfHref}
          onPdfClose={handleLibraryPdfClose}
          onReturn={libraryReturnTab === 'heute' ? handleReturnFromLibrary : undefined}
          returnLabel={libraryReturnTab === 'heute' ? 'Zurück zu Heute' : undefined}
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
