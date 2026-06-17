export type PublicCheckInSharePayload = {
  title: string
  text: string
  url: string
}

export type BuildPublicCheckInSharePayloadInput = {
  sessionTitle: string
  sessionDate: string
  url: string
}

export function buildPublicCheckInSharePayload({
  sessionDate,
  sessionTitle,
  url,
}: BuildPublicCheckInSharePayloadInput): PublicCheckInSharePayload {
  return {
    title: 'Rugby Donau S&C Check-in',
    text: `Bitte vor dem Training einchecken: ${sessionTitle} (${sessionDate}).`,
    url,
  }
}

export function buildWhatsAppShareUrl(payload: PublicCheckInSharePayload) {
  return `https://wa.me/?text=${encodeURIComponent(`${payload.text} ${payload.url}`)}`
}

export function buildMailShareUrl(payload: PublicCheckInSharePayload) {
  return `mailto:?subject=${encodeURIComponent(payload.title)}&body=${encodeURIComponent(`${payload.text}\n\n${payload.url}`)}`
}

export async function copyPublicCheckInLink(url: string) {
  if (!navigator.clipboard?.writeText) {
    throw new Error('Clipboard API ist nicht verfuegbar.')
  }

  await navigator.clipboard.writeText(url)
}

export async function createPublicCheckInQrCodeDataUrl(url: string) {
  const QRCode = await import('qrcode')
  return QRCode.toDataURL(url, { margin: 1, width: 220 })
}
