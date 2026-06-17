import { useEffect, useMemo, useState } from 'react'
import Icon from '../components/Icon'
import { getEmailSummaries } from '../lib/communicatie'

const TZ = 'Europe/Brussels'
const CATEGORY = {
  quote: 'Offerte',
  invoice: 'Factuur',
  architect: 'Architect',
  other: 'Overig',
}

const dayKey = (iso) => new Date(iso).toLocaleDateString('nl-BE', { timeZone: TZ })
const dayLabel = (iso) =>
  new Date(iso).toLocaleDateString('nl-BE', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' })
const timeLabel = (iso) =>
  new Date(iso).toLocaleTimeString('nl-BE', { timeZone: TZ, hour: '2-digit', minute: '2-digit' })

function gmailLink(rfc822) {
  return `https://mail.google.com/mail/u/0/#search/rfc822msgid:${encodeURIComponent(rfc822 || '')}`
}

function Card({ s }) {
  return (
    <article className={`comm-card ${s.action_needed ? 'comm-card--action' : ''}`}>
      <div className="comm-card-top">
        <div className="comm-meta">
          <span className="comm-sender">{s.sender || 'Onbekende afzender'}</span>
          <span className="comm-time">{timeLabel(s.received_at)}</span>
        </div>
        <span className={`cat-badge cat-badge--${s.category}`}>{CATEGORY[s.category] || 'Overig'}</span>
      </div>

      <h3 className="comm-subject">{s.subject || '(geen onderwerp)'}</h3>
      {s.action_needed && <span className="comm-action">Actie nodig</span>}

      {s.summary_text && <p className="comm-summary">{s.summary_text}</p>}

      {Array.isArray(s.key_points) && s.key_points.length > 0 && (
        <ul className="comm-points">
          {s.key_points.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      )}

      <div className="comm-card-foot">
        {Array.isArray(s.attachment_names) && s.attachment_names.length > 0 && (
          <span className="comm-attach">
            <Icon name="file" size={14} /> {s.attachment_names.join(', ')}
          </span>
        )}
        {s.rfc822_message_id && (
          <a className="comm-link" href={gmailLink(s.rfc822_message_id)} target="_blank" rel="noreferrer">
            Open in Gmail →
          </a>
        )}
      </div>
    </article>
  )
}

export default function Communicatie() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let c = false
    getEmailSummaries()
      .then((d) => !c && setRows(d))
      .catch((e) => !c && setError(e.message))
      .finally(() => !c && setLoading(false))
    return () => {
      c = true
    }
  }, [])

  // Group by Brussels calendar day, preserving the newest-first order.
  const groups = useMemo(() => {
    const map = new Map()
    for (const s of rows) {
      const k = dayKey(s.received_at)
      if (!map.has(k)) map.set(k, [])
      map.get(k).push(s)
    }
    return [...map.entries()]
  }, [rows])

  const todayKey = new Date().toLocaleDateString('nl-BE', { timeZone: TZ })
  const hasToday = groups.length > 0 && groups[0][0] === todayKey

  return (
    <div className="page">
      <header className="page-header">
        <h1>Communicatie</h1>
        <p className="subtitle">Dagelijkse samenvatting van je Verbouwing-mailbox</p>
      </header>

      {error && (
        <div className="banner banner--error" role="alert">
          {error}
          <button className="banner-close" onClick={() => setError(null)}>✕</button>
        </div>
      )}
      {loading && <div className="empty">Laden…</div>}

      {!loading && !error && (
        <>
          {!hasToday && (
            <div className="panel comm-empty-today">Vandaag nog niets nieuws uit je Verbouwing-mailbox.</div>
          )}

          {rows.length === 0 && (
            <div className="empty">Nog geen communicatie samengevat.</div>
          )}

          {groups.map(([key, items]) => (
            <section key={key} className="comm-day">
              <h2 className="comm-day-label">{key === todayKey ? 'Vandaag' : dayLabel(items[0].received_at)}</h2>
              <div className="comm-list">
                {items.map((s) => (
                  <Card key={s.id} s={s} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  )
}
