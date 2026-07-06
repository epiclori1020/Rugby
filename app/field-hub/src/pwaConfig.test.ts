/// <reference types="node" />

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { activePdfRefs } from './content/pdfRefs'

const projectRoot = process.cwd()

function readPngDimensions(fileName: string) {
  const png = readFileSync(join(projectRoot, 'public', fileName))

  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
  }
}

describe('Sprint 10 PWA configuration', () => {
  it('uses OnField Coach brand metadata for install surfaces', () => {
    const viteConfig = readFileSync(join(projectRoot, 'vite.config.ts'), 'utf8')
    const indexHtml = readFileSync(join(projectRoot, 'index.html'), 'utf8')

    expect(indexHtml).toContain('<meta name="theme-color" content="#1F6B5C" />')
    expect(indexHtml).toContain('<meta name="apple-mobile-web-app-title" content="OnField Coach" />')
    expect(indexHtml).toContain('<title>OnField Coach</title>')
    expect(viteConfig).toContain("name: 'OnField Coach'")
    expect(viteConfig).toContain("short_name: 'OnField'")
    expect(viteConfig).toContain("description: 'Field-ready coach operations for the training day.'")
    expect(viteConfig).toContain("theme_color: '#1F6B5C'")
    expect(viteConfig).toContain("background_color: '#F4F5F3'")
  })

  it('uses PNG install icons for iOS and PWA manifests', () => {
    const viteConfig = readFileSync(join(projectRoot, 'vite.config.ts'), 'utf8')
    const indexHtml = readFileSync(join(projectRoot, 'index.html'), 'utf8')
    const iconSvg = readFileSync(join(projectRoot, 'public/pwa-512x512.svg'), 'utf8')

    expect(viteConfig).toContain("src: '/pwa-192x192.png'")
    expect(viteConfig).toContain("src: '/pwa-512x512.png'")
    expect(viteConfig).toContain("type: 'image/png'")
    expect(indexHtml).toContain('<link rel="icon" type="image/png" href="/pwa-192x192.png" />')
    expect(indexHtml).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon.png" />')
    expect(existsSync(join(projectRoot, 'public/pwa-192x192.png'))).toBe(true)
    expect(existsSync(join(projectRoot, 'public/pwa-512x512.png'))).toBe(true)
    expect(existsSync(join(projectRoot, 'public/apple-touch-icon.png'))).toBe(true)
    expect(readPngDimensions('pwa-192x192.png')).toEqual({ width: 192, height: 192 })
    expect(readPngDimensions('pwa-512x512.png')).toEqual({ width: 512, height: 512 })
    expect(readPngDimensions('apple-touch-icon.png')).toEqual({ width: 180, height: 180 })
    expect(iconSvg).toContain('aria-label="OnField Coach icon"')
    expect(iconSvg).toContain('#1F6B5C')
    expect(iconSvg).toContain('#7A1F2B')
    expect(iconSvg).not.toContain('Field Hub icon')
    expect(iconSvg).not.toContain('#b75a2a')
  })

  it('pre-caches active PDF library fallbacks for offline field use', () => {
    const viteConfig = readFileSync(join(projectRoot, 'vite.config.ts'), 'utf8')

    expect(viteConfig).toContain("globPatterns: ['**/*.{js,css,html,svg,ico,png,webp,pdf}']")

    for (const pdfRef of activePdfRefs) {
      expect(pdfRef.href.startsWith('/library/')).toBe(true)
      expect(existsSync(join(projectRoot, 'public', pdfRef.href))).toBe(true)
    }
  })
})

describe('Sprint 18 PWA install and offline polish', () => {
  it('keeps the installed app in standalone mode with a same-origin start scope', () => {
    const viteConfig = readFileSync(join(projectRoot, 'vite.config.ts'), 'utf8')
    const indexHtml = readFileSync(join(projectRoot, 'index.html'), 'utf8')

    expect(indexHtml).toContain('viewport-fit=cover')
    expect(indexHtml).toContain('<meta name="apple-mobile-web-app-capable" content="yes" />')
    expect(viteConfig).toContain("start_url: '/'")
    expect(viteConfig).toContain("scope: '/'")
    expect(viteConfig).toContain("display: 'standalone'")
    expect(viteConfig).toContain("orientation: 'any'")
  })

  it('falls back to the app shell for offline navigation instead of a browser error page', () => {
    const viteConfig = readFileSync(join(projectRoot, 'vite.config.ts'), 'utf8')

    expect(viteConfig).toContain("navigateFallback: '/index.html'")
    expect(viteConfig).toContain("cleanupOutdatedCaches: true")
  })
})
