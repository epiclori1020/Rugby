import { describe, expect, it } from 'vitest'
import { enforceScreenshotPolicy, resolveSprint19Target } from './e2e-sprint19-visual-qa.mjs'

describe('resolveSprint19Target', () => {
  it('allows loopback without a separate auth allowlist', () => {
    expect(resolveSprint19Target('http://localhost:5182/')).toEqual({
      url: 'http://localhost:5182/',
      logUrl: 'http://localhost:5182/',
    })
  })

  it('blocks remote credential targets unless their exact HTTPS origin is allowlisted', () => {
    expect(() => resolveSprint19Target('https://beta.example.com/')).toThrow(/AUTH_ORIGIN/)
    expect(() =>
      resolveSprint19Target('http://beta.example.com/', 'http://beta.example.com'),
    ).toThrow(/HTTPS/)
  })

  it('rejects URL credentials and sanitizes the log URL', () => {
    expect(() => resolveSprint19Target('https://coach:secret@beta.example.com/')).toThrow(/Zugangsdaten/)
    expect(
      resolveSprint19Target('https://beta.example.com/app/?token=secret#qa', 'https://beta.example.com'),
    ).toEqual({
      url: 'https://beta.example.com/app/?token=secret#qa',
      logUrl: 'https://beta.example.com/app/',
    })
  })
})

describe('authenticated screenshot policy', () => {
  it('blocks persistence when authenticated QA is requested', () => {
    expect(() => enforceScreenshotPolicy(true, true)).toThrow(/keine Screenshots/)
    expect(() => enforceScreenshotPolicy(true, false)).not.toThrow()
    expect(() => enforceScreenshotPolicy(false, true)).not.toThrow()
  })
})
