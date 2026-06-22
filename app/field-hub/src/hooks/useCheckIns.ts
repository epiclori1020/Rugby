import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CheckInEntryPatch, PlayerObservation, PlayerSessionEntry, PlayerWarning, TrafficLight } from '../domain/checkIn'
import type { Player } from '../domain/players'
import type { PublicCheckInSubmission } from '../domain/publicCheckIn'
import type { PlayerSyncOverview } from '../domain/sync'
import { defaultPlayerSyncOverview } from '../domain/sync'
import type { SessionDefinition } from '../content/types'
import { scheduleBackgroundSync } from '../lib/backgroundSync'
import { mergeRecordIntoList } from '../lib/optimisticUpdates'
import {
  buildEmptyEntry,
  countLocalSessionLogs,
  ensureSessionLog,
  findSessionLog,
  getCheckInSyncOverview,
  listCheckInEntries,
  listExpectedPlayerIds,
  listLatestObservations,
  listLatestWarnings,
  pullRemoteCheckIns,
  pushPendingCheckIns,
  saveCheckInEntry,
  saveKioskCheckInEntry,
  saveSessionLogPatch,
  resetCheckInEntry,
  resetAllCheckInsForSession,
  syncCheckIns,
  type SessionLogPatch,
} from '../lib/checkInRepository'
import { hasPlayerId } from '../lib/playerId'
import {
  closePublicCheckInLink,
  createPublicCheckInLinkBundle,
  importPublicCheckInSubmissions,
  listLocalPublicCheckInLinks,
  listLocalPublicCheckInSubmissions,
  refreshRemotePublicCheckIns,
  resetPublicCheckInSubmissionsForSession,
  type CreatedPublicCheckInLink,
} from '../lib/publicCheckInRepository'

const REMOTE_PULL_THROTTLE_MS = 30_000

type SaveEntryResult =
  | { ok: true; entry: PlayerSessionEntry }
  | { ok: false; error: string }

async function loadLocalPublicCheckInSnapshot(userId: string, sessionDefinitionId: string) {
  const links = await listLocalPublicCheckInLinks(userId, sessionDefinitionId)
  const submissions = (await Promise.all(links.map((link) => listLocalPublicCheckInSubmissions(userId, link.id)))).flat()

  return { links, submissions }
}

async function shouldHydrateRemoteCheckInsForPublicRecovery(
  userId: string,
  sessionDefinition: SessionDefinition,
  submissions: PublicCheckInSubmission[],
) {
  const importedSubmissions = submissions.filter((submission) => submission.status === 'imported' && !submission.deletedAt)

  if (importedSubmissions.length === 0) {
    return false
  }

  const sessionLog = await findSessionLog(userId, sessionDefinition.id)
  if (!sessionLog) {
    return true
  }

  const localEntries = await listCheckInEntries(userId, sessionLog.id)
  const localEntryPlayerIds = new Set(
    localEntries.filter((entry) => hasPlayerId(entry) && !entry.deletedAt).map((entry) => entry.playerId),
  )

  return importedSubmissions.some((submission) => !submission.playerId || !localEntryPlayerIds.has(submission.playerId))
}

export function useCheckIns(
  userId: string | null,
  sessionDefinition: SessionDefinition,
  players: Player[],
) {
  const [entries, setEntries] = useState<PlayerSessionEntry[]>([])
  const [warnings, setWarnings] = useState<PlayerWarning[]>([])
  const [observations, setObservations] = useState<PlayerObservation[]>([])
  const [syncOverview, setSyncOverview] = useState<PlayerSyncOverview>(defaultPlayerSyncOverview)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionLogId, setSessionLogId] = useState<string | null>(null)
  const [sessionLog, setSessionLog] = useState<Awaited<ReturnType<typeof findSessionLog>>>(null)
  const [expectedPlayerIds, setExpectedPlayerIds] = useState<string[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [publicCheckInLinks, setPublicCheckInLinks] = useState<Awaited<ReturnType<typeof listLocalPublicCheckInLinks>>>([])
  const [publicCheckInSubmissions, setPublicCheckInSubmissions] = useState<PublicCheckInSubmission[]>([])
  const [publicCheckInNotice, setPublicCheckInNotice] = useState<string | null>(null)
  const publicRefreshInFlightRef = useRef<Promise<void> | null>(null)
  const remotePullInFlightRef = useRef<Promise<void> | null>(null)
  const lastRemotePullAtRef = useRef(0)
  const syncRunningRef = useRef(false)

  const activePlayers = useMemo(() => players.filter((player) => player.active), [players])
  const activePlayerIds = useMemo(() => new Set(activePlayers.map((player) => player.id)), [activePlayers])
  const activeEntries = useMemo(
    () => entries.filter((entry) => hasPlayerId(entry) && activePlayerIds.has(entry.playerId)),
    [activePlayerIds, entries],
  )
  const activeWarnings = useMemo(
    () => warnings.filter((warning) => hasPlayerId(warning) && activePlayerIds.has(warning.playerId)),
    [activePlayerIds, warnings],
  )
  const activeObservations = useMemo(
    () => observations.filter((observation) => hasPlayerId(observation) && activePlayerIds.has(observation.playerId)),
    [activePlayerIds, observations],
  )

  const refreshLocalCheckIns = useCallback(async () => {
    if (!userId) {
      setEntries([])
      setWarnings([])
      setObservations([])
      setSyncOverview(defaultPlayerSyncOverview)
      setSessionLogId(null)
      setSessionLog(null)
      setExpectedPlayerIds([])
      setErrorMessage(null)
      setPublicCheckInLinks([])
      setPublicCheckInSubmissions([])
      setPublicCheckInNotice(null)
      return
    }

    const sessionLog = await findSessionLog(userId, sessionDefinition.id)
    const [localEntries, localWarnings, localObservations, expectedIds, overview, localPublicLinks] = await Promise.all([
      sessionLog ? listCheckInEntries(userId, sessionLog.id) : Promise.resolve([]),
      listLatestWarnings(userId, sessionLog?.id ?? null, sessionDefinition.date),
      listLatestObservations(userId, sessionLog?.id ?? null, sessionDefinition.date),
      listExpectedPlayerIds(userId, sessionDefinition.date),
      getCheckInSyncOverview(userId),
      listLocalPublicCheckInLinks(userId, sessionDefinition.id),
    ])
    setSessionLogId(sessionLog?.id ?? null)
    setSessionLog(sessionLog)
    setEntries(localEntries)
    setWarnings(localWarnings)
    setObservations(localObservations)
    setExpectedPlayerIds(expectedIds)
    setSyncOverview(overview)
    setPublicCheckInLinks(localPublicLinks.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
    setPublicCheckInSubmissions(
      (
        await Promise.all(localPublicLinks.map((link) => listLocalPublicCheckInSubmissions(userId, link.id)))
      ).flat(),
    )
  }, [sessionDefinition, userId])

  const runSync = useCallback(async () => {
    if (!userId) {
      return
    }

    syncRunningRef.current = true
    setIsLoading(true)
    try {
      await refreshRemotePublicCheckIns(userId, { sessionDefinitionId: sessionDefinition.id }).catch(() => undefined)
      const { submissions: localPublicSubmissions } = await loadLocalPublicCheckInSnapshot(userId, sessionDefinition.id)
      let canRecoverImportedPublicSubmissions = false
      if (await shouldHydrateRemoteCheckInsForPublicRecovery(userId, sessionDefinition, localPublicSubmissions)) {
        try {
          await pullRemoteCheckIns(userId, { sessionDefinitionId: sessionDefinition.id })
          canRecoverImportedPublicSubmissions = true
        } catch {
          canRecoverImportedPublicSubmissions = false
        }
      }
      const publicImportResult = await importPublicCheckInSubmissions(userId, sessionDefinition, {
        recoverImportedWithoutLocalEntry: canRecoverImportedPublicSubmissions,
      }).catch(() => null)
      const overview = await syncCheckIns(userId, { sessionDefinitionId: sessionDefinition.id })
      setSyncOverview(overview)
      setErrorMessage(overview.status === 'error' ? overview.errorMessage ?? 'Check-in-Sync fehlgeschlagen.' : null)
      if (publicImportResult && (publicImportResult.imported > 0 || publicImportResult.conflicts > 0)) {
        setPublicCheckInNotice(
          `${publicImportResult.imported} Spieler-Check-ins uebernommen, ${publicImportResult.conflicts} Konflikte.`,
        )
      }
      await refreshLocalCheckIns()
      return overview
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Check-in-Sync fehlgeschlagen.'
      const overview = {
        ...(await getCheckInSyncOverview(userId)),
        status: 'error' as const,
        errorMessage: message,
      }
      setSyncOverview(overview)
      setErrorMessage(message)
      return overview
    } finally {
      setIsLoading(false)
      syncRunningRef.current = false
    }
  }, [refreshLocalCheckIns, sessionDefinition, userId])

  // M1: leichter, event-getriebener Frische-Pull fuer Cross-Device-Daten.
  // Bewusst KEIN setIsLoading (Controls bleiben nutzbar), KEIN Push/syncCheckIns,
  // session-begrenzt (voll nur bei leerer lokaler DB), gedrosselt + in-flight-geschuetzt.
  const refreshRemoteCheckInData = useCallback(async () => {
    if (!userId || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return
    }

    if (syncRunningRef.current || remotePullInFlightRef.current) {
      return remotePullInFlightRef.current ?? undefined
    }

    if (Date.now() - lastRemotePullAtRef.current < REMOTE_PULL_THROTTLE_MS) {
      return
    }

    const pullPromise = (async () => {
      try {
        const hasLocalHistory = (await countLocalSessionLogs(userId)) > 0
        await pullRemoteCheckIns(userId, hasLocalHistory ? { sessionDefinitionId: sessionDefinition.id } : {})
        await refreshLocalCheckIns()
        lastRemotePullAtRef.current = Date.now()
      } catch {
        // Best-effort: Fehler ignorieren, lokale Daten bleiben gueltig.
      }
    })().finally(() => {
      remotePullInFlightRef.current = null
    })
    remotePullInFlightRef.current = pullPromise
    return pullPromise
  }, [refreshLocalCheckIns, sessionDefinition.id, userId])

  const pushImportedPublicCheckIns = useCallback(async () => {
    if (!userId) {
      return null
    }

    const overview = await pushPendingCheckIns(userId)
    setSyncOverview(overview)
    setErrorMessage(overview.status === 'error' ? overview.errorMessage ?? 'Check-in-Sync fehlgeschlagen.' : null)
    return overview
  }, [userId])

  const refreshPublicCheckIns = useCallback(async () => {
    if (!userId || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return
    }

    if (publicRefreshInFlightRef.current) {
      return publicRefreshInFlightRef.current
    }

    const refreshPromise = (async () => {
      await refreshRemotePublicCheckIns(userId, { sessionDefinitionId: sessionDefinition.id })
      const { links: refreshedPublicLinks, submissions: refreshedPublicSubmissions } =
        await loadLocalPublicCheckInSnapshot(userId, sessionDefinition.id)
      let canRecoverImportedPublicSubmissions = false
      if (await shouldHydrateRemoteCheckInsForPublicRecovery(userId, sessionDefinition, refreshedPublicSubmissions)) {
        try {
          await pullRemoteCheckIns(userId, { sessionDefinitionId: sessionDefinition.id })
          canRecoverImportedPublicSubmissions = true
        } catch {
          canRecoverImportedPublicSubmissions = false
        }
      }
      let publicImportResult = { imported: 0, conflicts: 0, superseded: 0 }
      try {
        publicImportResult = await importPublicCheckInSubmissions(userId, sessionDefinition, {
          recoverImportedWithoutLocalEntry: canRecoverImportedPublicSubmissions,
        })
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : 'Link-Check-ins konnten nicht synchronisiert werden.'
        setErrorMessage(`Link-Check-ins nicht aktualisiert: ${message}`)
      }
      if (publicImportResult.imported > 0) {
        await pushImportedPublicCheckIns()
      }
      if (publicImportResult.imported > 0 || publicImportResult.conflicts > 0) {
        setPublicCheckInNotice(
          `${publicImportResult.imported} Spieler-Check-ins uebernommen, ${publicImportResult.conflicts} Konflikte.`,
        )
      }
      if (
        publicImportResult.imported > 0 ||
        publicImportResult.conflicts > 0 ||
        publicImportResult.superseded > 0 ||
        canRecoverImportedPublicSubmissions
      ) {
        await refreshLocalCheckIns()
      } else {
        const [overview] = await Promise.all([
          getCheckInSyncOverview(userId),
        ])
        setSyncOverview(overview)
        setPublicCheckInLinks(refreshedPublicLinks.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
        setPublicCheckInSubmissions(refreshedPublicSubmissions)
      }
    })().finally(() => {
      publicRefreshInFlightRef.current = null
    })
    publicRefreshInFlightRef.current = refreshPromise
    return refreshPromise
  }, [pushImportedPublicCheckIns, refreshLocalCheckIns, sessionDefinition, userId])

  const runBackgroundSync = useCallback(async () => {
    if (!userId || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return
    }

    try {
      const overview = await pushPendingCheckIns(userId)
      setSyncOverview(await getCheckInSyncOverview(userId))
      if (overview.status !== 'error') {
        await refreshLocalCheckIns()
      }
      setErrorMessage(overview.status === 'error' ? overview.errorMessage ?? 'Check-in-Sync fehlgeschlagen.' : null)
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Check-in-Sync fehlgeschlagen.'
      setSyncOverview({
        ...(await getCheckInSyncOverview(userId)),
        status: 'error' as const,
        errorMessage: message,
      })
      setErrorMessage(`Lokal gespeichert, Sync offen: ${message}`)
    }
  }, [refreshLocalCheckIns, userId])

  useEffect(() => {
    Promise.resolve()
      .then(refreshLocalCheckIns)
      .catch(() => undefined)
  }, [refreshLocalCheckIns])

  // M1: einmal beim Mount/Session-Wechsel + beim Sichtbarwerden (Vordergrund) frisch ziehen.
  useEffect(() => {
    void refreshRemoteCheckInData()
  }, [refreshRemoteCheckInData])

  useEffect(() => {
    if (!userId || typeof document === 'undefined') {
      return undefined
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshRemoteCheckInData()
        void refreshPublicCheckIns().catch(() => undefined)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [refreshPublicCheckIns, refreshRemoteCheckInData, userId])

  useEffect(() => {
    if (!userId) {
      return undefined
    }

    const pollPublicCheckIns = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return
      }

      void refreshPublicCheckIns().catch(() => undefined)
    }
    const intervalId = window.setInterval(pollPublicCheckIns, 30_000)

    return () => window.clearInterval(intervalId)
  }, [refreshPublicCheckIns, userId])

  useEffect(() => {
    if (!userId) {
      return undefined
    }

    const handleOnline = () => {
      runSync()
    }
    const handleOffline = () => {
      refreshLocalCheckIns()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [refreshLocalCheckIns, runSync, userId])

  async function saveEntry(
    player: Player,
    patch: CheckInEntryPatch,
    manualTrafficLight?: TrafficLight | 'auto',
  ): Promise<SaveEntryResult> {
    if (!userId) {
      throw new Error('Login erforderlich.')
    }

    try {
      setErrorMessage(null)
      const sessionLog = sessionLogId
        ? { id: sessionLogId }
        : await ensureSessionLog(userId, sessionDefinition)

      const savedEntry = await saveCheckInEntry(userId, sessionLog.id, player, patch, manualTrafficLight)
      setSessionLogId(sessionLog.id)
      setEntries((currentEntries) => mergeRecordIntoList(currentEntries, savedEntry))
      setSyncOverview(await getCheckInSyncOverview(userId))
      if (typeof navigator === 'undefined' || navigator.onLine) {
        scheduleBackgroundSync(userId, 'check-ins', runBackgroundSync)
      }
      return { ok: true, entry: savedEntry }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Check-in konnte nicht gespeichert werden.'
      setErrorMessage(message)
      return { ok: false, error: message }
    }
  }

  async function saveKioskEntry(player: Player, patch: CheckInEntryPatch): Promise<SaveEntryResult> {
    if (!userId) {
      throw new Error('Login erforderlich.')
    }

    try {
      setErrorMessage(null)
      const sessionLog = sessionLogId
        ? { id: sessionLogId }
        : await ensureSessionLog(userId, sessionDefinition)

      const savedEntry = await saveKioskCheckInEntry(userId, sessionLog.id, player, patch)
      setSessionLogId(sessionLog.id)
      setEntries((currentEntries) => mergeRecordIntoList(currentEntries, savedEntry))
      setSyncOverview(await getCheckInSyncOverview(userId))
      if (typeof navigator === 'undefined' || navigator.onLine) {
        scheduleBackgroundSync(userId, 'check-ins', runBackgroundSync)
      }
      return { ok: true, entry: savedEntry }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Kiosk-Check-in konnte nicht gespeichert werden.'
      setErrorMessage(message)
      return { ok: false, error: message }
    }
  }

  async function resetEntry(entryId: string): Promise<SaveEntryResult> {
    if (!userId) {
      throw new Error('Login erforderlich.')
    }

    try {
      setErrorMessage(null)
      const resetEntry = await resetCheckInEntry(userId, entryId)
      setEntries((currentEntries) =>
        resetEntry.deletedAt
          ? currentEntries.filter((entry) => entry.id !== resetEntry.id)
          : mergeRecordIntoList(currentEntries, resetEntry),
      )
      setSyncOverview(await getCheckInSyncOverview(userId))
      if (typeof navigator === 'undefined' || navigator.onLine) {
        scheduleBackgroundSync(userId, 'check-ins', runBackgroundSync)
      }
      return { ok: true, entry: resetEntry }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Check-in konnte nicht zurückgesetzt werden.'
      setErrorMessage(message)
      return { ok: false, error: message }
    }
  }

  async function resetSessionCheckIns() {
    if (!userId) {
      return {
        ok: true as const,
        resetCount: 0,
        publicSubmissionResetCount: 0,
        retainedPostSessionCount: 0,
        sourceCounts: { coach: 0, player_link: 0, player_kiosk: 0, mixed: 0 },
      }
    }

    try {
      setErrorMessage(null)
      if (typeof navigator === 'undefined' || navigator.onLine) {
        await refreshRemotePublicCheckIns(userId, { sessionDefinitionId: sessionDefinition.id }).catch(() => undefined)
      }
      const [checkInResetResult, publicSubmissionResetCount] = await Promise.all([
        sessionLogId
          ? resetAllCheckInsForSession(userId, sessionLogId)
          : Promise.resolve({
              entries: [],
              resetCount: 0,
              deletedCount: 0,
              retainedPostSessionCount: 0,
              sourceCounts: { coach: 0, player_link: 0, player_kiosk: 0, mixed: 0 },
            }),
        resetPublicCheckInSubmissionsForSession(userId, sessionDefinition.id),
      ])
      const resetEntries = checkInResetResult.entries
      setEntries((currentEntries) => {
        const deletedEntryIds = new Set(resetEntries.filter((entry) => entry.deletedAt).map((entry) => entry.id))
        const nextEntries = currentEntries.filter((entry) => !deletedEntryIds.has(entry.id))

        for (const entry of resetEntries.filter((item) => !item.deletedAt)) {
          const index = nextEntries.findIndex((currentEntry) => currentEntry.id === entry.id)
          if (index >= 0) {
            nextEntries[index] = entry
          } else {
            nextEntries.push(entry)
          }
        }

        return nextEntries
      })
      setSyncOverview(await getCheckInSyncOverview(userId))
      if (typeof navigator === 'undefined' || navigator.onLine) {
        scheduleBackgroundSync(userId, 'check-ins', runBackgroundSync)
      }

      return {
        ok: true as const,
        resetCount: checkInResetResult.resetCount,
        publicSubmissionResetCount,
        retainedPostSessionCount: checkInResetResult.retainedPostSessionCount,
        sourceCounts: checkInResetResult.sourceCounts,
      }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Check-ins konnten nicht zurückgesetzt werden.'
      setErrorMessage(message)
      return { ok: false as const, error: message }
    }
  }

  async function saveSessionPatch(patch: SessionLogPatch) {
    if (!userId) {
      throw new Error('Login erforderlich.')
    }

    try {
      setErrorMessage(null)
      const savedSessionLog = await saveSessionLogPatch(userId, sessionDefinition, patch)
      setSessionLogId(savedSessionLog.id)
      setSessionLog(savedSessionLog)
      setSyncOverview(await getCheckInSyncOverview(userId))
      if (typeof navigator === 'undefined' || navigator.onLine) {
        scheduleBackgroundSync(userId, 'check-ins', runBackgroundSync)
      }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Training-Notiz konnte nicht gespeichert werden.'
      setErrorMessage(message)
    }
  }

  async function createPublicLink(): Promise<CreatedPublicCheckInLink | null> {
    if (!userId) {
      throw new Error('Login erforderlich.')
    }

    try {
      setErrorMessage(null)
      const createdLink = await createPublicCheckInLinkBundle(userId, sessionDefinition, activePlayers)
      await refreshLocalCheckIns()
      setPublicCheckInNotice('Check-in-Link erstellt.')
      return createdLink
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Check-in-Link konnte nicht erstellt werden.'
      setErrorMessage(message)
      return null
    }
  }

  async function closePublicLink(linkId: string) {
    if (!userId) {
      throw new Error('Login erforderlich.')
    }

    try {
      setErrorMessage(null)
      await closePublicCheckInLink(userId, linkId)
      await refreshLocalCheckIns()
      setPublicCheckInNotice('Check-in-Link geschlossen.')
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Check-in-Link konnte nicht geschlossen werden.'
      setErrorMessage(message)
    }
  }

  function getEntryForPlayer(player: Player) {
    const entry = entries.find((existingEntry) => existingEntry.playerId === player.id)

    if (entry) {
      return entry
    }

    const preview = buildEmptyEntry(userId ?? 'local-preview', sessionLogId ?? 'session-preview', player)

    return {
      ...preview,
      id: `preview:${sessionDefinition.id}:${player.id}`,
      clientUpdatedAt: sessionDefinition.date,
      createdAt: sessionDefinition.date,
      updatedAt: sessionDefinition.date,
      syncStatus: 'synced' as const,
      syncError: null,
    }
  }

  return {
    activePlayers,
    sessionEntries: entries,
    entries: activeEntries,
    errorMessage,
    expectedPlayerIds,
    warnings: activeWarnings,
    observations: activeObservations,
    syncOverview,
    isLoading,
    sessionLogId,
    publicCheckInLinks,
    publicCheckInSubmissions,
    publicCheckInNotice,
    refreshLocalCheckIns,
    runSync,
    saveEntry,
    saveKioskEntry,
    resetEntry,
    resetSessionCheckIns,
    saveSessionPatch,
    createPublicLink,
    closePublicLink,
    getEntryForPlayer,
    sessionLog,
    clearError: () => setErrorMessage(null),
  }
}
