import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { useLang, LangToggle } from '../i18n'
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
 * Marketing copy, NL + EN. The landing page owns its own copy (instead of the
 * central i18n dictionary) because it is a self-contained public page.
 * -------------------------------------------------------------------------- */

const COPY = {
  nl: {
    navFeatures: 'Functionaliteiten',
    navHow: 'Hoe het werkt',
    login: 'Inloggen',
    heroTitle1: 'Houd je renovatie',
    heroTitle2: 'op de rails.',
    heroSub:
      'Renotrack houdt je budget, je offertes, je taken én je mailbox bij — zodat jij je kan focussen op je huis, niet op de administratie.',
    heroCta: 'Ontdek hoe het werkt',
    trust: ['Live budgetbewaking', 'Dagelijkse AI-samenvatting', 'Gedeeld met je partner'],
    sectionTitle: 'Alles voor je verbouwing, op één plek',
    features: [
      {
        eyebrow: 'AI-samenvatting',
        title: 'Je mailbox, elke ochtend samengevat',
        body: 'Renotrack leest je verbouwing-mailbox en geeft je elke dag een kort overzicht met actiepunten. Offertes, facturen, afspraken — je mist niets meer.',
        points: ['Dagelijkse samenvatting, per week geordend', 'Actiepunten meteen zichtbaar', 'Eén klik naar de originele e-mail'],
      },
      {
        eyebrow: 'Overzicht & budget',
        title: 'Altijd weten waar je staat',
        body: 'Bouw je verbouwing op in secties en posten met raming, offerte en factuur. Vergelijk scenario’s met versies en zie in realtime je verschil met het budget.',
        points: ['Raming vs. offerte vs. factuur', 'Scenario’s vergelijken met versies', 'Live totalen en budgetbewaking'],
      },
      {
        eyebrow: 'Taken',
        title: 'Samen op dezelfde lijn',
        body: 'Een gedeelde takenlijst voor jou en je partner, gekoppeld aan de juiste post. Met eigenaar, prioriteit en deadline weet iedereen wat er moet gebeuren.',
        points: ['Gedeeld tussen partners', 'Gekoppeld aan je posten', 'Prioriteit en deadline per taak'],
      },
      {
        eyebrow: 'Documenten',
        title: 'Al je offertes en facturen op één plek',
        body: 'Upload en bekijk je documenten in de app en koppel ze aan de juiste post. Geen verloren bijlagen meer in je mailbox.',
        points: ['Offertes, facturen en vergunningen', 'Gekoppeld aan de juiste post', 'In-app bekijken, ook pdf’s'],
      },
    ],
    howEyebrow: 'Hoe het werkt',
    howTitle: 'In drie stappen onder controle',
    steps: [
      ['Zet je posten op', 'Voeg secties en posten toe met je ramingen — in een paar minuten staat je verbouwing klaar.'],
      ['Koppel offertes & facturen', 'Vul offertes en facturen aan en hou je budget realtime up-to-date.'],
      ['Laat Renotrack meelezen', 'Krijg elke ochtend een samenvatting van je verbouwing-mailbox met de actiepunten van die dag.'],
    ],
    ctaTitle: 'Klaar om je renovatie op de rails te zetten?',
    ctaSub: 'Meld je aan en hou je hele project op één plek bij.',
    footerMade: 'Gemaakt in Vlaanderen, tijdens onze eigen verbouwing.',
    footerContact: 'Contact',
    // Mock panel copy (fictional demo data)
    mockCols: ['Post', 'Offerte', 'Meetellen'],
    mockSection: 'AFWERKING',
    mockRows: [
      ['Ruwbouw', '€ 142.000', true],
      ['Keuken', '€ 24.500', true],
      ['Badkamers', '€ 18.900', true],
      ['Zonnepanelen', '€ 9.200', false],
    ],
    mockTotal: 'Totaal',
    mockWithinBudget: 'binnen budget',
    mockCommWeek: 'Deze week · 4 berichten',
    mockMails: [
      ['di', '17', 'Aannemer Janssens', 'Offerte ruwbouw — fase 2', 'Bedrag: € 142.000 · geldig tot 30/06', true],
      ['ma', '16', 'Keukenstudio Lux', 'Bevestiging plaatsingsdatum', 'Plaatsing week 28 · voorschot betaald', false],
    ],
    mockAction: 'Actie nodig',
    mockTasks: [
      ['Vloertegels kiezen', 'Karo', 'High', false],
      ['Offerte zonnepanelen vergelijken', 'Vincent', 'Medium', false],
      ['Voorschot keuken betalen', 'Vincent', 'Low', true],
    ],
    mockDocs: [
      ['Offerte_ruwbouw_Janssens.pdf', 'Offerte'],
      ['Factuur_keuken_voorschot.pdf', 'Factuur'],
      ['Vergunning_verbouwing.pdf', 'Vergunning'],
    ],
  },
  en: {
    navFeatures: 'Features',
    navHow: 'How it works',
    login: 'Log in',
    heroTitle1: 'Keep your renovation',
    heroTitle2: 'on track.',
    heroSub:
      'Renotrack keeps track of your budget, your quotes, your tasks and your mailbox, so you can focus on your house instead of the paperwork.',
    heroCta: 'See how it works',
    trust: ['Live budget tracking', 'Daily AI summary', 'Shared with your partner'],
    sectionTitle: 'Everything for your renovation, in one place',
    features: [
      {
        eyebrow: 'AI summary',
        title: 'Your mailbox, summarized every morning',
        body: 'Renotrack reads your renovation mailbox and gives you a short daily overview with action items. Quotes, invoices, appointments: you will not miss a thing.',
        points: ['Daily summary, organized per week', 'Action items visible at a glance', 'One click to the original email'],
      },
      {
        eyebrow: 'Overview & budget',
        title: 'Always know where you stand',
        body: 'Build your renovation out of sections and line items with estimate, quote and invoice. Compare scenarios with versions and watch your gap with the budget in real time.',
        points: ['Estimate vs. quote vs. invoice', 'Compare scenarios with versions', 'Live totals and budget tracking'],
      },
      {
        eyebrow: 'Tasks',
        title: 'On the same page, together',
        body: 'A shared task list for you and your partner, linked to the right line item. With an owner, a priority and a deadline, everyone knows what needs to happen.',
        points: ['Shared between partners', 'Linked to your line items', 'Priority and deadline per task'],
      },
      {
        eyebrow: 'Documents',
        title: 'All your quotes and invoices in one place',
        body: 'Upload and view your documents in the app and link them to the right line item. No more lost attachments in your mailbox.',
        points: ['Quotes, invoices and permits', 'Linked to the right line item', 'View in-app, including PDFs'],
      },
    ],
    howEyebrow: 'How it works',
    howTitle: 'In control in three steps',
    steps: [
      ['Set up your line items', 'Add sections and line items with your estimates. Your renovation is ready in minutes.'],
      ['Link quotes & invoices', 'Add quotes and invoices and keep your budget up to date in real time.'],
      ['Let Renotrack read along', 'Get a summary of your renovation mailbox every morning with that day’s action items.'],
    ],
    ctaTitle: 'Ready to put your renovation on track?',
    ctaSub: 'Sign in and keep your whole project in one place.',
    footerMade: 'Made in Flanders, during our own renovation.',
    footerContact: 'Contact',
    // Mock panel copy (fictional demo data)
    mockCols: ['Item', 'Quote', 'Include'],
    mockSection: 'FINISHES',
    mockRows: [
      ['Structural work', '€ 142,000', true],
      ['Kitchen', '€ 24,500', true],
      ['Bathrooms', '€ 18,900', true],
      ['Solar panels', '€ 9,200', false],
    ],
    mockTotal: 'Total',
    mockWithinBudget: 'within budget',
    mockCommWeek: 'This week · 4 messages',
    mockMails: [
      ['Tue', '17', 'Janssens Contractors', 'Quote structural work, phase 2', 'Amount: € 142,000 · valid until 30/06', true],
      ['Mon', '16', 'Kitchen Studio Lux', 'Installation date confirmed', 'Installation week 28 · deposit paid', false],
    ],
    mockAction: 'Action needed',
    mockTasks: [
      ['Choose floor tiles', 'Karo', 'High', false],
      ['Compare solar panel quotes', 'Vincent', 'Medium', false],
      ['Pay kitchen deposit', 'Vincent', 'Low', true],
    ],
    mockDocs: [
      ['Quote_structural_Janssens.pdf', 'Quote'],
      ['Invoice_kitchen_deposit.pdf', 'Invoice'],
      ['Renovation_permit.pdf', 'Permit'],
    ],
  },
}

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

function MockBudget({ c }) {
  const [colName, colQuote, colInclude] = c.mockCols
  return (
    <div className="lp-mock">
      <div className="lp-mock-head"><span>{colName}</span><span>{colQuote}</span><span>{colInclude}</span></div>
      <div className="lp-mock-section"><span>{c.mockSection}</span><span className="lp-mock-amount">€ 194.600</span><span /></div>
      {c.mockRows.map(([name, amount, on]) => (
        <div key={name} className={`lp-mock-row ${on ? '' : 'lp-mock-row--off'}`}>
          <span className="lp-mock-name">{name}</span>
          <span className="lp-mock-amount">{amount}</span>
          <span className={`lp-check ${on ? 'lp-check--on' : ''}`}>{on && <Icon name="check" size={13} strokeWidth={3} />}</span>
        </div>
      ))}
      <div className="lp-mock-total"><span>{c.mockTotal}</span><span className="lp-mock-amount">€ 185.400</span><span className="lp-pill lp-pill--ok">{c.mockWithinBudget}</span></div>
    </div>
  )
}

function MockComm({ c }) {
  return (
    <div className="lp-mock lp-mock--comm">
      <div className="lp-comm-week">{c.mockCommWeek}</div>
      {c.mockMails.map(([wd, d, sender, subject, point, action]) => (
        <div key={subject} className={`lp-comm-row ${action ? 'lp-comm-row--action' : ''}`}>
          <div className="lp-comm-date"><span>{wd}</span><strong>{d}</strong></div>
          <div className="lp-comm-main">
            <div className="lp-comm-meta"><span className="lp-comm-sender">{sender}</span>{action && <span className="lp-flag">{c.mockAction}</span>}</div>
            <div className="lp-comm-subject">{subject}</div>
            <div className="lp-comm-point">• {point}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function MockTasks({ c }) {
  const prio = { High: 'high', Medium: 'medium', Low: 'low' }
  return (
    <div className="lp-mock">
      {c.mockTasks.map(([title, owner, p, done]) => (
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

function MockDocs({ c }) {
  return (
    <div className="lp-mock">
      {c.mockDocs.map(([name, tag]) => (
        <div key={name} className="lp-doc-row">
          <span className="lp-doc-icon"><Icon name="file" size={16} /></span>
          <span className="lp-doc-name">{name}</span>
          <span className="lp-pill lp-pill--soft">{tag}</span>
        </div>
      ))}
    </div>
  )
}

/* ---- Feature visual config (copy comes from COPY.features, same order) ----- */

const FEATURE_META = [
  { id: 'communicatie', theme: 'blue', Illu: MailChar, Mock: MockComm, reverse: false },
  { id: 'budget', theme: 'yellow', Illu: CoinChar, Mock: MockBudget, reverse: true },
  { id: 'taken', theme: 'green', Illu: ClipboardChar, Mock: MockTasks, reverse: false },
  { id: 'documenten', theme: 'cream', Illu: null, Mock: MockDocs, reverse: true },
]

// Wave color flows into the NEXT section's background.
const WAVE_INTO = { blue: 'var(--c-blue-soft)', yellow: 'var(--c-yellow-soft)', green: 'var(--c-green-soft)', cream: 'var(--c-cream)', purple: 'var(--c-purple-soft)' }

/* ---- Sections ------------------------------------------------------------- */

function LandingNav({ c }) {
  return (
    <header className="lp-nav">
      <div className="lp-nav-inner">
        <a className="lp-brand" href="#top"><RenotrackMark size={38} /><RenotrackWordmark /></a>
        <nav className="lp-nav-links">
          <a href="#functies">{c.navFeatures}</a>
          <a href="#hoe">{c.navHow}</a>
        </nav>
        <LangToggle className="lp-lang" />
        <Link to="/login" className="lp-btn lp-btn--primary lp-nav-cta">{c.login}</Link>
      </div>
    </header>
  )
}

function Hero({ c }) {
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
          <h1 className="lp-hero-title">{c.heroTitle1}<br />{c.heroTitle2}</h1>
          <p className="lp-hero-sub">{c.heroSub}</p>
          <div className="lp-hero-actions">
            <Link to="/login" className="lp-btn lp-btn--primary lp-btn--lg">{c.login}</Link>
            <a href="#functies" className="lp-btn lp-btn--ghost lp-btn--lg">{c.heroCta}</a>
          </div>
          <div className="lp-trust">
            {c.trust.map((tItem) => (
              <span key={tItem}><Icon name="check" size={14} strokeWidth={3} /> {tItem}</span>
            ))}
          </div>
        </div>

        <div className="lp-hero-visual" ref={ref} onMouseMove={onMove}>
          <div className="lp-hero-frame"><BrowserFrame label="renotrack.app/overzicht"><MockBudget c={c} /></BrowserFrame></div>
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

function FeatureSection({ meta, copy, c, index }) {
  const { theme, Illu, Mock, reverse } = meta
  const next = FEATURE_META[index + 1]
  const waveFill = next ? WAVE_INTO[next.theme] : 'var(--c-purple-soft)'
  return (
    <section className={`lp-feat lp-feat--${theme} ${reverse ? 'lp-feat--reverse' : ''}`}>
      <div className="lp-feat-inner">
        <div className="lp-feat-text lp-reveal">
          <span className="lp-eyebrow">{copy.eyebrow}</span>
          <h2 className="lp-feat-title">{copy.title}</h2>
          <p className="lp-feat-body">{copy.body}</p>
          <ul className="lp-feat-list">
            {copy.points.map((p) => <li key={p}><Icon name="check" size={15} strokeWidth={3} /> {p}</li>)}
          </ul>
        </div>
        <div className="lp-feat-visual lp-reveal">
          {Illu && <Illu className="lp-feat-illu lp-float-b" />}
          <div className="lp-feat-frame"><BrowserFrame><Mock c={c} /></BrowserFrame></div>
        </div>
      </div>
      <Wave fill={waveFill} flip={index % 2 === 1} />
    </section>
  )
}

export default function Landing() {
  const { lang } = useLang()
  const c = COPY[lang] || COPY.nl

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
  }, [lang])

  return (
    <div className="lp">
      <LandingNav c={c} />

      <main>
        <Hero c={c} />

        <div className="lp-section-head lp-section-head--onblue lp-reveal" id="functies">
          <span className="lp-eyebrow">{c.navFeatures}</span>
          <h2 className="lp-section-title">{c.sectionTitle}</h2>
        </div>

        {FEATURE_META.map((meta, i) => (
          <FeatureSection key={meta.id} meta={meta} copy={c.features[i]} c={c} index={i} />
        ))}

        <section className="lp-steps" id="hoe">
          <Squiggle className="lp-steps-squiggle" color="var(--c-orange)" />
          <div className="lp-section-head lp-reveal">
            <span className="lp-eyebrow">{c.howEyebrow}</span>
            <h2 className="lp-section-title">{c.howTitle}</h2>
          </div>
          <div className="lp-steps-grid">
            {c.steps.map(([title, sbody], i) => (
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
            <h2 className="lp-cta-title">{c.ctaTitle}</h2>
            <p className="lp-cta-sub">{c.ctaSub}</p>
            <Link to="/login" className="lp-btn lp-btn--onindigo lp-btn--lg">{c.login}</Link>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <a className="lp-brand" href="#top"><RenotrackMark size={34} /><RenotrackWordmark /></a>
          <span className="lp-footer-made">{c.footerMade}</span>
          <div className="lp-footer-links">
            <a href="mailto:debockvincent@gmail.com">{c.footerContact}</a>
            <span>© {new Date().getFullYear()} Renotrack</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
