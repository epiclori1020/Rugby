// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SelfCheckInFlow, type SelfCheckInSubmissionInput } from './SelfCheckInFlow'

function getButton(container: HTMLElement, name: string) {
  const button = [...container.querySelectorAll('button')].find((item) => item.textContent === name)

  if (!button) {
    throw new Error(`Button ${name} not found`)
  }

  return button as HTMLButtonElement
}

function getButtons(container: HTMLElement, name: string) {
  return [...container.querySelectorAll('button')].filter((item) => item.textContent === name) as HTMLButtonElement[]
}

async function changeInput(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, value: string) {
  await act(async () => {
    element.value = value
    element.dispatchEvent(new Event('input', { bubbles: true }))
    element.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

describe('SelfCheckInFlow', () => {
  let root: Root | null = null

  beforeEach(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  })

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount()
      })
      root = null
    }
  })

  it('requires a pain location only when pain is above zero and submits the full check-in payload', async () => {
    const onSubmit = vi.fn(async (_input: SelfCheckInSubmissionInput) => {
      expect(_input.playerId).toBeTruthy()
    })
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
        />,
      )
    })

    const submitButton = getButton(container, 'Check-in absenden')
    expect(submitButton.disabled).toBe(true)
    expect(container.textContent).not.toContain('Schmerzort / Körperregion')

    const select = container.querySelector('select') as HTMLSelectElement
    await changeInput(select, 'player-1')

    const confirm = container.querySelector('input[type="checkbox"]') as HTMLInputElement
    await act(async () => {
      confirm.click()
    })
    await act(async () => {
      getButton(container, '4').click()
      getButton(container, 'Stress').click()
      getButtons(container, '3').at(-1)?.click()
    })

    expect(container.textContent).toContain('Schmerzort / Körperregion')
    expect(getButton(container, 'Check-in absenden').disabled).toBe(true)

    await act(async () => {
      getButton(container, 'Wade/Achilles').click()
      getButton(container, 'Ja, neu/schlechter').click()
      getButtons(container, 'Nein').at(-1)?.click()
    })
    await act(async () => {
      container.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    expect(onSubmit).toHaveBeenCalledWith({
      playerId: 'player-1',
      readiness: 4,
      lifeFlag: 'Stress',
      painScore: 3,
      painLocation: 'Wade/Achilles',
      returnerFlag: 'nein',
      sessionReaction: 'new_or_worse',
      playerNote: '',
    })
  })

  it('clears pain location for pain score zero', async () => {
    const onSubmit = vi.fn(async (_input: SelfCheckInSubmissionInput) => {
      expect(_input.playerId).toBeTruthy()
    })
    const container = document.createElement('div')
    root = createRoot(container)

    await act(async () => {
      root?.render(<SelfCheckInFlow onSubmit={onSubmit} players={[{ id: 'player-1', displayName: 'Max Muster' }]} />)
    })

    await changeInput(container.querySelector('select') as HTMLSelectElement, 'player-1')
    await act(async () => {
      ;(container.querySelector('input[type="checkbox"]') as HTMLInputElement).click()
      getButton(container, '5').click()
      getButton(container, '0').click()
      getButton(container, 'Nein').click()
    })

    await act(async () => {
      container.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ painScore: 0, painLocation: '' }))
  })
})
