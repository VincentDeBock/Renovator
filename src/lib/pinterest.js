// Pinterest board embed helpers. The official widget script (pinit.js) turns any
// <a data-pin-do="embedBoard" href="…board…"> into an iframe grid of the board's pins.
// Only PUBLIC boards render; private/invalid ones show nothing, so callers always keep
// a plain "open on Pinterest" fallback link.

const SCRIPT_SRC = 'https://assets.pinterest.com/js/pinit.js'
let loadPromise = null

// Inject pinit.js once and resolve when window.PinUtils is ready. Idempotent.
export function loadPinterestWidget() {
  if (typeof window === 'undefined') return Promise.resolve(false)
  if (window.PinUtils) return Promise.resolve(true)
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve) => {
    const ready = (ok) => resolve(ok)
    // PinUtils may appear a tick after onload; poll briefly.
    const waitForPinUtils = (tries = 20) => {
      if (window.PinUtils) return ready(true)
      if (tries <= 0) return ready(false)
      setTimeout(() => waitForPinUtils(tries - 1), 150)
    }
    let script = document.querySelector(`script[src="${SCRIPT_SRC}"]`)
    if (!script) {
      script = document.createElement('script')
      script.src = SCRIPT_SRC
      script.async = true
      script.defer = true
      script.onload = () => waitForPinUtils()
      script.onerror = () => ready(false)
      document.body.appendChild(script)
    } else {
      waitForPinUtils()
    }
  })
  return loadPromise
}

// Render any not-yet-built [data-pin-do] anchors into iframes.
export function buildPins() {
  if (typeof window !== 'undefined' && window.PinUtils && typeof window.PinUtils.build === 'function') {
    window.PinUtils.build()
    return true
  }
  return false
}

const RESERVED = new Set(['pin', 'search', 'ideas', 'today', 'categories', 'settings', 'business'])

// Validate + normalize a Pinterest BOARD url. Returns { ok, href } or
// { ok:false, reason } where `reason` is a translation key (see src/i18n),
// translated at render time so it follows the active language.
export function parseBoardUrl(raw) {
  const input = String(raw || '').trim()
  if (!input) return { ok: false, reason: 'pin.err.empty' }
  let url
  try {
    url = new URL(input)
  } catch {
    return { ok: false, reason: 'pin.err.invalidUrl' }
  }
  const host = url.hostname.toLowerCase()
  if (host === 'pin.it') {
    return { ok: false, reason: 'pin.err.shortlink' }
  }
  if (!/(^|\.)pinterest\.[a-z.]+$/.test(host)) {
    return { ok: false, reason: 'pin.err.notPinterest' }
  }
  const segments = url.pathname.split('/').filter(Boolean)
  if (segments.length < 2) {
    return { ok: false, reason: 'pin.err.profile' }
  }
  const [user, board] = segments
  if (RESERVED.has(user.toLowerCase()) || user.startsWith('_') || board.startsWith('_')) {
    return { ok: false, reason: 'pin.err.notBoard' }
  }
  // Normalize to a clean board href (drop section/query/hash), keep the original domain.
  const href = `${url.protocol}//${host}/${user}/${board}/`
  return { ok: true, href }
}
