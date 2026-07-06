// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LazyScreenBoundary } from './App'

function BrokenScreen(): never {
  throw new Error('lazy chunk failed')
}

describe('LazyScreenBoundary', () => {
  let container: HTMLDivElement
  let root: Root
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    consoleErrorSpy.mockRestore()
  })

  it('shows a coach-readable reload state when a lazy screen fails', () => {
    act(() => {
      root.render(
        <LazyScreenBoundary resetKey="analyse" screenName="Analyse">
          <BrokenScreen />
        </LazyScreenBoundary>,
      )
    })

    expect(container.textContent).toContain('Analyse konnte nicht geladen werden.')
    expect(container.textContent).toContain('App neu laden oder Verbindung prüfen.')
    expect(container.querySelector('.screen-load-state-error')).not.toBeNull()
    expect(container.querySelector('[role="alert"]')).not.toBeNull()
    expect(container.querySelector('button')?.textContent).toBe('App neu laden')
  })

  it('clears the error state when the lazy screen reset key changes', () => {
    act(() => {
      root.render(
        <LazyScreenBoundary resetKey="analyse" screenName="Analyse">
          <BrokenScreen />
        </LazyScreenBoundary>,
      )
    })

    act(() => {
      root.render(
        <LazyScreenBoundary resetKey="bibliothek" screenName="Bibliothek">
          <p>Bibliothek geladen</p>
        </LazyScreenBoundary>,
      )
    })

    expect(container.textContent).toContain('Bibliothek geladen')
    expect(container.textContent).not.toContain('Analyse konnte nicht geladen werden.')
  })
})
