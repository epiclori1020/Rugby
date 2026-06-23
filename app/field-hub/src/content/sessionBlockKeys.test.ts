import { describe, expect, test } from 'vitest'
import { libraryItems } from './library'
import { sessionDefinitions } from './sessions'
import type { ExposureTag } from './types'

const allowedExposureTags: ExposureTag[] = [
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
]

const expectedBlockKeysBySession: Record<string, string[]> = {
  'kw25-di-2026-06-16': [
    'arrival',
    'team-brief',
    'readiness-check',
    'ramp-warmup',
    'movement-screen',
    'technique-patterns-1',
    'speed-prep',
    'technique-patterns-2',
    'easy-finish',
    'closeout',
  ],
  'kw25-do-2026-06-18': [
    'check-in',
    'warm-up',
    'speed',
    'mini-baseline',
    'strength-pods',
    'microdose',
    'easy-tempo',
    'closeout',
  ],
  'kw26-di-2026-06-23': [
    'check-in',
    'mobility-activation',
    'track-technique',
    'acceleration',
    'make-up-tests',
    'strength-pods',
    'position-module',
    'finish-closeout',
  ],
  'kw26-do-2026-06-25': ['checkin-prep-speed', 'power-strength', 'robustness-conditioning'],
  'kw27-di-2026-06-30': ['checkin-prep-speed', 'power-strength-pods', 'cluster-microdose-conditioning'],
  'kw27-do-2026-07-02': ['checkin-prep-speed', 'power-strength', 'robustness-tempo'],
  'kw28-di-2026-07-07': ['checkin-prep-speed', 'power-strength-pods', 'contact-microdose-conditioning'],
  'kw28-do-2026-07-09': ['checkin-prep-speed', 'power-strength', 'robustness-conditioning-review'],
  'kw29-di-2026-07-14': ['checkin-prep-speed', 'power-strength-pods', 'cluster-microdose-conditioning'],
  'kw29-do-2026-07-16': ['checkin-prep-speed', 'power-strength', 'robustness-conditioning'],
  'kw30-di-2026-07-21': ['checkin-prep-speed-cod', 'power-strength-pods', 'cluster-microdose-conditioning'],
  'kw30-do-2026-07-23': ['checkin-prep-speed', 'power-strength', 'robustness-conditioning-closeout'],
  'kw31-di-2026-07-28': ['checkin-prep-mini-recheck', 'power-strength-pods', 'microdose-conditioning-august-rules'],
  'kw31-do-2026-07-30': ['checkin-prep-speed', 'power-strength-technique', 'august-robustness-closeout'],
}

describe('session block keys', () => {
  test('all active KW25-31 sessions have the expected stable block keys', () => {
    expect(sessionDefinitions).toHaveLength(Object.keys(expectedBlockKeysBySession).length)

    for (const session of sessionDefinitions) {
      const expectedSlugs = expectedBlockKeysBySession[session.id]

      expect(expectedSlugs, `missing expected key list for ${session.id}`).toBeDefined()
      expect(session.timeline.map((block) => block.key)).toEqual(
        expectedSlugs.map((slug) => `${session.id}:${slug}`),
      )
    }
  })

  test('block keys are globally unique and never title or index based', () => {
    const keys = sessionDefinitions.flatMap((session) => session.timeline.map((block) => block.key))

    expect(new Set(keys).size).toBe(keys.length)

    for (const session of sessionDefinitions) {
      session.timeline.forEach((block, index) => {
        expect(block.key.startsWith(`${session.id}:`)).toBe(true)
        expect(block.key).not.toBe(`${block.time}-${block.title}`)
        expect(block.key).not.toBe(`${session.id}:${index}`)
      })
    }
  })

  test('block order is explicit, unique, and follows timeline order', () => {
    for (const session of sessionDefinitions) {
      const orders = session.timeline.map((block) => block.order)

      expect(new Set(orders).size).toBe(orders.length)
      expect(orders).toEqual(session.timeline.map((_, index) => (index + 1) * 10))
      expect(orders).toEqual([...orders].sort((a, b) => a - b))
    }
  })

  test('exposure tags and block library refs point to known static content', () => {
    const knownLibraryIds = new Set(libraryItems.map((item) => item.id))
    const knownExposureTags = new Set<string>(allowedExposureTags)

    for (const session of sessionDefinitions) {
      for (const block of session.timeline) {
        for (const tag of block.exposureTags ?? []) {
          expect(knownExposureTags.has(tag), `${block.key} has unknown exposure tag ${tag}`).toBe(true)
        }

        for (const libraryRef of block.libraryRefs ?? []) {
          expect(knownLibraryIds.has(libraryRef), `${block.key} has unknown library ref ${libraryRef}`).toBe(true)
        }
      }
    }
  })

  test('KW26 Tuesday pilot carries structured exercise details for the live coach flow', () => {
    const session = sessionDefinitions.find((candidate) => candidate.id === 'kw26-di-2026-06-23')
    expect(session).toBeDefined()

    const mobility = session?.timeline.find((block) => block.key.endsWith(':mobility-activation'))
    const makeUp = session?.timeline.find((block) => block.key.endsWith(':make-up-tests'))
    const strength = session?.timeline.find((block) => block.key.endsWith(':strength-pods'))

    expect(mobility?.exercises?.map((exercise) => exercise.name)).toContain('Hip Switch')
    expect(mobility?.exercises?.find((exercise) => exercise.name === 'Knee-to-Wall')?.prescription).toContain('8/Seite')
    expect(mobility?.exercises?.every((exercise) => exercise.coachingCues.length > 0)).toBe(true)

    expect(makeUp?.exercises?.find((exercise) => exercise.name === 'Artur Med-Ball')?.recording).toBe('metric')
    expect(makeUp?.exercises?.find((exercise) => exercise.name === 'Christopher/David Broad Jump')?.playerNames).toEqual([
      'Christopher',
      'David',
    ])

    expect(strength?.exercises?.find((exercise) => exercise.name === 'Deadlift')?.prescription).toContain('3x5')
    expect(strength?.exercises?.find((exercise) => exercise.name === 'Deadlift')?.recording).toBe('exercise')
  })

  test('KW26 Tuesday structured exercises keep targeting and recording keys complete', () => {
    const session = sessionDefinitions.find((candidate) => candidate.id === 'kw26-di-2026-06-23')
    expect(session).toBeDefined()

    for (const exercise of session?.timeline.flatMap((block) => block.exercises ?? []) ?? []) {
      if (exercise.recording === 'metric') {
        expect(exercise.metricKey, `${exercise.key} metric recording needs metricKey`).toBeTruthy()
      }

      if (exercise.recording === 'exercise') {
        expect(exercise.exerciseKey, `${exercise.key} exercise recording needs exerciseKey`).toBeTruthy()
      }

      if (exercise.targeting === 'named') {
        expect(exercise.playerNames.length, `${exercise.key} named targeting needs playerNames`).toBeGreaterThan(0)
      }

      if (exercise.targeting === 'cluster') {
        expect(exercise.clusters.length, `${exercise.key} cluster targeting needs clusters`).toBeGreaterThan(0)
      }
    }
  })
})
