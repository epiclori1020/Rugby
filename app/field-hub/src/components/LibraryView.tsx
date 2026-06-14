import { ExternalLink, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { libraryCategories, libraryItems } from '../content/library'
import type { LibraryCategory, LibraryItem } from '../content/types'

const allCategoriesLabel = 'Alle'

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

export function LibraryView() {
  const [selectedCategory, setSelectedCategory] = useState<LibraryCategory | typeof allCategoriesLabel>(
    allCategoriesLabel,
  )
  const [query, setQuery] = useState('')
  const [selectedItemId, setSelectedItemId] = useState(libraryItems[0]?.id)

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return libraryItems.filter((item) => {
      const categoryMatches = selectedCategory === allCategoriesLabel || item.category === selectedCategory
      const queryMatches = normalizedQuery.length === 0 || searchableText(item).includes(normalizedQuery)
      return categoryMatches && queryMatches
    })
  }, [query, selectedCategory])

  const selectedItem =
    filteredItems.find((item) => item.id === selectedItemId) ?? filteredItems[0] ?? libraryItems[0]

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

  return (
    <section className="library-layout" aria-labelledby="library-heading">
      <div className="library-sidebar panel">
        <div className="library-heading">
          <p className="eyebrow">Sprint 2</p>
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
              className={selectedItem.id === item.id ? 'library-list-item active' : 'library-list-item'}
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
            <div className="pdf-link-grid">
              {selectedItem.pdfRefs.map((pdf) => (
                <a className="pdf-link" href={pdf.href} key={pdf.href} target="_blank" rel="noreferrer">
                  <span>{pdf.label}</span>
                  <ExternalLink className="nav-icon" aria-hidden />
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </article>
    </section>
  )
}
