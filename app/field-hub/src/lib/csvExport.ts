import type { BaselineEntry } from '../domain/baseline'
import type { PlayerSessionEntry, SessionLog } from '../domain/checkIn'
import { getExerciseDefinition, type ExerciseResult } from '../domain/exercises'
import type { PlayerExposureSummary } from '../domain/exposures'
import { getMetricDefinition, type MetricResult } from '../domain/metrics'
import type { Player } from '../domain/players'
import type { ProgressEntry } from '../domain/postSession'
import type { SessionBlockLog } from '../domain/sessionBlocks'

type CsvValue = string | number | boolean | null | undefined

function normalizeCsvValue(value: CsvValue) {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'boolean') {
    return value ? 'ja' : 'nein'
  }

  return String(value)
}

function escapeCsvValue(value: CsvValue) {
  const normalized = normalizeCsvValue(value)

  if (/[;"\r\n]/.test(normalized)) {
    return `"${normalized.replaceAll('"', '""')}"`
  }

  return normalized
}

export function buildCsv(headers: string[], rows: CsvValue[][]) {
  return [
    `\uFEFF${headers.map(escapeCsvValue).join(';')}`,
    ...rows.map((row) => row.map(escapeCsvValue).join(';')),
  ].join('\r\n')
}

function dateForSession(sessionLogId: string | null, sessionDateById: Map<string, string>) {
  return sessionLogId ? (sessionDateById.get(sessionLogId) ?? '') : ''
}

function playerName(playerId: string | null, playerNameById: Map<string, string>) {
  if (playerId === null) {
    return 'Geloeschter Spieler'
  }

  return playerNameById.get(playerId) ?? playerId
}

export function buildPlayersCsv(players: Player[]) {
  return buildCsv(
    ['Name', 'Position', 'Cluster', 'Aktiv', 'Geloescht am', 'Consent', 'Foto-Erlaubnis', 'Returner', 'Notizen'],
    players.map((player) => [
      player.name,
      player.position,
      player.cluster,
      player.active,
      player.deletedAt,
      player.consentStatus,
      player.photoConsentStatus,
      player.returnerStatus,
      player.notes,
    ]),
  )
}

export function buildCheckInsCsv(
  entries: PlayerSessionEntry[],
  players: Player[],
  sessionLogs: SessionLog[],
) {
  const playerNameById = new Map(players.map((player) => [player.id, player.name]))
  const sessionDateById = new Map(sessionLogs.map((sessionLog) => [sessionLog.id, sessionLog.date]))

  return buildCsv(
    [
      'Session',
      'Spieler',
      'Anwesend',
      'Readiness',
      'Life-Flag',
      'Pain',
      'Pain-Ort',
      'Reaktion',
      'Returner',
      'Ampel',
      'Limits',
      'Beobachtung',
      'sRPE',
      'Dauer',
      'Load',
      'Post-Pain',
      'E2',
      'Naechster Schritt',
    ],
    entries.map((entry) => [
      dateForSession(entry.sessionLogId, sessionDateById),
      playerName(entry.playerId, playerNameById),
      entry.present,
      entry.readiness,
      entry.lifeFlag,
      entry.painScore,
      entry.painLocation,
      entry.sessionReaction,
      entry.returnerFlag,
      entry.trafficLight ?? entry.trafficLightSuggestion,
      entry.limits.join(', '),
      entry.observation,
      entry.sessionRpe,
      entry.durationMinutes,
      entry.sessionLoad,
      entry.postPainScore,
      entry.e2Decision,
      entry.nextStep,
    ]),
  )
}

export function buildProgressCsv(
  entries: ProgressEntry[],
  players: Player[],
  sessionLogs: SessionLog[],
) {
  const playerNameById = new Map(players.map((player) => [player.id, player.name]))
  const sessionDateById = new Map(sessionLogs.map((sessionLog) => [sessionLog.id, sessionLog.date]))

  return buildCsv(
    ['Session', 'Spieler', 'Hauptuebung', 'Last', 'Reps', 'RPE', 'Power/Sprint', 'Conditioning', 'Notiz'],
    entries.map((entry) => [
      dateForSession(entry.sessionLogId, sessionDateById),
      playerName(entry.playerId, playerNameById),
      entry.mainExercise,
      entry.load,
      entry.reps,
      entry.rpe,
      entry.powerOrSprint,
      entry.conditioning,
      entry.note,
    ]),
  )
}

export function buildBaselineCsv(
  entries: BaselineEntry[],
  players: Player[],
  sessionLogs: SessionLog[],
) {
  const playerNameById = new Map(players.map((player) => [player.id, player.name]))
  const sessionDateById = new Map(sessionLogs.map((sessionLog) => [sessionLog.id, sessionLog.date]))

  return buildCsv(
    ['Session', 'Spieler', 'Broad Jump cm', 'Med-Ball Chest Pass m', 'Med-Ball kg', '30 m spaeter/optional', 'Notiz'],
    entries.map((entry) => [
      dateForSession(entry.sessionLogId, sessionDateById),
      playerName(entry.playerId, playerNameById),
      entry.broadJumpCm,
      entry.medBallChestPassM,
      entry.medBallWeightKg,
      entry.sprint30m,
      entry.note,
    ]),
  )
}

export function buildSessionBlocksCsv(entries: SessionBlockLog[], sessionLogs: SessionLog[]) {
  const sessionDateById = new Map(sessionLogs.map((sessionLog) => [sessionLog.id, sessionLog.date]))

  return buildCsv(
    [
      'Session',
      'Session Definition',
      'Block Order',
      'Block Key',
      'Block',
      'Geplante Zeit',
      'Geplante Arbeit',
      'Status',
      'Grund',
      'Notiz',
    ],
    entries.map((entry) => [
      dateForSession(entry.sessionLogId, sessionDateById),
      entry.sessionDefinitionId,
      entry.blockOrder,
      entry.blockKey,
      entry.blockTitle,
      entry.plannedTime,
      entry.plannedWork,
      entry.status,
      entry.reason,
      entry.coachNote,
    ]),
  )
}

export function buildExposureSummariesCsv(
  entries: PlayerExposureSummary[],
  players: Player[],
  sessionLogs: SessionLog[],
) {
  const playerNameById = new Map(players.map((player) => [player.id, player.name]))
  const sessionDateById = new Map(sessionLogs.map((sessionLog) => [sessionLog.id, sessionLog.date]))

  return buildCsv(
    [
      'Session',
      'Spieler',
      'Speed',
      'Acceleration',
      'COD/Decel',
      'Lower Strength',
      'Upper Strength',
      'Power',
      'Conditioning',
      'Contact Prep',
      'Neck/Trunk',
      'Mobility',
      'Reconditioning',
      'Coach-Notiz',
    ],
    entries.map((entry) => [
      entry.sessionLogId ? dateForSession(entry.sessionLogId, sessionDateById) : entry.sessionDate,
      playerName(entry.playerId, playerNameById),
      entry.statuses.speed,
      entry.statuses.acceleration,
      entry.statuses.cod_decel,
      entry.statuses.lower_strength,
      entry.statuses.upper_strength,
      entry.statuses.power,
      entry.statuses.conditioning,
      entry.statuses.contact_prep,
      entry.statuses.neck_trunk,
      entry.statuses.mobility,
      entry.statuses.reconditioning,
      entry.coachNote,
    ]),
  )
}

export function buildMetricResultsCsv(
  entries: MetricResult[],
  players: Player[],
  sessionLogs: SessionLog[],
) {
  const playerNameById = new Map(players.map((player) => [player.id, player.name]))
  const sessionDateById = new Map(sessionLogs.map((sessionLog) => [sessionLog.id, sessionLog.date]))

  return buildCsv(
    ['Session', 'Spieler', 'Metric', 'Einheit', 'Wert', 'Attempt', 'Gueltig', 'Seite', 'Kontext'],
    entries.map((entry) => {
      const definition = getMetricDefinition(entry.metricKey)

      return [
        entry.sessionLogId ? dateForSession(entry.sessionLogId, sessionDateById) : '',
        playerName(entry.playerId, playerNameById),
        definition.name,
        definition.unit,
        entry.value,
        entry.attempt,
        entry.isValid,
        entry.bodySide,
        entry.contextNote,
      ]
    }),
  )
}

export function buildExerciseResultsCsv(
  entries: ExerciseResult[],
  players: Player[],
  sessionLogs: SessionLog[],
) {
  const playerNameById = new Map(players.map((player) => [player.id, player.name]))
  const sessionDateById = new Map(sessionLogs.map((sessionLog) => [sessionLog.id, sessionLog.date]))

  return buildCsv(
    [
      'Session',
      'Spieler',
      'Uebung',
      'Pattern',
      'Variante',
      'Sets',
      'Reps',
      'Last',
      'Einheit',
      'RPE',
      'RIR',
      'Technik',
      'Pain Response',
      'Notiz',
    ],
    entries.map((entry) => {
      const definition = getExerciseDefinition(entry.exerciseKey)

      return [
        dateForSession(entry.sessionLogId, sessionDateById),
        playerName(entry.playerId, playerNameById),
        definition.name,
        definition.pattern,
        entry.variant,
        entry.sets,
        entry.reps,
        entry.loadValue,
        entry.loadUnit,
        entry.rpe,
        entry.rir,
        entry.techniqueQuality,
        entry.painResponse,
        entry.notes,
      ]
    }),
  )
}

export function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
