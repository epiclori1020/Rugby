import { describe, expect, it, vi } from 'vitest'
import { triggerHapticFeedback } from './interactionFeedback'

describe('triggerHapticFeedback', () => {
  it('uses navigator vibrate when available', () => {
    const vibrate = vi.fn(() => true)

    expect(triggerHapticFeedback('selection', { vibrate })).toBe(true)
    expect(vibrate).toHaveBeenCalledWith(8)
  })

  it('returns false when haptic feedback is unavailable', () => {
    expect(triggerHapticFeedback('selection', {})).toBe(false)
  })
})
