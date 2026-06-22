import { metricDefinitions, type MetricDefinition, type MetricKey } from '../content/metricDefinitions'
import type { SyncStatus } from './sync'

export type MetricBodySide = 'none' | 'left' | 'right'

export type MetricResult = {
  id: string
  userId: string
  playerId: string | null
  sessionLogId: string | null
  metricKey: MetricKey
  value: number
  attempt: number
  isValid: boolean
  bodySide: MetricBodySide
  contextNote: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  clientUpdatedAt: string
  syncStatus: SyncStatus
  syncError: string | null
}

export type MetricResultPatch = {
  metricKey: string
  value: number | string | null
  attempt?: number
  isValid?: boolean
  bodySide?: MetricBodySide
  contextNote?: string
}

export type ValidMetricResultPatch = {
  metricKey: MetricKey
  value: number
  attempt: number
  isValid: boolean
  bodySide: MetricBodySide
  contextNote: string
}

const metricDefinitionByKey = new Map<string, MetricDefinition>(
  metricDefinitions.map((definition) => [definition.key, definition]),
)

export function isKnownMetricKey(value: string): value is MetricKey {
  return metricDefinitionByKey.has(value)
}

export function getMetricDefinition(metricKey: string): MetricDefinition {
  const definition = metricDefinitionByKey.get(metricKey)
  if (!definition) {
    throw new Error(`Unbekannte Metric: ${metricKey}`)
  }

  return definition
}

export function parseOptionalMetricValue(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  const trimmed = value.trim().replace(',', '.')
  if (!trimmed) {
    return null
  }

  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

export function validateMetricResultPatch(patch: MetricResultPatch): ValidMetricResultPatch {
  if (!isKnownMetricKey(patch.metricKey)) {
    throw new Error(`Unbekannte Metric: ${patch.metricKey}`)
  }

  const value = parseOptionalMetricValue(patch.value)
  if (value === null || value < 0) {
    throw new Error('Metric-Wert muss eine Zahl groesser oder gleich 0 sein.')
  }

  const attempt = patch.attempt ?? 1
  if (!Number.isInteger(attempt) || attempt < 1 || attempt > 20) {
    throw new Error('Attempt muss zwischen 1 und 20 liegen.')
  }

  const bodySide = patch.bodySide ?? 'none'
  if (bodySide !== 'none' && bodySide !== 'left' && bodySide !== 'right') {
    throw new Error('Metric-Seite ist ungueltig.')
  }

  return {
    metricKey: patch.metricKey,
    value,
    attempt,
    isValid: patch.isValid ?? true,
    bodySide,
    contextNote: patch.contextNote?.trim() ?? '',
  }
}

export function hasMetricResultContent(result: MetricResult) {
  return result.deletedAt === null && Number.isFinite(result.value)
}

export function formatMetricValue(result: Pick<MetricResult, 'metricKey' | 'value'>) {
  const definition = getMetricDefinition(result.metricKey)
  return `${result.value} ${definition.unit}`
}
