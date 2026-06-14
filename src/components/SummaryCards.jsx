import { formatEuro } from '../lib/format'

// The four project-total cards: the visual anchor of the screen.
// Order matches the wireframe emphasis: Budget, Raming, Offertes, Facturen.
const CARDS = [
  { key: 'budget', label: 'Budget' },
  { key: 'raming', label: 'Raming' },
  { key: 'offertes', label: 'Offertes' },
  { key: 'facturen', label: 'Facturen' },
]

export default function SummaryCards({ totals }) {
  return (
    <section className="cards" aria-label="Projecttotalen">
      {CARDS.map(({ key, label }) => (
        <div key={key} className={`card card--${key}`}>
          <span className="card-label">{label}</span>
          <span className="card-value">{formatEuro(totals[key])}</span>
        </div>
      ))}
    </section>
  )
}
