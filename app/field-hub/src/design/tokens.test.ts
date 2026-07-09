/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = process.cwd()

function readSource(path: string) {
  return readFileSync(join(projectRoot, path), 'utf8')
}

function extractToken(source: string, tokenName: string) {
  const match = source.match(new RegExp(`${tokenName}:\\s*([^;]+);`))

  if (!match) {
    throw new Error(`Missing token: ${tokenName}`)
  }

  return match[1].trim()
}

function contrastRatio(foreground: string, background: string) {
  function luminance(hex: string) {
    const normalized = hex.replace('#', '')
    const channels = normalized.match(/[0-9A-Fa-f]{2}/g)

    if (!channels || channels.length !== 3) {
      throw new Error(`Expected six-digit hex color, got ${hex}`)
    }

    const [red, green, blue] = channels.map((channel) => {
      const value = Number.parseInt(channel, 16) / 255
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    })

    return 0.2126 * red + 0.7152 * green + 0.0722 * blue
  }

  const foregroundLuminance = luminance(foreground)
  const backgroundLuminance = luminance(background)
  const lighter = Math.max(foregroundLuminance, backgroundLuminance)
  const darker = Math.min(foregroundLuminance, backgroundLuminance)

  return (lighter + 0.05) / (darker + 0.05)
}

describe('OnField design tokens', () => {
  it('loads the token foundation before screen styles', () => {
    const indexCss = readSource('src/index.css')

    expect(indexCss.startsWith('@import "./design/tokens.css";')).toBe(true)
  })

  it('defines the Sprint 4 Field Graphite token contract', () => {
    const tokensCss = readSource('src/design/tokens.css')

    expect(tokensCss).toContain('--of-color-brand-primary: #1F6B5C;')
    expect(tokensCss).toContain('--of-color-brand-secondary: #7A1F2B;')
    expect(tokensCss).toContain('--of-color-bg-base: #F4F5F3;')
    expect(tokensCss).toContain('--of-color-surface-default: #FFFFFF;')
    expect(tokensCss).toContain('--of-color-border-default: #D9DED8;')
    expect(tokensCss).toContain('--of-color-text-primary: #131815;')
    expect(tokensCss).toContain('--of-color-text-secondary: #5E6961;')
    expect(tokensCss).toContain('--of-color-on-brand: #FFFFFF;')
    expect(tokensCss).toContain('--of-color-status-success: #1D7A46;')
    expect(tokensCss).toContain('--of-color-status-warning: #D39A2B;')
    expect(tokensCss).toContain('--of-color-status-danger: #B42318;')
    expect(tokensCss).toContain('--of-color-status-info: #155EEF;')
    expect(tokensCss).toContain('--of-color-focus-ring: #005FCC;')
  })

  it('defines the Redesign v2 typography token contract', () => {
    const tokensCss = readSource('src/design/tokens.css')

    expect(tokensCss).toContain('--of-font-family-system: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;')
    expect(tokensCss).toContain('--of-font-family-display: var(--of-font-family-system);')
    expect(tokensCss).toContain('--of-font-family-mono: ui-monospace, "SF Mono", Menlo, monospace;')
    expect(tokensCss).toContain('--of-font-size-scoreboard: 2.5rem;')
    expect(tokensCss).toContain('--of-font-size-display: 1.75rem;')
    expect(tokensCss).toContain('--of-font-size-title: 1.375rem;')
    expect(tokensCss).toContain('--of-font-size-section: 1.125rem;')
    expect(tokensCss).toContain('--of-font-size-body: 1rem;')
    expect(tokensCss).toContain('--of-font-size-secondary: 0.875rem;')
    expect(tokensCss).toContain('--of-font-size-caption: 0.75rem;')
    expect(tokensCss).toContain('--of-font-size-metric-xl: 1.5rem;')
    expect(tokensCss).toContain('--of-font-size-metric-m: 1.125rem;')
    expect(tokensCss).toContain('--of-line-height-scoreboard: 1;')
    expect(tokensCss).toContain('--of-line-height-tight: 1.14;')
    expect(tokensCss).toContain('--of-line-height-snug: 1.25;')
    expect(tokensCss).toContain('--of-line-height-normal: 1.4;')
    expect(tokensCss).toContain('--of-font-weight-regular: 400;')
    expect(tokensCss).toContain('--of-font-weight-medium: 500;')
    expect(tokensCss).toContain('--of-font-weight-semibold: 600;')
    expect(tokensCss).toContain('--of-font-weight-bold: 700;')
    expect(tokensCss).toContain('--of-font-weight-heading: 800;')
  })

  it('defines expanded iPad typography token values', () => {
    const tokensCss = readSource('src/design/tokens.css')
    const expandedBlock = tokensCss.match(/@media \(min-width: 840px\) \{[\s\S]*?\n\}/)?.[0]

    expect(expandedBlock).toContain('--of-font-size-scoreboard: 3.5rem;')
    expect(expandedBlock).toContain('--of-font-size-display: 2.125rem;')
    expect(expandedBlock).toContain('--of-font-size-title: 1.75rem;')
    expect(expandedBlock).toContain('--of-font-size-section: 1.375rem;')
    expect(expandedBlock).toContain('--of-font-size-body: 1.0625rem;')
    expect(expandedBlock).toContain('--of-font-size-secondary: 0.9375rem;')
    expect(expandedBlock).toContain('--of-font-size-caption: 0.8125rem;')
    expect(expandedBlock).toContain('--of-font-size-metric-xl: 1.75rem;')
    expect(expandedBlock).toContain('--of-font-size-metric-m: 1.25rem;')
  })

  it('defines Field Mode token layers for system dark and explicit theme overrides', () => {
    const tokensCss = readSource('src/design/tokens.css')

    expect(tokensCss).toContain('color-scheme: light dark;')
    expect(tokensCss).toContain('@media (prefers-color-scheme: dark)')
    expect(tokensCss).toContain(':root[data-theme="light"]')
    expect(tokensCss).toContain(':root[data-theme="dark"]')
    expect(tokensCss).toContain('--of-color-bg-base: #0C110E;')
    expect(tokensCss).toContain('--of-color-surface-default: #151D18;')
    expect(tokensCss).toContain('--of-color-surface-muted: #1B241E;')
    expect(tokensCss).toContain('--of-color-border-default: #28332C;')
    expect(tokensCss).toContain('--of-color-text-primary: #EAF0EA;')
    expect(tokensCss).toContain('--of-color-text-secondary: #9AA69D;')
    expect(tokensCss).toContain('--of-color-on-brand: #08130F;')
    expect(tokensCss).toContain('--of-color-brand-primary: #4FB89E;')
    expect(tokensCss).toContain('--of-color-brand-primary-strong: #63C6AE;')
    expect(tokensCss).toContain('--of-color-brand-primary-soft: #16302A;')
    expect(tokensCss).toContain('--of-color-brand-secondary: #CE7B82;')
    expect(tokensCss).toContain('--of-color-status-success: #5FC98A;')
    expect(tokensCss).toContain('--of-color-status-warning: #E4B052;')
    expect(tokensCss).toContain('--of-color-status-danger: #F0837A;')
    expect(tokensCss).toContain('--of-color-status-info: #6FA8FF;')
    expect(tokensCss).toContain('--of-color-focus-ring: #5B9BFF;')
  })

  it('keeps Field Mode primary controls above the target contrast ratio', () => {
    const tokensCss = readSource('src/design/tokens.css')

    const darkThemeBlock = tokensCss.match(/:root\[data-theme="dark"\] \{[\s\S]*?\n\}/)?.[0] ?? ''
    const primary = extractToken(darkThemeBlock, '--of-color-brand-primary')
    const onBrand = extractToken(darkThemeBlock, '--of-color-on-brand')

    expect(contrastRatio(onBrand, primary)).toBeGreaterThanOrEqual(7)
  })

  it('provides the tabular numeric utility for Redesign v2 score and load values', () => {
    const indexCss = readSource('src/index.css')

    expect(indexCss).toContain('.of-num')
    expect(indexCss).toContain('font-variant-numeric: tabular-nums;')
    expect(indexCss).toContain('font-feature-settings: "tnum" 1;')
  })

  it('uses on-brand foregrounds for existing primary brand controls', () => {
    const indexCss = readSource('src/index.css')
    const componentCss = readSource('src/components/ui/onfield-ui.css')

    expect(indexCss).toContain('color: var(--of-color-on-brand);')
    expect(componentCss).toContain('color: var(--of-color-on-brand);')
    expect(componentCss).not.toContain('.of-button-primary {\n  background: var(--of-color-brand-primary);\n  color: var(--of-color-text-inverse);')
  })

  it('keeps screen CSS color values routed through tokens', () => {
    const indexCss = readSource('src/index.css')

    expect(indexCss.match(/#[0-9A-Fa-f]{3,8}|rgba?\(/g)).toBeNull()
  })
})
