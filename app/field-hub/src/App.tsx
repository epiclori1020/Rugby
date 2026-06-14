import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppShell } from './components/AppShell'
import { BackupReminderBanner } from './components/BackupReminderBanner'
import { CheckInView } from './components/CheckInView'
import { ExportView } from './components/ExportView'
import { LibraryView } from './components/LibraryView'
import { PostSessionView } from './components/PostSessionView'
import { PlayersView } from './components/PlayersView'
import { ReturnerView } from './components/ReturnerView'
import { TodayDashboard } from './components/TodayDashboard'
import { TrainingView } from './components/TrainingView'
import { getRelevantSessions, sessionDefinitions } from './content/sessions'
import { shouldShowBackupReminder } from './domain/backupReminder'
import type { SessionLog } from './domain/checkIn'
import { useAuthSession } from './hooks/useAuthSession'
import { useBaselines } from './hooks/useBaselines'
import { useCheckIns } from './hooks/useCheckIns'
import { usePlayers } from './hooks/usePlayers'
import { usePostSession } from './hooks/usePostSession'
import { useReturners } from './hooks/useReturners'
import { useStoragePersistence } from './hooks/useStoragePersistence'
import { getLastExportAt, getLatestCompletedSession } from './lib/backupRepository'
import { combineSyncOverviews, syncAllUserData } from './lib/syncRepository'

export type HubTab =
  | 'heute'
  | 'spieler'
  | 'check-in'
  | 'training'
  | 'nachbereitung'
  | 'returner'
  | 'bibliothek'
  | 'export'

const selectedSessionStorageKey = 'fieldHub:selectedSessionId'

function getInitialSelectedSessionId(fallbackSessionId: string) {
  if (typeof window === 'undefined') {
    return fallbackSessionId
  }

  const storedSessionId = window.localStorage.getItem(selectedSessionStorageKey)
  const storedSessionExists = sessionDefinitions.some((session) => session.id === storedSessionId)

  return storedSessionExists && storedSessionId ? storedSessionId : fallbackSessionId
}

function App() {
  const [activeTab, setActiveTab] = useState<HubTab>('heute')
  const [dismissedBackupReminderKey, setDismissedBackupReminderKey] = useState<string | null>(null)
  const [isManualSyncing, setIsManualSyncing] = useState(false)
  const [lastExportAt, setLastExportAtState] = useState<string | null>(null)
  const [latestCompletedSession, setLatestCompletedSession] = useState<SessionLog | null>(null)
  const storagePersistence = useStoragePersistence()
  const authState = useAuthSession()
  const playerActions = usePlayers(authState.status === 'signed-in' ? authState.user.id : null)
  const { featuredSession } = getRelevantSessions()
  const [selectedSessionId, setSelectedSessionId] = useState(() => getInitialSelectedSessionId(featuredSession.id))
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
  const backupReminderKey = latestCompletedSession
    ? `${latestCompletedSession.id}:${latestCompletedSession.clientUpdatedAt}`
    : null
  const showBackupReminder = shouldShowBackupReminder({
    completedSessionClientUpdatedAt: latestCompletedSession?.clientUpdatedAt ?? null,
    dismissedReminderKey: dismissedBackupReminderKey,
    lastExportAt,
    reminderKey: backupReminderKey,
  })

  const refreshAllLocalData = useCallback(async () => {
    if (!userId) {
      return
    }

    await Promise.all([
      refreshLocalPlayers(),
      refreshLocalCheckIns(),
      refreshPostSession(),
      refreshBaselines(),
      refreshReturners(),
    ])
    const [storedLastExportAt, completedSession] = await Promise.all([
      getLastExportAt(userId),
      getLatestCompletedSession(userId),
    ])
    setLastExportAtState(storedLastExportAt)
    setLatestCompletedSession(completedSession)
  }, [refreshBaselines, refreshLocalCheckIns, refreshLocalPlayers, refreshPostSession, refreshReturners, userId])

  const runManualSync = useCallback(async () => {
    if (!userId) {
      return
    }

    setIsManualSyncing(true)
    try {
      await syncAllUserData(userId)
      await refreshAllLocalData()
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
  }, [refreshAllLocalData, syncOverview.pendingCount])

  return (
    <AppShell
      activeTab={activeTab}
      isManualSyncing={isManualSyncing}
      onManualSync={runManualSync}
      onTabChange={setActiveTab}
      storagePersistence={storagePersistence}
      authState={authState}
      playerSync={syncOverview}
    >
      {showBackupReminder && latestCompletedSession ? (
        <BackupReminderBanner
          lastExportAt={lastExportAt}
          onDismiss={() => setDismissedBackupReminderKey(backupReminderKey)}
          onNavigate={setActiveTab}
          sessionLog={latestCompletedSession}
        />
      ) : null}
      {activeTab === 'heute' ? (
        <TodayDashboard
          checkInActions={checkInActions}
          onNavigate={setActiveTab}
          onSessionChange={setSelectedSessionId}
          players={playerActions.players}
          selectedSession={selectedSession}
          selectedSessionId={selectedSession.id}
          sessions={sessionDefinitions}
          storagePersistence={storagePersistence}
        />
      ) : activeTab === 'spieler' ? (
        <PlayersView authState={authState} baselineActions={baselineActions} playerActions={playerActions} />
      ) : activeTab === 'check-in' ? (
        <CheckInView
          authState={authState}
          checkInActions={checkInActions}
          onNavigate={setActiveTab}
          onSessionChange={setSelectedSessionId}
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
          onNavigate={setActiveTab}
          onSessionChange={setSelectedSessionId}
          returnerCaps={returnerActions.returnerCaps}
          selectedSession={selectedSession}
          selectedSessionId={selectedSession.id}
          sessions={sessionDefinitions}
        />
      ) : activeTab === 'nachbereitung' ? (
        <PostSessionView
          authState={authState}
          onNavigate={setActiveTab}
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
          onNavigate={setActiveTab}
          onSessionChange={setSelectedSessionId}
          returnerActions={returnerActions}
          selectedSession={selectedSession}
          selectedSessionId={selectedSession.id}
          sessions={sessionDefinitions}
        />
      ) : activeTab === 'bibliothek' ? (
        <LibraryView />
      ) : activeTab === 'export' ? (
        <ExportView
          authState={authState}
          lastExportAt={lastExportAt}
          onDataChanged={refreshAllLocalData}
          onExportComplete={setLastExportAtState}
        />
      ) : (
        null
      )}
    </AppShell>
  )
}

export default App
