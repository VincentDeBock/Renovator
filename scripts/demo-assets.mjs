// Demo asset generator. Renders fictional Belgian quotes (offertes) and invoices
// (facturen) as PDFs, and inspiration "moodboard" images as PNGs, all from HTML via
// Playwright (already a dev dependency) — no external downloads. Used by
// scripts/seed-demo.mjs to populate the demo project's Storage bucket.

import { chromium } from 'playwright'

const euro = (n) =>
  new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(n)
const dateNL = (d) => new Intl.DateTimeFormat('nl-BE', { day: '2-digit', month: 'long', year: 'numeric' }).format(d)

// Shared brand palette (mirrors the app's warm identity, no hardcoded reuse needed here).
const INK = '#1d1f3a'
const ACCENT = '#ff7a1a'
const MUTED = '#6b6f86'
const LINE = '#e7e3da'

function docHtml({ kind, number, vendor, vendorSub, client, date, validOrDue, lines, vatRate = 0.21 }) {
  const subtotal = lines.reduce((s, l) => s + l.qty * l.unit, 0)
  const vat = subtotal * vatRate
  const total = subtotal + vat
  const isQuote = kind === 'offerte'
  const rows = lines
    .map(
      (l) => `<tr>
        <td>${l.desc}</td>
        <td class="num">${l.qty}</td>
        <td class="num">${euro(l.unit)}</td>
        <td class="num">${euro(l.qty * l.unit)}</td>
      </tr>`,
    )
    .join('')
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; color: ${INK}; margin: 0; padding: 48px 52px; font-size: 13px; }
    .top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid ${ACCENT}; padding-bottom: 18px; }
    .brand { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
    .brand small { display: block; font-size: 11px; font-weight: 500; color: ${MUTED}; letter-spacing: 0; margin-top: 3px; }
    .doctype { text-align: right; }
    .doctype h1 { margin: 0; font-size: 26px; text-transform: uppercase; letter-spacing: 0.04em; color: ${ACCENT}; }
    .doctype .meta { font-size: 12px; color: ${MUTED}; margin-top: 6px; line-height: 1.6; }
    .parties { display: flex; justify-content: space-between; margin: 26px 0 18px; font-size: 12px; line-height: 1.6; }
    .parties .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: ${MUTED}; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: ${MUTED}; border-bottom: 1px solid ${LINE}; padding: 8px 6px; }
    td { padding: 10px 6px; border-bottom: 1px solid ${LINE}; }
    td.num, th.num { text-align: right; }
    .totals { margin-top: 18px; margin-left: auto; width: 260px; font-size: 13px; }
    .totals .row { display: flex; justify-content: space-between; padding: 6px 0; }
    .totals .grand { border-top: 2px solid ${INK}; margin-top: 6px; padding-top: 10px; font-weight: 800; font-size: 16px; }
    .foot { margin-top: 36px; font-size: 11px; color: ${MUTED}; line-height: 1.6; border-top: 1px solid ${LINE}; padding-top: 14px; }
    .badge { display: inline-block; background: #fff3e8; color: ${ACCENT}; font-weight: 700; padding: 4px 10px; border-radius: 999px; font-size: 11px; }
  </style></head><body>
    <div class="top">
      <div>
        <div class="brand">${vendor}<small>${vendorSub}</small></div>
      </div>
      <div class="doctype">
        <h1>${kind}</h1>
        <div class="meta">Nr. ${number}<br>${dateNL(date)}<br>${isQuote ? 'Geldig tot' : 'Vervaldag'}: ${dateNL(validOrDue)}</div>
      </div>
    </div>
    <div class="parties">
      <div>
        <div class="label">${isQuote ? 'Opgemaakt voor' : 'Gefactureerd aan'}</div>
        ${client}
      </div>
      <div style="text-align:right">
        <div class="label">Betreft</div>
        Verbouwing woning<br>Demostraat 12, 9000 Gent
      </div>
    </div>
    <table>
      <thead><tr><th>Omschrijving</th><th class="num">Aantal</th><th class="num">Eenheidsprijs</th><th class="num">Totaal</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="totals">
      <div class="row"><span>Subtotaal</span><span>${euro(subtotal)}</span></div>
      <div class="row"><span>BTW (${Math.round(vatRate * 100)}%)</span><span>${euro(vat)}</span></div>
      <div class="row grand"><span>Totaal</span><span>${euro(total)}</span></div>
    </div>
    <div class="foot">
      ${isQuote
        ? '<span class="badge">Vrijblijvende offerte</span> &nbsp; Prijzen geldig 30 dagen. Uitvoeringstermijn in onderling overleg.'
        : '<span class="badge">Te betalen</span> &nbsp; Gelieve te betalen binnen 14 dagen op BE00 0000 0000 0000 met vermelding van het factuurnummer.'}
      <br>BTW BE 0123.456.789 · ${vendor} · Demoweg 1, 9000 Gent · (fictief demodocument)
    </div>
  </body></html>`
}

// A stylized abstract "interior swatch" — no external imagery, clearly a demo mood card.
function moodHtml({ label, c1, c2, accent }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body { margin: 0; }
    .card { width: 1024px; height: 768px; position: relative; overflow: hidden;
      background: linear-gradient(135deg, ${c1}, ${c2}); font-family: -apple-system, Arial, sans-serif; }
    .blob { position: absolute; border-radius: 40% 60% 55% 45%; opacity: 0.5; }
    .b1 { width: 520px; height: 520px; background: ${accent}; top: -120px; right: -120px; }
    .b2 { width: 380px; height: 380px; background: #ffffff; bottom: -140px; left: -80px; opacity: 0.18; }
    .bar { position: absolute; left: 64px; bottom: 64px; right: 64px; }
    .tag { display: inline-block; background: rgba(0,0,0,0.35); color: #fff; backdrop-filter: blur(4px);
      padding: 8px 16px; border-radius: 999px; font-size: 20px; font-weight: 600; letter-spacing: 0.02em; }
    .title { color: #fff; font-size: 56px; font-weight: 800; margin-top: 16px; letter-spacing: -0.02em;
      text-shadow: 0 2px 18px rgba(0,0,0,0.25); }
    .sub { color: rgba(255,255,255,0.85); font-size: 22px; margin-top: 8px; }
  </style></head><body>
    <div class="card">
      <div class="blob b1"></div><div class="blob b2"></div>
      <div class="bar">
        <span class="tag">Inspiratie</span>
        <div class="title">${label}</div>
        <div class="sub">Moodboard · demo</div>
      </div>
    </div>
  </body></html>`
}

export async function withGenerator(fn) {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const api = {
    async pdf(spec) {
      await page.setContent(docHtml(spec), { waitUntil: 'networkidle' })
      return await page.pdf({ format: 'A4', printBackground: true, margin: { top: '0', bottom: '0', left: '0', right: '0' } })
    },
    async image(spec) {
      await page.setViewportSize({ width: 1024, height: 768 })
      await page.setContent(moodHtml(spec), { waitUntil: 'networkidle' })
      return await page.screenshot({ type: 'jpeg', quality: 82, clip: { x: 0, y: 0, width: 1024, height: 768 } })
    },
  }
  try {
    return await fn(api)
  } finally {
    await browser.close()
  }
}
