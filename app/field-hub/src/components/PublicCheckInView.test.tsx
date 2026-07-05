// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { publicSubmissionErrorMessage } from '../lib/publicCheckInErrors'
import { PublicCheckInView } from './PublicCheckInView'

vi.mock('../lib/publicCheckInRepository', () => ({
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

describe('PublicCheckInView', () => {
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

  it('shows OnField Rugby branding while keeping the form visible', async () => {
    const container = document.createElement('div')
    root = createRoot(container)

    await act(async () => {
      root?.render(<PublicCheckInView token="public-token" />)
    })

    expect(container.textContent).toContain('Training Check-in')
    expect(container.textContent).toContain('OnField Rugby Public Check-in')
    expect(container.textContent).toContain('Know squad status before the whistle.')
    expect(container.textContent).toContain('Max Muster')
  })
})

describe('PublicCheckInView error mapping', () => {
  it('shows a friendly message when the submission limit is reached', () => {
    expect(publicSubmissionErrorMessage(new Error('public check-in submission limit reached'))).toBe(
      'Check-in wurde bereits mehrfach abgeschickt. Sag Arwin bitte direkt Bescheid.',
    )
  })
})
