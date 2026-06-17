import { formatEuro } from '../lib/format'

// Budget vs a total → { text, cls }. Under budget is good (green), over is red.
function budgetDelta(budget, total) {
  const d = (Number(budget) || 0) - (Number(total) || 0)
  if (d === 0) return { text: 'op budget', cls: 'even' }
  if (d > 0) return { text: `${formatEuro(d)} onder budget`, cls: 'under' }
  return { text: `${formatEuro(-d)} over budget`, cls: 'over' }
}

// Overzicht tiles: Budget (the target) + Offertes & Facturen with their gap vs it.
export default function SummaryCards({ totals, budget }) {
  const off = budgetDelta(budget, totals.offertes)
  const fac = budgetDelta(budget, totals.facturen)
  return (
    <section className="cards cards--3" aria-label="Projecttotalen">
      <div className="card card--budget">
        <span className="card-label">Budget</span>
        <span className="card-value">{formatEuro(budget)}</span>
      </div>
      <div className="card">
        <span className="card-label">Offertes</span>
        <span className="card-value">{formatEuro(totals.offertes)}</span>
        <span className={`card-delta card-delta--${off.cls}`}>{off.text}</span>
      </div>
      <div className="card">
        <span className="card-label">Facturen</span>
        <span className="card-value">{formatEuro(totals.facturen)}</span>
        <span className={`card-delta card-delta--${fac.cls}`}>{fac.text}</span>
      </div>
    </section>
  )
}
