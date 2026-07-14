import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BrandSurface } from './BrandSurface'

describe('BrandSurface', () => {
  it('renders the OnField wordmark with a scoped variant and no forced claim', () => {
    const markup = renderToStaticMarkup(
      <BrandSurface
        body="Field-ready coach operations for the training day."
        title="Trainingstag vorbereiten"
        variant="welcome"
      />,
    )

    expect(markup).toContain('class="brand-surface brand-surface-welcome brand-surface-artwork-none"')
    expect(markup).toContain('<span class="onfield-wordmark-name">OnField</span>')
    expect(markup).toContain('<span class="onfield-wordmark-product">Coach</span>')
    expect(markup).toContain('Trainingstag vorbereiten')
    expect(markup).toContain('data-context="brand"')
    expect(markup).not.toContain('Check in players. Run the session. Wrap the day.')
    expect(markup).not.toContain('brand-surface-claim')
  })

  it('supports explicit hero and texture artwork modes with a safe none default', () => {
    const heroMarkup = renderToStaticMarkup(
      <BrandSurface artwork="hero" body="Body" title="Hero" variant="welcome" />,
    )
    const textureMarkup = renderToStaticMarkup(
      <BrandSurface artwork="texture" body="Body" title="Texture" variant="public" />,
    )
    const noneMarkup = renderToStaticMarkup(
      <BrandSurface body="Body" title="None" variant="compact" />,
    )

    expect(heroMarkup).toContain('brand-surface-artwork-hero')
    expect(textureMarkup).toContain('brand-surface-artwork-texture')
    expect(noneMarkup).toContain('brand-surface-artwork-none')
  })

  it('can render actions and a product frame without forcing extra routes', () => {
    const markup = renderToStaticMarkup(
      <BrandSurface
        body="Know squad status before the whistle."
        primaryAction={<button className="primary-action">Login oeffnen</button>}
        productFrame={<div>Heute / Check-in / Wrap-up</div>}
        title="Coach-Login"
        variant="auth"
      />,
    )

    expect(markup).toContain('Login oeffnen')
    expect(markup).toContain('brand-product-frame')
    expect(markup).toContain('Heute / Check-in / Wrap-up')
  })
})
