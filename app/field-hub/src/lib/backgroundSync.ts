type BackgroundSyncRunner = () => Promise<void>

const pendingSyncTimers = new Map<string, ReturnType<typeof setTimeout>>()
const pendingSyncRunners = new Map<string, BackgroundSyncRunner>()

function syncKey(userId: string, scope: string) {
  return `${userId}:${scope}`
}

export function scheduleBackgroundSync(
  userId: string,
  scope: string,
  runner: BackgroundSyncRunner,
  delayMs = 1200,
) {
  const key = syncKey(userId, scope)
  const existingTimer = pendingSyncTimers.get(key)
  if (existingTimer) {
    clearTimeout(existingTimer)
  }

  pendingSyncRunners.set(key, runner)
  const timer = setTimeout(() => {
    pendingSyncTimers.delete(key)
    const pendingRunner = pendingSyncRunners.get(key)
    pendingSyncRunners.delete(key)
    void pendingRunner?.()
  }, delayMs)

  pendingSyncTimers.set(key, timer)
}

export async function flushBackgroundSyncs() {
  const pendingRuns = [...pendingSyncRunners.entries()]
  pendingSyncRunners.clear()

  for (const [key, runner] of pendingRuns) {
    const timer = pendingSyncTimers.get(key)
    if (timer) {
      clearTimeout(timer)
      pendingSyncTimers.delete(key)
    }
    try {
      await runner()
    } catch (caughtError) {
      console.error(`Background sync flush failed for ${key}:`, caughtError)
    }
  }
}
