/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = process.cwd()

function readSource(path: string) {
  return readFileSync(join(projectRoot, path), 'utf8')
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
    expect(tokensCss).toContain('--of-color-status-success: #1D7A46;')
    expect(tokensCss).toContain('--of-color-status-warning: #D39A2B;')
    expect(tokensCss).toContain('--of-color-status-danger: #B42318;')
    expect(tokensCss).toContain('--of-color-status-info: #155EEF;')
    expect(tokensCss).toContain('--of-color-focus-ring: #005FCC;')
  })

  it('keeps screen CSS color values routed through tokens', () => {
    const indexCss = readSource('src/index.css')

    expect(indexCss.match(/#[0-9A-Fa-f]{3,8}|rgba?\(/g)).toBeNull()
  })
})
