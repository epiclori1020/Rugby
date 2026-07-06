import { describe, expect, it } from 'vitest'
import { onFieldRugbyConfig, onFieldRugbyPositionGroups } from './onfieldRugby'

describe('onFieldRugbyConfig', () => {
  it('defines OnField Rugby as the only active sport preset contract', () => {
    expect(onFieldRugbyConfig.sportId).toBe('rugby')
    expect(onFieldRugbyConfig.productLabel).toBe('OnField Rugby')
    expect(onFieldRugbyConfig.athleteLabels).toMatchObject({
      genericName: 'Athlete',
      displayName: 'Spieler',
      pluralDisplayName: 'Spieler',
      positionLabel: 'Position',
      positionGroupLabel: 'Position Group',
    })
  })

  it('keeps Rugby position groups stable and uniquely addressable', () => {
    expect(onFieldRugbyPositionGroups).toEqual([
      { value: 'offen', label: 'Offen' },
      { value: 'front_row', label: 'Front Row' },
      { value: 'locks', label: 'Locks' },
      { value: 'back_row', label: 'Back Row' },
      { value: 'halves', label: 'Halves' },
      { value: 'centres', label: 'Centres' },
      { value: 'back_three', label: 'Back Three' },
    ])

    const values = onFieldRugbyPositionGroups.map((option) => option.value)
    const labels = onFieldRugbyPositionGroups.map((option) => option.label)

    expect(new Set(values).size).toBe(values.length)
    expect(new Set(labels).size).toBe(labels.length)
    expect(values).toContain('offen')
  })

  it('captures the first configurable sport-specific label groups without creating a runtime engine', () => {
    expect(onFieldRugbyConfig.sessionTypeLabels).toMatchObject({
      training: 'Training',
      baseline: 'Baseline',
      recheck: 'Re-Check',
      transition: 'Transition',
    })
    expect(onFieldRugbyConfig.metricLabels).toMatchObject({
      broad_jump: 'Broad Jump',
      med_ball_chest_pass: 'Med-Ball Chest Pass',
      sprint_10m: '10 m Sprint',
      sprint_30m: '30 m Sprint',
    })
    expect(onFieldRugbyConfig.trafficLightLabels).toMatchObject({
      green: 'Gruen',
      yellow: 'Gelb',
      red: 'Rot',
    })
    expect(onFieldRugbyConfig.reconditioningLabels.capCategories).toEqual([
      'Speed',
      'COD/Decel',
      'Conditioning',
      'Kontakt',
    ])
    expect(onFieldRugbyConfig.libraryCategoryLabels).toContain('Heute relevant')
    expect(onFieldRugbyConfig.safetyCopy.coachBoundary).toContain('keine medizinische Entscheidung')
  })
})
