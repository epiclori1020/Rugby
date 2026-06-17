import { describe, expect, it, vi } from 'vitest'
import {
  buildMailShareUrl,
  buildPublicCheckInSharePayload,
  buildWhatsAppShareUrl,
  copyPublicCheckInLink,
} from './publicCheckInShare'

describe('public check-in sharing', () => {
  it('builds a stable private check-in share payload', () => {
    expect(
      buildPublicCheckInSharePayload({
        sessionTitle: 'Dienstag Speed & Kraft',
        sessionDate: '2026-06-16',
        url: 'https://field.test/#/checkin/token',
      }),
    ).toEqual({
      title: 'Rugby Donau S&C Check-in',
      text: 'Bitte vor dem Training einchecken: Dienstag Speed & Kraft (2026-06-16).',
      url: 'https://field.test/#/checkin/token',
    })
  })

  it('builds an encoded WhatsApp share URL with text and link', () => {
    const payload = buildPublicCheckInSharePayload({
      sessionTitle: 'Dienstag Speed & Kraft',
      sessionDate: '2026-06-16',
      url: 'https://field.test/#/checkin/token?x=1&y=2',
    })

    expect(buildWhatsAppShareUrl(payload)).toBe(
      `https://wa.me/?text=${encodeURIComponent(`${payload.text} ${payload.url}`)}`,
    )
  })

  it('builds an encoded mail share URL with subject and body', () => {
    const payload = buildPublicCheckInSharePayload({
      sessionTitle: 'Dienstag',
      sessionDate: '2026-06-16',
      url: 'https://field.test/#/checkin/token',
    })

    expect(buildMailShareUrl(payload)).toBe(
      `mailto:?subject=${encodeURIComponent(payload.title)}&body=${encodeURIComponent(`${payload.text}\n\n${payload.url}`)}`,
    )
  })

  it('copies the public check-in link through the Clipboard API', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    await copyPublicCheckInLink('https://field.test/#/checkin/token')

    expect(writeText).toHaveBeenCalledWith('https://field.test/#/checkin/token')
  })

  it('rejects when clipboard writing is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    })

    await expect(copyPublicCheckInLink('https://field.test/#/checkin/token')).rejects.toThrow(
      'Clipboard API ist nicht verfuegbar.',
    )
  })
})
