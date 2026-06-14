import { useEffect, useState } from 'react'

export type StoragePersistenceStatus =
  | 'checking'
  | 'persisted'
  | 'denied'
  | 'unsupported'
  | 'error'

export type StoragePersistenceState = {
  status: StoragePersistenceStatus
}

export function useStoragePersistence(): StoragePersistenceState {
  const [status, setStatus] = useState<StoragePersistenceStatus>('checking')

  useEffect(() => {
    let active = true

    async function requestPersistence() {
      if (!('storage' in navigator) || typeof navigator.storage.persist !== 'function') {
        if (active) {
          setStatus('unsupported')
        }
        return
      }

      try {
        const persisted = await navigator.storage.persist()
        if (active) {
          setStatus(persisted ? 'persisted' : 'denied')
        }
      } catch {
        if (active) {
          setStatus('error')
        }
      }
    }

    void requestPersistence()

    return () => {
      active = false
    }
  }, [])

  return { status }
}
