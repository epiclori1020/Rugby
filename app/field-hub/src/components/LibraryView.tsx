import { FileText, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { libraryCategories, libraryItems } from '../content/library'
import { activePdfRefs } from '../content/pdfRefs'
import type { LibraryCategory, LibraryItem, PdfRef } from '../content/types'
import { measureInteraction } from '../lib/performanceTrace'
import { prewarmPdfAssets } from '../lib/pdfAssets'

const allCategoriesLabel = 'Alle'

type LibraryViewProps = {
  initialQuery?: string
  initialPdfHref?: string
  initialPdfTimedOut?: boolean
}

function searchableText(item: LibraryItem) {
  return [
    item.title,
    item.summary,
    item.sourcePath,
    item.category,
    item.tags.join(' '),
    item.sections.map((section) => `${section.title} ${section.body.join(' ')}`).join(' '),
  ]
    .join(' ')
    .toLowerCase()
}

function findPdfByHref(href: string | undefined) {
  if (!href || !href.startsWith('/library/')) {
    return null
  }

  return activePdfRefs.find((pdf) => pdf.href === href) ?? null
}

export function LibraryView({ initialQuery = '', initialPdfHref, initialPdfTimedOut = false }: LibraryViewProps = {}) {
  const [selectedCategory, setSelectedCategory] = useState<LibraryCategory | typeof allCategoriesLabel>(
    allCategoriesLabel,
  )
  const [query, setQuery] = useState(initialQuery)
  const [selectedItemId, setSelectedItemId] = useState(libraryItems[0]?.id)
  const [selectedPdf, setSelectedPdf] = useState<PdfRef | null>(() => findPdfByHref(initialPdfHref))
  const [isPdfLoading, setIsPdfLoading] = useState(Boolean(initialPdfHref))
  const [hasPdfTimedOut, setHasPdfTimedOut] = useState(initialPdfTimedOut)
  const completePdfOpenMeasureRef = useRef<(() => void) | null>(null)

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return libraryItems.filter((item) => {
      const categoryMatches = selectedCategory === allCategoriesLabel || item.category === selectedCategory
      const queryMatches = normalizedQuery.length === 0 || searchableText(item).includes(normalizedQuery)
      return categoryMatches && queryMatches
    })
  }, [query, selectedCategory])

  const selectedItem = filteredItems.find((item) => item.id === selectedItemId) ?? filteredItems[0] ?? null

  function chooseCategory(category: LibraryCategory | typeof allCategoriesLabel) {
    setSelectedCategory(category)
    const firstMatching =
      category === allCategoriesLabel
        ? libraryItems[0]
        : libraryItems.find((item) => item.category === category)

    if (firstMatching) {
      setSelectedItemId(firstMatching.id)
    }
  }

  function openPdf(pdf: PdfRef) {
    if (!pdf.href.startsWith('/library/')) {
      return
    }

    completePdfOpenMeasureRef.current?.()
    completePdfOpenMeasureRef.current = null
    setSelectedPdf(pdf)
    setIsPdfLoading(true)
    setHasPdfTimedOut(false)
    void measureInteraction(
      'pdf:open',
      () =>
        new Promise<void>((resolve) => {
          completePdfOpenMeasureRef.current = resolve
        }),
    )
    void prewarmPdfAssets([pdf.href])
  }

  function closePdf() {
    completePdfOpenMeasureRef.current?.()
    completePdfOpenMeasureRef.current = null
    setSelectedPdf(null)
    setIsPdfLoading(false)
    setHasPdfTimedOut(false)
  }

  useEffect(() => {
    if (!selectedPdf) {
      return undefined
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closePdf()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedPdf])

  useEffect(() => {
    if (!selectedPdf || !isPdfLoading) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => setHasPdfTimedOut(true), 8000)
    return () => window.clearTimeout(timeoutId)
  }, [isPdfLoading, selectedPdf])

  return (
    <section className="library-layout" aria-labelledby="library-heading">
      <div className="library-sidebar panel">
        <div className="library-heading">
          <p className="eyebrow">Unterlagen</p>
          <h3 id="library-heading">Bibliothek</h3>
          <p>Strukturierte Unterlagen als App-UI. PDFs bleiben Fallback.</p>
        </div>

        <label className="search-box">
          <Search className="nav-icon" aria-hidden />
          <span className="sr-only">Bibliothek durchsuchen</span>
          <input
            type="search"
            value={query}
            placeholder="Suchen: Ampel, Returner, KW26..."
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <div className="filter-row" aria-label="Bibliothekskategorien">
          <button
            className={selectedCategory === allCategoriesLabel ? 'filter-chip active' : 'filter-chip'}
            type="button"
            onClick={() => chooseCategory(allCategoriesLabel)}
          >
            {allCategoriesLabel}
          </button>
          {libraryCategories.map((category) => (
            <button
              className={selectedCategory === category ? 'filter-chip active' : 'filter-chip'}
              key={category}
              type="button"
              onClick={() => chooseCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="library-list" aria-label="Bibliothekseintraege">
          {filteredItems.map((item) => (
            <button
              className={selectedItem?.id === item.id ? 'library-list-item active' : 'library-list-item'}
              key={item.id}
              type="button"
              onClick={() => setSelectedItemId(item.id)}
            >
              <span>{item.category}</span>
              <strong>{item.title}</strong>
              <small>{item.summary}</small>
            </button>
          ))}
          {filteredItems.length === 0 ? (
            <p className="empty-state">Keine Unterlage fuer diese Suche gefunden.</p>
          ) : null}
        </div>
      </div>

      {selectedItem ? (
        <article className="panel library-detail">
          <div className="library-heading">
            <p className="eyebrow">{selectedItem.category}</p>
            <h3>{selectedItem.title}</h3>
            <p>{selectedItem.summary}</p>
          </div>

          <div className="source-box">
            <span>Quelle</span>
            <strong>{selectedItem.sourcePath}</strong>
          </div>

          <div className="section-stack">
            {selectedItem.sections.map((section) => (
              <section className="library-section" key={section.title}>
                <h4>{section.title}</h4>
                <ul>
                  {section.body.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {selectedItem.pdfRefs && selectedItem.pdfRefs.length > 0 ? (
            <div className="pdf-list" aria-label="PDF-Fallbacks">
              <h4>PDF-Fallback</h4>
              <p className="pdf-note">Oeffnet PDF direkt in der App mit eigener Schliessen-Option.</p>
              <div className="pdf-link-grid">
                {selectedItem.pdfRefs.map((pdf) => (
                  <button className="pdf-link" key={pdf.href} type="button" onClick={() => openPdf(pdf)}>
                    <span>{pdf.label}</span>
                    <FileText className="nav-icon" aria-hidden />
                    <small>PDF in App oeffnen</small>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </article>
      ) : (
        <article className="panel library-detail empty-detail">
          <div className="library-heading">
            <p className="eyebrow">Keine Treffer</p>
            <h3>Keine Unterlage ausgewaehlt</h3>
            <p>Waehle eine andere Suche oder Kategorie.</p>
          </div>
        </article>
      )}

      {selectedPdf ? (
        <div
          className="pdf-viewer-backdrop"
          role="presentation"
          onClick={(event) => {
            if (event.currentTarget === event.target) {
              closePdf()
            }
          }}
        >
          <section
            className="pdf-viewer-sheet"
            role="dialog"
            aria-label={`${selectedPdf.label} PDF Viewer`}
            aria-modal="true"
          >
            <div className="pdf-viewer-toolbar">
              <div>
                <span>PDF</span>
                <strong>{selectedPdf.label}</strong>
              </div>
              <div className="pdf-viewer-actions">
                <a className="secondary-action compact-action" href={selectedPdf.href} target="_blank" rel="noreferrer">
                  Vollstaendige PDF oeffnen
                </a>
                <button
                  className="icon-button"
                  type="button"
                  aria-label="PDF schliessen"
                  onClick={closePdf}
                >
                  <X className="nav-icon" aria-hidden />
                </button>
              </div>
            </div>
            <div className="pdf-viewer-body">
              {isPdfLoading ? (
                <div className="pdf-loading" role="status">
                  {hasPdfTimedOut ? (
                    <>
                      PDF braucht laenger.
                      <a className="secondary-action compact-action" href={selectedPdf.href} target="_blank" rel="noreferrer">
                        Direkt oeffnen
                      </a>
                    </>
                  ) : (
                    'PDF wird geladen...'
                  )}
                </div>
              ) : null}
              <iframe
                className="pdf-viewer-frame"
                src={selectedPdf.href}
                title={selectedPdf.label}
                referrerPolicy="no-referrer"
                onLoad={() => {
                  completePdfOpenMeasureRef.current?.()
                  completePdfOpenMeasureRef.current = null
                  setIsPdfLoading(false)
                  setHasPdfTimedOut(false)
                }}
              />
            </div>
          </section>
        </div>
      ) : null}
    </section>
  )
}
