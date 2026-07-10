import type { PlayerSessionEntry, PlayerWarning } from './checkIn'
import type { CoachInsight } from './coachInsights'
import type { Player } from './players'

export type TodayAttentionTone = 'red' | 'yellow' | 'returner' | 'open'

export type TodayAttentionReason = {
  id: string
  tone: TodayAttentionTone
  detail: string
  context: string
}

export type TodayAttentionRow = {
  playerId: string
  name: string
  position: string
  tone: TodayAttentionTone
  reasons: TodayAttentionReason[]
}

export type TodaySquadSummary = {
  squadPlayerIds: string[]
  squadCount: number
  presentCount: number
  yellowCount: number
  redCount: number
  returnerCount: number
  attentionRows: TodayAttentionRow[]
  relevantCoachInsights: CoachInsight[]
}

type TodaySquadInput = {
  players: Player[]
  entries: PlayerSessionEntry[]
  warnings: PlayerWarning[]
  coachInsights: CoachInsight[]
  expectedPlayerIds: string[]
}

const toneRank: Record<TodayAttentionTone, number> = {
  red: 0,
  yellow: 1,
  returner: 2,
  open: 3,
}

function warningTone(warning: PlayerWarning): TodayAttentionTone {
  if (warning.trafficLight === 'red' || warning.nextStep === 'klaeren') {
    return 'red'
  }

  if (warning.trafficLight === 'yellow' || warning.nextStep === 'reduzieren' || (warning.postPainScore ?? 0) >= 3) {
    return 'yellow'
  }

  if (warning.returnerFlag === 'ja') {
    return 'returner'
  }

  return 'open'
}

function warningDetail(warning: PlayerWarning) {
  const trafficLabel = warning.trafficLight === 'red' ? 'Ampel Rot' : warning.trafficLight === 'yellow' ? 'Ampel Gelb' : null
  const parts = [
    trafficLabel,
    warning.returnerFlag === 'ja'
      ? 'Returner'
      : warning.returnerFlag === 'offen'
        ? 'Returner-Status klären'
        : null,
    warning.nextStep ? `Nächster Schritt: ${warning.nextStep}` : null,
    warning.observation.trim() || null,
  ].filter((part): part is string => Boolean(part))

  return parts.join(' · ') || 'Offene Klärung aus letzter Einheit.'
}

function insightTone(insight: CoachInsight): TodayAttentionTone {
  if (insight.severity === 'high') {
    return 'red'
  }

  if (insight.severity === 'medium') {
    return 'yellow'
  }

  return 'open'
}

function insightTargetLabel(insight: CoachInsight) {
  const labels: Record<CoachInsight['targetTab'], string> = {
    analysis: 'Analyse',
    'check-in': 'Check-in',
    nachbereitung: 'Nachbereitung',
    returner: 'Returner',
    spieler: 'Spieler',
    training: 'Training',
  }

  return labels[insight.targetTab]
}

export function buildTodaySquadSummary({
  coachInsights,
  entries,
  expectedPlayerIds,
  players,
  warnings,
}: TodaySquadInput): TodaySquadSummary {
  const activePlayers = players.filter((player) => player.active)
  const activePlayerById = new Map(activePlayers.map((player) => [player.id, player]))
  const presentEntryByPlayerId = new Map<string, PlayerSessionEntry>()

  entries.forEach((entry) => {
    if (entry.present && entry.playerId && activePlayerById.has(entry.playerId)) {
      presentEntryByPlayerId.set(entry.playerId, entry)
    }
  })

  const presentPlayerIds = new Set(presentEntryByPlayerId.keys())
  const expectedActiveIds = new Set(expectedPlayerIds.filter((playerId) => activePlayerById.has(playerId)))
  const squadPlayerIds = new Set(
    expectedPlayerIds.length > 0 ? expectedActiveIds : activePlayers.map((player) => player.id),
  )
  presentPlayerIds.forEach((playerId) => squadPlayerIds.add(playerId))

  const explicitReturnerPlayerIds = new Set<string>()
  const reasonsByPlayerId = new Map<string, Map<string, TodayAttentionReason>>()

  function addReason(playerId: string, reason: TodayAttentionReason) {
    const reasonMap = reasonsByPlayerId.get(playerId) ?? new Map<string, TodayAttentionReason>()
    reasonMap.set(reason.id, reason)
    reasonsByPlayerId.set(playerId, reasonMap)
  }

  presentEntryByPlayerId.forEach((entry, playerId) => {
    const player = activePlayerById.get(playerId)
    if (!player) {
      return
    }

    const trafficLight = entry.trafficLight ?? entry.trafficLightSuggestion
    if (trafficLight === 'red') {
      addReason(playerId, {
        id: 'current:red',
        tone: 'red',
        detail: 'Ampel Rot im heutigen Check-in.',
        context: 'Heute eingecheckt',
      })
    } else if (trafficLight === 'yellow') {
      addReason(playerId, {
        id: 'current:yellow',
        tone: 'yellow',
        detail: 'Ampel Gelb im heutigen Check-in.',
        context: 'Heute eingecheckt',
      })
    }

    const isExplicitReturner = entry.returnerFlag === 'ja' || player.returnerStatus === 'ja'
    const needsReturnerClarification =
      !isExplicitReturner && (entry.returnerFlag === 'offen' || player.returnerStatus === 'offen')

    if (isExplicitReturner) {
      explicitReturnerPlayerIds.add(playerId)
      addReason(playerId, {
        id: 'current:returner',
        tone: 'returner',
        detail: 'Returner-Belastungsplan für heute prüfen.',
        context: 'Heute eingecheckt',
      })
    } else if (needsReturnerClarification) {
      addReason(playerId, {
        id: 'current:returner-open',
        tone: 'open',
        detail: 'Returner-Status vor Trainingsbeginn klären.',
        context: 'Heute eingecheckt',
      })
    }
  })

  warnings.forEach((warning, index) => {
    if (!warning.playerId || !presentPlayerIds.has(warning.playerId)) {
      return
    }

    addReason(warning.playerId, {
      id: `warning:${warning.sessionDate}:${index}`,
      tone: warningTone(warning),
      detail: warningDetail(warning),
      context: `Letzte Einheit ${warning.sessionDate}`,
    })

    if (warning.returnerFlag === 'ja') {
      explicitReturnerPlayerIds.add(warning.playerId)
    }
  })

  coachInsights.forEach((insight) => {
    const playerIds = new Set(
      insight.sources
        .map((source) => source.playerId)
        .filter(
          (playerId): playerId is string =>
            typeof playerId === 'string' && presentPlayerIds.has(playerId),
        ),
    )

    playerIds.forEach((playerId) => {
      addReason(playerId, {
        id: `insight:${insight.id}`,
        tone: insightTone(insight),
        detail: insight.reason,
        context: `Coach Insight · ${insightTargetLabel(insight)}`,
      })
    })
  })

  const attentionRows = [...presentPlayerIds]
    .flatMap((playerId): TodayAttentionRow[] => {
      const player = activePlayerById.get(playerId)
      const reasonMap = reasonsByPlayerId.get(playerId)
      if (!player || !reasonMap || reasonMap.size === 0) {
        return []
      }

      const reasons = [...reasonMap.values()].sort(
        (a, b) => toneRank[a.tone] - toneRank[b.tone] || a.id.localeCompare(b.id, 'de-AT'),
      )

      return [
        {
          playerId,
          name: player.name,
          position: player.position || 'Position offen',
          tone: reasons[0].tone,
          reasons,
        },
      ]
    })
    .sort((a, b) => toneRank[a.tone] - toneRank[b.tone] || a.name.localeCompare(b.name, 'de-AT'))

  const relevantCoachInsights = coachInsights.filter((insight) => {
    const playerSources = insight.sources.filter((source) => source.playerId)
    return playerSources.length === 0 || playerSources.some((source) => source.playerId && squadPlayerIds.has(source.playerId))
  })
  const redCount = attentionRows.filter((row) => row.tone === 'red').length
  const yellowCount = attentionRows.filter((row) => row.tone === 'yellow').length

  return {
    squadPlayerIds: [...squadPlayerIds],
    squadCount: squadPlayerIds.size,
    presentCount: presentPlayerIds.size,
    yellowCount,
    redCount,
    returnerCount: explicitReturnerPlayerIds.size,
    attentionRows,
    relevantCoachInsights,
  }
}
