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

  it('opens PDFs through the in-app viewer instead of a new browser tab', () => {
    const markup = renderToStaticMarkup(<LibraryView />)

    expect(markup).toContain('PDF in App oeffnen')
    expect(markup).not.toContain('target="_blank"')
  })

  it('shows loading feedback while the in-app PDF viewer initializes', () => {
    const markup = renderToStaticMarkup(<LibraryView initialPdfHref="/library/2_COACH_SCRIPT_di_do.pdf" />)

    expect(markup).toContain('PDF wird geladen')
  })

  it('always exposes a direct full PDF link from the viewer', () => {
    const markup = renderToStaticMarkup(<LibraryView initialPdfHref="/library/2_COACH_SCRIPT_di_do.pdf" />)

    expect(markup).toContain('Vollstaendige PDF oeffnen')
    expect(markup).toContain('href="/library/2_COACH_SCRIPT_di_do.pdf"')
    expect(markup).toContain('target="_blank"')
  })

  it('shows a direct PDF fallback when the in-app viewer times out', () => {
    const markup = renderToStaticMarkup(
      <LibraryView initialPdfHref="/library/2_COACH_SCRIPT_di_do.pdf" initialPdfTimedOut />,
    )

    expect(markup).toContain('Direkt oeffnen')
    expect(markup).toContain('href="/library/2_COACH_SCRIPT_di_do.pdf"')
  })
})
