export type UnitSubTab = 'check-in' | 'training' | 'nachbereitung'
export type MoreSubTab = 'bibliothek' | 'export' | 'einstellungen' | 'returner'
export type AppSection = 'heute' | 'einheit' | 'spieler' | 'analysis' | 'mehr'
export type HubTab = 'heute' | 'spieler' | 'analysis' | UnitSubTab | MoreSubTab

export const unitSubTabs: readonly UnitSubTab[] = ['check-in', 'training', 'nachbereitung']
export const moreSubTabs: readonly MoreSubTab[] = ['bibliothek', 'export', 'einstellungen', 'returner']
export const appSections: readonly AppSection[] = ['heute', 'einheit', 'spieler', 'analysis', 'mehr']

export function isUnitSubTab(tab: HubTab): tab is UnitSubTab {
  return (unitSubTabs as readonly string[]).includes(tab)
}

export function isMoreSubTab(tab: HubTab): tab is MoreSubTab {
  return (moreSubTabs as readonly string[]).includes(tab)
}

export function sectionForTab(tab: HubTab): AppSection {
  if (isUnitSubTab(tab)) {
    return 'einheit'
  }

  if (isMoreSubTab(tab)) {
    return 'mehr'
  }

  return tab
}

export function defaultTabForSection(
  section: AppSection,
  rememberedTabs: { unitSubTab: UnitSubTab; moreSubTab: MoreSubTab },
): HubTab {
  if (section === 'einheit') {
    return rememberedTabs.unitSubTab
  }

  if (section === 'mehr') {
    return rememberedTabs.moreSubTab
  }

  return section
}
