import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { AuthSessionState } from '../lib/auth'
import { WelcomeView } from './WelcomeView'

const signedOut: AuthSessionState = { status: 'signed-out', session: null, user: null, error: null }

describe('WelcomeView', () => {
  it('presents the three-stage first-run path with one dominant login action', () => {
    const markup = renderToStaticMarkup(<WelcomeView authState={signedOut} />)

    expect(markup).toContain('<span class="onfield-wordmark-name">OnField</span>')
    expect(markup).toContain('<span class="onfield-wordmark-product">Coach</span>')
    expect(markup).toContain('Trainingstag vorbereiten')
    expect(markup).toContain('1. Login')
    expect(markup).toContain('2. Spieler anlegen')
    expect(markup).toContain('3. Check-in öffnen')
    expect(markup).toContain('aria-current="step"')
    expect(markup).toContain('brand-surface-artwork-hero')
    expect((markup.match(/brand-surface-artwork-hero/g) ?? []).length).toBe(1)
    expect((markup.match(/<section class="brand-surface/g) ?? []).length).toBe(1)
    expect(markup).toContain('auth-panel-embedded')
    expect((markup.match(/of-button-primary/g) ?? []).length).toBe(1)
  })

  it('keeps the runtime loading state inside the same cohesive brand surface', () => {
    const markup = renderToStaticMarkup(
      <WelcomeView authState={{ status: 'loading', session: null, user: null, error: null }} />,
    )

    expect((markup.match(/<section class="brand-surface/g) ?? []).length).toBe(1)
    expect(markup).toContain('OnField Coach wird vorbereitet')
    expect(markup).toContain('role="status"')
    expect(markup).not.toContain('1. Login')
  })
})
