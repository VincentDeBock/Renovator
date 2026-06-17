import { formatEuro } from '../lib/format'

// Budget vs a total → { text, cls }. Under budget is good (green), over is red.
function budgetDelta(budget, total) {
  const d = (Number(budget) || 0) - (Number(total) || 0)
  if (d === 0) return { text: 'op budget', cls: 'even' }
  if (d > 0) return { text: `${formatEuro(d)} onder budget`, cls: 'under' }
  return { text: `${formatEuro(-d)} over budget`, cls: 'over' }
}

function Tile({ label, value, budget }) {
  const delta = budgetDelta(budget, value)
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
  return (
    <section className="cards cards--3" aria-label="Projecttotalen">
      <div className="card card--budget">
        <span className="card-label">Budget</span>
        <span className="card-value">{formatEuro(budget)}</span>
      </div>
      <Tile label="Offertes" value={totals.offertes} budget={budget} />
      <Tile label="Facturen" value={totals.facturen} budget={budget} />
    </section>
  )
}
