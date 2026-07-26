import { useEffect, useMemo, useState } from 'react'
import Icon from '../components/Icon'
import { getEmailSummaries } from '../lib/communicatie'
import { useLang } from '../i18n'

const TZ = 'Europe/Brussels'
const CATEGORY_KEY = {
  quote: 'cat.quote',
  invoice: 'cat.invoice',
  architect: 'cat.architect',
  other: 'cat.other',
}
const POINTS_SHOWN = 3

// --- Date helpers (all in the Brussels calendar) ---------------------------
const brussels = (iso) => new Date(new Date(iso).toLocaleString('en-US', { timeZone: TZ }))

const timeLabel = (iso, locale) =>
  new Date(iso).toLocaleTimeString(locale, { timeZone: TZ, hour: '2-digit', minute: '2-digit' })
const weekdayShort = (iso, locale) =>
  new Date(iso).toLocaleDateString(locale, { timeZone: TZ, weekday: 'short' }).replace('.', '')
const dayNum = (iso) => brussels(iso).getDate()
const monthShort = (iso, locale) =>
  new Date(iso).toLocaleDateString(locale, { timeZone: TZ, month: 'short' }).replace('.', '')

// Monday 00:00 of the week that contains `iso`, as a Brussels-local Date.
function weekStart(iso) {
  const d = brussels(iso)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function weekLabel(start, locale) {
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const sameMonth = start.getMonth() === end.getMonth()
  const m = (d) => d.toLocaleDateString(locale, { month: 'long' })
  const left = sameMonth ? `${start.getDate()}` : `${start.getDate()} ${m(start)}`
  return `${left} – ${end.getDate()} ${m(end)}`
}

function gmailLink(rfc822) {
  return `https://mail.google.com/mail/u/0/#search/rfc822msgid:${encodeURIComponent(rfc822 || '')}`
}

function MailRow({ s }) {
  const { t, locale } = useLang()
  const [open, setOpen] = useState(false)
  const points = Array.isArray(s.key_points) ? s.key_points : []
  const hasMore = points.length > POINTS_SHOWN
  const shown = open ? points : points.slice(0, POINTS_SHOWN)

  return (
    <article className={`cw-row ${s.action_needed ? 'cw-row--action' : ''}`}>
      <div className="cw-date" aria-hidden="true">
        <span className="cw-date-wd">{weekdayShort(s.received_at, locale)}</span>
        <span className="cw-date-d">{dayNum(s.received_at)}</span>
        <span className="cw-date-m">{monthShort(s.received_at, locale)}</span>
      </div>

      <div className="cw-main">
        <div className="cw-meta">
          <span className="cw-sender">{s.sender || t('cw.unknownSender')}</span>
          <span className="cw-time">{timeLabel(s.received_at, locale)}</span>
          {s.action_needed && <span className="cw-flag">{t('cw.actionNeeded')}</span>}
          <span className={`cat-badge cat-badge--${s.category}`}>{t(CATEGORY_KEY[s.category] || 'cat.other')}</span>
        </div>

        <h3 className="cw-subject">{s.subject || t('cw.noSubject')}</h3>

        {points.length > 0 ? (
          <>
            <ul className="cw-points">
              {shown.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
            {hasMore && (
              <button type="button" className="cw-more" onClick={() => setOpen((v) => !v)}>
                {open ? t('cw.showLess') : t('cw.showMore', { n: points.length - POINTS_SHOWN })}
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
              {t('cw.openGmail')}
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

export default function Communicatie() {
  const { t, locale } = useLang()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [weekIndex, setWeekIndex] = useState(0)

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

  // Open on the current week when it exists, otherwise the newest (index 0).
  useEffect(() => {
    if (!weeks.length) return
    const i = weeks.findIndex((w) => ymd(w.start) === thisWeekKey)
    setWeekIndex(i >= 0 ? i : 0)
  }, [weeks, thisWeekKey])

  // weekIndex 0 = newest. Left arrow → older (index+1), right arrow → newer (index-1).
  const atNewest = weekIndex <= 0
  const atOldest = weekIndex >= weeks.length - 1
  const goOlder = () => setWeekIndex((i) => Math.min(i + 1, weeks.length - 1))
  const goNewer = () => setWeekIndex((i) => Math.max(i - 1, 0))

  // Arrow keys jump between weeks.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return
      if (e.key === 'ArrowLeft') goOlder()
      else if (e.key === 'ArrowRight') goNewer()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [weeks.length])

  const current = weeks[weekIndex]

  return (
    <div className="page">
      <header className="page-header">
        <h1>{t('cw.title')}</h1>
        <p className="subtitle">{t('cw.sub')}</p>
      </header>

      {error && (
        <div className="banner banner--error" role="alert">
          {error}
          <button className="banner-close" onClick={() => setError(null)}>✕</button>
        </div>
      )}
      {loading && <div className="empty">{t('common.loading')}</div>}

      {!loading && !error && (
        <>
          {weeks.length === 0 && <div className="empty">{t('cw.empty')}</div>}

          {current && (() => {
            const isThisWeek = ymd(current.start) === thisWeekKey
            const actions = current.items.filter((i) => i.action_needed).length
            return (
              <section className="cw-week">
                <div className="cw-nav">
                  <button
                    type="button"
                    className="cw-nav-btn"
                    onClick={goOlder}
                    disabled={atOldest}
                    aria-label={t('cw.prevWeek')}
                    title={t('cw.prevWeek')}
                  >
                    <Icon name="back" size={18} />
                  </button>

                  <div className="cw-nav-center">
                    <h2 className="cw-week-title">
                      {isThisWeek ? t('cw.thisWeek') : t('cw.weekOf')}{' '}
                      <span className="cw-week-range">{weekLabel(current.start, locale)}</span>
                    </h2>
                    <div className="cw-week-meta">
                      <span>{t(current.items.length === 1 ? 'cw.messageOne' : 'cw.messageMany', { n: current.items.length })}</span>
                      {actions > 0 && <span className="cw-week-actions">{t('cw.actionsCount', { n: actions })}</span>}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="cw-nav-btn"
                    onClick={goNewer}
                    disabled={atNewest}
                    aria-label={t('cw.nextWeek')}
                    title={t('cw.nextWeek')}
                  >
                    <Icon name="forward" size={18} />
                  </button>
                </div>

                <div className="cw-weekpick">
                  <label>
                    {t('cw.jumpToWeek')}{' '}
                    <select value={weekIndex} onChange={(e) => setWeekIndex(Number(e.target.value))}>
                      {weeks.map((w, i) => (
                        <option key={ymd(w.start)} value={i}>
                          {ymd(w.start) === thisWeekKey ? t('cw.thisWeek') : weekLabel(w.start, locale)} ({w.items.length})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="cw-list">
                  {current.items.map((s) => (
                    <MailRow key={s.id} s={s} />
                  ))}
                </div>
              </section>
            )
          })()}
        </>
      )}
    </div>
  )
}
