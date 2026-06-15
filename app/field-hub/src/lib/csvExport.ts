import type { BaselineEntry } from '../domain/baseline'
import type { PlayerSessionEntry, SessionLog } from '../domain/checkIn'
import type { Player } from '../domain/players'
import type { ProgressEntry } from '../domain/postSession'

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

function dateForSession(sessionLogId: string, sessionDateById: Map<string, string>) {
  return sessionDateById.get(sessionLogId) ?? ''
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
