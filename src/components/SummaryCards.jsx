import { formatEuro } from '../lib/format'
import { useLang } from '../i18n'

// Budget vs a total → { text, cls }. Under budget is good (green), over is red.
function budgetDelta(budget, total, t) {
  const d = (Number(budget) || 0) - (Number(total) || 0)
  if (d === 0) return { text: t('cards.onBudget'), cls: 'even' }
  if (d > 0) return { text: t('cards.underBudget', { amount: formatEuro(d) }), cls: 'under' }
  return { text: t('cards.overBudget', { amount: formatEuro(-d) }), cls: 'over' }
}

function Tile({ label, value, budget, t }) {
  const delta = budgetDelta(budget, value, t)
  const pct = budget > 0 ? Math.min((value / budget) * 100, 100) : 0
  return (
    <div className="card">
      <span className="card-label">{label}</span>
      <span className="card-value">{formatEuro(value)}</span>
      <div className={`card-bar card-bar--${delta.cls}`}>
        <div className="card-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className={`card-delta card-delta--${delta.cls}`}>{delta.text}</span>
    </div>
  )
}

// Overzicht tiles: Budget (the target) + Offertes & Facturen with their gap vs it.
export default function SummaryCards({ totals, budget }) {
  const { t } = useLang()
  return (
    <section className="cards cards--3" aria-label={t('cards.aria')}>
      <div className="card card--budget">
        <span className="card-label">{t('cards.budget')}</span>
        <span className="card-value">{formatEuro(budget)}</span>
      </div>
      <Tile label={t('cards.quotes')} value={totals.offertes} budget={budget} t={t} />
      <Tile label={t('cards.invoices')} value={totals.facturen} budget={budget} t={t} />
    </section>
  )
}
