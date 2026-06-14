import { describe, expect, test } from 'vitest'
import {
  formatOptionalBaselineNumber,
  hasBaselineContent,
  parseOptionalBaselineNumber,
  sprint30mOptionalLabel,
  type BaselineEntry,
} from './baseline'

function baselineEntry(overrides: Partial<BaselineEntry> = {}): BaselineEntry {
  return {
    id: 'baseline-1',
    userId: 'user-1',
    playerId: 'player-1',
    sessionLogId: 'session-1',
    broadJumpCm: null,
    medBallChestPassM: null,
    medBallWeightKg: null,
    sprint30m: null,
    note: '',
    createdAt: '2026-06-18T18:00:00.000Z',
    updatedAt: '2026-06-18T18:00:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-06-18T18:00:00.000Z',
    syncStatus: 'synced',
    syncError: null,
    ...overrides,
  }
}

describe('parseOptionalBaselineNumber', () => {
  test('treats empty values as optional null values', () => {
    expect(parseOptionalBaselineNumber('')).toBeNull()
    expect(parseOptionalBaselineNumber('   ')).toBeNull()
  })

  test('accepts point and comma decimal values', () => {
    expect(parseOptionalBaselineNumber('245')).toBe(245)
    expect(parseOptionalBaselineNumber('7.25')).toBe(7.25)
    expect(parseOptionalBaselineNumber('6,5')).toBe(6.5)
  })

  test('rejects invalid or negative values', () => {
    expect(() => parseOptionalBaselineNumber('abc', 'Broad Jump')).toThrow(
      'Broad Jump muss eine nicht-negative Zahl sein.',
    )
    expect(() => parseOptionalBaselineNumber('-1', '30 m')).toThrow('30 m muss eine nicht-negative Zahl sein.')
  })
})

describe('formatOptionalBaselineNumber', () => {
  test('formats optional values for compact field display', () => {
    expect(formatOptionalBaselineNumber(null)).toBe('')
    expect(formatOptionalBaselineNumber(245)).toBe('245')
    expect(formatOptionalBaselineNumber(6.5)).toBe('6.5')
    expect(formatOptionalBaselineNumber(6.25)).toBe('6.25')
  })
})

describe('hasBaselineContent', () => {
  test('requires at least one measurement or note', () => {
    expect(hasBaselineContent(baselineEntry())).toBe(false)
    expect(hasBaselineContent(baselineEntry({ broadJumpCm: 245 }))).toBe(true)
    expect(hasBaselineContent(baselineEntry({ sprint30m: 4.4 }))).toBe(true)
    expect(hasBaselineContent(baselineEntry({ note: 'ruhig gemessen' }))).toBe(true)
  })

  test('keeps the 30 m copy explicitly optional', () => {
    expect(sprint30mOptionalLabel).toBe('30 m spaeter/optional')
  })
})
