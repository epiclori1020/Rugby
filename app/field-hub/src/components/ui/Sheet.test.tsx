// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { Sheet } from './Sheet'

describe('Sheet', () => {
  it('binds its description, traps focus, closes on Escape and restores the opener', async () => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    const onClose = vi.fn()
    const opener = document.createElement('button')
    opener.textContent = 'Öffnen'
    document.body.append(opener)
    opener.focus()
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <Sheet description="Aufgabe abschließen" onClose={onClose} title="Nachbereitungsaufgabe bearbeiten">
          <button type="button">Erste Aktion</button>
          <button type="button">Letzte Aktion</button>
        </Sheet>,
      )
    })

    const dialog = container.querySelector<HTMLElement>('[role="dialog"]')
    const description = container.querySelector<HTMLElement>('.of-sheet-header p')
    expect(dialog?.getAttribute('aria-describedby')).toBe(description?.id)
    expect(dialog?.contains(document.activeElement)).toBe(true)

    const focusable = Array.from(dialog?.querySelectorAll<HTMLButtonElement>('button') ?? [])
    focusable.at(-1)?.focus()
    await act(async () => {
      focusable.at(-1)?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    })
    expect(document.activeElement).toBe(focusable[0])

    await act(async () => {
      dialog?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    expect(onClose).toHaveBeenCalledOnce()

    await act(async () => root.unmount())
    expect(document.activeElement).toBe(opener)
    container.remove()
    opener.remove()
  })
})
