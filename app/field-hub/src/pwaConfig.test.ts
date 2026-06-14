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
  it('uses PNG install icons for iOS and PWA manifests', () => {
    const viteConfig = readFileSync(join(projectRoot, 'vite.config.ts'), 'utf8')
    const indexHtml = readFileSync(join(projectRoot, 'index.html'), 'utf8')

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
