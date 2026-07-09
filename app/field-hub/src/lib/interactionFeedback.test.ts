import { describe, expect, it, vi } from 'vitest'
import {
  actionFeedbackForFailure,
  actionFeedbackForSave,
  triggerActionFeedback,
  triggerHapticFeedback,
} from './interactionFeedback'

describe('triggerHapticFeedback', () => {
  it('uses navigator vibrate when available', () => {
    const vibrate = vi.fn(() => true)

    expect(triggerHapticFeedback('selection', { vibrate })).toBe(true)
    expect(vibrate).toHaveBeenCalledWith(8)
  })

  it('returns false when haptic feedback is unavailable', () => {
    expect(triggerHapticFeedback('selection', {})).toBe(false)
  })

  it('maps saved state to coach-facing feedback copy', () => {
    expect(actionFeedbackForSave({ syncStatus: 'synced', isOnline: true })).toEqual({
      tone: 'success',
      message: 'gespeichert',
    })
    expect(actionFeedbackForSave({ syncStatus: 'pending', isOnline: true })).toEqual({
      tone: 'pending',
      message: 'wartet auf Sync',
    })
    expect(actionFeedbackForSave({ syncStatus: 'pending', isOnline: false })).toEqual({
      tone: 'offline',
      message: 'offline lokal gespeichert',
    })
    expect(actionFeedbackForFailure()).toEqual({
      tone: 'error',
      message: 'nicht gespeichert - erneut versuchen',
    })
  })

  it('uses warning haptics for failed action feedback', () => {
    const vibrate = vi.fn(() => true)

    expect(triggerActionFeedback({ tone: 'error', message: 'nicht gespeichert - erneut versuchen' }, { vibrate })).toBe(true)
    expect(vibrate).toHaveBeenCalledWith([18, 36, 18])
  })
})
