// Display helpers. Inputs accept plain numbers; output is euro for the eye.

const euro = new Intl.NumberFormat('nl-BE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatEuro(value) {
  const n = Number(value) || 0
  return euro.format(n)
}

// Compact euro for the comparison cards: €300K, €11K, €1.5K, or €500 below 1000.
export function formatEuroCompact(value) {
  const n = Math.round(Number(value) || 0)
  if (Math.abs(n) >= 1000) return `€${trimK(n / 1000)}K`
  return `€${n}`
}

// Signed delta in thousands, e.g. +50K, -12K, +0K (matches the requested card).
export function formatDeltaK(value) {
  const n = Math.round(Number(value) || 0)
  const sign = n < 0 ? '-' : '+'
  return `${sign}${trimK(Math.abs(n) / 1000)}K`
}

function trimK(k) {
  return Number.isInteger(k) ? String(k) : k.toFixed(1)
}

// Parse user input ("1.234,56", "1234.56", "€ 1 200") into a plain number.
// Tolerant of both comma and dot decimals so editing on a phone is forgiving.
export function parseAmount(raw) {
  if (raw == null) return 0
  let s = String(raw).trim()
  if (!s) return 0
  // Drop everything that is not a digit, separator or sign.
  s = s.replace(/[^0-9.,-]/g, '')
  const lastComma = s.lastIndexOf(',')
  const lastDot = s.lastIndexOf('.')
  // Whichever separator comes last is treated as the decimal separator.
  if (lastComma > lastDot) {
    s = s.replace(/\./g, '').replace(',', '.')
  } else {
    s = s.replace(/,/g, '')
  }
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : 0
}
