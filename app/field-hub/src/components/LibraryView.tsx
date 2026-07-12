import { FileText, Search, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { libraryCategories, libraryItems } from '../content/library'
import { activePdfRefs } from '../content/pdfRefs'
import type { LibraryCategory, LibraryItem, PdfRef, SessionDefinition } from '../content/types'
import { measureInteraction } from '../lib/performanceTrace'
import { prewarmPdfAssets } from '../lib/pdfAssets'
import { Sheet } from './ui'

const allCategoriesLabel = 'Alle'
const todayCategory = 'Heute relevant' satisfies LibraryCategory
const defaultTodayLibraryRefs = ['variants-abcd', 'exercise-mapping-offseason']

type LibraryViewProps = {
  initialQuery?: string
  initialCategory?: LibraryCategory | typeof allCategoriesLabel
  initialItemId?: string
  initialPdfHref?: string
  initialPdfTimedOut?: boolean
  onPdfClose?: () => void
  onReturn?: () => void
  returnLabel?: string
  selectedSession?: SessionDefinition
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

function uniqueLibraryItems(items: LibraryItem[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false
    }

    seen.add(item.id)
    return true
  })
}

function buildTodaySessionItem(selectedSession: SessionDefinition): LibraryItem | null {
  if (selectedSession.pdfRefs.length === 0) {
    return null
  }

  return {
    id: `today-session-${selectedSession.id}`,
    category: 'Aktive Pläne',
    title: selectedSession.title,
    summary: 'Direkte Session-Unterlagen fuer den heutigen Arbeitskontext.',
    sourcePath: selectedSession.primarySource,
    tags: [selectedSession.kw, selectedSession.date, selectedSession.title, 'Heute', 'Plan'],
    sections: [
      {
        title: 'Schnell nutzen',
        body:
          selectedSession.goals.length > 0
            ? selectedSession.goals
            : ['Session-PDFs oeffnen, falls keine strukturierte Library-Referenz hinterlegt ist.'],
      },
    ],
    pdfRefs: selectedSession.pdfRefs,
  }
}

function buildTodayRelevantItems(selectedSession: SessionDefinition | undefined) {
  const libraryItemById = new Map(libraryItems.map((item) => [item.id, item]))

  if (!selectedSession) {
    return defaultTodayLibraryRefs
      .map((libraryRef) => libraryItemById.get(libraryRef))
      .filter((item): item is LibraryItem => Boolean(item))
  }

  const sessionItem = buildTodaySessionItem(selectedSession)
  const referencedItems = selectedSession.libraryRefs
    .map((libraryRef) => libraryItemById.get(libraryRef))
    .filter((item): item is LibraryItem => Boolean(item))
  const fallbackItems =
    referencedItems.length > 0
      ? []
      : defaultTodayLibraryRefs
          .map((libraryRef) => libraryItemById.get(libraryRef))
          .filter((item): item is LibraryItem => Boolean(item))

  return uniqueLibraryItems([sessionItem, ...referencedItems, ...fallbackItems].filter((item): item is LibraryItem => Boolean(item)))
}

function LibraryDetailContent({
  item,
  onOpenPdf,
}: {
  item: LibraryItem
  onOpenPdf: (pdf: PdfRef, trigger: HTMLButtonElement) => void
}) {
  return (
    <>
      <div className="library-heading">
        <p className="eyebrow">{item.category}</p>
        <h3>{item.title}</h3>
        <p>{item.summary}</p>
      </div>

      <div className="source-box">
        <span>Quelle</span>
        <strong>{item.sourcePath}</strong>
      </div>
      <div className="library-workflow-strip" aria-label="Arbeitsnutzen">
        <span className="tag compact">{item.category}</span>
        {item.pdfRefs && item.pdfRefs.length > 0 ? (
          <span className="tag compact">{item.pdfRefs.length} PDF-Fallback(s)</span>
        ) : null}
      </div>

      <div className="section-stack">
        {item.sections.map((section) => (
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

      {item.pdfRefs && item.pdfRefs.length > 0 ? (
        <div className="pdf-list" aria-label="PDF-Fallbacks">
          <h4>PDF-Fallback</h4>
          <p className="pdf-note">Oeffnet PDF direkt in der App mit eigener Schliessen-Option.</p>
          <div className="pdf-link-grid">
            {item.pdfRefs.map((pdf) => (
              <button
                className="pdf-link"
                key={pdf.href}
                type="button"
                onClick={(event) => onOpenPdf(pdf, event.currentTarget)}
              >
                <span>{pdf.label}</span>
                <FileText className="nav-icon" aria-hidden />
                <small>PDF in App oeffnen</small>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  )
}

export function LibraryView({
  initialQuery = '',
  initialCategory = allCategoriesLabel,
  initialItemId,
  initialPdfHref,
  initialPdfTimedOut = false,
  onPdfClose,
  onReturn,
  returnLabel,
  selectedSession,
}: LibraryViewProps = {}) {
  const [selectedCategory, setSelectedCategory] = useState<LibraryCategory | typeof allCategoriesLabel>(
    initialCategory,
  )
  const [query, setQuery] = useState(initialQuery)
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(initialItemId ?? libraryItems[0]?.id)
  const [selectedPdf, setSelectedPdf] = useState<PdfRef | null>(() => findPdfByHref(initialPdfHref))
  const [isPdfLoading, setIsPdfLoading] = useState(Boolean(initialPdfHref))
  const [hasPdfTimedOut, setHasPdfTimedOut] = useState(initialPdfTimedOut)
  const [isCompact, setIsCompact] = useState(
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(max-width: 599px)').matches
      : false,
  )
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false)
  const completePdfOpenMeasureRef = useRef<(() => void) | null>(null)
  const pdfDialogRef = useRef<HTMLElement | null>(null)
  const pdfCloseButtonRef = useRef<HTMLButtonElement | null>(null)
  const pdfReturnFocusRef = useRef<HTMLElement | null>(null)
  const todayRelevantItems = useMemo(() => buildTodayRelevantItems(selectedSession), [selectedSession])

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const sourceItems = selectedCategory === todayCategory ? todayRelevantItems : libraryItems

    return sourceItems.filter((item) => {
      const categoryMatches =
        selectedCategory === allCategoriesLabel || selectedCategory === todayCategory || item.category === selectedCategory
      const queryMatches = normalizedQuery.length === 0 || searchableText(item).includes(normalizedQuery)
      return categoryMatches && queryMatches
    })
  }, [query, selectedCategory, todayRelevantItems])

  const selectedItem = filteredItems.find((item) => item.id === selectedItemId) ?? filteredItems[0] ?? null

  function chooseCategory(category: LibraryCategory | typeof allCategoriesLabel) {
    setSelectedCategory(category)
    setIsDetailSheetOpen(false)
    const firstMatching =
      category === todayCategory
        ? todayRelevantItems[0]
        : category === allCategoriesLabel
        ? libraryItems[0]
        : libraryItems.find((item) => item.category === category)

    if (firstMatching) {
      setSelectedItemId(firstMatching.id)
    }
  }

  function chooseItem(itemId: string) {
    setSelectedItemId(itemId)
    if (isCompact) {
      setIsDetailSheetOpen(true)
    }
  }

  function openPdf(pdf: PdfRef, trigger: HTMLButtonElement) {
    if (!pdf.href.startsWith('/library/')) {
      return
    }

    pdfReturnFocusRef.current = trigger
    completePdfOpenMeasureRef.current?.()
    completePdfOpenMeasureRef.current = null
    setIsDetailSheetOpen(false)
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

  const closePdf = useCallback(() => {
    completePdfOpenMeasureRef.current?.()
    completePdfOpenMeasureRef.current = null
    setSelectedPdf(null)
    setIsPdfLoading(false)
    setHasPdfTimedOut(false)
    onPdfClose?.()
    window.requestAnimationFrame(() => {
      const returnTarget = pdfReturnFocusRef.current?.isConnected
        ? pdfReturnFocusRef.current
        : document.querySelector<HTMLElement>('.library-list-item.active')
      returnTarget?.focus()
      pdfReturnFocusRef.current = null
    })
  }, [onPdfClose])

  function handlePdfDialogKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      closePdf()
      return
    }

    if (event.key !== 'Tab') {
      return
    }

    const focusableElements = Array.from(
      pdfDialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [href], [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    )
    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements.at(-1)
    if (!firstFocusable || !lastFocusable) {
      event.preventDefault()
      pdfDialogRef.current?.focus()
      return
    }

    if (event.shiftKey && (document.activeElement === firstFocusable || document.activeElement === pdfDialogRef.current)) {
      event.preventDefault()
      lastFocusable.focus()
    } else if (!event.shiftKey && (document.activeElement === lastFocusable || document.activeElement === pdfDialogRef.current)) {
      event.preventDefault()
      firstFocusable.focus()
    }
  }

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return undefined
    }

    const mediaQuery = window.matchMedia('(max-width: 599px)')
    const handleChange = (event: MediaQueryListEvent) => {
      setIsCompact(event.matches)
      if (!event.matches) {
        setIsDetailSheetOpen(false)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    const nextPdf = findPdfByHref(initialPdfHref)
    if (!nextPdf) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setSelectedPdf(nextPdf)
      setIsPdfLoading(true)
      setHasPdfTimedOut(initialPdfTimedOut)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [initialPdfHref, initialPdfTimedOut])

  useEffect(() => {
    if (!selectedPdf) {
      return undefined
    }

    const frameId = window.requestAnimationFrame(() => pdfCloseButtonRef.current?.focus())
    return () => window.cancelAnimationFrame(frameId)
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
          <p className="eyebrow">Referenzbereich</p>
          <h3 id="library-heading">Bibliothek</h3>
          <p>Ruhiger Nachschlagebereich fuer Plaene, Playbooks, Session-Inhalte und Quellen. PDFs bleiben Fallback.</p>
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
            aria-pressed={selectedCategory === allCategoriesLabel}
            className={selectedCategory === allCategoriesLabel ? 'filter-chip active' : 'filter-chip'}
            type="button"
            onClick={() => chooseCategory(allCategoriesLabel)}
          >
            {allCategoriesLabel}
          </button>
          <button
            aria-pressed={selectedCategory === todayCategory}
            className={selectedCategory === todayCategory ? 'filter-chip active' : 'filter-chip'}
            type="button"
            onClick={() => chooseCategory(todayCategory)}
          >
            {todayCategory}
          </button>
          {libraryCategories.map((category) => (
            <button
              aria-pressed={selectedCategory === category}
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
              aria-pressed={selectedItem?.id === item.id}
              className={selectedItem?.id === item.id ? 'library-list-item active' : 'library-list-item'}
              key={item.id}
              type="button"
              onClick={() => chooseItem(item.id)}
            >
              <span>{item.category}</span>
              <strong>{item.title}</strong>
              <small>{item.summary}</small>
            </button>
          ))}
          {filteredItems.length === 0 ? (
            <p className="empty-state">
              {selectedCategory === todayCategory
                ? 'Keine heutigen Unterlagen fuer diese Suche gefunden.'
                : 'Keine Unterlage fuer diese Suche gefunden.'}
            </p>
          ) : null}
        </div>
      </div>

      {!isCompact && selectedItem ? (
        <article className="panel library-detail library-detail-pane">
          <LibraryDetailContent item={selectedItem} onOpenPdf={openPdf} />
        </article>
      ) : !isCompact ? (
        <article className="panel library-detail library-detail-pane empty-detail">
          <div className="library-heading">
            <p className="eyebrow">Keine Treffer</p>
            <h3>Keine Unterlage ausgewaehlt</h3>
            <p>
              {selectedCategory === todayCategory
                ? 'Fuer diese Einheit sind keine passenden Unterlagen in der aktuellen Suche sichtbar.'
                : 'Waehle eine andere Suche oder Kategorie.'}
            </p>
          </div>
        </article>
      ) : null}

      {isCompact && isDetailSheetOpen && selectedItem ? (
        <Sheet
          title="Unterlage ansehen"
          description={selectedItem.category}
          onClose={() => setIsDetailSheetOpen(false)}
        >
          <div className="library-detail library-detail-sheet">
            <LibraryDetailContent item={selectedItem} onOpenPdf={openPdf} />
          </div>
        </Sheet>
      ) : null}

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
            onKeyDown={handlePdfDialogKeyDown}
            ref={pdfDialogRef}
            tabIndex={-1}
          >
            <div className="pdf-viewer-toolbar">
              <div>
                <span>PDF</span>
                <strong>{selectedPdf.label}</strong>
              </div>
              <div className="pdf-viewer-actions">
                {onReturn && returnLabel ? (
                  <button
                    className="secondary-action compact-action"
                    data-testid="library-return-button"
                    type="button"
                    onClick={onReturn}
                  >
                    {returnLabel}
                  </button>
                ) : null}
                <a className="secondary-action compact-action" href={selectedPdf.href} target="_blank" rel="noreferrer">
                  Vollstaendige PDF oeffnen
                </a>
                <button
                  className="icon-button"
                  type="button"
                  aria-label="PDF schliessen"
                  onClick={closePdf}
                  ref={pdfCloseButtonRef}
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
