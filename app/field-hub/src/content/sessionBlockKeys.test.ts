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
})
