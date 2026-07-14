import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const sprint19Source = readFileSync(new URL('./e2e-sprint19-visual-qa.mjs', import.meta.url), 'utf8')
const pwaSource = readFileSync(new URL('./e2e-pwa-smoke.mjs', import.meta.url), 'utf8')

describe('R8 responsive and Field Mode E2E contract', () => {
  it('keeps the R8 screen contract active while storing the current ignored R9 evidence', () => {
    expect(sprint19Source).toContain("const themes = ['light', 'dark']")
    expect(sprint19Source).toContain("'.tmp/onfield-qa/r9/after'")
    expect(sprint19Source).toContain('assertRenderedContrast')
    expect(sprint19Source).toContain('assertR8ResponsiveContracts')
    expect(sprint19Source).toContain("requiredRatio: resolvedTheme === 'dark' && isPrimaryControl ? 7 : 4.5")
    expect(sprint19Source).toContain('checkedKioskSurfaces')
    expect(sprint19Source).toContain("'Kiosk Field Mode'")
  })

  it('keeps lazy PWA verification on the complete viewport matrix', () => {
    expect(pwaSource).toContain('const lazyScreenViewports = viewports')
    expect(pwaSource).toContain("expectedTexts: ['Analyse', 'Kernwerte mit Kontext']")
  })
})
