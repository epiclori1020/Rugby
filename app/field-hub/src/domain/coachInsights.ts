import type { SessionDefinition } from '../content/types'
import { deriveAttendanceStatus, type PlayerSessionEntry, type SessionLog } from './checkIn'
import type { PlayerExposureSummary } from './exposures'
import { buildLoadSpikeRatio, buildRollingLoadFromPoints, dateDaysBefore } from './loadAnalysis'
import type { Player } from './players'
import { hasCompleteReturnerCaps, type ReturnerEntry } from './returners'
import type { SessionBlockLog } from './sessionBlocks'

export type CoachInsightSeverity = 'high' | 'medium' | 'low'

export type CoachInsightRule =
  | 'speed_gap_14d'
  | 'consecutive_yellow_red'
  | 'missing_srpe_completed_session'
  | 'returner_caps_missing_decision'
  | 'consecutive_skipped_planned_block'
  | 'post_pain_missing_next_step'
  | 'load_spike'
  | 'contact_exposure_pattern'

export type CoachInsightTargetTab = 'spieler' | 'check-in' | 'training' | 'nachbereitung' | 'returner' | 'analysis'

export type CoachInsightSourceTable =
  | 'players'
  | 'session_logs'
  | 'player_session_entries'
  | 'returner_entries'
  | 'session_block_logs'
  | 'player_exposure_summaries'

export type CoachInsightSource = {
  playerId: string | null
  playerName: string | null
  sessionLogId: string | null
  sessionDefinitionId: string | null
  sessionDate: string
  table: CoachInsightSourceTable
  recordId: string
  correctionTarget: CoachInsightTargetTab
}

export type CoachInsight = {
  id: string
  rule: CoachInsightRule
  severity: CoachInsightSeverity
  title: string
  reason: string
  sources: CoachInsightSource[]
  targetTab: CoachInsightTargetTab
  correctionHint?: string
}

export type BuildCoachInsightsInput = {
  players: Player[]
  sessionDefinitions: SessionDefinition[]
  sessionLogs: SessionLog[]
  entries: PlayerSessionEntry[]
  returnerEntries: ReturnerEntry[]
  sessionBlockLogs: SessionBlockLog[]
  exposureSummaries: PlayerExposureSummary[]
  todayKey: string
}

const insightSeverityRank: Record<CoachInsightSeverity, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

const watchedBlockTypes = ['speed', 'contact_prep', 'conditioning'] as const

function inDateRange(date: string, startDate: string, endDate: string) {
  return date >= startDate && date <= endDate
}

function playerName(playersById: Map<string, Player>, playerId: string | null) {
  return playerId ? (playersById.get(playerId)?.name ?? null) : null
}

function sourceFromEntry(
  entry: PlayerSessionEntry,
  sessionLogById: Map<string, SessionLog>,
  playersById: Map<string, Player>,
  correctionTarget: CoachInsightTargetTab,
): CoachInsightSource {
  const sessionLog = sessionLogById.get(entry.sessionLogId) ?? null

  return {
    playerId: entry.playerId,
    playerName: playerName(playersById, entry.playerId),
    sessionLogId: entry.sessionLogId,
    sessionDefinitionId: sessionLog?.sessionDefinitionId ?? null,
    sessionDate: sessionLog?.date ?? entry.createdAt.slice(0, 10),
    table: 'player_session_entries',
    recordId: entry.id,
    correctionTarget,
  }
}

function sourceFromReturner(
  entry: ReturnerEntry,
  sessionLogById: Map<string, SessionLog>,
  playersById: Map<string, Player>,
): CoachInsightSource {
  const sessionLog = sessionLogById.get(entry.sessionLogId) ?? null

  return {
    playerId: entry.playerId,
    playerName: playerName(playersById, entry.playerId),
    sessionLogId: entry.sessionLogId,
    sessionDefinitionId: sessionLog?.sessionDefinitionId ?? null,
    sessionDate: sessionLog?.date ?? entry.createdAt.slice(0, 10),
    table: 'returner_entries',
    recordId: entry.id,
    correctionTarget: 'returner',
  }
}

function sourceFromBlockLog(entry: SessionBlockLog, sessionLogById: Map<string, SessionLog>): CoachInsightSource {
  const sessionLog = sessionLogById.get(entry.sessionLogId) ?? null

  return {
    playerId: null,
    playerName: null,
    sessionLogId: entry.sessionLogId,
    sessionDefinitionId: entry.sessionDefinitionId,
    sessionDate: sessionLog?.date ?? entry.createdAt.slice(0, 10),
    table: 'session_block_logs',
    recordId: entry.id,
    correctionTarget: 'training',
  }
}

function sourceFromExposure(
  summary: PlayerExposureSummary,
  playersById: Map<string, Player>,
): CoachInsightSource {
  return {
    playerId: summary.playerId,
    playerName: playerName(playersById, summary.playerId),
    sessionLogId: summary.sessionLogId,
    sessionDefinitionId: summary.sessionDefinitionId,
    sessionDate: summary.sessionDate,
    table: 'player_exposure_summaries',
    recordId: summary.id,
    correctionTarget: 'nachbereitung',
  }
}

function sourceFromPlayer(player: Player, todayKey: string): CoachInsightSource {
  return {
    playerId: player.id,
    playerName: player.name,
    sessionLogId: null,
    sessionDefinitionId: null,
    sessionDate: todayKey,
    table: 'players',
    recordId: player.id,
    correctionTarget: 'spieler',
  }
}

function sourceForTeamLoad(entries: PlayerSessionEntry[], sessionLogById: Map<string, SessionLog>): CoachInsightSource[] {
  return entries.slice(0, 4).map((entry) => {
    const sessionLog = sessionLogById.get(entry.sessionLogId) ?? null

    return {
      playerId: null,
      playerName: null,
      sessionLogId: entry.sessionLogId,
      sessionDefinitionId: sessionLog?.sessionDefinitionId ?? null,
      sessionDate: sessionLog?.date ?? entry.createdAt.slice(0, 10),
      table: 'player_session_entries',
      recordId: entry.id,
      correctionTarget: 'analysis',
    }
  })
}

function sortEntriesNewestFirst(entries: PlayerSessionEntry[], sessionLogById: Map<string, SessionLog>) {
  return [...entries].sort((a, b) => {
    const dateA = sessionLogById.get(a.sessionLogId)?.date ?? a.createdAt.slice(0, 10)
    const dateB = sessionLogById.get(b.sessionLogId)?.date ?? b.createdAt.slice(0, 10)
    if (dateA !== dateB) {
      return dateB.localeCompare(dateA)
    }

    return b.clientUpdatedAt.localeCompare(a.clientUpdatedAt)
  })
}

function sortInsights(insights: CoachInsight[]) {
  return insights.sort((a, b) => {
    const severityDiff = insightSeverityRank[a.severity] - insightSeverityRank[b.severity]
    if (severityDiff !== 0) {
      return severityDiff
    }

    if (a.rule === 'load_spike' && b.rule === 'load_spike') {
      const aIsTeam = a.id.includes(':team:')
      const bIsTeam = b.id.includes(':team:')
      if (aIsTeam !== bIsTeam) {
        return aIsTeam ? -1 : 1
      }
    }

    return a.id.localeCompare(b.id)
  })
}

function buildSpeedGapInsights(input: {
  activePlayers: Player[]
  entries: PlayerSessionEntry[]
  exposureSummaries: PlayerExposureSummary[]
  sessionLogById: Map<string, SessionLog>
  todayKey: string
}) {
  const startDate = dateDaysBefore(input.todayKey, 14)

  return input.activePlayers.flatMap((player) => {
    const attendedEntries = input.entries.filter((entry) => {
      const sessionDate = input.sessionLogById.get(entry.sessionLogId)?.date ?? ''
      return entry.playerId === player.id && deriveAttendanceStatus(entry) === 'present' && inDateRange(sessionDate, startDate, input.todayKey)
    })

    if (attendedEntries.length === 0) {
      return []
    }

    const hasSpeedExposure = input.exposureSummaries.some((summary) => {
      return (
        summary.playerId === player.id &&
        !summary.deletedAt &&
        inDateRange(summary.sessionDate, startDate, input.todayKey) &&
        (summary.statuses.speed === 'completed' ||
          summary.statuses.speed === 'reduced' ||
          summary.statuses.acceleration === 'completed' ||
          summary.statuses.acceleration === 'reduced')
      )
    })

    if (hasSpeedExposure) {
      return []
    }

    return [
      {
        id: `coach-insight:speed_gap_14d:${player.id}:${input.todayKey}`,
        rule: 'speed_gap_14d',
        severity: 'medium',
        title: 'Speed Exposure pruefen',
        reason: `${player.name} war in den letzten 14 Tagen dabei, aber ohne dokumentierte Speed- oder Acceleration-Exposure.`,
        targetTab: 'nachbereitung',
        correctionHint: 'Exposure-Summary in Nachbereitung pruefen oder naechste Speed-Exposure planen.',
        sources: [sourceFromPlayer(player, input.todayKey)],
      } satisfies CoachInsight,
    ]
  })
}

function buildConsecutiveTrafficInsights(input: {
  activePlayers: Player[]
  entries: PlayerSessionEntry[]
  sessionLogById: Map<string, SessionLog>
  playersById: Map<string, Player>
}) {
  return input.activePlayers.flatMap((player) => {
    const latestAttended = sortEntriesNewestFirst(
      input.entries.filter((entry) => entry.playerId === player.id && deriveAttendanceStatus(entry) === 'present'),
      input.sessionLogById,
    ).slice(0, 2)

    if (latestAttended.length < 2) {
      return []
    }

    const bothYellowOrRed = latestAttended.every((entry) => {
      const trafficLight = entry.trafficLight ?? entry.trafficLightSuggestion
      return trafficLight === 'yellow' || trafficLight === 'red'
    })

    if (!bothYellowOrRed) {
      return []
    }

    return [
      {
        id: `coach-insight:consecutive_yellow_red:${player.id}:${latestAttended.map((entry) => entry.id).join(':')}`,
        rule: 'consecutive_yellow_red',
        severity: 'high',
        title: 'Zwei Einheiten Gelb/Rot',
        reason: `${player.name} war in zwei teilgenommenen Sessions hintereinander gelb oder rot.`,
        targetTab: 'check-in',
        correctionHint: 'Check-in und naechste Trainingsanpassung pruefen.',
        sources: latestAttended.map((entry) => sourceFromEntry(entry, input.sessionLogById, input.playersById, 'check-in')),
      } satisfies CoachInsight,
    ]
  })
}

function buildMissingSrpeInsights(input: {
  entries: PlayerSessionEntry[]
  sessionLogById: Map<string, SessionLog>
  playersById: Map<string, Player>
}) {
  return input.entries.flatMap((entry) => {
    const sessionLog = input.sessionLogById.get(entry.sessionLogId)
    if (!sessionLog || sessionLog.status !== 'completed' || deriveAttendanceStatus(entry) !== 'present' || entry.sessionRpe !== null) {
      return []
    }

    const name = playerName(input.playersById, entry.playerId) ?? 'Spieler'
    return [
      {
        id: `coach-insight:missing_srpe_completed_session:${entry.id}`,
        rule: 'missing_srpe_completed_session',
        severity: 'medium',
        title: 'sRPE fehlt',
        reason: `${name} war anwesend, aber sRPE ist nach abgeschlossener Session noch offen.`,
        targetTab: 'nachbereitung',
        correctionHint: 'In Nachbereitung sRPE nachtragen oder bewusst offen lassen.',
        sources: [sourceFromEntry(entry, input.sessionLogById, input.playersById, 'nachbereitung')],
      } satisfies CoachInsight,
    ]
  })
}

function buildReturnerDecisionInsights(input: {
  returnerEntries: ReturnerEntry[]
  sessionLogById: Map<string, SessionLog>
  playersById: Map<string, Player>
}) {
  return input.returnerEntries.flatMap((entry) => {
    if (entry.deletedAt || !hasCompleteReturnerCaps(entry) || entry.decision !== null) {
      return []
    }

    const name = playerName(input.playersById, entry.playerId) ?? 'Returner'
    return [
      {
        id: `coach-insight:returner_caps_missing_decision:${entry.id}`,
        rule: 'returner_caps_missing_decision',
        severity: 'medium',
        title: 'Returner Next Step fehlt',
        reason: `${name} hat dokumentierte Caps und Completed-Feld, aber keine Entscheidung fuer den naechsten Schritt.`,
        targetTab: 'returner',
        correctionHint: 'Im Returner-Tab Entscheidung setzen: bleiben, steigern, reduzieren oder rueckmelden.',
        sources: [sourceFromReturner(entry, input.sessionLogById, input.playersById)],
      } satisfies CoachInsight,
    ]
  })
}

function buildSkippedBlockInsights(input: {
  sessionDefinitions: SessionDefinition[]
  sessionLogs: SessionLog[]
  sessionBlockLogs: SessionBlockLog[]
  sessionLogById: Map<string, SessionLog>
}) {
  const definitionById = new Map(input.sessionDefinitions.map((definition) => [definition.id, definition]))
  const blockLogBySessionAndKey = new Map(
    input.sessionBlockLogs
      .filter((log) => !log.deletedAt)
      .map((log) => [`${log.sessionLogId}:${log.blockKey}`, log]),
  )
  const eventsByType = new Map<
    (typeof watchedBlockTypes)[number],
    Array<{ sessionDate: string; log: SessionBlockLog | null }>
  >()

  for (const sessionLog of input.sessionLogs.filter((log) => !log.deletedAt).sort((a, b) => a.date.localeCompare(b.date))) {
    const definition = definitionById.get(sessionLog.sessionDefinitionId)
    if (!definition) {
      continue
    }

    for (const type of watchedBlockTypes) {
      const relevantBlocks = definition.timeline.filter((block) => block.exposureTags?.includes(type))
      if (relevantBlocks.length === 0) {
        continue
      }

      const skippedLog = relevantBlocks
        .map((block) => blockLogBySessionAndKey.get(`${sessionLog.id}:${block.key}`) ?? null)
        .find((log): log is SessionBlockLog => Boolean(log && log.status === 'skipped'))

      eventsByType.set(type, [...(eventsByType.get(type) ?? []), { sessionDate: sessionLog.date, log: skippedLog ?? null }])
    }
  }

  return [...eventsByType.entries()].flatMap(([type, events]) => {
    let latestPair: Array<{ sessionDate: string; log: SessionBlockLog }> | null = null
    for (let index = 1; index < events.length; index += 1) {
      const previousEvent = events[index - 1]
      const currentEvent = events[index]
      if (previousEvent.log && currentEvent.log) {
        latestPair = [
          { sessionDate: previousEvent.sessionDate, log: previousEvent.log },
          { sessionDate: currentEvent.sessionDate, log: currentEvent.log },
        ]
      }
    }

    if (!latestPair) {
      return []
    }

    const label = type === 'contact_prep' ? 'Contact Prep' : type === 'conditioning' ? 'Conditioning' : 'Speed'
    const sources = latestPair
      .map(({ log }) => sourceFromBlockLog(log, input.sessionLogById))
      .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))

    return [
      {
        id: `coach-insight:consecutive_skipped_planned_block:${type}:${latestPair.map(({ log }) => log.id).join(':')}`,
        rule: 'consecutive_skipped_planned_block',
        severity: 'medium',
        title: `${label} zweimal gestrichen`,
        reason: `${label} war in zwei relevanten Sessions geplant und wurde jeweils gestrichen.`,
        targetTab: 'training',
        correctionHint: 'Training-Blockstatus pruefen und naechste Einheit bewusst planen.',
        sources,
      } satisfies CoachInsight,
    ]
  })
}

function buildPostPainInsights(input: {
  entries: PlayerSessionEntry[]
  sessionLogById: Map<string, SessionLog>
  playersById: Map<string, Player>
}) {
  return input.entries.flatMap((entry) => {
    if (entry.postPainScore === null || entry.postPainScore < 3 || entry.e2Decision !== null || entry.nextStep !== null) {
      return []
    }

    const name = playerName(input.playersById, entry.playerId) ?? 'Spieler'
    return [
      {
        id: `coach-insight:post_pain_missing_next_step:${entry.id}`,
        rule: 'post_pain_missing_next_step',
        severity: 'high',
        title: 'Post-Pain ohne naechsten Schritt',
        reason: `${name} hat Post-Pain ${entry.postPainScore}/10, aber E2 oder Next Step fehlt.`,
        targetTab: 'nachbereitung',
        correctionHint: 'In Nachbereitung E2 oder Next Step setzen.',
        sources: [sourceFromEntry(entry, input.sessionLogById, input.playersById, 'nachbereitung')],
      } satisfies CoachInsight,
    ]
  })
}

function buildLoadSpikeForEntries(input: {
  idPart: string
  label: string
  entries: PlayerSessionEntry[]
  endDate: string
  sessionLogById: Map<string, SessionLog>
  sources: CoachInsightSource[]
  playerTarget?: CoachInsightSource
}) {
  const start28d = dateDaysBefore(input.endDate, 28)
  const loadPoints = input.entries.flatMap((entry) => {
    const date = input.sessionLogById.get(entry.sessionLogId)?.date ?? ''
    return date ? [{ sessionDate: date, load: entry.sessionLoad }] : []
  })

  const firstCoveredDate =
    loadPoints
      .filter((point) => point.load !== null && inDateRange(point.sessionDate, start28d, input.endDate))
      .map((point) => point.sessionDate)
      .sort()[0] ?? null
  const spike = buildLoadSpikeRatio({
    load7d: buildRollingLoadFromPoints(loadPoints, input.endDate, 7),
    load28d: buildRollingLoadFromPoints(loadPoints, input.endDate, 28),
    firstCoveredDate,
    endDate: input.endDate,
  })
  if (!spike || spike.ratio < 1.3) {
    return null
  }

  const severity: CoachInsightSeverity = spike.ratio >= 1.5 ? 'high' : 'medium'
  return {
    id: `coach-insight:load_spike:${input.idPart}:${input.endDate}`,
    rule: 'load_spike',
    severity,
    title: 'Load Spike pruefen',
    reason: `${input.label}: 7d Load liegt bei ${spike.ratio}x des 28d-Wochenschnitts.`,
    targetTab: 'analysis',
    correctionHint: 'Load-Verlauf in Analyse pruefen und naechste Einheit dosieren.',
    sources: input.sources.length > 0 ? input.sources : input.playerTarget ? [input.playerTarget] : [],
  } satisfies CoachInsight
}

function buildLoadSpikeInsights(input: {
  activePlayers: Player[]
  entries: PlayerSessionEntry[]
  sessionLogById: Map<string, SessionLog>
  playersById: Map<string, Player>
  todayKey: string
}) {
  const loadEntries = input.entries.filter((entry) => !entry.deletedAt && entry.sessionLoad !== null)
  const teamInsight = buildLoadSpikeForEntries({
    idPart: 'team',
    label: 'Team',
    entries: loadEntries,
    endDate: input.todayKey,
    sessionLogById: input.sessionLogById,
    sources: sourceForTeamLoad(
      sortEntriesNewestFirst(loadEntries, input.sessionLogById).filter((entry) => {
        const date = input.sessionLogById.get(entry.sessionLogId)?.date ?? ''
        return inDateRange(date, dateDaysBefore(input.todayKey, 7), input.todayKey)
      }),
      input.sessionLogById,
    ),
  })
  const playerInsights = input.activePlayers.flatMap((player) => {
    const playerEntries = loadEntries.filter((entry) => entry.playerId === player.id)
    const sources = sortEntriesNewestFirst(playerEntries, input.sessionLogById)
      .filter((entry) => {
        const date = input.sessionLogById.get(entry.sessionLogId)?.date ?? ''
        return inDateRange(date, dateDaysBefore(input.todayKey, 7), input.todayKey)
      })
      .slice(0, 4)
      .map((entry) => sourceFromEntry(entry, input.sessionLogById, input.playersById, 'analysis'))
    const insight = buildLoadSpikeForEntries({
      idPart: player.id,
      label: player.name,
      entries: playerEntries,
      endDate: input.todayKey,
      sessionLogById: input.sessionLogById,
      sources,
      playerTarget: sourceFromPlayer(player, input.todayKey),
    })

    return insight ? [insight] : []
  })

  return [...(teamInsight ? [teamInsight] : []), ...playerInsights]
}

function buildContactPatternInsights(input: {
  activePlayers: Player[]
  sessionDefinitions: SessionDefinition[]
  sessionLogs: SessionLog[]
  entries: PlayerSessionEntry[]
  exposureSummaries: PlayerExposureSummary[]
  sessionLogById: Map<string, SessionLog>
  playersById: Map<string, Player>
  todayKey: string
}) {
  const definitionById = new Map(input.sessionDefinitions.map((definition) => [definition.id, definition]))
  const start21d = dateDaysBefore(input.todayKey, 21)

  const lowInsights = input.activePlayers.flatMap((player) => {
    const contactEntries = input.entries.filter((entry) => {
      const sessionLog = input.sessionLogById.get(entry.sessionLogId)
      const definition = sessionLog ? definitionById.get(sessionLog.sessionDefinitionId) : null
      const hasContactPlan = definition?.timeline.some((block) => block.exposureTags?.includes('contact_prep')) ?? false

      return (
        entry.playerId === player.id &&
        deriveAttendanceStatus(entry) === 'present' &&
        Boolean(sessionLog && inDateRange(sessionLog.date, start21d, input.todayKey)) &&
        hasContactPlan
      )
    })

    if (contactEntries.length < 2) {
      return []
    }

    const hasContactExposure = input.exposureSummaries.some(
      (summary) =>
        summary.playerId === player.id &&
        !summary.deletedAt &&
        inDateRange(summary.sessionDate, start21d, input.todayKey) &&
        (summary.statuses.contact_prep === 'completed' || summary.statuses.contact_prep === 'reduced'),
    )

    if (hasContactExposure) {
      return []
    }

    return [
      {
        id: `coach-insight:contact_exposure_pattern:low:${player.id}:${input.todayKey}`,
        rule: 'contact_exposure_pattern',
        severity: 'medium',
        title: 'Contact Prep niedrig',
        reason: `${player.name} hatte mehrere contact-relevante Teilnahmen, aber keine dokumentierte Contact-Prep Exposure.`,
        targetTab: 'nachbereitung',
        correctionHint: 'Exposure-Summary pruefen oder Contact-Prep bewusst einplanen.',
        sources: sortEntriesNewestFirst(contactEntries, input.sessionLogById)
          .slice(0, 2)
          .map((entry) => sourceFromEntry(entry, input.sessionLogById, input.playersById, 'nachbereitung')),
      } satisfies CoachInsight,
    ]
  })

  const denseInsights = input.activePlayers.flatMap((player) => {
    const contactExposures = input.exposureSummaries
      .filter(
        (summary) =>
          summary.playerId === player.id &&
          !summary.deletedAt &&
          (summary.statuses.contact_prep === 'completed' || summary.statuses.contact_prep === 'reduced'),
      )
      .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))

    for (const current of contactExposures) {
      if (!inDateRange(current.sessionDate, start21d, input.todayKey)) {
        continue
      }

      const start7d = dateDaysBefore(current.sessionDate, 7)
      const denseWindow = contactExposures.filter((summary) => inDateRange(summary.sessionDate, start7d, current.sessionDate))
      if (denseWindow.length >= 2) {
        return [
          {
            id: `coach-insight:contact_exposure_pattern:dense:${player.id}:${input.todayKey}`,
            rule: 'contact_exposure_pattern',
            severity: 'medium',
            title: 'Contact Prep dicht',
            reason: `${player.name} hat mindestens zwei Contact-Prep Exposures innerhalb von 7 Tagen.`,
            targetTab: 'analysis',
            correctionHint: 'Contact-Dichte in Analyse pruefen und naechste Einheit passend dosieren.',
            sources: denseWindow.slice(0, 2).map((summary) => sourceFromExposure(summary, input.playersById)),
          } satisfies CoachInsight,
        ]
      }
    }

    return []
  })

  return [...lowInsights, ...denseInsights]
}

export function buildCoachInsights({
  players,
  sessionDefinitions,
  sessionLogs,
  entries,
  returnerEntries,
  sessionBlockLogs,
  exposureSummaries,
  todayKey,
}: BuildCoachInsightsInput): CoachInsight[] {
  const activePlayers = players.filter((player) => player.active && !player.deletedAt)
  const activePlayerIds = new Set(activePlayers.map((player) => player.id))
  const playersById = new Map(activePlayers.map((player) => [player.id, player]))
  const sessionLogById = new Map(sessionLogs.filter((log) => !log.deletedAt).map((log) => [log.id, log]))
  const activeEntries = entries.filter(
    (entry) => !entry.deletedAt && entry.playerId !== null && activePlayerIds.has(entry.playerId) && sessionLogById.has(entry.sessionLogId),
  )
  const activeReturners = returnerEntries.filter(
    (entry) => !entry.deletedAt && entry.playerId !== null && activePlayerIds.has(entry.playerId) && sessionLogById.has(entry.sessionLogId),
  )
  const activeExposureSummaries = exposureSummaries.filter(
    (summary) =>
      !summary.deletedAt &&
      summary.playerId !== null &&
      activePlayerIds.has(summary.playerId) &&
      (!summary.sessionLogId || sessionLogById.has(summary.sessionLogId)),
  )

  return sortInsights([
    ...buildPostPainInsights({ entries: activeEntries, sessionLogById, playersById }),
    ...buildConsecutiveTrafficInsights({ activePlayers, entries: activeEntries, sessionLogById, playersById }),
    ...buildLoadSpikeInsights({ activePlayers, entries: activeEntries, sessionLogById, playersById, todayKey }),
    ...buildMissingSrpeInsights({ entries: activeEntries, sessionLogById, playersById }),
    ...buildReturnerDecisionInsights({ returnerEntries: activeReturners, sessionLogById, playersById }),
    ...buildSkippedBlockInsights({ sessionDefinitions, sessionLogs: [...sessionLogById.values()], sessionBlockLogs, sessionLogById }),
    ...buildSpeedGapInsights({
      activePlayers,
      entries: activeEntries,
      exposureSummaries: activeExposureSummaries,
      sessionLogById,
      todayKey,
    }),
    ...buildContactPatternInsights({
      activePlayers,
      sessionDefinitions,
      sessionLogs: [...sessionLogById.values()],
      entries: activeEntries,
      exposureSummaries: activeExposureSummaries,
      sessionLogById,
      playersById,
      todayKey,
    }),
  ])
}
