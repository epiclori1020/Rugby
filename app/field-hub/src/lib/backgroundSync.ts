type BackgroundSyncRunner = () => Promise<void>

const pendingSyncTimers = new Map<string, ReturnType<typeof setTimeout>>()

function syncKey(userId: string, scope: string) {
  return `${userId}:${scope}`
}

export function scheduleBackgroundSync(
  userId: string,
  scope: string,
  runner: BackgroundSyncRunner,
  delayMs = 250,
) {
  const key = syncKey(userId, scope)
  const existingTimer = pendingSyncTimers.get(key)
  if (existingTimer) {
    clearTimeout(existingTimer)
  }

  const timer = setTimeout(() => {
    pendingSyncTimers.delete(key)
    void runner()
  }, delayMs)

  pendingSyncTimers.set(key, timer)
}
