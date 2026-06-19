import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import logo from '../assets/brand/logo.png'
import '../styles/landing.css'

/* ----------------------------------------------------------------------------
 * On-brand mock product panels. These reuse the design tokens but use fictional
 * demo data — never the real mailbox/amounts — so the public page leaks nothing.
 * -------------------------------------------------------------------------- */

function BrowserFrame({ children, label = 'renovai.app' }) {
  return (
    <div className="lp-frame" aria-hidden="true">
      <div className="lp-frame-bar">
        <span className="lp-dot" />
        <span className="lp-dot" />
        <span className="lp-dot" />
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
      <div className="lp-mock-head">
        <span>Post</span>
        <span>Offerte</span>
        <span>Meetellen</span>
      </div>
      <div className="lp-mock-section">
        <span>AFWERKING</span>
        <span className="lp-mock-amount">€ 194.600</span>
        <span />
      </div>
      {items.map(([name, amount, on]) => (
        <div key={name} className={`lp-mock-row ${on ? '' : 'lp-mock-row--off'}`}>
          <span className="lp-mock-name">{name}</span>
          <span className="lp-mock-amount">{amount}</span>
          <span className={`lp-check ${on ? 'lp-check--on' : ''}`}>
            {on && <Icon name="check" size={13} strokeWidth={3} />}
          </span>
        </div>
      ))}
      <div className="lp-mock-total">
        <span>Totaal</span>
        <span className="lp-mock-amount">€ 185.400</span>
        <span className="lp-pill lp-pill--ok">binnen budget</span>
      </div>
    </div>
  )
}

function MockComm() {
  const mails = [
    ['di', '17', 'Aannemer Janssens', 'Offerte ruwbouw — fase 2', 'Bedrag: € 142.000 · geldig tot 30/06', true],
    ['ma', '16', 'Keukenstudio Lux', 'Bevestiging plaatsingsdatum', 'Plaatsing voorzien week 28 · voorschot betaald', false],
  ]
  return (
    <div className="lp-mock lp-mock--comm">
      <div className="lp-comm-week">Deze week · 4 berichten</div>
      {mails.map(([wd, d, sender, subject, point, action]) => (
        <div key={subject} className={`lp-comm-row ${action ? 'lp-comm-row--action' : ''}`}>
          <div className="lp-comm-date">
            <span>{wd}</span>
            <strong>{d}</strong>
          </div>
          <div className="lp-comm-main">
            <div className="lp-comm-meta">
              <span className="lp-comm-sender">{sender}</span>
              {action && <span className="lp-flag">Actie nodig</span>}
            </div>
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
          <span className={`lp-check ${done ? 'lp-check--done' : ''}`}>
            {done && <Icon name="check" size={13} strokeWidth={3} />}
          </span>
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

/* ---- Sections ------------------------------------------------------------- */

const FEATURES = [
  {
    id: 'communicatie',
    eyebrow: 'AI-samenvatting',
    title: 'Je mailbox, elke ochtend samengevat',
    body: 'RenovAI leest je verbouwing-mailbox en geeft je elke dag een kort overzicht met actiepunten. Offertes, facturen, afspraken met de architect — je mist niets meer, zonder zelf door tientallen mails te ploeteren.',
    points: ['Dagelijkse samenvatting per week geordend', 'Actiepunten meteen zichtbaar', 'Eén klik naar de originele e-mail'],
    visual: <MockComm />,
  },
  {
    id: 'budget',
    eyebrow: 'Overzicht & budget',
    title: 'Altijd weten waar je staat',
    body: 'Bouw je verbouwing op in secties en posten met raming, offerte en factuur. Vergelijk scenario’s met versies en zie in realtime je verschil met het budget — groen of rood, in één oogopslag.',
    points: ['Raming vs. offerte vs. factuur', 'Scenario’s vergelijken met versies', 'Live totalen en budgetbewaking'],
    visual: <MockBudget />,
  },
  {
    id: 'taken',
    eyebrow: 'Taken',
    title: 'Samen op dezelfde lijn',
    body: 'Een gedeelde takenlijst voor jou en je partner, gekoppeld aan de juiste post. Met eigenaar, prioriteit en deadline weet iedereen wat er moet gebeuren — en wie aan zet is.',
    points: ['Gedeeld tussen partners', 'Gekoppeld aan je posten', 'Prioriteit en deadline per taak'],
    visual: <MockTasks />,
  },
  {
    id: 'documenten',
    eyebrow: 'Documenten',
    title: 'Al je offertes en facturen op één plek',
    body: 'Upload en bekijk je documenten in de app en koppel ze aan de juiste post. Geen verloren bijlagen meer in je mailbox — alles staat netjes bij je verbouwing.',
    points: ['Offertes, facturen en vergunningen', 'Gekoppeld aan de juiste post', 'In-app bekijken, ook pdf’s'],
    visual: <MockDocs />,
  },
]

function LandingNav() {
  return (
    <header className="lp-nav">
      <div className="lp-nav-inner">
        <a className="lp-brand" href="#top">
          <img className="lp-logo" src={logo} alt="" />
          <span className="lp-wordmark">RenovAI</span>
        </a>
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
  return (
    <section className="lp-hero" id="top">
      <div className="lp-hero-text">
        <span className="lp-eyebrow">Voor wie verbouwt</span>
        <h1 className="lp-hero-title">Verbouwen zonder de chaos.</h1>
        <p className="lp-hero-sub">
          RenovAI houdt je budget, je offertes, je taken én je mailbox bij — zodat jij je kan
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
      <div className="lp-hero-visual">
        <BrowserFrame label="renovai.app/overzicht"><MockBudget /></BrowserFrame>
      </div>
    </section>
  )
}

function FeatureRow({ feature, index }) {
  return (
    <div className={`lp-feature ${index % 2 === 1 ? 'lp-feature--reverse' : ''}`}>
      <div className="lp-feature-text">
        <span className="lp-eyebrow">{feature.eyebrow}</span>
        <h2 className="lp-feature-title">{feature.title}</h2>
        <p className="lp-feature-body">{feature.body}</p>
        <ul className="lp-feature-list">
          {feature.points.map((p) => (
            <li key={p}><Icon name="check" size={15} strokeWidth={3} /> {p}</li>
          ))}
        </ul>
      </div>
      <div className="lp-feature-visual">
        <BrowserFrame>{feature.visual}</BrowserFrame>
      </div>
    </div>
  )
}

const STEPS = [
  ['Zet je posten op', 'Voeg secties en posten toe met je ramingen — in een paar minuten staat je verbouwing klaar.'],
  ['Koppel offertes & facturen', 'Vul offertes en facturen aan en hou je budget realtime up-to-date.'],
  ['Laat RenovAI meelezen', 'Krijg elke ochtend een samenvatting van je verbouwing-mailbox met de actiepunten van die dag.'],
]

export default function Landing() {
  return (
    <div className="lp">
      <LandingNav />

      <main>
        <Hero />

        <section className="lp-features" id="functies">
          <div className="lp-section-head">
            <span className="lp-eyebrow">Functionaliteiten</span>
            <h2 className="lp-section-title">Alles voor je verbouwing, op één plek</h2>
          </div>
          {FEATURES.map((f, i) => (
            <FeatureRow key={f.id} feature={f} index={i} />
          ))}
        </section>

        <section className="lp-steps" id="hoe">
          <div className="lp-section-head">
            <span className="lp-eyebrow">Hoe het werkt</span>
            <h2 className="lp-section-title">In drie stappen onder controle</h2>
          </div>
          <div className="lp-steps-grid">
            {STEPS.map(([title, body], i) => (
              <div key={title} className="lp-step">
                <span className="lp-step-num">{i + 1}</span>
                <h3 className="lp-step-title">{title}</h3>
                <p className="lp-step-body">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="lp-cta">
          <div className="lp-cta-inner">
            <h2 className="lp-cta-title">Klaar om grip te krijgen op je verbouwing?</h2>
            <p className="lp-cta-sub">Meld je aan en hou je hele project op één plek bij.</p>
            <Link to="/login" className="lp-btn lp-btn--onindigo lp-btn--lg">Inloggen</Link>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <a className="lp-brand" href="#top">
            <img className="lp-logo" src={logo} alt="" />
            <span className="lp-wordmark">RenovAI</span>
          </a>
          <span className="lp-footer-made">Gemaakt in Vlaanderen, tijdens onze eigen verbouwing.</span>
          <div className="lp-footer-links">
            <a href="mailto:debockvincent@gmail.com">Contact</a>
            <span>© {new Date().getFullYear()} RenovAI</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
