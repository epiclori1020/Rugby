import { describe, expect, test } from 'vitest'
import { metricDefinitions } from './metricDefinitions'

describe('metric definitions', () => {
  test('defines the initial static metric catalogue', () => {
    expect(metricDefinitions.map((definition) => definition.key)).toEqual([
      'broad_jump',
      'med_ball_chest_pass',
      'sprint_10m',
      'sprint_30m',
    ])
  })

  test('uses unique keys and expected units', () => {
    expect(new Set(metricDefinitions.map((definition) => definition.key)).size).toBe(metricDefinitions.length)

    expect(metricDefinitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'broad_jump', category: 'power', unit: 'cm', higherIsBetter: true }),
        expect.objectContaining({ key: 'med_ball_chest_pass', category: 'power', unit: 'm', higherIsBetter: true }),
        expect.objectContaining({ key: 'sprint_10m', category: 'speed', unit: 's', higherIsBetter: false }),
        expect.objectContaining({ key: 'sprint_30m', category: 'speed', unit: 's', higherIsBetter: false }),
      ]),
    )
  })

  test('keeps 30 m sprint explicitly optional for later', () => {
    const activeKeys = metricDefinitions.filter((definition) => definition.active).map((definition) => definition.key)
    const sprint30m = metricDefinitions.find((definition) => definition.key === 'sprint_30m')

    expect(activeKeys).toEqual(['broad_jump', 'med_ball_chest_pass', 'sprint_10m'])
    expect(sprint30m).toEqual(
      expect.objectContaining({
        active: false,
        status: 'optional_later',
      }),
    )
  })
})

