import { EventEmitter } from 'node:events'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { closeBrowser, resolveR5Target, stopPreview, validateR5Fixture } from './e2e-r5-squad-today.mjs'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('resolveR5Target', () => {
  it('allows the local preview target without a separate allowlist', () => {
    expect(resolveR5Target('http://127.0.0.1:5185/')).toEqual({
      url: 'http://127.0.0.1:5185/',
      logUrl: 'http://127.0.0.1:5185/',
    })
  })

  it('rejects a remote credential target without an exact origin allowlist', () => {
    expect(() => resolveR5Target('https://beta.example.com/')).toThrow(/AUTH_ORIGIN/)
  })

  it('requires HTTPS for an allowlisted remote credential target', () => {
    expect(() =>
      resolveR5Target('http://beta.example.com/', 'http://beta.example.com'),
    ).toThrow(/HTTPS/)
  })

  it('logs an allowlisted remote target without query, fragment, or userinfo', () => {
    expect(
      resolveR5Target(
        'https://beta.example.com/onfield/?access_token=secret#coach',
        'https://beta.example.com',
      ),
    ).toEqual({
      url: 'https://beta.example.com/onfield/?access_token=secret#coach',
      logUrl: 'https://beta.example.com/onfield/',
    })
  })
})

describe('R5 QA hard gate', () => {
  it('blocks an authenticated run without the populated attention fixture', () => {
    expect(() => validateR5Fixture({ squad: 1, present: 0, playerIds: [] })).toThrow(/Testzustand/)
  })

  it('force-stops a preview process that ignores SIGTERM', async () => {
    vi.useFakeTimers()
    const kill = vi.spyOn(process, 'kill').mockReturnValue(true)
    const child = Object.assign(new EventEmitter(), {
      pid: 123,
      spawnargs: ['npm'],
      stdout: { destroy: vi.fn() },
      stderr: { destroy: vi.fn() },
      unref: vi.fn(),
    })

    const stopping = stopPreview(child)
    await vi.advanceTimersByTimeAsync(1_000)
    await stopping

    expect(kill).toHaveBeenNthCalledWith(1, -123, 'SIGTERM')
    expect(kill).toHaveBeenNthCalledWith(2, -123, 'SIGKILL')
    expect(child.stdout.destroy).toHaveBeenCalledOnce()
    expect(child.stderr.destroy).toHaveBeenCalledOnce()
    expect(child.unref).toHaveBeenCalledOnce()
  })

  it('force-closes Chromium when the normal close does not settle', async () => {
    vi.useFakeTimers()
    const kill = vi.fn()
    const browser = {
      close: () => new Promise(() => undefined),
      process: () => ({ kill }),
    }

    const closing = closeBrowser(browser)
    await vi.advanceTimersByTimeAsync(2_000)
    await closing

    expect(kill).toHaveBeenCalledWith('SIGKILL')
  })
})
