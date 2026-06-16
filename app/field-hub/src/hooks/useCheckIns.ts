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
  saveSessionLogPatch,
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
  type CreatedPublicCheckInLink,
} from '../lib/publicCheckInRepository'

const REMOTE_PULL_THROTTLE_MS = 30_000

type SaveEntryResult =
  | { ok: true; entry: PlayerSessionEntry }
  | { ok: false; error: string }

export function useCheckIns(
  userId: string | null,
  sessionDefinition: SessionDefinition,
  players: Player[],
  enablePublicCheckInPolling = false,
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
      const publicImportResult = await importPublicCheckInSubmissions(userId, sessionDefinition).catch(() => null)
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

  const refreshPublicCheckIns = useCallback(async () => {
    if (!userId || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return
    }

    if (publicRefreshInFlightRef.current) {
      return publicRefreshInFlightRef.current
    }

    const refreshPromise = (async () => {
      await refreshRemotePublicCheckIns(userId, { sessionDefinitionId: sessionDefinition.id })
      const publicImportResult = await importPublicCheckInSubmissions(userId, sessionDefinition)
      if (publicImportResult.imported > 0 || publicImportResult.conflicts > 0) {
        setPublicCheckInNotice(
          `${publicImportResult.imported} Spieler-Check-ins uebernommen, ${publicImportResult.conflicts} Konflikte.`,
        )
      }
      if (publicImportResult.imported > 0 || publicImportResult.conflicts > 0 || publicImportResult.superseded > 0) {
        await refreshLocalCheckIns()
      } else {
        const [overview, localPublicLinks] = await Promise.all([
          getCheckInSyncOverview(userId),
          listLocalPublicCheckInLinks(userId, sessionDefinition.id),
        ])
        setSyncOverview(overview)
        setPublicCheckInLinks(localPublicLinks.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
        setPublicCheckInSubmissions(
          (
            await Promise.all(localPublicLinks.map((link) => listLocalPublicCheckInSubmissions(userId, link.id)))
          ).flat(),
        )
      }
    })().finally(() => {
      publicRefreshInFlightRef.current = null
    })
    publicRefreshInFlightRef.current = refreshPromise
    return refreshPromise
  }, [refreshLocalCheckIns, sessionDefinition, userId])

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
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [refreshRemoteCheckInData, userId])

  useEffect(() => {
    if (!userId || !enablePublicCheckInPolling) {
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
  }, [enablePublicCheckInPolling, refreshPublicCheckIns, userId])

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
    saveSessionPatch,
    createPublicLink,
    closePublicLink,
    getEntryForPlayer,
    sessionLog,
    clearError: () => setErrorMessage(null),
  }
}
