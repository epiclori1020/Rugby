import type { BaselineEntry } from './baseline'
import { hasBaselineContent } from './baseline'
import type { PlayerSessionEntry, SessionLog } from './checkIn'
import { deriveAttendanceStatus } from './checkIn'
import type { Player } from './players'
import type { ProgressEntry } from './postSession'
import type { SessionType } from '../content/types'

export type ClosureStatus = 'offen' | 'teilweise_abgeschlossen' | 'abgeschlossen'

export type ClosureItemKind =
  | 'no_session_log'
  | 'attendance_open'
  | 'missing_srpe'
  | 'missing_duration'
  | 'missing_post_pain'
  | 'missing_e2_next_step'
  | 'session_status'
  | 'progression_advisory'
  | 'baseline_advisory'
  | 'backup_export'

export type ClosureItem = {
  kind: ClosureItemKind
  label: string
  count: number
  playerNames: string[]
}

export type PostSessionCompletion = {
  status: ClosureStatus
  blockers: ClosureItem[]
  advisories: ClosureItem[]
  needsBackupExport: boolean
}

export type DerivePostSessionCompletionInput = {
  activePlayers: Player[]
  sessionLog: SessionLog | null
  sessionType: SessionType
  entries: PlayerSessionEntry[]
  progressEntries: ProgressEntry[]
  baselineEntries: BaselineEntry[]
  lastExportAt: string | null
}

export type LatestRelevantPostSessionWork = {
  sessionLog: SessionLog
  completion: PostSessionCompletion
}

export type FindLatestRelevantPostSessionWorkInput = {
  activePlayers: Player[]
  sessionLogs: SessionLog[]
  entries: PlayerSessionEntry[]
  progressEntries: ProgressEntry[]
  baselineEntries: BaselineEntry[]
  lastExportAt: string | null
  todayKey: string
  getSessionType: (sessionDefinitionId: string) => SessionType
}

function item(kind: ClosureItemKind, label: string, playerNames: string[] = []): ClosureItem {
  return {
    kind,
    label,
    count: playerNames.length,
    playerNames,
  }
}

function playerNameById(players: Player[]) {
  return new Map(players.map((player) => [player.id, player.name]))
}

function entryByPlayerId(entries: PlayerSessionEntry[]) {
  return new Map(
    entries
      .filter((entry): entry is PlayerSessionEntry & { playerId: string } => Boolean(entry.playerId) && !entry.deletedAt)
      .map((entry) => [entry.playerId, entry]),
  )
}

function progressByPlayerId(progressEntries: ProgressEntry[]) {
  return new Map(
    progressEntries
      .filter((entry): entry is ProgressEntry & { playerId: string } => Boolean(entry.playerId) && !entry.deletedAt)
      .map((entry) => [entry.playerId, entry]),
  )
}

function baselineByPlayerId(baselineEntries: BaselineEntry[]) {
  return new Map(
    baselineEntries
      .filter((entry): entry is BaselineEntry & { playerId: string } => Boolean(entry.playerId) && !entry.deletedAt)
      .map((entry) => [entry.playerId, entry]),
  )
}

function hasProgressContent(entry: ProgressEntry | undefined) {
  if (!entry) {
    return false
  }

  return [
    entry.mainExercise,
    entry.load,
    entry.reps,
    entry.rpe,
    entry.powerOrSprint,
    entry.conditioning,
    entry.note,
  ].some((value) => value.trim().length > 0)
}

function hasHardPostSessionFlag(entry: PlayerSessionEntry, player: Player) {
  const trafficLight = entry.trafficLight ?? entry.trafficLightSuggestion
  const painIncreased =
    entry.painScore !== null && entry.postPainScore !== null && entry.postPainScore > entry.painScore

  return (
    trafficLight === 'yellow' ||
    trafficLight === 'red' ||
    entry.redFlag !== 'none' ||
    entry.movementConcern ||
    entry.limits.length > 0 ||
    entry.returnerFlag !== 'nein' ||
    player.returnerStatus !== 'nein' ||
    (entry.painScore !== null && entry.painScore > 0) ||
    (entry.postPainScore !== null && entry.postPainScore >= 3) ||
    painIncreased ||
    (entry.e2Decision !== null && entry.e2Decision !== 'normal')
  )
}

function progressionRelevant(entry: PlayerSessionEntry, progressEntry: ProgressEntry | undefined) {
  return (
    hasProgressContent(progressEntry) ||
    entry.nextStep !== null ||
    (entry.e2Decision !== null && entry.e2Decision !== 'normal')
  )
}

function backupIsNeeded(sessionLog: SessionLog, lastExportAt: string | null) {
  return sessionLog.status === 'completed' && (!lastExportAt || lastExportAt < sessionLog.clientUpdatedAt)
}

export function derivePostSessionCompletion({
  activePlayers,
  sessionLog,
  sessionType,
  entries,
  progressEntries,
  baselineEntries,
  lastExportAt,
}: DerivePostSessionCompletionInput): PostSessionCompletion {
  if (!sessionLog) {
    return {
      status: 'offen',
      blockers: activePlayers.length > 0 ? [item('no_session_log', 'Noch keine lokale Einheit fuer Nachbereitung.')] : [],
      advisories: [],
      needsBackupExport: false,
    }
  }

  const blockers: ClosureItem[] = []
  const advisories: ClosureItem[] = []
  const entriesByPlayer = entryByPlayerId(entries)
  const progressByPlayer = progressByPlayerId(progressEntries)
  const baselinesByPlayer = baselineByPlayerId(baselineEntries)
  const namesById = playerNameById(activePlayers)

  const openAttendanceNames: string[] = []
  const missingSrpeNames: string[] = []
  const missingPostPainNames: string[] = []
  const missingE2NextStepNames: string[] = []
  const progressionAdvisoryNames: string[] = []
  const baselineAdvisoryNames: string[] = []
  let presentCount = 0

  for (const player of activePlayers) {
    const entry = entriesByPlayer.get(player.id)
    const playerName = namesById.get(player.id) ?? player.name

    if (!entry || deriveAttendanceStatus(entry) === 'open') {
      openAttendanceNames.push(playerName)
      continue
    }

    if (!entry.present) {
      continue
    }

    presentCount += 1

    if (entry.sessionRpe === null) {
      missingSrpeNames.push(playerName)
    }

    const isFlagged = hasHardPostSessionFlag(entry, player)
    if (isFlagged && entry.postPainScore === null) {
      missingPostPainNames.push(playerName)
    }

    if (isFlagged && (!entry.e2Decision || !entry.nextStep)) {
      missingE2NextStepNames.push(playerName)
    }

    const progressEntry = progressByPlayer.get(player.id)
    if (progressionRelevant(entry, progressEntry) && !hasProgressContent(progressEntry)) {
      progressionAdvisoryNames.push(playerName)
    }

    if (
      (sessionType === 'baseline' || sessionType === 'recheck') &&
      !hasBaselineContent(
        baselinesByPlayer.get(player.id) ?? {
          broadJumpCm: null,
          medBallChestPassM: null,
          medBallWeightKg: null,
          sprint30m: null,
          note: '',
        },
      )
    ) {
      baselineAdvisoryNames.push(playerName)
    }
  }

  if (openAttendanceNames.length > 0) {
    blockers.push(item('attendance_open', 'Anwesenheit noch offen.', openAttendanceNames))
  }

  if (missingSrpeNames.length > 0) {
    blockers.push(item('missing_srpe', 'sRPE fehlt bei anwesenden Spielern.', missingSrpeNames))
  }

  if (presentCount > 0 && sessionLog.durationMinutes === null) {
    blockers.push(item('missing_duration', 'Dauer fehlt fuer belastbare Session Load.'))
  }

  if (missingPostPainNames.length > 0) {
    blockers.push(item('missing_post_pain', 'Post-Pain fehlt bei auffaelligen Spielern.', missingPostPainNames))
  }

  if (missingE2NextStepNames.length > 0) {
    blockers.push(item('missing_e2_next_step', 'E2 oder Next Step fehlt bei Auffaelligen.', missingE2NextStepNames))
  }

  if (sessionLog.status !== 'completed') {
    blockers.push(item('session_status', 'Einheit ist noch nicht als abgeschlossen markiert.'))
  }

  if (progressionAdvisoryNames.length > 0) {
    advisories.push(item('progression_advisory', 'Progression pruefen, wo Next Step/E2 relevant ist.', progressionAdvisoryNames))
  }

  if (baselineAdvisoryNames.length > 0) {
    advisories.push(item('baseline_advisory', 'Baseline/Re-Check ist optional offen.', baselineAdvisoryNames))
  }

  const needsBackupExport = backupIsNeeded(sessionLog, lastExportAt)
  if (needsBackupExport) {
    advisories.push(item('backup_export', 'Nach Abschluss JSON/CSV-Export als Zusatzbackup erstellen.'))
  }

  return {
    status: blockers.length === 0 ? 'abgeschlossen' : entries.length === 0 ? 'offen' : 'teilweise_abgeschlossen',
    blockers,
    advisories,
    needsBackupExport,
  }
}

export function findLatestRelevantPostSessionWork({
  activePlayers,
  sessionLogs,
  entries,
  progressEntries,
  baselineEntries,
  lastExportAt,
  todayKey,
  getSessionType,
}: FindLatestRelevantPostSessionWorkInput): LatestRelevantPostSessionWork | null {
  const eligibleSessionLogs = sessionLogs
    .filter((sessionLog) => !sessionLog.deletedAt && sessionLog.date <= todayKey)
    .sort((a, b) => {
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date)
      }

      return b.clientUpdatedAt.localeCompare(a.clientUpdatedAt)
    })

  let latestBackupOnly: LatestRelevantPostSessionWork | null = null

  for (const sessionLog of eligibleSessionLogs) {
    const sessionEntries = entries.filter((entry) => entry.sessionLogId === sessionLog.id && !entry.deletedAt)
    const completion = derivePostSessionCompletion({
      activePlayers,
      sessionLog,
      sessionType: getSessionType(sessionLog.sessionDefinitionId),
      entries: sessionEntries,
      progressEntries: progressEntries.filter((entry) => entry.sessionLogId === sessionLog.id && !entry.deletedAt),
      baselineEntries: baselineEntries.filter((entry) => entry.sessionLogId === sessionLog.id && !entry.deletedAt),
      lastExportAt,
    })

    if (completion.status !== 'abgeschlossen') {
      return { sessionLog, completion }
    }

    if (!latestBackupOnly && completion.needsBackupExport) {
      latestBackupOnly = { sessionLog, completion }
    }
  }

  return latestBackupOnly
}
