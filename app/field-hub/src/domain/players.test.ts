import { describe, expect, it } from 'vitest'
import { clusterOptions, onFieldRugbyAthletePreset } from './players'

describe('onFieldRugbyAthletePreset', () => {
  it('keeps athlete terminology generic while exposing Rugby position groups as preset labels', () => {
    expect(onFieldRugbyAthletePreset).toMatchObject({
      athleteGenericName: 'Athlete',
      athleteDisplayName: 'Spieler',
      positionLabel: 'Position',
      positionGroupLabel: 'Position Group',
      presetName: 'OnField Rugby',
    })
    expect(onFieldRugbyAthletePreset.positionGroups).toEqual(clusterOptions)
    expect(onFieldRugbyAthletePreset.positionGroups.map((option) => option.label)).toEqual([
      'Offen',
      'Front Row',
      'Locks',
      'Back Row',
      'Halves',
      'Centres',
      'Back Three',
    ])
  })
})
