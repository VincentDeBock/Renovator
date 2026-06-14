import { versionTotals } from '../lib/totals'
import { formatEuroCompact, formatDeltaK } from '../lib/format'

// At-a-glance comparison across versions: each version's Offertes total and how
// it sits against the shared budget. Keeps the original comparison goal alive even
// though the table itself shows one version at a time.
export default function VersionCompare({ versions, sections, budget }) {
  if (versions.length < 2) return null

  return (
    <section className="vcompare" aria-label="Versies vergelijken">
      <h2 className="vcompare-title">Versies vergelijken — Offertes vs budget</h2>
      <div className="vcompare-rows">
        {versions.map((v) => {
          const totals = versionTotals(sections, v.id)
          const delta = totals.offertes - (Number(budget) || 0)
          const state = delta > 0 ? 'over' : delta < 0 ? 'under' : 'even'
          return (
            <div key={v.id} className="vcompare-row">
              <span className="vcompare-badge" style={{ background: v.color || '#94a3b8' }}>
                {v.name}
              </span>
              <span className="vcompare-amount">{formatEuroCompact(totals.offertes)}</span>
              <span className={`vcompare-delta vcompare-delta--${state}`}>
                {formatDeltaK(delta)} vs budget
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
