import type { CheckInLimit, PlayerSessionEntry, PlayerWarning, TrafficLight } from './checkIn'
import type { ReturnerCapSummary } from './returners'

export type CheckInGuidanceLevel = 'check_today' | 'recommended_limit' | 'adjust_load' | 'decision_open' | 'info'
export type CheckInGuidanceSource = 'today' | 'carryover' | 'returner_caps'

export type CheckInGuidanceItem = {
  id: string
  level: CheckInGuidanceLevel
  source: CheckInGuidanceSource
  title: string
  meaning: string
  why: string
  coachAction: string
  consequence: string
}

export type AdvisoryConsequences = {
  visibleTrafficLight: TrafficLight | null
  recommendedLimits: CheckInLimit[]
  staleStoredLimits: CheckInLimit[]
}

const limitLabels: Record<CheckInLimit, string> = {
  kein_sprint: 'kein Sprint',
  kein_cond: 'kein Conditioning',
  kein_schweres_heben: 'kein schweres Heben',
  physio: 'Medical/Physio klären',
  klaeren: 'klären',
}

function listLimits(limits: CheckInLimit[]) {
  return limits.map((limit) => limitLabels[limit]).join(', ')
}

function appendUnique(base: CheckInLimit[], extra: CheckInLimit[]) {
  return [...new Set([...base, ...extra])]
}

function item(input: CheckInGuidanceItem): CheckInGuidanceItem {
  return input
}

export function deriveAdvisoryConsequences(entry: PlayerSessionEntry): AdvisoryConsequences {
  const visibleTrafficLight = entry.trafficLightWasManual
    ? entry.trafficLight
    : entry.trafficLightSuggestion ?? entry.trafficLight
  let recommendedLimits: CheckInLimit[] = []

  if (visibleTrafficLight === 'yellow') {
    recommendedLimits = ['kein_cond']
  }

  if (visibleTrafficLight === 'red') {
    recommendedLimits = ['kein_sprint', 'kein_cond', 'kein_schweres_heben', 'klaeren']
  }

  if (entry.redFlag !== 'none') {
    recommendedLimits = appendUnique(recommendedLimits, ['physio'])
  }

  const recommendedLimitSet = new Set(recommendedLimits)

  return {
    visibleTrafficLight,
    recommendedLimits,
    staleStoredLimits: entry.limits.filter((limit) => !recommendedLimitSet.has(limit)),
  }
}

export function buildCheckInGuidance(input: {
  entry: PlayerSessionEntry
  warning?: PlayerWarning
  returnerCap?: ReturnerCapSummary
}): CheckInGuidanceItem[] {
  const { entry, warning, returnerCap } = input
  const guidance: CheckInGuidanceItem[] = []
  const consequences = deriveAdvisoryConsequences(entry)

  if (entry.returnerFlag === 'offen') {
    guidance.push(
      item({
        id: 'today:returner-open',
        level: 'decision_open',
        source: 'today',
        title: 'Returner klären',
        meaning: 'Der Returner-Status ist heute noch nicht entschieden.',
        why: 'Neue oder unklare Spieler starten mit offen, damit der Status bewusst geprüft wird.',
        coachAction: 'Returner ja oder nein wählen; bei ja die Caps prüfen.',
        consequence: 'Keine Belastungswarnung; zuerst Returner ja/nein wählen.',
      }),
    )
  }

  if (entry.returnerFlag === 'ja') {
    guidance.push(
      item({
        id: 'today:returner-yes',
        level: 'adjust_load',
        source: 'today',
        title: 'Returner heute',
        meaning: 'Der Spieler ist heute als Returner markiert.',
        why: 'Returner sollen nicht automatisch in den normalen Plan hineinrutschen.',
        coachAction: 'Returner-Caps prüfen und Belastung vor Sprint, COD, Conditioning und Kontakt bewusst wählen.',
        consequence: 'Belastung anpassen; Caps und Tagesreaktion führen die Entscheidung.',
      }),
    )
  }

  if (consequences.visibleTrafficLight === 'yellow') {
    guidance.push(
      item({
        id: 'today:traffic-yellow',
        level: 'adjust_load',
        source: 'today',
        title: 'Gelb: Belastung anpassen',
        meaning: 'Mindestens ein auffälliges Check-in-Signal liegt vor.',
        why: 'Gelb kann aus Schmerz 3-4, niedriger Readiness, Life-Flag, Returner oder Vorwarnung entstehen.',
        coachAction: 'Belastung reduzieren oder Variante wählen und Reaktion im Training beobachten.',
        consequence: 'Empfohlen: Conditioning prüfen/reduzieren.',
      }),
    )
  }

  if (consequences.visibleTrafficLight === 'red') {
    guidance.push(
      item({
        id: 'today:traffic-red',
        level: 'check_today',
        source: 'today',
        title: 'Rot: heute prüfen',
        meaning: 'Ein starkes oder kombiniertes Warnsignal ist sichtbar.',
        why: 'Rot kann aus Schmerz über 4, Red Flag, auffälliger Bewegung oder mehreren gelben Signalen entstehen.',
        coachAction: 'Aktuelle Ursache prüfen und normale Progression nicht einfach übernehmen.',
        consequence: `Empfohlen: ${listLimits(consequences.recommendedLimits.filter((limit) => limit !== 'physio'))}.`,
      }),
    )
  }

  if (entry.redFlag !== 'none') {
    guidance.push(
      item({
        id: `today:red-flag:${entry.redFlag}`,
        level: 'check_today',
        source: 'today',
        title: 'Red Flag prüfen',
        meaning: 'Kopf/Nacken/neurologisches Signal oder akute Instabilität ist markiert.',
        why: 'Diese Signale liegen außerhalb normaler S&C-Progression.',
        coachAction: 'Medical/Physio klären; keine normale Progression übernehmen.',
        consequence: 'Keine normale Progression; App bleibt beratend und sperrt keine Coach-Entscheidung.',
      }),
    )
  }

  if (consequences.staleStoredLimits.length > 0) {
    guidance.push(
      item({
        id: 'today:stored-limits-review',
        level: 'decision_open',
        source: 'today',
        title: 'Gespeicherte Limits prüfen',
        meaning: `Aus früheren Eingaben sind Limits gespeichert: ${listLimits(consequences.staleStoredLimits)}.`,
        why: 'Gespeicherte Limits können strenger sein als die aktuelle Coach-Ampel.',
        coachAction: 'Aktuelle Lage und Coach-Korrektur prüfen, bevor diese Limits weiterverwendet werden.',
        consequence: 'Nicht automatisch als heutiges Limit anzeigen; Coach-Entscheidung und aktuelle Lage prüfen.',
      }),
    )
  }

  if (returnerCap) {
    const capParts = [
      returnerCap.currentStage ? `Stufe ${returnerCap.currentStage}` : null,
      returnerCap.speedCap ? `Speed: ${returnerCap.speedCap}` : null,
      returnerCap.codDecelCap ? `COD: ${returnerCap.codDecelCap}` : null,
      returnerCap.conditioningCap ? `Conditioning: ${returnerCap.conditioningCap}` : null,
      returnerCap.contactCap ? `Kontakt: ${returnerCap.contactCap}` : null,
    ].filter(Boolean)

    if (capParts.length > 0) {
      guidance.push(
        item({
          id: 'returner-caps:latest',
          level: 'info',
          source: 'returner_caps',
          title: 'Returner-Caps',
          meaning: `Letzter Belastungsplan vom ${returnerCap.sessionDate}: ${capParts.join(' · ')}.`,
          why: 'Caps trennen Speed, COD/Decel, Conditioning und Kontakt.',
          coachAction: 'Caps mit heutigem Status abgleichen und im Training beobachten.',
          consequence: 'Caps sind ein Belastungsplan, keine medizinische Freigabe.',
        }),
      )
    }
  }

  if (warning) {
    guidance.push(
      item({
        id: `carryover:warning:${warning.sessionDate}`,
        level: warning.trafficLight === 'red' ? 'check_today' : 'info',
        source: 'carryover',
        title: 'Vorwarnung aus letzter Einheit',
        meaning: `In der letzten auffälligen Einheit stand die Ampel auf ${warning.trafficLight ?? 'offen'}.`,
        why: 'Dieser Hinweis ist ein Carry-over, kein automatisch neuer Tagesbefund.',
        coachAction: 'Beim heutigen Check-in kurz gegenprüfen und neue Ampel bewusst setzen.',
        consequence: 'Mitnahme aus der Vergangenheit; heutige Entscheidung bleibt beim Coach.',
      }),
    )

    if (warning.returnerFlag !== 'nein') {
      guidance.push(
        item({
          id: `carryover:returner:${warning.sessionDate}`,
          level: 'info',
          source: 'carryover',
          title: 'Returner aus letzter Einheit',
          meaning: `Zuletzt war Returner ${warning.returnerFlag} dokumentiert.`,
          why: 'Returner-Status kann sich zwischen Einheiten ändern.',
          coachAction: 'Heutigen Returner-Status aktiv wählen.',
          consequence: 'Status prüfen; keine automatische Belastungsentscheidung.',
        }),
      )
    }

    if (warning.e2Decision && warning.e2Decision !== 'normal') {
      guidance.push(
        item({
          id: `carryover:e2:${warning.sessionDate}`,
          level: 'adjust_load',
          source: 'carryover',
          title: 'E2 aus letzter Einheit',
          meaning: `E2 war ${warning.e2Decision}.`,
          why: 'E2 ist die geplante Anpassung für die nächste Einheit.',
          coachAction: 'E2 mit heutigem Check-in abgleichen.',
          consequence: 'Belastung anpassen, wenn die heutige Lage dazu passt.',
        }),
      )
    }

    if (warning.nextStep) {
      guidance.push(
        item({
          id: `carryover:next-step:${warning.sessionDate}`,
          level: warning.nextStep === 'klaeren' || warning.nextStep === 'reduzieren' ? 'adjust_load' : 'info',
          source: 'carryover',
          title: 'Next Step aus letzter Einheit',
          meaning: `Letzter nächster Schritt: ${warning.nextStep}.`,
          why: 'Die Nachbereitung kann eine Progressionsrichtung vorgeben.',
          coachAction: 'Heute gegen Readiness, Schmerz und Trainingsziel prüfen.',
          consequence: 'Als Entscheidungshilfe nutzen, nicht als automatische Vorgabe.',
        }),
      )
    }

    if (warning.postPainScore !== null) {
      guidance.push(
        item({
          id: `carryover:post-pain:${warning.sessionDate}`,
          level: warning.postPainScore >= 5 ? 'check_today' : 'adjust_load',
          source: 'carryover',
          title: 'Post-Pain aus letzter Einheit',
          meaning: `Nach der Einheit waren ${warning.postPainScore}/10 dokumentiert${warning.postPainLocation ? ` (${warning.postPainLocation})` : ''}.`,
          why: 'Post-Pain kann auf unpassende Dosis oder Reaktion nach Training hinweisen.',
          coachAction: 'Heute Schmerz, Ort und Reaktion erneut prüfen.',
          consequence: 'Belastung je nach aktuellem Check-in anpassen.',
        }),
      )
    }

    if (warning.limits.length > 0) {
      guidance.push(
        item({
          id: `carryover:limits:${warning.sessionDate}`,
          level: 'decision_open',
          source: 'carryover',
          title: 'Alte Limits prüfen',
          meaning: `Aus der letzten auffälligen Einheit liegen Limits vor: ${listLimits(warning.limits)}.`,
          why: 'Alte Limits können überholt sein oder weiter relevant bleiben.',
          coachAction: 'Heute bewusst prüfen und nicht ungeprüft übernehmen.',
          consequence: 'Als Mitnahme anzeigen; heutige Einschränkung neu entscheiden.',
        }),
      )
    }
  }

  return guidance
}
