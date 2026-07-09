import { useCallback, useEffect, useState } from 'react'
import {
  actionFeedbackForFailure,
  actionFeedbackForSave,
  triggerActionFeedback,
  type ActionFeedbackState,
} from '../lib/interactionFeedback'

export function useActionFeedback(timeoutMs = 2400) {
  const [feedback, setFeedback] = useState<ActionFeedbackState | null>(null)

  const showFeedback = useCallback((nextFeedback: ActionFeedbackState) => {
    setFeedback(nextFeedback)
    triggerActionFeedback(nextFeedback)
  }, [])

  const showSaved = useCallback(
    (syncStatus?: 'synced' | 'pending' | 'error') => {
      showFeedback(actionFeedbackForSave({ syncStatus }))
    },
    [showFeedback],
  )

  const showPending = useCallback(() => {
    showFeedback({ tone: 'pending', message: 'wartet auf Sync' })
  }, [showFeedback])

  const showOffline = useCallback(() => {
    showFeedback({ tone: 'offline', message: 'offline lokal gespeichert' })
  }, [showFeedback])

  const showError = useCallback(
    (message?: string) => {
      showFeedback(actionFeedbackForFailure(message))
    },
    [showFeedback],
  )

  const clearFeedback = useCallback(() => setFeedback(null), [])

  useEffect(() => {
    if (!feedback || timeoutMs <= 0) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => setFeedback(null), timeoutMs)
    return () => window.clearTimeout(timeoutId)
  }, [feedback, timeoutMs])

  return {
    feedback,
    showFeedback,
    showSaved,
    showPending,
    showOffline,
    showError,
    clearFeedback,
  }
}
