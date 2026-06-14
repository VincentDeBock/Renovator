import { formatEuro } from '../lib/format'

// The four project-total cards: the visual anchor of the screen.
// Budget is a project-level target (set on Settings); the other three are the
// live rollups of every included row.
export default function SummaryCards({ totals, budget }) {
  const cards = [
    { key: 'budget', label: 'Budget', value: budget },
    { key: 'raming', label: 'Raming', value: totals.raming },
    { key: 'offertes', label: 'Offertes', value: totals.offertes },
    { key: 'facturen', label: 'Facturen', value: totals.facturen },
  ]

  return (
    <section className="cards" aria-label="Projecttotalen">
      {cards.map(({ key, label, value }) => (
        <div key={key} className={`card card--${key}`}>
          <span className="card-label">{label}</span>
          <span className="card-value">{formatEuro(value)}</span>
        </div>
      ))}
    </section>
  )
}
