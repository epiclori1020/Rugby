// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionDefinition } from '../content/types'
import { KioskCheckInView } from './KioskCheckInView'

const selectedSession: SessionDefinition = {
  id: 'session-1',
  date: '2026-06-16',
  kw: 'KW25',
  title: 'Dienstag',
  type: 'training',
  summary: '',
  primarySource: '',
  pdfRefs: [],
  goals: [],
  timeline: [],
  materials: [],
  safetyNotes: [],
  coachNotes: [],
  libraryRefs: [],
}

describe('KioskCheckInView', () => {
  let root: Root | null = null

  beforeEach(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    vi.useFakeTimers()
  })

  afterEach(async () => {
    vi.useRealTimers()
    if (root) {
      await act(async () => {
        root?.unmount()
      })
      root = null
    }
  })

  it('requires a full two-second hold before exiting kiosk mode', async () => {
    const onExit = vi.fn()
    const container = document.createElement('div')
    root = createRoot(container)

    await act(async () => {
      root?.render(
        <KioskCheckInView
          errorMessage={null}
          onExit={onExit}
          onSubmitKioskEntry={async () => undefined}
          players={[{ id: 'player-1', displayName: 'Max Muster' }]}
          selectedSession={selectedSession}
        />,
      )
    })

    const exitButton = container.querySelector<HTMLButtonElement>('.kiosk-exit-button')
    expect(exitButton).not.toBeNull()

    await act(async () => {
      exitButton?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
      vi.advanceTimersByTime(1999)
    })
    expect(onExit).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(1)
    })
    expect(onExit).toHaveBeenCalledTimes(1)
  })
})
