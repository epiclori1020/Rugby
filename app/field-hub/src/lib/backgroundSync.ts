type BackgroundSyncRunner = () => Promise<void>

const pendingSyncTimers = new Map<string, ReturnType<typeof setTimeout>>()
const pendingSyncRunners = new Map<string, BackgroundSyncRunner>()
const runningSyncs = new Map<string, Promise<void>>()

function syncKey(userId: string, scope: string) {
  return `${userId}:${scope}`
}

function runQueuedSync(key: string, runner: BackgroundSyncRunner) {
  const previousRun = runningSyncs.get(key) ?? Promise.resolve()
  const run = previousRun.catch(() => undefined).then(runner)
  const trackedRun = run
    .catch(() => undefined)
    .finally(() => {
      if (runningSyncs.get(key) === trackedRun) {
        runningSyncs.delete(key)
      }
    })
  runningSyncs.set(key, trackedRun)
  return run
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
    if (pendingRunner) {
      void runQueuedSync(key, pendingRunner).catch((caughtError) => {
        console.error(`Background sync failed for ${key}:`, caughtError)
      })
    }
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
      await runQueuedSync(key, runner)
    } catch (caughtError) {
      console.error(`Background sync flush failed for ${key}:`, caughtError)
    }
  }
}
