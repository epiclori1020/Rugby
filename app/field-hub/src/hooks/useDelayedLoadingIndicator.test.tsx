// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useDelayedLoadingIndicator } from './useDelayedLoadingIndicator'

function Probe({ active, delayMs }: { active: boolean; delayMs?: number }) {
  const visible = useDelayedLoadingIndicator(active, delayMs)
  return <output>{visible ? 'visible' : 'hidden'}</output>
}

describe('useDelayedLoadingIndicator', () => {
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('keeps short loading work quiet and appears after the default 300 ms', async () => {
    vi.useFakeTimers()
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => root.render(<Probe active />))
    expect(container.textContent).toBe('hidden')

    await act(async () => vi.advanceTimersByTime(299))
    expect(container.textContent).toBe('hidden')

    await act(async () => vi.advanceTimersByTime(1))
    expect(container.textContent).toBe('visible')

    await act(async () => root.render(<Probe active={false} />))
    expect(container.textContent).toBe('hidden')
    root.unmount()
  })

  it('cleans up a pending timer when loading ends early', async () => {
    vi.useFakeTimers()
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => root.render(<Probe active delayMs={500} />))
    await act(async () => root.render(<Probe active={false} delayMs={500} />))
    await act(async () => vi.advanceTimersByTime(500))

    expect(container.textContent).toBe('hidden')
    root.unmount()
  })

  it('starts the full delay again when loading restarts after the skeleton was visible', async () => {
    vi.useFakeTimers()
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => root.render(<Probe active />))
    await act(async () => vi.advanceTimersByTime(300))
    expect(container.textContent).toBe('visible')

    await act(async () => root.render(<Probe active={false} />))
    await act(async () => root.render(<Probe active />))
    expect(container.textContent).toBe('hidden')

    await act(async () => vi.advanceTimersByTime(299))
    expect(container.textContent).toBe('hidden')
    await act(async () => vi.advanceTimersByTime(1))
    expect(container.textContent).toBe('visible')

    root.unmount()
  })
})
