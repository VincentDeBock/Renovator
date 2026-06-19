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
const POINTS_SHOWN = 3

// --- Date helpers (all in the Brussels calendar) ---------------------------
const brussels = (iso) => new Date(new Date(iso).toLocaleString('en-US', { timeZone: TZ }))

const timeLabel = (iso) =>
  new Date(iso).toLocaleTimeString('nl-BE', { timeZone: TZ, hour: '2-digit', minute: '2-digit' })
const weekdayShort = (iso) =>
  new Date(iso).toLocaleDateString('nl-BE', { timeZone: TZ, weekday: 'short' }).replace('.', '')
const dayNum = (iso) => brussels(iso).getDate()
const monthShort = (iso) =>
  new Date(iso).toLocaleDateString('nl-BE', { timeZone: TZ, month: 'short' }).replace('.', '')

// Monday 00:00 of the week that contains `iso`, as a Brussels-local Date.
function weekStart(iso) {
  const d = brussels(iso)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function weekLabel(start) {
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const sameMonth = start.getMonth() === end.getMonth()
  const m = (d) => d.toLocaleDateString('nl-BE', { month: 'long' })
  const left = sameMonth ? `${start.getDate()}` : `${start.getDate()} ${m(start)}`
  return `${left} – ${end.getDate()} ${m(end)}`
}

function gmailLink(rfc822) {
  return `https://mail.google.com/mail/u/0/#search/rfc822msgid:${encodeURIComponent(rfc822 || '')}`
}

function MailRow({ s }) {
  const [open, setOpen] = useState(false)
  const points = Array.isArray(s.key_points) ? s.key_points : []
  const hasMore = points.length > POINTS_SHOWN
  const shown = open ? points : points.slice(0, POINTS_SHOWN)

  return (
    <article className={`cw-row ${s.action_needed ? 'cw-row--action' : ''}`}>
      <div className="cw-date" aria-hidden="true">
        <span className="cw-date-wd">{weekdayShort(s.received_at)}</span>
        <span className="cw-date-d">{dayNum(s.received_at)}</span>
        <span className="cw-date-m">{monthShort(s.received_at)}</span>
      </div>

      <div className="cw-main">
        <div className="cw-meta">
          <span className="cw-sender">{s.sender || 'Onbekende afzender'}</span>
          <span className="cw-time">{timeLabel(s.received_at)}</span>
          {s.action_needed && <span className="cw-flag">Actie nodig</span>}
          <span className={`cat-badge cat-badge--${s.category}`}>{CATEGORY[s.category] || 'Overig'}</span>
        </div>

        <h3 className="cw-subject">{s.subject || '(geen onderwerp)'}</h3>

        {points.length > 0 ? (
          <>
            <ul className="cw-points">
              {shown.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
            {hasMore && (
              <button type="button" className="cw-more" onClick={() => setOpen((v) => !v)}>
                {open ? 'Toon minder' : `+${points.length - POINTS_SHOWN} meer`}
              </button>
            )}
          </>
        ) : (
          s.summary_text && <p className="cw-summary">{s.summary_text}</p>
        )}

        <div className="cw-foot">
          {Array.isArray(s.attachment_names) && s.attachment_names.length > 0 && (
            <span className="cw-attach">
              <Icon name="file" size={13} /> {s.attachment_names.join(', ')}
            </span>
          )}
          {s.rfc822_message_id && (
            <a className="cw-link" href={gmailLink(s.rfc822_message_id)} target="_blank" rel="noreferrer">
              Open in Gmail →
            </a>
          )}
        </div>
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

  // Group by week (Monday-start), newest week first, newest message first.
  const weeks = useMemo(() => {
    const map = new Map()
    for (const s of rows) {
      const start = weekStart(s.received_at)
      const k = ymd(start)
      if (!map.has(k)) map.set(k, { start, items: [] })
      map.get(k).items.push(s)
    }
    return [...map.values()].sort((a, b) => (a.start < b.start ? 1 : -1))
  }, [rows])

  const thisWeekKey = ymd(weekStart(new Date().toISOString()))

  return (
    <div className="page">
      <header className="page-header">
        <h1>Communicatie</h1>
        <p className="subtitle">Wekelijks overzicht van je Verbouwing-mailbox</p>
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
          {rows.length === 0 && <div className="empty">Nog geen communicatie samengevat.</div>}

          {weeks.map(({ start, items }) => {
            const isThisWeek = ymd(start) === thisWeekKey
            const actions = items.filter((i) => i.action_needed).length
            return (
              <section key={ymd(start)} className="cw-week">
                <div className="cw-week-head">
                  <h2 className="cw-week-title">
                    {isThisWeek ? 'Deze week' : 'Week van'}{' '}
                    <span className="cw-week-range">{weekLabel(start)}</span>
                  </h2>
                  <div className="cw-week-meta">
                    <span>{items.length} {items.length === 1 ? 'bericht' : 'berichten'}</span>
                    {actions > 0 && <span className="cw-week-actions">{actions}× actie nodig</span>}
                  </div>
                </div>

                <div className="cw-list">
                  {items.map((s) => (
                    <MailRow key={s.id} s={s} />
                  ))}
                </div>
              </section>
            )
          })}
        </>
      )}
    </div>
  )
}
