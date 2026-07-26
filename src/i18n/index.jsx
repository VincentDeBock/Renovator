import { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { translations } from './translations'

// Language layer. The language is deep-linkable via a `?lang=en` URL parameter:
// visiting any route with `?lang=en` opens the English version. The choice is
// persisted in localStorage; toggling updates the URL so the address bar is
// always a shareable link to the current language. Dutch is the default and
// carries no parameter (toggling back to NL removes it).

const STORAGE_KEY = 'renovator.lang'
const LANGS = ['nl', 'en']

const LangContext = createContext(null)

function readParam(search) {
  const p = new URLSearchParams(search).get('lang')
  return LANGS.includes(p) ? p : null
}

function initialLang() {
  const fromUrl = readParam(window.location.search)
  if (fromUrl) return fromUrl
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (LANGS.includes(stored)) return stored
  } catch {
    /* storage unavailable */
  }
  return 'nl'
}

export function LanguageProvider({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [lang, setLangState] = useState(initialLang)

  // A lang param appearing in the URL (deep link, back/forward) wins.
  useEffect(() => {
    const fromUrl = readParam(location.search)
    if (fromUrl && fromUrl !== lang) setLangState(fromUrl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search])

  // Keep <html lang>, localStorage and the URL in sync with the active language.
  useEffect(() => {
    document.documentElement.lang = lang
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      /* storage unavailable */
    }
    const params = new URLSearchParams(location.search)
    const inUrl = params.get('lang')
    const wanted = lang === 'nl' ? null : lang // NL is the default → no param
    if (inUrl === wanted || (inUrl === null && wanted === null)) return
    if (wanted) params.set('lang', wanted)
    else params.delete('lang')
    const search = params.toString()
    navigate(
      { pathname: location.pathname, search: search ? `?${search}` : '', hash: location.hash },
      { replace: true },
    )
  }, [lang, location.pathname, location.search, location.hash, navigate])

  const setLang = useCallback((next) => {
    if (LANGS.includes(next)) setLangState(next)
  }, [])

  const t = useCallback(
    (key, vars) => {
      let s = translations[lang]?.[key] ?? translations.nl[key] ?? key
      if (vars) {
        for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
      }
      return s
    },
    [lang],
  )

  const locale = lang === 'nl' ? 'nl-BE' : 'en-GB'

  return <LangContext.Provider value={{ lang, setLang, t, locale }}>{children}</LangContext.Provider>
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within a LanguageProvider')
  return ctx
}

// Small NL | EN pill toggle, reusable in the app nav, landing nav and login.
export function LangToggle({ className = '' }) {
  const { lang, setLang } = useLang()
  return (
    <div className={`lang-toggle ${className}`} role="group" aria-label="Taal / Language">
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          className={`lang-toggle-btn ${lang === l ? 'lang-toggle-btn--active' : ''}`}
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
