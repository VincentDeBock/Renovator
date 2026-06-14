import { useEffect, useRef, useState } from 'react'
import { formatEuro, parseAmount } from '../lib/format'

// Click-to-edit value. Renders as text until clicked, then an input that saves
// on blur or Enter and cancels on Escape. `kind` is 'text' or 'amount'.
export default function EditableCell({
  value,
  onSave,
  kind = 'text',
  placeholder = '',
  ariaLabel,
  className = '',
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  function startEditing() {
    setDraft(kind === 'amount' ? String(value ?? '') : String(value ?? ''))
    setEditing(true)
  }

  function commit() {
    setEditing(false)
    if (kind === 'amount') {
      const next = parseAmount(draft)
      if (next !== (Number(value) || 0)) onSave(next)
    } else {
      const next = draft.trim()
      if (next !== String(value ?? '')) onSave(next)
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className={`cell-input cell-input--${kind} ${className}`}
        inputMode={kind === 'amount' ? 'decimal' : 'text'}
        value={draft}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
      />
    )
  }

  const display =
    kind === 'amount'
      ? formatEuro(value)
      : String(value ?? '').trim() || placeholder

  const isPlaceholder = kind !== 'amount' && !String(value ?? '').trim()

  return (
    <button
      type="button"
      className={`cell-display cell-display--${kind} ${
        isPlaceholder ? 'cell-display--empty' : ''
      } ${className}`}
      aria-label={ariaLabel}
      onClick={startEditing}
    >
      {display}
    </button>
  )
}
