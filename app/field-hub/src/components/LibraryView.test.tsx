import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LibraryView } from './LibraryView'

describe('LibraryView empty states', () => {
  it('does not render a stale detail item when search has no matches', () => {
    const markup = renderToStaticMarkup(<LibraryView initialQuery="kein-treffer-xyz" />)

    expect(markup).toContain('Keine Unterlage fuer diese Suche gefunden.')
    expect(markup).toContain('Waehle eine andere Suche oder Kategorie.')
    expect(markup).not.toContain('Coach-Skript KW25: Was sage ich?')
  })
})
