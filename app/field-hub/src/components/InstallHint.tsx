import { Smartphone } from 'lucide-react'
import type { StoragePersistenceState } from '../hooks/useStoragePersistence'

type InstallHintProps = {
  storagePersistence: StoragePersistenceState
}

const storageCopy: Record<StoragePersistenceState['status'], string> = {
  checking: 'Speicherpersistenz wird angefragt.',
  persisted: 'Der Browser hat persistenten Speicher bestaetigt.',
  denied: 'Der Browser hat persistenten Speicher nicht bestaetigt.',
  unsupported: 'Dieser Browser meldet keine Storage-Persistenz-API.',
  error: 'Die Speicherpersistenz konnte nicht geprueft werden.',
}

export function InstallHint({ storagePersistence }: InstallHintProps) {
  return (
    <section className="install-hint" aria-label="Installationshinweis">
      <div className="status-line">
        <Smartphone className="nav-icon" aria-hidden />
        <strong>Zum Home-Bildschirm hinzufuegen</strong>
      </div>
      <p>
        Auf iPad und iPhone sollte die PWA vom Home-Bildschirm gestartet werden. Zusammen mit
        Supabase-Sync und regelmaessigem JSON-Export reduziert das das Risiko von Datenverlust
        oder Geraete-Drift nach laengerer Nichtnutzung.
      </p>
      <div className="storage-grid">
        <div className="storage-result">{storageCopy[storagePersistence.status]}</div>
        <p>
          Vor laengeren Pausen, besonders vor Arwins August-Abwesenheit, bleibt ein JSON-Backup
          Pflicht. iOS/Safari-Speicher ist kein Ersatz fuer Sync und Export.
        </p>
      </div>
    </section>
  )
}
