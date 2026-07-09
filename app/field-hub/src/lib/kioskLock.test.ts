import { describe, expect, it } from 'vitest'
import {
  KIOSK_LOCK_STORAGE_KEY,
  clearKioskLock,
  isKioskLockForSession,
  readKioskLock,
  writeKioskLock,
} from './kioskLock'

function createStorage() {
  const entries = new Map<string, string>()

  return {
    getItem: (key: string) => entries.get(key) ?? null,
    removeItem: (key: string) => {
      entries.delete(key)
    },
    setItem: (key: string, value: string) => {
      entries.set(key, value)
    },
  }
}

describe('kioskLock', () => {
  it('stores and clears a local session-bound kiosk lock without auth state', () => {
    const storage = createStorage()

    writeKioskLock('session-current', storage)

    expect(readKioskLock(storage)).toMatchObject({ sessionId: 'session-current' })
    expect(isKioskLockForSession('session-current', storage)).toBe(true)
    expect(isKioskLockForSession('session-other', storage)).toBe(false)

    clearKioskLock(storage)
    expect(readKioskLock(storage)).toBeNull()
  })

  it('reads the legacy raw session id format and rewrites only through the helper', () => {
    const storage = createStorage()
    storage.setItem(KIOSK_LOCK_STORAGE_KEY, 'session-legacy')

    expect(readKioskLock(storage)).toMatchObject({ sessionId: 'session-legacy' })
    expect(isKioskLockForSession('session-legacy', storage)).toBe(true)
  })
})
