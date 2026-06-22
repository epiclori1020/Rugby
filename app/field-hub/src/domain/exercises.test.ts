import { describe, expect, it } from 'vitest'
import {
  exercisePainResponses,
  exerciseTechniqueQualities,
  exerciseVariants,
  formatExerciseResult,
  getExerciseDefinition,
  hasExerciseResultContent,
  isKnownExerciseKey,
  parseOptionalExerciseNumber,
  validateExerciseResultPatch,
  type ExerciseResult,
} from './exercises'

const exerciseResult: ExerciseResult = {
  id: 'exercise-1',
  userId: 'user-1',
  playerId: 'player-1',
  sessionLogId: 'session-1',
  exerciseKey: 'trap_bar_deadlift',
  variant: 'A',
  sets: 3,
  reps: '5',
  loadValue: 90,
  loadUnit: 'kg',
  rpe: 7,
  rir: null,
  techniqueQuality: 'good',
  painResponse: 'none',
  notes: 'Sauber',
  createdAt: '2026-06-18T18:00:00.000Z',
  updatedAt: '2026-06-18T18:05:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-18T18:05:00.000Z',
  syncStatus: 'synced',
  syncError: null,
}

describe('exercises domain', () => {
  it('maps static exercise definitions and rejects unknown exercise keys', () => {
    expect(getExerciseDefinition('trap_bar_deadlift')).toMatchObject({
      name: 'Trap Bar Deadlift',
      defaultUnit: 'kg',
      active: true,
    })
    expect(isKnownExerciseKey('goblet_squat')).toBe(true)
    expect(isKnownExerciseKey('unknown_exercise')).toBe(false)
    expect(() => getExerciseDefinition('unknown_exercise')).toThrow('Unbekannte Uebung')
  })

  it('normalizes and validates structured exercise result patches', () => {
    expect(
      validateExerciseResultPatch({
        exerciseKey: 'trap_bar_deadlift',
        variant: 'A_plus',
        sets: '3',
        reps: '5',
        loadValue: '90,5',
        loadUnit: 'kg',
        rpe: '7,5',
        rir: '',
        techniqueQuality: 'ok',
        painResponse: 'same',
        notes: '  kontrolliert  ',
      }),
    ).toEqual({
      exerciseKey: 'trap_bar_deadlift',
      variant: 'A_plus',
      sets: 3,
      reps: '5',
      loadValue: 90.5,
      loadUnit: 'kg',
      rpe: 7.5,
      rir: null,
      techniqueQuality: 'ok',
      painResponse: 'same',
      notes: 'kontrolliert',
    })
  })

  it('rejects invalid keys, enums and number ranges before persistence', () => {
    expect(() => validateExerciseResultPatch({ exerciseKey: 'unknown', reps: '5' })).toThrow('Unbekannte Uebung')
    expect(() => validateExerciseResultPatch({ exerciseKey: 'trap_bar_deadlift', variant: 'wild', reps: '5' })).toThrow(
      'Variante',
    )
    expect(() =>
      validateExerciseResultPatch({ exerciseKey: 'trap_bar_deadlift', reps: '5', techniqueQuality: 'excellent' }),
    ).toThrow('Technikqualitaet')
    expect(() =>
      validateExerciseResultPatch({ exerciseKey: 'trap_bar_deadlift', reps: '5', painResponse: 'new_pain' }),
    ).toThrow('Pain Response')
    expect(() => validateExerciseResultPatch({ exerciseKey: 'trap_bar_deadlift', sets: 0, reps: '5' })).toThrow('Sets')
    expect(() => validateExerciseResultPatch({ exerciseKey: 'trap_bar_deadlift', rpe: 11, reps: '5' })).toThrow('RPE')
    expect(() => validateExerciseResultPatch({ exerciseKey: 'trap_bar_deadlift', rir: 11, reps: '5' })).toThrow('RIR')
  })

  it('keeps enum lists explicit for compact touch UI controls', () => {
    expect(exerciseVariants).toEqual(['A_plus', 'A', 'B', 'C', 'D', 'custom'])
    expect(exerciseTechniqueQualities).toContain('not_recorded')
    expect(exercisePainResponses).toContain('unclear')
  })

  it('parses optional numbers and formats exercise result summaries', () => {
    expect(parseOptionalExerciseNumber('')).toBeNull()
    expect(parseOptionalExerciseNumber(' 6,25 ')).toBe(6.25)
    expect(formatExerciseResult(exerciseResult)).toBe('Trap Bar Deadlift: 3x5, 90 kg, RPE 7')
    expect(hasExerciseResultContent(exerciseResult)).toBe(true)
    expect(hasExerciseResultContent({ ...exerciseResult, deletedAt: '2026-06-18T19:00:00.000Z' })).toBe(false)
  })
})
