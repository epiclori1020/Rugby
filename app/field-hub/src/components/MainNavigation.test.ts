import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MainNavigation } from './MainNavigation'

const tabLabels = [
  'Heute',
  'Einheit',
  'Spieler',
  'Analyse',
  'Mehr',
]

const hiddenSubsectionLabels = [
  'Check-in',
  'Training',
  'Nachbereitung',
  'Returner',
  'Bibliothek',
  'Export & Backup',
  'Einstellungen',
]

describe('MainNavigation accessibility contract', () => {
  it('renders the five top-level app sections as named navigation buttons', () => {
    const markup = renderToStaticMarkup(
      createElement(MainNavigation, { activeSection: 'heute', onSectionChange: () => undefined }),
    )

    for (const label of tabLabels) {
      expect(markup).toContain(`aria-label="${label}"`)
    }

    for (const label of hiddenSubsectionLabels) {
      expect(markup).not.toContain(`aria-label="${label}"`)
    }

    expect(markup).toContain('aria-current="page"')
    expect(markup.match(/class="nav-button/g)).toHaveLength(5)
  })
})
