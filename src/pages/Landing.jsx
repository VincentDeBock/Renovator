import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import {
  RenotrackMark,
  RenotrackWordmark,
  Blob,
  Squiggle,
  HouseChar,
  MailChar,
  CoinChar,
  ClipboardChar,
  Wave,
} from '../components/landing/Illustrations'
import '../styles/landing.css'

/* ----------------------------------------------------------------------------
 * On-brand mock product panels — fictional demo data only (no real mailbox or
 * amounts), so nothing leaks on a public page.
 * -------------------------------------------------------------------------- */

function BrowserFrame({ children, label = 'renotrack.app' }) {
  return (
    <div className="lp-frame" aria-hidden="true">
      <div className="lp-frame-bar">
        <span className="lp-dot" /><span className="lp-dot" /><span className="lp-dot" />
        <span className="lp-frame-url">{label}</span>
      </div>
      <div className="lp-frame-body">{children}</div>
    </div>
  )
}

function MockBudget() {
  const items = [
    ['Ruwbouw', '€ 142.000', true],
    ['Keuken', '€ 24.500', true],
    ['Badkamers', '€ 18.900', true],
    ['Zonnepanelen', '€ 9.200', false],
  ]
  return (
    <div className="lp-mock">
      <div className="lp-mock-head"><span>Post</span><span>Offerte</span><span>Meetellen</span></div>
      <div className="lp-mock-section"><span>AFWERKING</span><span className="lp-mock-amount">€ 194.600</span><span /></div>
      {items.map(([name, amount, on]) => (
        <div key={name} className={`lp-mock-row ${on ? '' : 'lp-mock-row--off'}`}>
          <span className="lp-mock-name">{name}</span>
          <span className="lp-mock-amount">{amount}</span>
          <span className={`lp-check ${on ? 'lp-check--on' : ''}`}>{on && <Icon name="check" size={13} strokeWidth={3} />}</span>
        </div>
      ))}
      <div className="lp-mock-total"><span>Totaal</span><span className="lp-mock-amount">€ 185.400</span><span className="lp-pill lp-pill--ok">binnen budget</span></div>
    </div>
  )
}

function MockComm() {
  const mails = [
    ['di', '17', 'Aannemer Janssens', 'Offerte ruwbouw — fase 2', 'Bedrag: € 142.000 · geldig tot 30/06', true],
    ['ma', '16', 'Keukenstudio Lux', 'Bevestiging plaatsingsdatum', 'Plaatsing week 28 · voorschot betaald', false],
  ]
  return (
    <div className="lp-mock lp-mock--comm">
      <div className="lp-comm-week">Deze week · 4 berichten</div>
      {mails.map(([wd, d, sender, subject, point, action]) => (
        <div key={subject} className={`lp-comm-row ${action ? 'lp-comm-row--action' : ''}`}>
          <div className="lp-comm-date"><span>{wd}</span><strong>{d}</strong></div>
          <div className="lp-comm-main">
            <div className="lp-comm-meta"><span className="lp-comm-sender">{sender}</span>{action && <span className="lp-flag">Actie nodig</span>}</div>
            <div className="lp-comm-subject">{subject}</div>
            <div className="lp-comm-point">• {point}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function MockTasks() {
  const tasks = [
    ['Vloertegels kiezen', 'Karo', 'High', false],
    ['Offerte zonnepanelen vergelijken', 'Vincent', 'Medium', false],
    ['Voorschot keuken betalen', 'Vincent', 'Low', true],
  ]
  const prio = { High: 'high', Medium: 'medium', Low: 'low' }
  return (
    <div className="lp-mock">
      {tasks.map(([title, owner, p, done]) => (
        <div key={title} className="lp-task-row">
          <span className={`lp-check ${done ? 'lp-check--done' : ''}`}>{done && <Icon name="check" size={13} strokeWidth={3} />}</span>
          <span className={`lp-task-title ${done ? 'lp-task-title--done' : ''}`}>{title}</span>
          <span className="lp-owner">{owner[0]}</span>
          <span className={`lp-pill lp-pill--${prio[p]}`}>{p}</span>
        </div>
      ))}
    </div>
  )
}

function MockDocs() {
  const docs = [
    ['Offerte_ruwbouw_Janssens.pdf', 'Offerte'],
    ['Factuur_keuken_voorschot.pdf', 'Factuur'],
    ['Vergunning_verbouwing.pdf', 'Vergunning'],
  ]
  return (
    <div className="lp-mock">
      {docs.map(([name, tag]) => (
        <div key={name} className="lp-doc-row">
          <span className="lp-doc-icon"><Icon name="file" size={16} /></span>
          <span className="lp-doc-name">{name}</span>
          <span className="lp-pill lp-pill--soft">{tag}</span>
        </div>
      ))}
    </div>
  )
}

/* ---- Feature config ------------------------------------------------------- */

const FEATURES = [
  {
    id: 'communicatie', theme: 'blue', eyebrow: 'AI-samenvatting',
    title: 'Je mailbox, elke ochtend samengevat',
    body: 'Renotrack leest je verbouwing-mailbox en geeft je elke dag een kort overzicht met actiepunten. Offertes, facturen, afspraken — je mist niets meer.',
    points: ['Dagelijkse samenvatting, per week geordend', 'Actiepunten meteen zichtbaar', 'Eén klik naar de originele e-mail'],
    Illu: MailChar, mock: <MockComm />, reverse: false,
  },
  {
    id: 'budget', theme: 'yellow', eyebrow: 'Overzicht & budget',
    title: 'Altijd weten waar je staat',
    body: 'Bouw je verbouwing op in secties en posten met raming, offerte en factuur. Vergelijk scenario’s met versies en zie in realtime je verschil met het budget.',
    points: ['Raming vs. offerte vs. factuur', 'Scenario’s vergelijken met versies', 'Live totalen en budgetbewaking'],
    Illu: CoinChar, mock: <MockBudget />, reverse: true,
  },
  {
    id: 'taken', theme: 'green', eyebrow: 'Taken',
    title: 'Samen op dezelfde lijn',
    body: 'Een gedeelde takenlijst voor jou en je partner, gekoppeld aan de juiste post. Met eigenaar, prioriteit en deadline weet iedereen wat er moet gebeuren.',
    points: ['Gedeeld tussen partners', 'Gekoppeld aan je posten', 'Prioriteit en deadline per taak'],
    Illu: ClipboardChar, mock: <MockTasks />, reverse: false,
  },
  {
    id: 'documenten', theme: 'cream', eyebrow: 'Documenten',
    title: 'Al je offertes en facturen op één plek',
    body: 'Upload en bekijk je documenten in de app en koppel ze aan de juiste post. Geen verloren bijlagen meer in je mailbox.',
    points: ['Offertes, facturen en vergunningen', 'Gekoppeld aan de juiste post', 'In-app bekijken, ook pdf’s'],
    Illu: null, mock: <MockDocs />, reverse: true,
  },
]

// Wave color flows into the NEXT section's background.
const WAVE_INTO = { blue: 'var(--c-blue-soft)', yellow: 'var(--c-yellow-soft)', green: 'var(--c-green-soft)', cream: 'var(--c-cream)', purple: 'var(--c-purple-soft)' }

const STEPS = [
  ['Zet je posten op', 'Voeg secties en posten toe met je ramingen — in een paar minuten staat je verbouwing klaar.'],
  ['Koppel offertes & facturen', 'Vul offertes en facturen aan en hou je budget realtime up-to-date.'],
  ['Laat Renotrack meelezen', 'Krijg elke ochtend een samenvatting van je verbouwing-mailbox met de actiepunten van die dag.'],
]

/* ---- Sections ------------------------------------------------------------- */

function LandingNav() {
  return (
    <header className="lp-nav">
      <div className="lp-nav-inner">
        <a className="lp-brand" href="#top"><RenotrackMark size={38} /><RenotrackWordmark /></a>
        <nav className="lp-nav-links">
          <a href="#functies">Functionaliteiten</a>
          <a href="#hoe">Hoe het werkt</a>
        </nav>
        <Link to="/login" className="lp-btn lp-btn--primary lp-nav-cta">Inloggen</Link>
      </div>
    </header>
  )
}

function Hero() {
  const ref = useRef(null)
  function onMove(e) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    el.style.setProperty('--px', px.toFixed(3))
    el.style.setProperty('--py', py.toFixed(3))
  }
  return (
    <section className="lp-hero" id="top">
      <div className="lp-hero-bg" aria-hidden="true">
        <Blob className="lp-blob lp-blob--1 lp-float-a" color="var(--c-orange-soft)" />
        <Blob className="lp-blob lp-blob--2 lp-float-b" color="var(--c-blue-soft)" />
        <Blob className="lp-blob lp-blob--3 lp-float-c" color="var(--c-yellow-soft)" />
      </div>

      <div className="lp-hero-inner">
        <div className="lp-hero-text">
          <h1 className="lp-hero-title">Houd je renovatie<br />op de rails.</h1>
          <p className="lp-hero-sub">
            Renotrack houdt je budget, je offertes, je taken én je mailbox bij — zodat jij je kan
            focussen op je huis, niet op de administratie.
          </p>
          <div className="lp-hero-actions">
            <Link to="/login" className="lp-btn lp-btn--primary lp-btn--lg">Inloggen</Link>
            <a href="#functies" className="lp-btn lp-btn--ghost lp-btn--lg">Ontdek hoe het werkt</a>
          </div>
          <div className="lp-trust">
            <span><Icon name="check" size={14} strokeWidth={3} /> Live budgetbewaking</span>
            <span><Icon name="check" size={14} strokeWidth={3} /> Dagelijkse AI-samenvatting</span>
            <span><Icon name="check" size={14} strokeWidth={3} /> Gedeeld met je partner</span>
          </div>
        </div>

        <div className="lp-hero-visual" ref={ref} onMouseMove={onMove}>
          <div className="lp-hero-frame"><BrowserFrame label="renotrack.app/overzicht"><MockBudget /></BrowserFrame></div>
          <CoinChar className="lp-hero-illu lp-hero-illu--coin lp-float-a" />
          <MailChar className="lp-hero-illu lp-hero-illu--mail lp-float-b" />
          <HouseChar className="lp-hero-illu lp-hero-illu--house lp-float-c" />
          <Squiggle className="lp-hero-illu lp-hero-illu--squiggle" color="var(--c-purple)" />
        </div>
      </div>

      <Wave fill="var(--c-blue-soft)" />
    </section>
  )
}

function FeatureSection({ feature, index, total }) {
  const { theme, eyebrow, title, body, points, Illu, mock, reverse } = feature
  const next = FEATURES[index + 1]
  const waveFill = next ? WAVE_INTO[next.theme] : 'var(--c-purple-soft)'
  return (
    <section className={`lp-feat lp-feat--${theme} ${reverse ? 'lp-feat--reverse' : ''}`}>
      <div className="lp-feat-inner">
        <div className="lp-feat-text lp-reveal">
          <span className="lp-eyebrow">{eyebrow}</span>
          <h2 className="lp-feat-title">{title}</h2>
          <p className="lp-feat-body">{body}</p>
          <ul className="lp-feat-list">
            {points.map((p) => <li key={p}><Icon name="check" size={15} strokeWidth={3} /> {p}</li>)}
          </ul>
        </div>
        <div className="lp-feat-visual lp-reveal">
          {Illu && <Illu className="lp-feat-illu lp-float-b" />}
          <div className="lp-feat-frame"><BrowserFrame>{mock}</BrowserFrame></div>
        </div>
      </div>
      <Wave fill={waveFill} flip={index % 2 === 1} />
    </section>
  )
}

export default function Landing() {
  // Reveal-on-scroll for .lp-reveal elements.
  useEffect(() => {
    const els = document.querySelectorAll('.lp-reveal')
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add('is-in'), io.unobserve(e.target))),
      { threshold: 0.18 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <div className="lp">
      <LandingNav />

      <main>
        <Hero />

        <div className="lp-section-head lp-section-head--onblue lp-reveal" id="functies">
          <span className="lp-eyebrow">Functionaliteiten</span>
          <h2 className="lp-section-title">Alles voor je verbouwing, op één plek</h2>
        </div>

        {FEATURES.map((f, i) => <FeatureSection key={f.id} feature={f} index={i} total={FEATURES.length} />)}

        <section className="lp-steps" id="hoe">
          <Squiggle className="lp-steps-squiggle" color="var(--c-orange)" />
          <div className="lp-section-head lp-reveal">
            <span className="lp-eyebrow">Hoe het werkt</span>
            <h2 className="lp-section-title">In drie stappen onder controle</h2>
          </div>
          <div className="lp-steps-grid">
            {STEPS.map(([title, sbody], i) => (
              <div key={title} className="lp-step lp-reveal">
                <span className="lp-step-num">{i + 1}</span>
                <h3 className="lp-step-title">{title}</h3>
                <p className="lp-step-body">{sbody}</p>
              </div>
            ))}
          </div>
          <Wave fill="var(--c-indigo)" />
        </section>

        <section className="lp-cta">
          <Blob className="lp-cta-blob lp-cta-blob--1 lp-float-a" color="rgba(255,255,255,0.06)" />
          <Blob className="lp-cta-blob lp-cta-blob--2 lp-float-c" color="rgba(255,255,255,0.05)" />
          <div className="lp-cta-inner">
            <HouseChar className="lp-cta-illu lp-float-b" />
            <h2 className="lp-cta-title">Klaar om je renovatie op de rails te zetten?</h2>
            <p className="lp-cta-sub">Meld je aan en hou je hele project op één plek bij.</p>
            <Link to="/login" className="lp-btn lp-btn--onindigo lp-btn--lg">Inloggen</Link>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <a className="lp-brand" href="#top"><RenotrackMark size={34} /><RenotrackWordmark /></a>
          <span className="lp-footer-made">Gemaakt in Vlaanderen, tijdens onze eigen verbouwing.</span>
          <div className="lp-footer-links">
            <a href="mailto:debockvincent@gmail.com">Contact</a>
            <span>© {new Date().getFullYear()} Renotrack</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
