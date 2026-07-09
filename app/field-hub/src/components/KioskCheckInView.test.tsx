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
    vi.useFakeTimers()
    confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  afterEach(async () => {
    vi.useRealTimers()
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
    expect(container.textContent).toContain('OnField Rugby Kiosk')
    expect(container.textContent).toContain('Know squad status before the whistle.')
    expect(container.textContent).toContain('Donnerstag, 18. Juni 2026')
    expect(container.textContent).toContain('Training + Mini-Baseline optional')
    expect(container.textContent).toContain('Schritt 1 von 6')
    expect(container.textContent).not.toContain('Coach-Notiz')
    expect(container.textContent).not.toContain('Team-Analyse')
    expect(container.textContent).not.toContain('Analyse')
    expect(container.textContent).not.toContain('Einstellungen')
    expect(container.textContent).not.toContain('Historie')
  })

  it('does not exit kiosk mode after a simple click or browser confirm', async () => {
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

    const exitButton = container.querySelector<HTMLButtonElement>('.kiosk-exit-trigger')
    expect(exitButton).not.toBeNull()
    expect(exitButton?.textContent).toContain('Coach-Modus')

    await act(async () => {
      exitButton?.click()
    })

    const holdButton = container.querySelector<HTMLButtonElement>('.kiosk-hold-exit-button')
    expect(holdButton).not.toBeNull()
    expect(holdButton?.textContent).toContain('Zum Coach-Modus halten')
    expect(confirmSpy).not.toHaveBeenCalled()
    expect(onExit).not.toHaveBeenCalled()
  })

  it('exits only after the coach hold action completes', async () => {
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
      container.querySelector<HTMLButtonElement>('.kiosk-exit-trigger')?.click()
    })

    const holdButton = container.querySelector<HTMLButtonElement>('.kiosk-hold-exit-button')

    await act(async () => {
      holdButton?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
      vi.advanceTimersByTime(2999)
    })

    expect(onExit).not.toHaveBeenCalled()
    expect(container.textContent).toContain('Zum Coach-Modus halten')

    await act(async () => {
      vi.advanceTimersByTime(1)
    })

    expect(confirmSpy).not.toHaveBeenCalled()
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('cancels the hold exit when the coach releases early', async () => {
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
      container.querySelector<HTMLButtonElement>('.kiosk-exit-trigger')?.click()
    })

    const holdButton = container.querySelector<HTMLButtonElement>('.kiosk-hold-exit-button')

    await act(async () => {
      holdButton?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
      vi.advanceTimersByTime(1800)
      holdButton?.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
      vi.advanceTimersByTime(2000)
    })

    expect(onExit).not.toHaveBeenCalled()
    expect(container.textContent).toContain('Zum Coach-Modus halten')
  })

  it('shows a visible disabled reason when kiosk check-in is fail-closed', async () => {
    const container = document.createElement('div')
    root = createRoot(container)

    await act(async () => {
      root?.render(
        <KioskCheckInView
          disabledReason="Coach-Session prüfen. Der Kiosk bleibt gesperrt."
          errorMessage={null}
          isCheckInDisabled
          onExit={async () => undefined}
          onSubmitKioskEntry={async () => undefined}
          players={[{ id: 'player-1', displayName: 'Max Muster' }]}
          selectedSession={selectedSession}
        />,
      )
    })

    const nextButton = [...container.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Weiter')
    expect(nextButton?.disabled).toBe(true)
    expect(container.textContent).toContain('Coach-Session prüfen. Der Kiosk bleibt gesperrt.')
  })
})
