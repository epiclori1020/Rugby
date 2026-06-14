import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PwaUpdateNotice } from './PwaUpdateNotice'

describe('PwaUpdateNotice', () => {
  it('renders a reload action when a new app version is waiting', () => {
    const markup = renderToStaticMarkup(<PwaUpdateNotice onReload={() => undefined} />)

    expect(markup).toContain('Neue App-Version bereit')
    expect(markup).toContain('Aktualisieren')
  })
})
