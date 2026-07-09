/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  EmptyState,
  ErrorState,
  NumberScale,
  OfflineBanner,
  PainScale,
  PrimaryButton,
  SafetyNotice,
  SecondaryButton,
  SegmentedControl,
  Sheet,
  Skeleton,
  StatusChip,
  SyncStatus,
  TrafficLightChip,
} from './index'

const projectRoot = process.cwd()

function readComponentCss() {
  return readFileSync(join(projectRoot, 'src/components/ui/onfield-ui.css'), 'utf8')
}

describe('Sprint 5 Core Component Kit', () => {
  it('renders button loading and disabled contracts with accessible copy', () => {
    const loadingMarkup = renderToStaticMarkup(
      <PrimaryButton isLoading loadingLabel="Speichern laeuft">
        Speichern
      </PrimaryButton>,
    )
    const disabledMarkup = renderToStaticMarkup(
      <SecondaryButton id="retry" disabled disabledReason="Erst wieder online gehen.">
        Wiederholen
      </SecondaryButton>,
    )

    expect(loadingMarkup).toContain('aria-busy="true"')
    expect(loadingMarkup).toContain('Speichern laeuft')
    expect(disabledMarkup).toContain('disabled=""')
    expect(disabledMarkup).toContain('Erst wieder online gehen.')
    expect(disabledMarkup).toContain('aria-describedby="retry-disabled-reason"')
  })

  it('keeps segmented and numeric controls as labelled button groups', () => {
    const segmentedMarkup = renderToStaticMarkup(
      <SegmentedControl
        label="Einheitsphase"
        value="checkin"
        options={[
          { value: 'checkin', label: 'Check-in' },
          { value: 'training', label: 'Training' },
        ]}
        onChange={() => undefined}
      />,
    )
    const numberMarkup = renderToStaticMarkup(
      <NumberScale label="Readiness" max={5} value={3} onChange={() => undefined} />,
    )
    const painMarkup = renderToStaticMarkup(
      <PainScale label="Pain" value={0} onChange={() => undefined} />,
    )

    expect(segmentedMarkup).toContain('role="group"')
    expect(segmentedMarkup).toContain('aria-label="Einheitsphase"')
    expect(segmentedMarkup).toContain('aria-pressed="true"')
    expect(numberMarkup).toContain('aria-label="Readiness"')
    expect(numberMarkup).toContain('class="of-number-scale-option of-num"')
    expect(numberMarkup).toContain('>5</button>')
    expect(painMarkup).toContain('aria-label="Pain"')
    expect(painMarkup).toContain('class="of-number-scale-option of-num"')
    expect(painMarkup).toContain('>0</button>')
    expect(painMarkup).toContain('>10</button>')
  })

  it('communicates status with text plus semantic tone classes', () => {
    const markup = renderToStaticMarkup(
      <>
        <StatusChip tone="warning" label="Consent offen" />
        <TrafficLightChip tone="yellow" label="Gelb" reason="modifizieren" />
        <SyncStatus tone="pending" label="Online · Aenderungen offen" detail="2 Aenderungen offen" />
        <OfflineBanner message="Offline" detail="Aenderungen bleiben lokal gespeichert." />
      </>,
    )

    expect(markup).toContain('Consent offen')
    expect(markup).toContain('of-status-chip-warning')
    expect(markup).toContain('Gelb')
    expect(markup).toContain('modifizieren')
    expect(markup).toContain('Online · Aenderungen offen')
    expect(markup).toContain('Aenderungen bleiben lokal gespeichert.')
  })

  it('renders notice, sheet, empty, loading and error states with recovery affordances', () => {
    const markup = renderToStaticMarkup(
      <>
        <SafetyNotice title="Ruecksprache noetig" tone="danger">
          Training anpassen und naechste Aktion mit Staff klaeren.
        </SafetyNotice>
        <Sheet title="Athlet Details" description="Kurz pruefen" onClose={() => undefined}>
          Inhalt
        </Sheet>
        <EmptyState title="Keine offenen Aufgaben" body="Heute ist nichts nachzutragen." action={<SecondaryButton>Zurueck</SecondaryButton>} />
        <Skeleton variant="row" />
        <ErrorState title="Speichern nicht moeglich" body="Erneut versuchen." action={<SecondaryButton>Erneut versuchen</SecondaryButton>} />
      </>,
    )

    expect(markup).toContain('role="alert"')
    expect(markup).toContain('Training anpassen')
    expect(markup).toContain('role="dialog"')
    expect(markup).toContain('aria-modal="true"')
    expect(markup).toContain('Schliessen')
    expect(markup).toContain('Keine offenen Aufgaben')
    expect(markup).toContain('role="status"')
    expect(markup).toContain('Speichern nicht moeglich')
  })

  it('keeps touch targets and component colors routed through tokens', () => {
    const css = readComponentCss()

    expect(css).toContain('min-height: 44px')
    expect(css).toContain('min-height: 48px')
    expect(css).toContain('env(safe-area-inset-top)')
    expect(css.match(/#[0-9A-Fa-f]{3,8}|rgba?\(/g)).toBeNull()
    expect(css).toContain('var(--of-color-brand-primary)')
    expect(css).toContain('var(--of-color-status-danger)')
  })
})
