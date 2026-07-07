/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = process.cwd()

function readAppCss() {
  return readFileSync(join(projectRoot, 'src/index.css'), 'utf8')
}

describe('Sprint 18 accessibility CSS contracts', () => {
  it('keeps coach actions, icon buttons and PDF links keyboard visible', () => {
    const css = readAppCss()

    expect(css).toContain('.primary-action:focus-visible')
    expect(css).toContain('.secondary-action:focus-visible')
    expect(css).toContain('.icon-button:focus-visible')
    expect(css).toContain('.pdf-link:focus-visible')
    expect(css).toContain('.kiosk-exit-button:focus-visible')
    expect(css).toContain('outline: 3px solid var(--of-color-focus-ring)')
    expect(css).toContain('outline-offset: 2px')
  })

  it('keeps touch targets and bottom safe areas large enough for iPhone and iPad PWA use', () => {
    const css = readAppCss()

    expect(css).toContain('--shell-bottom-clearance: calc(var(--shell-bottom-nav-height) + env(safe-area-inset-bottom))')
    expect(css).toContain('min-height: 48px')
    expect(css).toContain('width: 44px')
    expect(css).toContain('height: 44px')
    expect(css).toContain('bottom: calc(16px + env(safe-area-inset-bottom))')
    expect(css).toContain('padding-bottom: calc(88px + env(safe-area-inset-bottom))')
  })

  it('keeps Sprint 25 responsive shell breakpoints aligned with the SSOT', () => {
    const css = readAppCss()

    expect(css).toContain('@media (max-width: 839px)')
    expect(css).toContain('@media (max-width: 599px)')
    expect(css).not.toContain('@media (max-width: 760px)')
    expect(css).not.toContain('@media (max-width: 560px)')
  })
})
