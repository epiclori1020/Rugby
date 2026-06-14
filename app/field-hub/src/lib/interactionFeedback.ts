export type HapticFeedbackKind = 'selection' | 'success' | 'warning'

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
