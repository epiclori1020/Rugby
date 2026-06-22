import type { ExposureTag, SessionDefinition } from '../content/types'
import type { PlayerSessionEntry, SessionLog } from './checkIn'
import type { ReturnerCapSummary } from './returners'
import type { SessionBlockLog, SessionBlockStatus } from './sessionBlocks'
import type { SyncStatus } from './sync'

export const exposureTypes = [
  'speed',
  'acceleration',
  'cod_decel',
  'lower_strength',
  'upper_strength',
  'power',
  'conditioning',
  'contact_prep',
  'neck_trunk',
  'mobility',
  'reconditioning',
] as const satisfies ExposureTag[]

export type ExposureType = (typeof exposureTypes)[number]
export type ExposureStatus = 'none' | 'completed' | 'reduced' | 'skipped'
export type ExposureSource = 'block_default' | 'limit_override' | 'returner_cap'

export type ExposureSourceEntry = {
  blockKey: string
  blockTitle: string
  blockStatus: SessionBlockStatus
  derivedStatus: ExposureStatus
  source: ExposureSource
}

export type ManualExposureOverride = {
  status: Exclude<ExposureStatus, 'none'>
  note: string
  updatedAt: string
}

export type ExposureStatusMap = Record<ExposureType, ExposureStatus>
export type ExposureSources = Partial<Record<ExposureType, ExposureSourceEntry[]>>
export type ManualExposureOverrides = Partial<Record<ExposureType, ManualExposureOverride>>

export type PlayerExposureSummary = {
  id: string
  userId: string
  playerId: string | null
  sessionLogId: string | null
  sessionDefinitionId: string
  sessionDate: string
  statuses: ExposureStatusMap
  sources: ExposureSources
  manualOverrides: ManualExposureOverrides
  coachNote: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  clientUpdatedAt: string
  syncStatus: SyncStatus
  syncError: string | null
}

export type BuildPlayerExposureSummariesInput = {
  userId: string
  sessionLog: SessionLog
  sessionDefinition: SessionDefinition
  blockLogs: SessionBlockLog[]
  entries: PlayerSessionEntry[]
  returnerCaps: ReturnerCapSummary[]
  existingSummaries: PlayerExposureSummary[]
}

const statusPriority: Record<ExposureStatus, number> = {
  none: 0,
  skipped: 1,
  reduced: 2,
  completed: 3,
}

// Eindeutige Stop-Woerter: greifen ueberall im Text (z. B. "stop nach 10min", "rot heute").
const unambiguousStopKeywords = ['stop', 'rot', 'verboten']
// Mehrdeutige Negationen: nur als Gesamtwert ein Stop (eine reine "kein"/"nein"/"no"-Eingabe).
const bareNegationTokens = ['no', 'none', 'nein', 'kein', 'keine', 'nicht']
// Negation + Restriktions-Nomen ("kein Sprint", "kein Vollkontakt") gilt als Stop.
const stopNegators = ['kein', 'keine', 'nicht', 'no']
// Distinktive Nomen werden per Substring erkannt, damit Komposita wie "Vollkontakt"/"Sprinttraining" greifen.
const compoundRestrictionNouns = [
  'sprint',
  'kontakt',
  'contact',
  'tackle',
  'tackling',
  'zweikampf',
  'scrum',
  'gedraenge',
  'gedränge',
  'training',
  'trainieren',
  'conditioning',
  'belastung',
  'belasten',
  'laufen',
  'running',
]
// Kurze/mehrdeutige Nomen nur als ganzes Token, um Falschtreffer (z. B. "run" in "Grund") zu vermeiden.
const exactRestrictionNouns = ['speed', 'cod', 'decel', 'cond', 'tempo', 'lauf', 'run', 'maul', 'ruck']
const reduceCapKeywords = [
  'low',
  'leicht',
  'smooth',
  'submax',
  'kontrolliert',
  'reduziert',
  'orange',
  'gelb',
  '%',
  'cap',
  'limit',
]
const allowCapKeywords = ['full', 'normal', 'frei', 'gruen', 'grün', 'voll']
const noLimitCapPhrases = [
  'keine limits',
  'kein limit',
  'keinerlei einschraenkung',
  'keinerlei einschränkung',
  'ohne einschraenkung',
  'ohne einschränkung',
  'volle belastung',
  'no limits',
  'no limit',
]
const medicalClearanceWords = ['freigabe', 'clearance', 'cleared', 'medizinisch frei', 'medical clearance']

function regexEscape(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function includesWord(value: string, keyword: string) {
  return new RegExp(`(?:^|[^\\p{L}\\p{N}_])${regexEscape(keyword)}(?:$|[^\\p{L}\\p{N}_])`, 'u').test(value)
}

function matchesRestrictionNoun(token: string) {
  return exactRestrictionNouns.includes(token) || compoundRestrictionNouns.some((noun) => token.includes(noun))
}

// True, wenn ein Negator-Token unmittelbar von einem Restriktions-Nomen-Token gefolgt wird.
// Faengt "kein Vollkontakt"/"nicht trainieren", ohne "keine Probleme mit Kontakt" faelschlich zu stoppen.
function hasStopNegatorBeforeRestriction(text: string) {
  const tokens = text.split(/[^\p{L}\p{N}]+/u).filter(Boolean)
  for (let index = 0; index < tokens.length - 1; index += 1) {
    if (stopNegators.includes(tokens[index]) && matchesRestrictionNoun(tokens[index + 1])) {
      return true
    }
  }
  return false
}

function nowIso() {
  return new Date().toISOString()
}

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function createEmptyExposureStatuses(): ExposureStatusMap {
  return Object.fromEntries(exposureTypes.map((type) => [type, 'none'])) as ExposureStatusMap
}

function blockStatusToExposureStatus(status: SessionBlockStatus): ExposureStatus {
  if (status === 'done') {
    return 'completed'
  }

  if (status === 'reduced' || status === 'changed') {
    return 'reduced'
  }

  if (status === 'skipped') {
    return 'skipped'
  }

  return 'none'
}

function combineExposureStatus(current: ExposureStatus, incoming: ExposureStatus) {
  return statusPriority[incoming] > statusPriority[current] ? incoming : current
}

function addSource(sources: ExposureSources, type: ExposureType, source: ExposureSourceEntry) {
  sources[type] = [...(sources[type] ?? []), source]
}

function applyStatus(
  statuses: ExposureStatusMap,
  sources: ExposureSources,
  type: ExposureType,
  status: ExposureStatus,
  source: ExposureSourceEntry,
) {
  if (status === 'none') {
    return
  }

  statuses[type] = combineExposureStatus(statuses[type], status)
  addSource(sources, type, source)
}

function capTextStatus(value: string): ExposureStatus | null {
  const normalized = value.trim().toLocaleLowerCase('de-AT')
  if (!normalized) {
    return null
  }

  const hasNoLimitPhrase = noLimitCapPhrases.some((phrase) => normalized.includes(phrase))
  const stopText = noLimitCapPhrases.reduce((current, phrase) => current.split(phrase).join(' '), normalized)

  if (
    normalized === '0' ||
    bareNegationTokens.includes(normalized) ||
    unambiguousStopKeywords.some((keyword) => includesWord(stopText, keyword)) ||
    hasStopNegatorBeforeRestriction(stopText)
  ) {
    return 'skipped'
  }

  if (hasNoLimitPhrase) {
    return 'completed'
  }

  if (allowCapKeywords.some((keyword) => includesWord(normalized, keyword))) {
    return 'completed'
  }

  if (reduceCapKeywords.some((keyword) => (keyword === '%' ? normalized.includes(keyword) : includesWord(normalized, keyword)))) {
    return 'reduced'
  }

  return 'reduced'
}

function applyCap(
  statuses: ExposureStatusMap,
  sources: ExposureSources,
  type: ExposureType,
  capText: string,
) {
  const capStatus = capTextStatus(capText)
  if (!capStatus || statuses[type] === 'none') {
    return
  }

  const cappedStatus = statusPriority[capStatus] < statusPriority[statuses[type]] ? capStatus : statuses[type]
  statuses[type] = cappedStatus
  addSource(sources, type, {
    blockKey: 'returner-cap',
    blockTitle: capText,
    blockStatus: cappedStatus === 'completed' ? 'done' : cappedStatus === 'skipped' ? 'skipped' : 'reduced',
    derivedStatus: cappedStatus,
    source: 'returner_cap',
  })
}

function addLimitOverride(statuses: ExposureStatusMap, sources: ExposureSources, type: ExposureType) {
  if (statuses[type] === 'none') {
    return
  }

  statuses[type] = 'skipped'
  addSource(sources, type, {
    blockKey: 'player-limit',
    blockTitle: 'Spieler-Limit',
    blockStatus: 'skipped',
    derivedStatus: 'skipped',
    source: 'limit_override',
  })
}

function applyPlayerLimits(statuses: ExposureStatusMap, sources: ExposureSources, entry: PlayerSessionEntry) {
  if (entry.limits.includes('kein_sprint')) {
    addLimitOverride(statuses, sources, 'speed')
    addLimitOverride(statuses, sources, 'acceleration')
    addLimitOverride(statuses, sources, 'cod_decel')
  }

  if (entry.limits.includes('kein_cond')) {
    addLimitOverride(statuses, sources, 'conditioning')
  }

  const trafficLight = entry.trafficLight ?? entry.trafficLightSuggestion
  const shouldStop =
    entry.trainingVariant === 'D' ||
    trafficLight === 'red' ||
    entry.limits.includes('klaeren') ||
    entry.limits.includes('physio')

  if (!shouldStop) {
    return
  }

  for (const type of exposureTypes) {
    addLimitOverride(statuses, sources, type)
  }
}

function applyReturnerCaps(
  statuses: ExposureStatusMap,
  sources: ExposureSources,
  cap: ReturnerCapSummary | undefined,
) {
  if (!cap) {
    return
  }

  applyCap(statuses, sources, 'speed', cap.speedCap)
  applyCap(statuses, sources, 'acceleration', cap.speedCap)
  applyCap(statuses, sources, 'cod_decel', cap.codDecelCap)
  applyCap(statuses, sources, 'conditioning', cap.conditioningCap)
  applyCap(statuses, sources, 'contact_prep', cap.contactCap)
}

function applyManualOverrides(statuses: ExposureStatusMap, overrides: ManualExposureOverrides) {
  for (const [type, override] of Object.entries(overrides) as Array<[ExposureType, ManualExposureOverride]>) {
    statuses[type] = override.status
  }
}

export function mergeManualExposureOverrides(
  currentOverrides: ManualExposureOverrides,
  type: ExposureType,
  override: ManualExposureOverride,
): ManualExposureOverrides {
  const normalizedNote = override.note.trim().toLocaleLowerCase('de-AT')
  if (medicalClearanceWords.some((word) => normalizedNote.includes(word))) {
    throw new Error('Keine medizinische Freigabe in Exposure-Overrides dokumentieren.')
  }

  return {
    ...currentOverrides,
    [type]: {
      ...override,
      note: override.note.trim(),
    },
  }
}

export function buildPlayerExposureSummaries({
  userId,
  sessionLog,
  sessionDefinition,
  blockLogs,
  entries,
  returnerCaps,
  existingSummaries,
}: BuildPlayerExposureSummariesInput): PlayerExposureSummary[] {
  const blockByKey = new Map(sessionDefinition.timeline.map((block) => [block.key, block]))
  const capByPlayerId = new Map(returnerCaps.flatMap((cap) => (cap.playerId ? [[cap.playerId, cap]] : [])))
  const existingByPlayerId = new Map(existingSummaries.flatMap((summary) => (summary.playerId ? [[summary.playerId, summary]] : [])))
  const timestamp = nowIso()

  return entries
    .filter((entry) => entry.present && entry.playerId !== null && !entry.deletedAt)
    .map((entry) => {
      const statuses = createEmptyExposureStatuses()
      const sources: ExposureSources = {}

      for (const log of blockLogs) {
        if (log.deletedAt || log.sessionLogId !== sessionLog.id) {
          continue
        }

        const block = blockByKey.get(log.blockKey)
        if (!block?.exposureTags?.length) {
          continue
        }

        const derivedStatus = blockStatusToExposureStatus(log.status)
        if (derivedStatus === 'none') {
          continue
        }

        for (const type of block.exposureTags) {
          applyStatus(statuses, sources, type, derivedStatus, {
            blockKey: block.key,
            blockTitle: block.title,
            blockStatus: log.status,
            derivedStatus,
            source: 'block_default',
          })
        }
      }

      applyPlayerLimits(statuses, sources, entry)
      applyReturnerCaps(statuses, sources, entry.playerId ? capByPlayerId.get(entry.playerId) : undefined)

      const existing = entry.playerId ? existingByPlayerId.get(entry.playerId) : undefined
      const manualOverrides = existing?.manualOverrides ?? {}
      applyManualOverrides(statuses, manualOverrides)

      return {
        id: existing?.id ?? createId(),
        userId,
        playerId: entry.playerId,
        sessionLogId: sessionLog.id,
        sessionDefinitionId: sessionDefinition.id,
        sessionDate: sessionLog.date,
        statuses,
        sources,
        manualOverrides,
        coachNote: existing?.coachNote ?? '',
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
        deletedAt: null,
        clientUpdatedAt: timestamp,
        syncStatus: 'pending',
        syncError: null,
      }
    })
}
