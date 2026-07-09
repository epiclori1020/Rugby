export type HapticFeedbackKind = 'selection' | 'success' | 'warning'
export type ActionFeedbackTone = 'success' | 'pending' | 'offline' | 'error'

export type ActionFeedbackState = {
  tone: ActionFeedbackTone
  message: string
}

export type SaveActionResult<T = unknown> =
  | { ok: true; syncStatus?: 'synced' | 'pending' | 'error'; value?: T }
  | { ok: false; errorMessage: string }

type HapticTarget = {
  vibrate?: (pattern: VibratePattern) => boolean
}

const hapticPatterns: Record<HapticFeedbackKind, VibratePattern> = {
  selection: 8,
  success: [8, 24, 12],
  warning: [18, 36, 18],
}

export function triggerHapticFeedback(
  kind: HapticFeedbackKind,
  target: HapticTarget | undefined = typeof navigator === 'undefined' ? undefined : navigator,
) {
  if (!target || typeof target.vibrate !== 'function') {
    return false
  }

  return target.vibrate(hapticPatterns[kind])
}

export function actionFeedbackForSave({
  syncStatus = 'synced',
  isOnline = typeof navigator === 'undefined' ? true : navigator.onLine,
}: {
  syncStatus?: 'synced' | 'pending' | 'error'
  isOnline?: boolean
}): ActionFeedbackState {
  if (!isOnline) {
    return { tone: 'offline', message: 'offline lokal gespeichert' }
  }

  if (syncStatus === 'pending') {
    return { tone: 'pending', message: 'wartet auf Sync' }
  }

  if (syncStatus === 'error') {
    return actionFeedbackForFailure()
  }

  return { tone: 'success', message: 'gespeichert' }
}

export function actionFeedbackForFailure(message = 'nicht gespeichert - erneut versuchen'): ActionFeedbackState {
  return { tone: 'error', message }
}

export function triggerActionFeedback(
  feedback: ActionFeedbackState,
  target: HapticTarget | undefined = typeof navigator === 'undefined' ? undefined : navigator,
) {
  return triggerHapticFeedback(feedback.tone === 'error' ? 'warning' : 'success', target)
}
