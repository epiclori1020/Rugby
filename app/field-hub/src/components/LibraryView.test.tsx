// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { pdfRefs } from '../content/pdfRefs'
import type { SessionDefinition } from '../content/types'
import { LibraryView } from './LibraryView'

const sessionWithoutLibraryRefs: SessionDefinition = {
  id: 'test-session',
  date: '2026-06-23',
  kw: 'KW26',
  title: 'Sehr lange Session mit bewusst langem Titel fuer iPad-Umbruch und schnelle Unterlagen',
  type: 'training',
  summary: 'Test',
  primarySource: 'plans/offseason_coach_sheets/KW26_tuesday_training_compact_2026-06-23.md',
  pdfRefs: [pdfRefs.kw26TuesdayTrainingCompact],
  goals: [],
  timeline: [],
  materials: [],
  safetyNotes: [],
  coachNotes: [],
  libraryRefs: [],
}

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

  it('shows a return action when opened from another tab', () => {
    const markup = renderToStaticMarkup(
      <LibraryView
        initialPdfHref="/library/2_COACH_SCRIPT_di_do.pdf"
        onReturn={() => undefined}
        returnLabel="Zurück zu Heute"
      />,
    )

    expect(markup).toContain('Zurück zu Heute')
  })

  it('reacts to initialPdfHref changes after mount and calls the return action', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    const onReturn = vi.fn()

    await act(async () => {
      root.render(<LibraryView />)
    })

    expect(container.textContent).not.toContain('PDF wird geladen')

    await act(async () => {
      root.render(
        <LibraryView
          initialPdfHref="/library/2_COACH_SCRIPT_di_do.pdf"
          onReturn={onReturn}
          returnLabel="Zurück zu Heute"
        />,
      )
    })
    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 0))
    })

    expect(container.textContent).toContain('PDF wird geladen')
    container.querySelector<HTMLButtonElement>('[data-testid="library-return-button"]')?.click()
    expect(onReturn).toHaveBeenCalledTimes(1)

    await act(async () => {
      root.unmount()
    })
  })

  it('calls the PDF close callback when the in-app viewer closes', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    const onPdfClose = vi.fn()

    await act(async () => {
      root.render(<LibraryView initialPdfHref="/library/2_COACH_SCRIPT_di_do.pdf" onPdfClose={onPdfClose} />)
    })

    container.querySelector<HTMLButtonElement>('button[aria-label="PDF schliessen"]')?.click()

    expect(onPdfClose).toHaveBeenCalledTimes(1)

    await act(async () => {
      root.unmount()
    })
  })

  it('opens a coach-focused today-relevant filter from the selected session', () => {
    const markup = renderToStaticMarkup(
      <LibraryView initialCategory="Heute relevant" selectedSession={sessionWithoutLibraryRefs} />,
    )

    expect(markup).toContain('Heute relevant')
    expect(markup).toContain('Sehr lange Session mit bewusst langem Titel')
    expect(markup).toContain('Di 23.06 Training kompakt')
    expect(markup).toContain('Variantenkarte A+/A/B/C/D')
    expect(markup).toContain('Exercise Pool Mapping')
    expect(markup).toContain('Aktive Pläne')
  })

  it('keeps archive visibly separated without promoting archive PDFs as active documents', () => {
    const markup = renderToStaticMarkup(<LibraryView initialCategory="Archiv" />)

    expect(markup).toContain('Archiv')
    expect(markup).toContain('_ARCHIV_nicht_drucken')
    expect(markup).toContain('nicht als aktive Vorlage')
    expect(markup).not.toContain('alt_unit_1_one_pager.pdf')
  })
})
