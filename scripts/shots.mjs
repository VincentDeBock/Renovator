// Screenshot every page (desktop + mobile) so the design can be reviewed against
// the real render. Logs in via the form, then shoots each route at two viewports
// into shots/. Run: `npm run shots` (needs scripts/.shots.env + a running server).
//
// Setup:
//   cp scripts/.shots.env.example scripts/.shots.env   # fill in app login
//   npx playwright install chromium                    # one-time
//   npm run dev        (or: npm run build && npm run preview)
//   npm run shots

import { chromium, webkit } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')

// Tiny .env reader (no dependency).
function loadEnv(path) {
  try {
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)
      if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '')
    }
  } catch {
    /* no env file — rely on real env */
  }
}
loadEnv(join(here, '.shots.env'))

const BASE = process.env.SHOTS_BASE_URL || 'http://localhost:5173'
const EMAIL = process.env.SHOTS_EMAIL
const PASSWORD = process.env.SHOTS_PASSWORD
if (!EMAIL || !PASSWORD) {
  console.error('Missing SHOTS_EMAIL / SHOTS_PASSWORD (see scripts/.shots.env.example).')
  process.exit(1)
}

const ROUTES = [
  ['overzicht', '/'],
  ['todo', '/todo'],
  ['communicatie', '/communicatie'],
  ['documenten', '/documenten'],
  ['instellingen', '/instellingen'],
]
const VIEWPORTS = [
  ['desktop', { width: 1280, height: 900 }],
  ['mobile', { width: 390, height: 844 }],
]

const outDir = join(root, 'shots')
mkdirSync(outDir, { recursive: true })

// Render in both Blink (Chromium) and WebKit (Safari). Native form controls —
// date inputs, selects — and many CSS edge cases render differently per engine,
// so a Chromium-only pass misses Safari-specific bugs (e.g. the date picker
// indicator spilling out of its box). WebKit is optional: if the binary isn't
// installed we warn and carry on rather than failing the whole run.
// One-time: `npx playwright install webkit`.
const ENGINES = [
  ['', chromium],
  ['safari-', webkit],
]

async function shoot(prefix, browser) {
  for (const [vpName, viewport] of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 })
    const page = await ctx.newPage()

    // Log in.
    await page.goto(BASE, { waitUntil: 'networkidle' })
    if (await page.locator('input[type="email"]').count()) {
      await page.fill('input[type="email"]', EMAIL)
      await page.fill('input[type="password"]', PASSWORD)
      await page.click('button[type="submit"]')
      await page.waitForSelector('.topnav', { timeout: 15000 })
    }

    for (const [name, route] of ROUTES) {
      await page.goto(BASE + route, { waitUntil: 'networkidle' })
      await page.waitForTimeout(600)
      const file = join(outDir, `${prefix}${name}-${vpName}.png`)
      await page.screenshot({ path: file, fullPage: true })
      console.log('shot', file)
    }

    // Item detail: open the first item from the Overzicht.
    await page.goto(BASE + '/', { waitUntil: 'networkidle' })
    const firstItem = page.locator('.item-link').first()
    if (await firstItem.count()) {
      await firstItem.click()
      await page.waitForTimeout(800)
      const file = join(outDir, `${prefix}item-detail-${vpName}.png`)
      await page.screenshot({ path: file, fullPage: true })
      console.log('shot', file)
    }

    await ctx.close()
  }
}

for (const [prefix, engine] of ENGINES) {
  let browser
  try {
    browser = await engine.launch()
  } catch (e) {
    console.warn(`\n⚠ Skipping ${engine.name()} — ${e.message.split('\n')[0]}`)
    console.warn(`  Install it once with: npx playwright install ${engine.name()}\n`)
    continue
  }
  try {
    await shoot(prefix, browser)
  } finally {
    await browser.close()
  }
}
console.log(`\nDone → ${outDir}`)
