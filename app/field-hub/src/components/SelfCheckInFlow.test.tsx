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

function getSubmitButton(container: HTMLElement) {
  return [...container.querySelectorAll('button')].find((item) => item.textContent === 'Check-in absenden') as HTMLButtonElement
}

function getInputByPlaceholder(container: HTMLElement, placeholder: string) {
  const input = [...container.querySelectorAll('input')].find((item) => item.placeholder === placeholder)

  if (!input) {
    throw new Error(`Input ${placeholder} not found`)
  }

  return input as HTMLInputElement
}

async function changeInput(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, value: string) {
  const prototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : element instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set

  await act(async () => {
    valueSetter?.call(element, value)
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

    await changeInput(container.querySelector('input') as HTMLInputElement, 'max')
    expect(container.textContent).toContain('Max Muster')

    await act(async () => {
      getButton(container, 'Max Muster').click()
    })
    expect(container.querySelector('select')).toBeNull()
    expect(container.querySelector('input[type="checkbox"]')).toBeNull()

    await act(async () => {
      getButton(container, '4').click()
      getButton(container, 'Stress').click()
      getButton(container, 'Muskelkater').click()
      getButtons(container, '3').at(-1)?.click()
    })

    expect(container.textContent).toContain('Schmerzort / Körperregion')
    expect(getButton(container, 'Check-in absenden').disabled).toBe(true)

    await act(async () => {
      getButton(container, 'Wade/Achilles').click()
      getButton(container, 'Knie').click()
      getButton(container, 'Ja, neu/schlechter').click()
    })
    await act(async () => {
      container.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    expect(onSubmit).toHaveBeenCalledWith({
      playerId: 'player-1',
      readiness: 4,
      lifeFlag: 'Stress; Muskelkater',
      painScore: 3,
      painLocation: 'Wade/Achilles; Knie',
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

    await changeInput(container.querySelector('input') as HTMLInputElement, 'max')
    await act(async () => {
      getButton(container, 'Max Muster').click()
      getButton(container, '5').click()
      getButton(container, '0').click()
      getButton(container, 'Nein').click()
    })

    await act(async () => {
      container.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ painScore: 0, painLocation: '', sessionReaction: 'none' }),
    )
  })

  it('requires an explicit session reaction before submitting', async () => {
    const onSubmit = vi.fn(async () => undefined)
    const container = document.createElement('div')
    root = createRoot(container)

    await act(async () => {
      root?.render(<SelfCheckInFlow onSubmit={onSubmit} players={[{ id: 'player-1', displayName: 'Max Muster' }]} />)
    })

    await changeInput(container.querySelector('input') as HTMLInputElement, 'max')
    await act(async () => {
      getButton(container, 'Max Muster').click()
      getButton(container, '5').click()
      getButton(container, '0').click()
    })

    expect(getSubmitButton(container).disabled).toBe(true)

    await act(async () => {
      container.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    expect(onSubmit).not.toHaveBeenCalled()

    await act(async () => {
      getButton(container, 'Nein').click()
    })

    expect(getSubmitButton(container).disabled).toBe(false)

    await act(async () => {
      container.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ sessionReaction: 'none' }))
  })

  it('does not show returner controls in player self-check-in', async () => {
    const container = document.createElement('div')
    root = createRoot(container)

    await act(async () => {
      root?.render(<SelfCheckInFlow onSubmit={async () => undefined} players={[{ id: 'player-1', displayName: 'Max Muster' }]} />)
    })

    expect(container.textContent).not.toContain('Returner')
    expect(container.textContent).not.toContain('Returner-Status')
  })

  it('appends life freetext to selected life chips', async () => {
    const onSubmit = vi.fn(async () => undefined)
    const container = document.createElement('div')
    root = createRoot(container)

    await act(async () => {
      root?.render(<SelfCheckInFlow onSubmit={onSubmit} players={[{ id: 'player-1', displayName: 'Max Muster' }]} />)
    })

    await changeInput(container.querySelector('input') as HTMLInputElement, 'max')
    await act(async () => {
      getButton(container, 'Max Muster').click()
      getButton(container, '5').click()
      getButton(container, 'Stress').click()
      getButton(container, 'Muskelkater').click()
      getButton(container, '0').click()
      getButton(container, 'Nein').click()
    })
    await changeInput(getInputByPlaceholder(container, 'leer lassen, wenn unauffällig'), 'Pruefungsstress')

    await act(async () => {
      container.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ lifeFlag: 'Stress; Muskelkater; Pruefungsstress' }))
  })

  it('appends pain freetext to selected pain locations', async () => {
    const onSubmit = vi.fn(async () => undefined)
    const container = document.createElement('div')
    root = createRoot(container)

    await act(async () => {
      root?.render(<SelfCheckInFlow onSubmit={onSubmit} players={[{ id: 'player-1', displayName: 'Max Muster' }]} />)
    })

    await changeInput(container.querySelector('input') as HTMLInputElement, 'max')
    await act(async () => {
      getButton(container, 'Max Muster').click()
      getButton(container, '5').click()
      getButtons(container, '2').at(-1)?.click()
      getButton(container, 'Nein').click()
    })
    await act(async () => {
      getButton(container, 'Knie').click()
    })
    await changeInput(getInputByPlaceholder(container, 'z. B. Wade rechts'), 'Schulter rechts')

    await act(async () => {
      container.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ painLocation: 'Knie; Schulter rechts' }))
  })

  it('shows no-results feedback and the selected player change action', async () => {
    const onSubmit = vi.fn(async () => undefined)
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

    await changeInput(container.querySelector('input') as HTMLInputElement, 'zzz')
    expect(container.textContent).toContain('Kein Treffer')

    await changeInput(container.querySelector('input') as HTMLInputElement, 'max')
    await act(async () => {
      getButton(container, 'Max Muster').click()
    })

    expect(container.textContent).toContain('Ausgewählt: Max Muster')

    await act(async () => {
      getButton(container, 'ändern').click()
    })

    expect(container.textContent).not.toContain('Ausgewählt: Max Muster')
    expect(container.textContent).toContain('Max Muster')
  })

  it('lets players undo selected buttons before submitting', async () => {
    const onSubmit = vi.fn(async () => undefined)
    const container = document.createElement('div')
    root = createRoot(container)

    await act(async () => {
      root?.render(<SelfCheckInFlow onSubmit={onSubmit} players={[{ id: 'player-1', displayName: 'Max Muster' }]} />)
    })

    await changeInput(container.querySelector('input') as HTMLInputElement, 'max')
    await act(async () => {
      getButton(container, 'Max Muster').click()
      getButton(container, '4').click()
      getButton(container, '4').click()
      getButton(container, '0').click()
    })

    expect(getSubmitButton(container).disabled).toBe(true)

    await act(async () => {
      getButton(container, '4').click()
      getButton(container, '0').click()
    })

    expect(getSubmitButton(container).disabled).toBe(true)
  })

  it('keeps unauffaellig exclusive in the life flags', async () => {
    const onSubmit = vi.fn(async () => undefined)
    const container = document.createElement('div')
    root = createRoot(container)

    await act(async () => {
      root?.render(<SelfCheckInFlow onSubmit={onSubmit} players={[{ id: 'player-1', displayName: 'Max Muster' }]} />)
    })

    await changeInput(container.querySelector('input') as HTMLInputElement, 'max')
    await act(async () => {
      getButton(container, 'Max Muster').click()
      getButton(container, 'Stress').click()
      getButton(container, 'Muskelkater').click()
    })
    await changeInput(getInputByPlaceholder(container, 'leer lassen, wenn unauffällig'), 'Pruefungsstress')
    await act(async () => {
      getButton(container, 'Unauffällig').click()
      getButton(container, '5').click()
      getButton(container, '0').click()
      getButton(container, 'Nein').click()
    })
    await act(async () => {
      container.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ lifeFlag: '' }))
  })
})
