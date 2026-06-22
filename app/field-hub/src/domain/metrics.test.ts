import { describe, expect, it } from 'vitest'
import {
  formatMetricValue,
  getMetricDefinition,
  hasMetricResultContent,
  isKnownMetricKey,
  parseOptionalMetricValue,
  validateMetricResultPatch,
  type MetricResult,
} from './metrics'

const metricResult: MetricResult = {
  id: 'metric-1',
  userId: 'user-1',
  playerId: 'player-1',
  sessionLogId: 'session-1',
  metricKey: 'broad_jump',
  value: 245,
  attempt: 1,
  isValid: true,
  bodySide: 'none',
  contextNote: '',
  createdAt: '2026-06-18T18:00:00.000Z',
  updatedAt: '2026-06-18T18:05:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-18T18:05:00.000Z',
  syncStatus: 'synced',
  syncError: null,
}

describe('metrics domain', () => {
  it('maps static metric definitions and keeps optional-later metrics known', () => {
    expect(getMetricDefinition('broad_jump')).toMatchObject({ name: 'Broad Jump', unit: 'cm', active: true })
    expect(getMetricDefinition('sprint_30m')).toMatchObject({ name: '30 m Sprint', active: false, status: 'optional_later' })
    expect(isKnownMetricKey('med_ball_chest_pass')).toBe(true)
    expect(isKnownMetricKey('unknown_metric')).toBe(false)
    expect(() => getMetricDefinition('unknown_metric')).toThrow('Unbekannte Metric')
  })

  it('normalizes and validates saved metric patches', () => {
    expect(
      validateMetricResultPatch({
        metricKey: 'sprint_10m',
        value: '1.82',
        attempt: 2,
        isValid: false,
        bodySide: 'left',
        contextNote: 'Handzeit',
      }),
    ).toMatchObject({
      metricKey: 'sprint_10m',
      value: 1.82,
      attempt: 2,
      isValid: false,
      bodySide: 'left',
      contextNote: 'Handzeit',
    })
  })

  it('rejects unknown keys, negative values and invalid attempts before persistence', () => {
    expect(() => validateMetricResultPatch({ metricKey: 'unknown_metric', value: 1 })).toThrow('Unbekannte Metric')
    expect(() => validateMetricResultPatch({ metricKey: 'broad_jump', value: -1 })).toThrow('Metric-Wert')
    expect(() => validateMetricResultPatch({ metricKey: 'broad_jump', value: 1, attempt: 0 })).toThrow('Attempt')
  })

  it('parses optional input and formats values with metric units', () => {
    expect(parseOptionalMetricValue('')).toBeNull()
    expect(parseOptionalMetricValue(' 6,25 ')).toBe(6.25)
    expect(formatMetricValue(metricResult)).toBe('245 cm')
    expect(hasMetricResultContent(metricResult)).toBe(true)
    expect(hasMetricResultContent({ ...metricResult, deletedAt: '2026-06-18T19:00:00.000Z' })).toBe(false)
  })
})
