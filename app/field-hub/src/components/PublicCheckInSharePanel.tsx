import { ClipboardCheck, Mail, MessageCircle, QrCode, Share2, X } from 'lucide-react'
import type { PublicCheckInSharePayload } from '../lib/publicCheckInShare'
import { buildMailShareUrl, buildWhatsAppShareUrl } from '../lib/publicCheckInShare'

type PublicCheckInSharePanelProps = {
  payload: PublicCheckInSharePayload
  qrCodeDataUrl: string | null
  qrCodeStatus: 'idle' | 'loading' | 'ready' | 'error'
  canNativeShare: boolean
  nativeShareStatus: 'idle' | 'sharing' | 'shared' | 'aborted' | 'error'
  copyStatus: 'idle' | 'copied' | 'error'
  onNativeShare: () => void
  onCopy: () => void
  onClose: () => void
}

function shareStatusLabel(
  nativeShareStatus: PublicCheckInSharePanelProps['nativeShareStatus'],
  copyStatus: PublicCheckInSharePanelProps['copyStatus'],
) {
  if (copyStatus === 'copied') {
    return 'Link kopiert.'
  }

  if (copyStatus === 'error') {
    return 'Kopieren nicht möglich. Nutze Teilen, WhatsApp, E-Mail oder QR-Code.'
  }

  if (nativeShareStatus === 'shared') {
    return 'Teilen geöffnet.'
  }

  if (nativeShareStatus === 'aborted') {
    return 'Teilen abgebrochen. Du kannst WhatsApp, E-Mail, Kopieren oder QR-Code nutzen.'
  }

  if (nativeShareStatus === 'error') {
    return 'Teilen direkt nicht verfügbar. Nutze WhatsApp, E-Mail, Kopieren oder QR-Code.'
  }

  if (nativeShareStatus === 'sharing') {
    return 'Teilen wird geöffnet...'
  }

  return null
}

export function PublicCheckInSharePanel({
  canNativeShare,
  copyStatus,
  nativeShareStatus,
  onClose,
  onCopy,
  onNativeShare,
  payload,
  qrCodeDataUrl,
  qrCodeStatus,
}: PublicCheckInSharePanelProps) {
  const statusLabel = shareStatusLabel(nativeShareStatus, copyStatus)

  return (
    <div className="public-checkin-share-panel" data-testid="public-checkin-share-panel">
      <div className="status-line">
        <Share2 className="nav-icon" aria-hidden />
        <div>
          <h4>Check-in-Link teilen</h4>
          <p className="public-checkin-share-warning">Dieser Link ist nur für diese Einheit gedacht. Nicht öffentlich posten.</p>
        </div>
      </div>

      <div className="public-checkin-share-actions">
        {canNativeShare ? (
          <button
            className="primary-action"
            data-testid="public-checkin-share-native"
            type="button"
            onClick={onNativeShare}
            disabled={nativeShareStatus === 'sharing'}
          >
            <Share2 className="nav-icon" aria-hidden />
            <span>{nativeShareStatus === 'sharing' ? 'Teilt...' : 'Teilen'}</span>
          </button>
        ) : null}
        <a
          className="secondary-action"
          data-testid="public-checkin-share-whatsapp"
          href={buildWhatsAppShareUrl(payload)}
          rel="noopener noreferrer"
          target="_blank"
        >
          <MessageCircle className="nav-icon" aria-hidden />
          <span>WhatsApp</span>
        </a>
        <a className="secondary-action" data-testid="public-checkin-share-mail" href={buildMailShareUrl(payload)}>
          <Mail className="nav-icon" aria-hidden />
          <span>E-Mail</span>
        </a>
        <button className="secondary-action" data-testid="public-checkin-share-copy" type="button" onClick={onCopy}>
          <ClipboardCheck className="nav-icon" aria-hidden />
          <span>Kopieren</span>
        </button>
        <button className="secondary-action" data-testid="public-checkin-share-close" type="button" onClick={onClose}>
          <X className="nav-icon" aria-hidden />
          <span>Schließen</span>
        </button>
      </div>

      {qrCodeStatus !== 'idle' ? (
        <div className="public-checkin-qr">
          {qrCodeStatus === 'ready' && qrCodeDataUrl ? (
            <img data-testid="public-checkin-share-qr" src={qrCodeDataUrl} alt="QR-Code für den Check-in-Link" />
          ) : qrCodeStatus === 'error' ? (
            <span>QR-Code konnte nicht erstellt werden. Nutze Teilen, WhatsApp, E-Mail oder Kopieren.</span>
          ) : (
            <span>
              <QrCode className="nav-icon" aria-hidden />
              QR-Code wird erstellt...
            </span>
          )}
        </div>
      ) : null}

      {statusLabel ? (
        <p className={copyStatus === 'error' || nativeShareStatus === 'error' ? 'form-error' : 'success-note'}>{statusLabel}</p>
      ) : null}
    </div>
  )
}
