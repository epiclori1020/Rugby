import { describe, expect, test } from 'vitest'
import { exerciseDefinitions, type ExercisePattern } from './exerciseDefinitions'
import { sessionDefinitions } from './sessions'
import { exerciseMappings } from './trainingReference'

describe('exercise definitions', () => {
  test('uses unique static exercise keys', () => {
    expect(new Set(exerciseDefinitions.map((definition) => definition.key)).size).toBe(exerciseDefinitions.length)
    expect(exerciseDefinitions.every((definition) => definition.active)).toBe(true)
  })

  test('aligns every definition with an existing training reference pattern', () => {
    const knownReferencePatterns = new Set(exerciseMappings.map((mapping) => mapping.pattern))

    for (const definition of exerciseDefinitions) {
      expect(
        knownReferencePatterns.has(definition.referencePattern),
        `${definition.key} references unknown pattern ${definition.referencePattern}`,
      ).toBe(true)
    }
  })

  test('covers every current training reference pattern', () => {
    const coveredReferencePatterns = new Set<string>(exerciseDefinitions.map((definition) => definition.referencePattern))

    for (const mapping of exerciseMappings) {
      expect(coveredReferencePatterns.has(mapping.pattern), `${mapping.pattern} has no exercise definition`).toBe(true)
    }
  })

  test('covers the initial structured exercise patterns without making COD an exercise result yet', () => {
    const coveredPatterns = new Set<ExercisePattern>(exerciseDefinitions.map((definition) => definition.pattern))
    const expectedExercisePatterns: ExercisePattern[] = [
      'squat',
      'hinge',
      'push',
      'pull',
      'carry',
      'lunge',
      'jump',
      'sprint',
      'neck_trunk',
      'conditioning',
      'other',
    ]

    for (const pattern of expectedExercisePatterns) {
      expect(coveredPatterns.has(pattern), `${pattern} has no exercise definition`).toBe(true)
    }

    expect(coveredPatterns.has('cod')).toBe(false)
    expect(sessionDefinitions.some((session) => session.timeline.some((block) => block.exposureTags?.includes('cod_decel')))).toBe(true)
  })
})
