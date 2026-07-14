import { describe, expect, it } from 'vitest'
import {
  canonicalCoachRoutes,
  defaultRouteForSection,
  legacyTargetToRoute,
  parseHashRoute,
  routeKey,
  routeToHash,
  routes,
} from './navigation'

describe('OnField coach routing', () => {
  it('keeps canonical coach routes unique and URL-stable', () => {
    const routeKeys = canonicalCoachRoutes.map(routeKey)
    const routeHashes = canonicalCoachRoutes.map(routeToHash)

    expect(new Set(routeKeys).size).toBe(canonicalCoachRoutes.length)
    expect(new Set(routeHashes).size).toBe(canonicalCoachRoutes.length)
    expect(routeHashes).toEqual([
      '#/today',
      '#/unit/check-in',
      '#/unit/training',
      '#/unit/returners',
      '#/unit/post-session',
      '#/players',
      '#/analysis',
      '#/more/library',
      '#/more/export',
      '#/more/settings',
      '#/more/returners',
    ])
  })

  it('parses canonical coach hashes', () => {
    expect(parseHashRoute('#/unit/training')).toMatchObject({
      kind: 'coach',
      route: routes.unitTraining,
      canonicalHash: '#/unit/training',
      source: 'canonical',
    })
    expect(parseHashRoute('#/more/settings')).toMatchObject({
      kind: 'coach',
      route: routes.moreSettings,
      canonicalHash: '#/more/settings',
      source: 'canonical',
    })
  })

  it('normalizes legacy coach hashes to canonical routes', () => {
    expect(parseHashRoute('#/nachbereitung')).toMatchObject({
      kind: 'coach',
      route: routes.unitPostSession,
      canonicalHash: '#/unit/post-session',
      source: 'legacy',
    })
    expect(parseHashRoute('#/bibliothek')).toMatchObject({
      kind: 'coach',
      route: routes.moreLibrary,
      canonicalHash: '#/more/library',
      source: 'legacy',
    })
    expect(parseHashRoute('#/einstellungen')).toMatchObject({
      kind: 'coach',
      route: routes.moreSettings,
      canonicalHash: '#/more/settings',
      source: 'legacy',
    })
    expect(parseHashRoute('#/returner')).toMatchObject({
      kind: 'coach',
      route: routes.unitReturners,
      canonicalHash: '#/unit/returners',
      source: 'legacy',
    })
  })

  it('keeps public check-in hashes outside the coach route model', () => {
    expect(parseHashRoute('#/checkin/player-token-1')).toEqual({
      kind: 'public-check-in',
      token: 'player-token-1',
    })
  })

  it('keeps the hidden welcome route outside the operational coach shell', () => {
    expect(parseHashRoute('#/welcome')).toEqual({ kind: 'welcome' })
  })

  it('falls back unknown coach hashes to Today', () => {
    expect(parseHashRoute('#/unknown')).toMatchObject({
      kind: 'coach',
      route: routes.today,
      canonicalHash: '#/today',
      source: 'fallback',
    })
  })

  it('keeps remembered unit and more routes when changing top-level sections', () => {
    expect(defaultRouteForSection('unit', { unitRoute: 'training', moreRoute: 'export' })).toBe(routes.unitTraining)
    expect(defaultRouteForSection('more', { unitRoute: 'training', moreRoute: 'export' })).toBe(routes.moreExport)
    expect(defaultRouteForSection('players', { unitRoute: 'training', moreRoute: 'export' })).toBe(routes.players)
  })

  it('maps legacy domain navigation targets at the app boundary', () => {
    expect(legacyTargetToRoute('nachbereitung')).toBe(routes.unitPostSession)
    expect(legacyTargetToRoute('returner')).toBe(routes.unitReturners)
    expect(legacyTargetToRoute('spieler')).toBe(routes.players)
  })
})
