import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { OnFieldWordmark } from './OnFieldWordmark'

describe('OnFieldWordmark', () => {
  it('keeps the Mixed Case wordmark and product descriptor accessible while hiding only the decorative dot', () => {
    const markup = renderToStaticMarkup(<OnFieldWordmark context="brand" product="Coach" />)

    expect(markup).toContain('data-context="brand"')
    expect(markup).toContain('<span class="onfield-wordmark-name">OnField</span>')
    expect(markup).toContain('<span class="onfield-wordmark-dot" aria-hidden="true">•</span>')
    expect(markup).toContain('<span class="onfield-wordmark-product">Coach</span>')
    expect(markup).not.toContain('aria-label=')
    expect(markup).not.toContain('Onfield')
    expect(markup).not.toContain('ONFIELD')
  })

  it('uses the operational context without turning the dot into a status label', () => {
    const markup = renderToStaticMarkup(<OnFieldWordmark as="h1" context="operational" compact />)

    expect(markup).toMatch(/^<h1/)
    expect(markup).toMatch(/<\/h1>$/)
    expect(markup).toContain('data-context="operational"')
    expect(markup).not.toMatch(/online|sync|status/i)
  })
})
