// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SelfCheckInFlow, type SelfCheckInSubmissionInput } from './SelfCheckInFlow'

type RenderFlowProps = Partial<{
  autoResetAfterSubmitMs: number | null
  completionTitle: string
  disabled: boolean
  mode: 'kiosk' | 'public'
  resetActionLabel: string
}>

function getButton(container: HTMLElement, name: string) {
  const button = [...container.querySelectorAll('button')].find((item) => item.textContent?.trim() === name)

  if (!button) {
    throw new Error(`Button ${name} not found`)
  }

  return button as HTMLButtonElement
}

function getInputByPlaceholder(container: HTMLElement, placeholder: string) {
  const input = [...container.querySelectorAll('input')].find((item) => item.placeholder === placeholder)

  if (!input) {
    throw new Error(`Input ${placeholder} not found`)
  }

  return input as HTMLInputElement
}

async function clickButton(container: HTMLElement, name: string) {
  await act(async () => {
    getButton(container, name).click()
  })
}

async function changeInput(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set

  await act(async () => {
    valueSetter?.call(element, value)
    element.dispatchEvent(new Event('input', { bubbles: true }))
    element.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

async function submitForm(container: HTMLElement) {
  await act(async () => {
    container.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
}

describe('SelfCheckInFlow', () => {
  let root: Root | null = null

  beforeEach(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
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

  async function renderFlow(
    onSubmit: (input: SelfCheckInSubmissionInput) => Promise<void> = async () => undefined,
    props: RenderFlowProps = {},
  ) {
    const container = document.createElement('div')
    root = createRoot(container)

    await act(async () => {
      root?.render(
        <SelfCheckInFlow
          onSubmit={onSubmit}
          players={[
            { id: 'player-1', displayName: 'Max Muster' },
            { id: 'player-2', displayName: 'Ali Test' },
          ]}
          {...props}
        />,
      )
    })

    return container
  }

  async function reachLifeStep(container: HTMLElement) {
    await changeInput(container.querySelector('input') as HTMLInputElement, 'max')
    await clickButton(container, 'Max Muster')
    await clickButton(container, 'Weiter')
    await clickButton(container, '4')
    await clickButton(container, 'Weiter')
  }

  it('submits the full payload through a linear self-check-in flow', async () => {
    const onSubmit = vi.fn(async (_input: SelfCheckInSubmissionInput) => {
      expect(_input.playerId).toBeTruthy()
    })
    const container = await renderFlow(onSubmit)

    expect(container.textContent).toContain('Schritt 1 von 6')
    expect(container.textContent).toContain('Dein Name')
    expect(container.textContent).not.toContain('Schmerz/Beschwerden heute')

    await reachLifeStep(container)
    await clickButton(container, 'Stress')
    await clickButton(container, 'Muskelkater')
    await changeInput(getInputByPlaceholder(container, 'leer lassen, wenn unauffällig'), 'Pruefungsstress')
    await clickButton(container, 'Weiter')

    await clickButton(container, '3')
    expect(container.textContent).toContain('Schmerzort / Körperregion')
    expect(getButton(container, 'Weiter').disabled).toBe(true)
    await clickButton(container, 'Wade/Achilles')
    await clickButton(container, 'Knie')
    await changeInput(getInputByPlaceholder(container, 'z. B. Wade rechts'), 'Schulter rechts')
    await clickButton(container, 'Weiter')

    await clickButton(container, 'Ja, neu/schlechter')
    await changeInput(container.querySelector('textarea') as HTMLTextAreaElement, 'komme später')
    await clickButton(container, 'Weiter')

    expect(container.textContent).toContain('Kurz prüfen und absenden')
    await submitForm(container)

    expect(onSubmit).toHaveBeenCalledWith({
      playerId: 'player-1',
      readiness: 4,
      lifeFlag: 'Stress; Muskelkater; Pruefungsstress',
      painScore: 3,
      painLocation: 'Wade/Achilles; Knie; Schulter rechts',
      sessionReaction: 'new_or_worse',
      playerNote: 'komme später',
    })
    expect(container.textContent).toContain('Check-in gespeichert')
  })

  it('keeps pain score zero without a pain location and requires a session reaction', async () => {
    const onSubmit = vi.fn(async () => undefined)
    const container = await renderFlow(onSubmit)

    await reachLifeStep(container)
    await clickButton(container, 'Weiter')
    await clickButton(container, '0')
    await clickButton(container, 'Weiter')

    expect(container.textContent).toContain('Seit dem letzten Training')
    expect(getButton(container, 'Weiter').disabled).toBe(true)

    await clickButton(container, 'Nein')
    expect(getButton(container, 'Weiter').disabled).toBe(false)
    await clickButton(container, 'Weiter')
    await submitForm(container)

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ painScore: 0, painLocation: '', sessionReaction: 'none' }),
    )
  })

  it('connects disabled next actions to visible field-ready reasons', async () => {
    const container = await renderFlow()

    let nextButton = getButton(container, 'Weiter')
    expect(nextButton.disabled).toBe(true)
    expect(nextButton.getAttribute('aria-describedby')).toBe('self-checkin-player-disabled-reason')
    expect(container.textContent).toContain('Name auswählen, dann weiter.')

    await changeInput(container.querySelector('input') as HTMLInputElement, 'max')
    await clickButton(container, 'Max Muster')
    await clickButton(container, 'Weiter')

    nextButton = getButton(container, 'Weiter')
    expect(nextButton.disabled).toBe(true)
    expect(nextButton.getAttribute('aria-describedby')).toBe('self-checkin-readiness-disabled-reason')
    expect(container.textContent).toContain('Readiness auswählen, dann weiter.')

    await clickButton(container, '4')
    await clickButton(container, 'Weiter')
    await clickButton(container, 'Weiter')

    nextButton = getButton(container, 'Weiter')
    expect(nextButton.disabled).toBe(true)
    expect(nextButton.getAttribute('aria-describedby')).toBe('self-checkin-pain-disabled-reason')
    expect(container.textContent).toContain('Schmerz-Skala auswählen, dann weiter.')

    await clickButton(container, '3')
    nextButton = getButton(container, 'Weiter')
    expect(nextButton.disabled).toBe(true)
    expect(nextButton.getAttribute('aria-describedby')).toBe('self-checkin-pain-disabled-reason')
    expect(container.textContent).toContain('Körperregion auswählen oder kurz notieren.')

    await clickButton(container, 'Knie')
    await clickButton(container, 'Weiter')

    nextButton = getButton(container, 'Weiter')
    expect(nextButton.disabled).toBe(true)
    expect(nextButton.getAttribute('aria-describedby')).toBe('self-checkin-reaction-disabled-reason')
    expect(container.textContent).toContain('Auswahl treffen, dann weiter.')
  })

  it('explains disabled flow availability at the current step', async () => {
    const container = await renderFlow(undefined, { disabled: true })

    const submitButton = container.querySelector<HTMLButtonElement>('.self-checkin-submit')
    expect(submitButton).toBeNull()

    const nextButton = getButton(container, 'Weiter')
    expect(nextButton.disabled).toBe(true)
    expect(nextButton.getAttribute('aria-describedby')).toBe('self-checkin-player-disabled-reason')
    expect(container.textContent).toContain('Check-in ist gerade nicht verfügbar.')
  })

  it('resets automatically after kiosk completion when configured', async () => {
    vi.useFakeTimers()
    const container = await renderFlow(vi.fn(async () => undefined), {
      autoResetAfterSubmitMs: 3000,
      completionTitle: 'Gespeichert',
      mode: 'kiosk',
      resetActionLabel: 'Nächsten Check-in starten',
    })

    await reachLifeStep(container)
    await clickButton(container, 'Weiter')
    await clickButton(container, '0')
    await clickButton(container, 'Weiter')
    await clickButton(container, 'Nein')
    await clickButton(container, 'Weiter')
    await submitForm(container)

    expect(container.textContent).toContain('Gespeichert')

    await act(async () => {
      vi.advanceTimersByTime(3000)
    })

    expect(container.textContent).toContain('Name suchen')
    expect(container.textContent).toContain('Schritt 1 von 6')
  })

  it('offers a manual reset for public completion', async () => {
    const container = await renderFlow()

    await reachLifeStep(container)
    await clickButton(container, 'Weiter')
    await clickButton(container, '0')
    await clickButton(container, 'Weiter')
    await clickButton(container, 'Nein')
    await clickButton(container, 'Weiter')
    await submitForm(container)

    expect(container.textContent).toContain('Check-in gespeichert')
    await clickButton(container, 'Weiteren Check-in erfassen')
    expect(container.textContent).toContain('Name suchen')
  })

  it('does not show returner controls in player self-check-in', async () => {
    const container = await renderFlow()

    expect(container.textContent).not.toContain('Returner')
    expect(container.textContent).not.toContain('Returner-Status')
  })
})
