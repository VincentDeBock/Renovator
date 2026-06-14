import { useState } from 'react'
import { formatEuro, parseAmount } from '../lib/format'

// Settings page. For now it holds a single field: the project-level budget target
// shown as the Budget summary card on the Overzicht.
export default function Settings({ project, onSaveBudget }) {
  const [value, setValue] = useState(String(project.budget ?? 0))
  const [status, setStatus] = useState('idle') // idle | saving | saved | error

  async function onSubmit(e) {
    e.preventDefault()
    if (status === 'saving') return
    setStatus('saving')
    try {
      await onSaveBudget(parseAmount(value))
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="settings">
      <header className="settings-header">
        <h1>Instellingen</h1>
        <p className="subtitle">Beheer het projectbudget</p>
      </header>

      <form className="settings-card" onSubmit={onSubmit}>
        <label className="field">
          <span className="field-label">Budget (totaal voor het project)</span>
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setStatus('idle')
            }}
          />
        </label>

        <p className="settings-hint">
          Dit bedrag verschijnt als de Budget-kaart bovenaan het overzicht.
          Huidig: {formatEuro(project.budget)}.
        </p>

        <div className="settings-actions">
          <button type="submit" className="btn-add-section" disabled={status === 'saving'}>
            {status === 'saving' ? 'Bezig…' : 'Opslaan'}
          </button>
          {status === 'saved' && <span className="settings-ok">Opgeslagen ✓</span>}
          {status === 'error' && (
            <span className="settings-err">Opslaan mislukt. Probeer opnieuw.</span>
          )}
        </div>
      </form>
    </div>
  )
}
