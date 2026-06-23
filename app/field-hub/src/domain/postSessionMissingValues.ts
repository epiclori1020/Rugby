import { metricDefinitions, type MetricKey } from '../content/metricDefinitions'
import type { SessionType } from '../content/types'
import { deriveAttendanceStatus, type PlayerSessionEntry, type SessionLog } from './checkIn'
import type { MetricResult } from './metrics'
import type { Player } from './players'
import type { ProgressEntry } from './postSession'

export type MissingValueSeverity = 'required' | 'expected' | 'optional'

export type MissingValueTarget =
  | 'session'
  | 'post_session'
  | 'metric'
  | 'progression'
  | 'backup'

export type MissingValueKind =
  | 'missing_duration'
  | 'missing_srpe'
  | 'missing_post_pain'
  | 'missing_e2'
  | 'missing_next_step'
  | 'missing_progression'
  | 'missing_metric'
  | 'backup_export'

export type MissingPostSessionValue = {
  id: string
  severity: MissingValueSeverity
  kind: MissingValueKind
  target: MissingValueTarget
  label: string
  helperText: string
  playerId: string | null
  playerName: string | null
  sessionLogId: string | null
  fieldKey?: string
  metricKey?: MetricKey
  currentValueLabel?: string
}

export type DeriveMissingPostSessionValuesInput = {
  activePlayers: Player[]
  sessionLog: SessionLog | null
  sessionType: SessionType
  entries: PlayerSessionEntry[]
  progressEntries: ProgressEntry[]
  metricResults: MetricResult[]
  lastExportAt: string | null
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

function metricKeyByPlayerId(metricResults: MetricResult[]) {
  const result = new Map<string, Set<MetricKey>>()

  for (const metricResult of metricResults) {
    if (!metricResult.playerId || metricResult.deletedAt || !Number.isFinite(metricResult.value)) {
      continue
    }

    const playerMetricKeys = result.get(metricResult.playerId) ?? new Set<MetricKey>()
    playerMetricKeys.add(metricResult.metricKey)
    result.set(metricResult.playerId, playerMetricKeys)
  }

  return result
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

function playerMissingValue(
  base: Omit<MissingPostSessionValue, 'id' | 'sessionLogId'> & { sessionLogId?: string | null },
): MissingPostSessionValue {
  const idParts = [
    base.kind,
    base.playerId ?? 'session',
    base.fieldKey ?? null,
    base.metricKey ?? null,
  ].filter(Boolean)

  return {
    ...base,
    id: idParts.join(':'),
    sessionLogId: base.sessionLogId ?? null,
  }
}

export function deriveMissingPostSessionValues({
  activePlayers,
  sessionLog,
  sessionType,
  entries,
  progressEntries,
  metricResults,
  lastExportAt,
}: DeriveMissingPostSessionValuesInput): MissingPostSessionValue[] {
  if (!sessionLog) {
    return []
  }

  const required: MissingPostSessionValue[] = []
  const expected: MissingPostSessionValue[] = []
  const optional: MissingPostSessionValue[] = []
  const entriesByPlayer = entryByPlayerId(entries)
  const progressByPlayer = progressByPlayerId(progressEntries)
  const metricKeysByPlayer = metricKeyByPlayerId(metricResults)
  const presentPlayers = activePlayers.filter((player) => {
    const entry = entriesByPlayer.get(player.id)
    return entry && deriveAttendanceStatus(entry) === 'present'
  })

  if (presentPlayers.length > 0 && sessionLog.durationMinutes === null) {
    required.push({
      id: 'missing_duration:session',
      severity: 'required',
      kind: 'missing_duration',
      target: 'session',
      label: 'Dauer nachtragen',
      helperText: 'Ohne Dauer kann die Session Load nicht belastbar berechnet werden.',
      playerId: null,
      playerName: null,
      sessionLogId: sessionLog.id,
      fieldKey: 'durationMinutes',
    })
  }

  for (const player of activePlayers) {
    const entry = entriesByPlayer.get(player.id)
    if (!entry || deriveAttendanceStatus(entry) !== 'present') {
      continue
    }

    if (entry.sessionRpe === null) {
      required.push(
        playerMissingValue({
          severity: 'required',
          kind: 'missing_srpe',
          target: 'post_session',
          label: 'sRPE nachtragen',
          helperText: 'Subjektive Belastung 0-10 fuer die gesamte Einheit.',
          playerId: player.id,
          playerName: player.name,
          sessionLogId: entry.sessionLogId,
          fieldKey: 'sessionRpe',
        }),
      )
    }

    const isFlagged = hasHardPostSessionFlag(entry, player)
    if (isFlagged && entry.postPainScore === null) {
      required.push(
        playerMissingValue({
          severity: 'required',
          kind: 'missing_post_pain',
          target: 'post_session',
          label: 'Post-Pain nachtragen',
          helperText: 'Bei auffaelligen Spielern kurz pruefen, ob Schmerz/Issue nach Training offen ist.',
          playerId: player.id,
          playerName: player.name,
          sessionLogId: entry.sessionLogId,
          fieldKey: 'postPainScore',
        }),
      )
    }

    if (isFlagged && !entry.e2Decision) {
      required.push(
        playerMissingValue({
          severity: 'required',
          kind: 'missing_e2',
          target: 'post_session',
          label: 'E2 festlegen',
          helperText: 'Naechste Einheit anpassen oder normal freigeben; keine medizinische Freigabe.',
          playerId: player.id,
          playerName: player.name,
          sessionLogId: entry.sessionLogId,
          fieldKey: 'e2Decision',
        }),
      )
    }

    if (isFlagged && !entry.nextStep) {
      required.push(
        playerMissingValue({
          severity: 'required',
          kind: 'missing_next_step',
          target: 'post_session',
          label: 'Next Step festlegen',
          helperText: 'Steigern, halten, reduzieren oder klaeren fuer die naechste Einheit.',
          playerId: player.id,
          playerName: player.name,
          sessionLogId: entry.sessionLogId,
          fieldKey: 'nextStep',
        }),
      )
    }

    const progressEntry = progressByPlayer.get(player.id)
    if (progressionRelevant(entry, progressEntry) && !hasProgressContent(progressEntry)) {
      expected.push(
        playerMissingValue({
          severity: 'expected',
          kind: 'missing_progression',
          target: 'progression',
          label: 'Progression nachtragen',
          helperText: 'Mindestens Hauptuebung oder kurze Progressionsnotiz sichern.',
          playerId: player.id,
          playerName: player.name,
          sessionLogId: entry.sessionLogId,
          fieldKey: 'mainExercise',
        }),
      )
    }

    if (sessionType === 'baseline' || sessionType === 'recheck') {
      const playerMetricKeys = metricKeysByPlayer.get(player.id) ?? new Set<MetricKey>()
      for (const definition of metricDefinitions) {
        if (!definition.active || definition.status !== 'active') {
          continue
        }

        if (!playerMetricKeys.has(definition.key)) {
          optional.push(
            playerMissingValue({
              severity: 'optional',
              kind: 'missing_metric',
              target: 'metric',
              label: `${definition.name} nachtragen`,
              helperText: `${definition.name} (${definition.unit}) optional erfassen, wenn Timing und Ablauf passen.`,
              playerId: player.id,
              playerName: player.name,
              sessionLogId: entry.sessionLogId,
              metricKey: definition.key,
              fieldKey: 'value',
            }),
          )
        }
      }
    }
  }

  if (backupIsNeeded(sessionLog, lastExportAt)) {
    optional.push({
      id: 'backup_export:session',
      severity: 'optional',
      kind: 'backup_export',
      target: 'backup',
      label: 'Backup exportieren',
      helperText: 'Nach abgeschlossener Einheit JSON/CSV als Zusatzbackup erstellen.',
      playerId: null,
      playerName: null,
      sessionLogId: sessionLog.id,
    })
  }

  return [...required, ...expected, ...optional]
}
