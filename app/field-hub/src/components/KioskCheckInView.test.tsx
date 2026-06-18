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
  let confirmSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  afterEach(async () => {
    confirmSpy.mockRestore()
    if (root) {
      await act(async () => {
        root?.unmount()
      })
      root = null
    }
  })

  it('renders a clean training check-in header with a local date', async () => {
    const container = document.createElement('div')
    root = createRoot(container)

    await act(async () => {
      root?.render(
        <KioskCheckInView
          errorMessage={null}
          onExit={async () => undefined}
          onSubmitKioskEntry={async () => undefined}
          players={[{ id: 'player-1', displayName: 'Max Muster' }]}
          selectedSession={{ ...selectedSession, title: 'Donnerstag 18. Juni: Training + Mini-Baseline optional', date: '2026-06-18' }}
        />,
      )
    })

    expect(container.textContent).not.toContain('Kiosk-Modus')
    expect(container.textContent).toContain('Training Check-in')
    expect(container.textContent).toContain('Donnerstag, 18. Juni 2026')
    expect(container.textContent).toContain('Training + Mini-Baseline optional')
  })

  it('exits kiosk mode after a confirmed single click without a hold timer', async () => {
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
    expect(exitButton?.textContent).toContain('Kiosk beenden')

    await act(async () => {
      exitButton?.click()
    })
    expect(confirmSpy).toHaveBeenCalledWith('Kiosk beenden und zur Coach-Ansicht zurückkehren?')
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('keeps kiosk mode open when exit is not confirmed', async () => {
    confirmSpy.mockReturnValue(false)
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

    await act(async () => {
      container.querySelector<HTMLButtonElement>('.kiosk-exit-button')?.click()
    })

    expect(onExit).not.toHaveBeenCalled()
  })
})
