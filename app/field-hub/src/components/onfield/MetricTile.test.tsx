import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MetricTile } from './MetricTile'

describe('MetricTile', () => {
  it('renders a tabular metric with visible context', () => {
    const markup = renderToStaticMarkup(
      <MetricTile label="Rolling 7d Load" value="462" detail="8 Load-Einträge" />,
    )

    expect(markup).toContain('of-metric-tile')
    expect(markup).toContain('class="of-metric-tile-value of-num"')
    expect(markup).toContain('Rolling 7d Load')
    expect(markup).toContain('462')
    expect(markup).toContain('8 Load-Einträge')
  })

  it('pairs a semantic tone with visible status text', () => {
    const markup = renderToStaticMarkup(
      <MetricTile label="Load Spike" value="1,4x" detail="Beobachten" tone="warning" />,
    )

    expect(markup).toContain('of-metric-tile-warning')
    expect(markup).toContain('Beobachten')
  })
})
