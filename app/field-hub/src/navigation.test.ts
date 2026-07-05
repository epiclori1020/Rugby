import { describe, expect, it } from 'vitest'
import { defaultTabForSection, sectionForTab } from './navigation'

describe('OnField navigation mapping', () => {
  it('maps legacy screen tabs into the five app sections', () => {
    expect(sectionForTab('heute')).toBe('heute')
    expect(sectionForTab('check-in')).toBe('einheit')
    expect(sectionForTab('training')).toBe('einheit')
    expect(sectionForTab('nachbereitung')).toBe('einheit')
    expect(sectionForTab('spieler')).toBe('spieler')
    expect(sectionForTab('analysis')).toBe('analysis')
    expect(sectionForTab('bibliothek')).toBe('mehr')
    expect(sectionForTab('export')).toBe('mehr')
    expect(sectionForTab('einstellungen')).toBe('mehr')
    expect(sectionForTab('returner')).toBe('mehr')
  })

  it('keeps the last used unit and more subsection when changing top-level sections', () => {
    expect(defaultTabForSection('einheit', { unitSubTab: 'training', moreSubTab: 'export' })).toBe('training')
    expect(defaultTabForSection('mehr', { unitSubTab: 'training', moreSubTab: 'export' })).toBe('export')
    expect(defaultTabForSection('spieler', { unitSubTab: 'training', moreSubTab: 'export' })).toBe('spieler')
  })
})
