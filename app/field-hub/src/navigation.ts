export type AppSection = 'today' | 'unit' | 'players' | 'analysis' | 'more'
export type UnitRoute = 'check-in' | 'training' | 'returners' | 'post-session'
export type MoreRoute = 'library' | 'export' | 'settings' | 'returners'

export type AppRoute =
  | { section: 'today' }
  | { section: 'unit'; unitRoute: UnitRoute }
  | { section: 'players' }
  | { section: 'analysis' }
  | { section: 'more'; moreRoute: MoreRoute }

export type LegacyNavigationTarget =
  | 'heute'
  | 'einheit'
  | 'spieler'
  | 'analysis'
  | 'analyse'
  | 'mehr'
  | 'check-in'
  | 'training'
  | 'nachbereitung'
  | 'bibliothek'
  | 'export'
  | 'einstellungen'
  | 'returner'

export type ParsedHashRoute =
  | { kind: 'coach'; route: AppRoute; canonicalHash: string; source: 'canonical' | 'legacy' | 'fallback' }
  | { kind: 'welcome' }
  | { kind: 'public-check-in'; token: string }

export const appSections: readonly AppSection[] = ['today', 'unit', 'players', 'analysis', 'more']
export const unitRoutes: readonly UnitRoute[] = ['check-in', 'training', 'returners', 'post-session']
export const moreRoutes: readonly MoreRoute[] = ['library', 'export', 'settings', 'returners']

export const routes = {
  today: { section: 'today' },
  unitCheckIn: { section: 'unit', unitRoute: 'check-in' },
  unitTraining: { section: 'unit', unitRoute: 'training' },
  unitReturners: { section: 'unit', unitRoute: 'returners' },
  unitPostSession: { section: 'unit', unitRoute: 'post-session' },
  players: { section: 'players' },
  analysis: { section: 'analysis' },
  moreLibrary: { section: 'more', moreRoute: 'library' },
  moreExport: { section: 'more', moreRoute: 'export' },
  moreSettings: { section: 'more', moreRoute: 'settings' },
  moreReturners: { section: 'more', moreRoute: 'returners' },
} as const satisfies Record<string, AppRoute>

export const canonicalCoachRoutes = [
  routes.today,
  routes.unitCheckIn,
  routes.unitTraining,
  routes.unitReturners,
  routes.unitPostSession,
  routes.players,
  routes.analysis,
  routes.moreLibrary,
  routes.moreExport,
  routes.moreSettings,
  routes.moreReturners,
] as const satisfies readonly AppRoute[]

const canonicalHashByKey = {
  today: '#/today',
  'unit/check-in': '#/unit/check-in',
  'unit/training': '#/unit/training',
  'unit/returners': '#/unit/returners',
  'unit/post-session': '#/unit/post-session',
  players: '#/players',
  analysis: '#/analysis',
  'more/library': '#/more/library',
  'more/export': '#/more/export',
  'more/settings': '#/more/settings',
  'more/returners': '#/more/returners',
} as const

const routeByHashPath = new Map<string, AppRoute>([
  ['', routes.today],
  ['/', routes.today],
  ['today', routes.today],
  ['unit/check-in', routes.unitCheckIn],
  ['unit/training', routes.unitTraining],
  ['unit/returners', routes.unitReturners],
  ['unit/post-session', routes.unitPostSession],
  ['players', routes.players],
  ['analysis', routes.analysis],
  ['more/library', routes.moreLibrary],
  ['more/export', routes.moreExport],
  ['more/settings', routes.moreSettings],
  ['more/returners', routes.moreReturners],
])

const legacyRouteByHashPath = new Map<string, AppRoute>([
  ['heute', routes.today],
  ['einheit', routes.unitCheckIn],
  ['unit', routes.unitCheckIn],
  ['check-in', routes.unitCheckIn],
  ['checkin', routes.unitCheckIn],
  ['unit/checkin', routes.unitCheckIn],
  ['unit/nachbereitung', routes.unitPostSession],
  ['nachbereitung', routes.unitPostSession],
  ['post-session', routes.unitPostSession],
  ['spieler', routes.players],
  ['analyse', routes.analysis],
  ['mehr', routes.moreLibrary],
  ['bibliothek', routes.moreLibrary],
  ['library', routes.moreLibrary],
  ['more/bibliothek', routes.moreLibrary],
  ['einstellungen', routes.moreSettings],
  ['settings', routes.moreSettings],
  ['more/einstellungen', routes.moreSettings],
  ['returner', routes.unitReturners],
  ['returners', routes.unitReturners],
  ['unit/returner', routes.unitReturners],
  ['more/returner', routes.moreReturners],
])

export function isUnitRoute(value: string): value is UnitRoute {
  return (unitRoutes as readonly string[]).includes(value)
}

export function isMoreRoute(value: string): value is MoreRoute {
  return (moreRoutes as readonly string[]).includes(value)
}

export function routeKey(route: AppRoute) {
  if (route.section === 'unit') {
    return `unit/${route.unitRoute}` as const
  }

  if (route.section === 'more') {
    return `more/${route.moreRoute}` as const
  }

  return route.section
}

export function routesEqual(first: AppRoute, second: AppRoute) {
  return routeKey(first) === routeKey(second)
}

export function routeToHash(route: AppRoute) {
  return canonicalHashByKey[routeKey(route)]
}

export function routeForUnit(unitRoute: UnitRoute): AppRoute {
  if (unitRoute === 'check-in') {
    return routes.unitCheckIn
  }

  if (unitRoute === 'training') {
    return routes.unitTraining
  }

  if (unitRoute === 'returners') {
    return routes.unitReturners
  }

  return routes.unitPostSession
}

export function routeForMore(moreRoute: MoreRoute): AppRoute {
  if (moreRoute === 'library') {
    return routes.moreLibrary
  }

  if (moreRoute === 'export') {
    return routes.moreExport
  }

  if (moreRoute === 'settings') {
    return routes.moreSettings
  }

  return routes.moreReturners
}

export function defaultRouteForSection(
  section: AppSection,
  rememberedRoutes: { unitRoute: UnitRoute; moreRoute: MoreRoute },
): AppRoute {
  if (section === 'unit') {
    return routeForUnit(rememberedRoutes.unitRoute)
  }

  if (section === 'more') {
    return routeForMore(rememberedRoutes.moreRoute)
  }

  if (section === 'players') {
    return routes.players
  }

  if (section === 'analysis') {
    return routes.analysis
  }

  return routes.today
}

export function legacyTargetToRoute(target: LegacyNavigationTarget): AppRoute {
  if (target === 'heute') {
    return routes.today
  }

  if (target === 'einheit' || target === 'check-in') {
    return routes.unitCheckIn
  }

  if (target === 'training') {
    return routes.unitTraining
  }

  if (target === 'nachbereitung') {
    return routes.unitPostSession
  }

  if (target === 'spieler') {
    return routes.players
  }

  if (target === 'analysis' || target === 'analyse') {
    return routes.analysis
  }

  if (target === 'mehr' || target === 'bibliothek') {
    return routes.moreLibrary
  }

  if (target === 'export') {
    return routes.moreExport
  }

  if (target === 'einstellungen') {
    return routes.moreSettings
  }

  return routes.unitReturners
}

function normalizeHashPath(hash: string) {
  return hash.replace(/^#\/?/, '').split(/[?#]/, 1)[0]?.replace(/^\/+|\/+$/g, '').toLowerCase() ?? ''
}

export function parseHashRoute(hash: string): ParsedHashRoute {
  const publicCheckInMatch = hash.match(/^#\/checkin\/([^/?#]+)/)
  if (publicCheckInMatch) {
    return { kind: 'public-check-in', token: decodeURIComponent(publicCheckInMatch[1]) }
  }

  if (normalizeHashPath(hash) === 'welcome') {
    return { kind: 'welcome' }
  }

  const hashPath = normalizeHashPath(hash)
  const canonicalRoute = routeByHashPath.get(hashPath)
  if (canonicalRoute) {
    return {
      kind: 'coach',
      route: canonicalRoute,
      canonicalHash: routeToHash(canonicalRoute),
      source: 'canonical',
    }
  }

  const legacyRoute = legacyRouteByHashPath.get(hashPath)
  if (legacyRoute) {
    return {
      kind: 'coach',
      route: legacyRoute,
      canonicalHash: routeToHash(legacyRoute),
      source: 'legacy',
    }
  }

  return {
    kind: 'coach',
    route: routes.today,
    canonicalHash: routeToHash(routes.today),
    source: 'fallback',
  }
}
