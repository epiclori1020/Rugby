import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AnalysisResultList } from './AnalysisResultList'

describe('AnalysisResultList', () => {
  it('uses one accessible data structure for compact rows and expanded columns', () => {
    const markup = renderToStaticMarkup(
      <AnalysisResultList
        ariaLabel="Wochenverlauf"
        columns={[
          { key: 'week', label: 'Woche' },
          { key: 'load', label: 'sRPE Load', numeric: true },
        ]}
        rows={[
          { id: '2026-06-16', cells: { week: 'KW25', load: '462' } },
        ]}
      />,
    )

    expect(markup).toContain('role="table"')
    expect(markup).toContain('role="columnheader"')
    expect(markup).toContain('role="row"')
    expect(markup).toContain('analysis-result-cell-label')
    expect(markup).not.toContain('aria-hidden="true"')
    expect(markup).toContain('sRPE Load')
    expect(markup).toContain('analysis-result-cell-numeric')
    expect(markup).toContain('of-num')
    expect(markup).not.toContain('<table')
  })
})
