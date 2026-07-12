import type { CSSProperties, ReactNode } from 'react'

export type AnalysisResultColumn = {
  key: string
  label: string
  numeric?: boolean
}

export type AnalysisResultRow = {
  id: string
  cells: Record<string, ReactNode>
}

type AnalysisResultListProps = {
  ariaLabel: string
  columns: AnalysisResultColumn[]
  rows: AnalysisResultRow[]
}

export function AnalysisResultList({ ariaLabel, columns, rows }: AnalysisResultListProps) {
  return (
    <div
      aria-label={ariaLabel}
      className="analysis-result-list"
      role="table"
      style={{ '--analysis-column-count': columns.length } as CSSProperties}
    >
      <div className="analysis-result-header" role="row">
        {columns.map((column) => (
          <span className={column.numeric ? 'of-num' : undefined} key={column.key} role="columnheader">
            {column.label}
          </span>
        ))}
      </div>
      <div className="analysis-result-body" role="rowgroup">
        {rows.map((row) => (
          <div className="analysis-result-row" key={row.id} role="row">
            {columns.map((column) => (
              <div
                className={`analysis-result-cell${column.numeric ? ' analysis-result-cell-numeric of-num' : ''}`}
                key={column.key}
                role="cell"
              >
                <span className="analysis-result-cell-label">
                  {column.label}
                </span>
                <span className="analysis-result-cell-value">{row.cells[column.key]}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
