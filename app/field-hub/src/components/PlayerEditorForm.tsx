import { Save } from 'lucide-react'
import type { FormEvent, ReactNode } from 'react'
import {
  clusterOptions,
  consentStatusOptions,
  photoConsentOptions,
  returnerStatusOptions,
  type ConsentStatus,
  type PhotoConsentStatus,
  type PlayerCluster,
  type PlayerFormValues,
  type ReturnerStatus,
} from '../domain/players'

export function PlayerEditorForm({
  actionChildren,
  children,
  formError,
  formNotice,
  isSubmitting,
  onFieldChange,
  onSubmit,
  photoLoadError,
  submitLabel = 'Speichern',
  submittingLabel = 'Speichert...',
  values,
}: {
  actionChildren?: ReactNode
  children?: ReactNode
  formError?: string | null
  formNotice?: string | null
  isSubmitting: boolean
  onFieldChange: <K extends keyof PlayerFormValues>(field: K, value: PlayerFormValues[K]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  photoLoadError?: boolean
  submitLabel?: string
  submittingLabel?: string
  values: PlayerFormValues
}) {
  return (
    <form className="field-form player-form" onSubmit={onSubmit}>
      <label>
        <span>Name</span>
        <input value={values.name} onChange={(event) => onFieldChange('name', event.target.value)} required />
      </label>

      <label>
        <span>Position</span>
        <input
          value={values.position}
          placeholder="z. B. Prop, Lock, 9, Centre"
          onChange={(event) => onFieldChange('position', event.target.value)}
        />
      </label>

      <div className="form-grid">
        <label>
          <span>Cluster</span>
          <select value={values.cluster} onChange={(event) => onFieldChange('cluster', event.target.value as PlayerCluster)}>
            {clusterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Consent</span>
          <select
            value={values.consentStatus}
            onChange={(event) => onFieldChange('consentStatus', event.target.value as ConsentStatus)}
          >
            {consentStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Returner / Rückkehrstatus</span>
          <select
            value={values.returnerStatus}
            onChange={(event) => onFieldChange('returnerStatus', event.target.value as ReturnerStatus)}
          >
            {returnerStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Foto-Erlaubnis</span>
          <select
            value={values.photoConsentStatus}
            onChange={(event) => onFieldChange('photoConsentStatus', event.target.value as PhotoConsentStatus)}
          >
            {photoConsentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="toggle-row">
        <input type="checkbox" checked={values.active} onChange={(event) => onFieldChange('active', event.target.checked)} />
        <span>Aktiv</span>
      </label>

      <label>
        <span>Coach-Notizen, keine Diagnosen</span>
        <textarea value={values.notes} rows={4} onChange={(event) => onFieldChange('notes', event.target.value)} />
      </label>

      <div className="form-actions">
        <button className="primary-action" type="submit" disabled={isSubmitting}>
          <Save className="nav-icon" aria-hidden />
          <span>{isSubmitting ? submittingLabel : submitLabel}</span>
        </button>
        {actionChildren}
      </div>

      {children}
      {formNotice ? <p className="form-notice">{formNotice}</p> : null}
      {photoLoadError ? <p className="form-error">Profilfoto konnte nicht geladen werden.</p> : null}
      {formError ? <p className="form-error">{formError}</p> : null}
    </form>
  )
}
