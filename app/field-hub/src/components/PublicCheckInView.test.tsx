// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { publicSubmissionErrorMessage } from '../lib/publicCheckInErrors'
import { submitPublicCheckIn } from '../lib/publicCheckInRepository'
import { PublicCheckInView } from './PublicCheckInView'

const repositoryMocks = vi.hoisted(() => ({
  loadPublicCheckInForm: vi.fn(async () => ({
    link: {
      id: 'link-1',
      sessionTitle: 'Dienstag Training',
      sessionDate: '2026-06-16',
    },
    linkPlayers: [{ id: 'player-1', displayName: 'Max Muster' }],
  })),
  submitPublicCheckIn: vi.fn(async () => undefined),
}))

vi.mock('../lib/publicCheckInRepository', () => repositoryMocks)

function getButton(container: HTMLElement, name: string) {
  const button = [...container.querySelectorAll('button')].find((item) => item.textContent?.trim() === name)

  if (!button) {
    throw new Error(`Button ${name} not found`)
  }

  return button as HTMLButtonElement
}

async function clickButton(container: HTMLElement, name: string) {
  await act(async () => {
    getButton(container, name).click()
  })
}

async function changeInput(element: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set

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

describe('PublicCheckInView', () => {
  let root: Root | null = null

  beforeEach(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    window.localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount()
      })
      root = null
    }
  })

  async function renderPublicCheckIn() {
    const container = document.createElement('div')
    root = createRoot(container)

    await act(async () => {
      root?.render(<PublicCheckInView token="public-token" />)
    })

    return container
  }

  it('shows OnField Rugby branding while keeping the public self-check-in visible', async () => {
    const container = await renderPublicCheckIn()

    expect(container.textContent).toContain('Training Check-in')
    expect(container.textContent).toContain('OnField Rugby Public Check-in')
    expect(container.textContent).toContain('Know squad status before the whistle.')
    expect(container.textContent).toContain('Max Muster')
    expect(container.textContent).toContain('Schritt 1 von 6')
  })

  it('submits without writing a local submitted marker', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    const container = await renderPublicCheckIn()

    await changeInput(container.querySelector('input') as HTMLInputElement, 'max')
    await clickButton(container, 'Max Muster')
    await clickButton(container, 'Weiter')
    await clickButton(container, '5')
    await clickButton(container, 'Weiter')
    await clickButton(container, 'Weiter')
    await clickButton(container, '0')
    await clickButton(container, 'Weiter')
    await clickButton(container, 'Nein')
    await clickButton(container, 'Weiter')
    await submitForm(container)

    expect(submitPublicCheckIn).toHaveBeenCalledWith(
      'public-token',
      expect.objectContaining({
        linkId: 'link-1',
        linkPlayerId: 'player-1',
        readiness: 5,
        painScore: 0,
        painLocation: '',
        sessionReaction: 'none',
      }),
    )
    expect(container.textContent).toContain('Check-in gespeichert')
    expect(setItemSpy).not.toHaveBeenCalledWith(expect.stringContaining('fieldHub:publicCheckInSubmitted'), expect.any(String))
    expect(window.localStorage.getItem('fieldHub:publicCheckInSubmitted:link-1')).toBeNull()

    setItemSpy.mockRestore()
  })
})

describe('PublicCheckInView error mapping', () => {
  it('shows a friendly message when the submission limit is reached', () => {
    expect(publicSubmissionErrorMessage(new Error('public check-in submission limit reached'))).toBe(
      'Check-in wurde bereits mehrfach abgeschickt. Bitte Coach direkt informieren.',
    )
  })

  it('does not expose raw public check-in backend errors', () => {
    expect(publicSubmissionErrorMessage(new Error('new row violates row-level security policy'))).toBe(
      'Check-in konnte gerade nicht gespeichert werden. Bitte erneut versuchen oder Coach informieren.',
    )
    expect(publicSubmissionErrorMessage(new Error('database timeout on public_checkin_submissions insert'))).toBe(
      'Check-in konnte gerade nicht gespeichert werden. Bitte erneut versuchen oder Coach informieren.',
    )
    expect(publicSubmissionErrorMessage(new Error('Check-in-Link ist ungueltig oder abgelaufen.'))).toBe(
      'Check-in-Link ist ungültig oder abgelaufen. Bitte Coach informieren.',
    )
  })
})
