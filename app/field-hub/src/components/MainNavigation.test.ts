import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MainNavigation } from './MainNavigation'

const tabLabels = [
  'Heute',
  'Spieler',
  'Check-in',
  'Training',
  'Nachbereitung',
  'Returner',
  'Analyse',
  'Bibliothek',
  'Export',
  'Einstellungen',
]

describe('MainNavigation accessibility contract', () => {
  it('keeps tab buttons named when visual labels are hidden at iPad widths', () => {
    const markup = renderToStaticMarkup(
      createElement(MainNavigation, { activeTab: 'heute', onTabChange: () => undefined }),
    )

    for (const label of tabLabels) {
      expect(markup).toContain(`aria-label="${label}"`)
    }

    expect(markup).toContain('aria-current="page"')
  })
})
