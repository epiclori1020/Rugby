import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BrandSurface } from './BrandSurface'

describe('BrandSurface', () => {
  it('renders the OnField claim with a scoped variant class', () => {
    const markup = renderToStaticMarkup(
      <BrandSurface
        body="Field-ready coach operations for the training day."
        title="Trainingstag vorbereiten"
        variant="welcome"
      />,
    )

    expect(markup).toContain('class="brand-surface brand-surface-welcome"')
    expect(markup).toContain('OnField Coach')
    expect(markup).toContain('Trainingstag vorbereiten')
    expect(markup).toContain('Check in players. Run the session. Wrap the day.')
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
