export const KIOSK_EXIT_HOLD_MS = 3000
export const KIOSK_LOCK_STORAGE_KEY = 'fieldHub:kioskSessionId'

type KioskStorage = Pick<Storage, 'getItem' | 'removeItem' | 'setItem'>

export type KioskLockState = {
  sessionId: string
  lockedAt: string | null
}

function getDefaultStorage(): KioskStorage | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

function parseStoredLock(value: string | null): KioskLockState | null {
  if (!value) {
    return null
  }

  try {
    const parsed = JSON.parse(value) as Partial<KioskLockState>
    if (typeof parsed.sessionId === 'string' && parsed.sessionId.length > 0) {
      return {
        sessionId: parsed.sessionId,
        lockedAt: typeof parsed.lockedAt === 'string' ? parsed.lockedAt : null,
      }
    }
  } catch {
    // Legacy storage wrote the raw session id. Keep it readable for existing kiosk devices.
  }

  return { sessionId: value, lockedAt: null }
}

export function readKioskLock(storage: KioskStorage | null = getDefaultStorage()) {
  return parseStoredLock(storage?.getItem(KIOSK_LOCK_STORAGE_KEY) ?? null)
}

export function writeKioskLock(sessionId: string, storage: KioskStorage | null = getDefaultStorage()) {
  storage?.setItem(
    KIOSK_LOCK_STORAGE_KEY,
    JSON.stringify({
      sessionId,
      lockedAt: new Date().toISOString(),
    } satisfies KioskLockState),
  )
}

export function clearKioskLock(storage: KioskStorage | null = getDefaultStorage()) {
  storage?.removeItem(KIOSK_LOCK_STORAGE_KEY)
}

export function isKioskLockForSession(sessionId: string, storage: KioskStorage | null = getDefaultStorage()) {
  return readKioskLock(storage)?.sessionId === sessionId
}
