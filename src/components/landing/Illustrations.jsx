/* Renotrack brand illustrations — hand-built SVG in a Headspace-inspired style:
 * bold flat fills, organic rounded shapes, and the signature friendly closed-eye
 * smile. Scalable, themeable and animatable; no binary assets. This is the
 * "starter set" to validate the visual direction before expanding it. */

// Signature face (closed happy eyes + smile), placed at an origin via transform.
function Face({ x = 0, y = 0, scale = 1, stroke = '#20223d', blush = null }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round">
      <path d="M-16 -2 q5 -7 10 0" />
      <path d="M6 -2 q5 -7 10 0" />
      <path d="M-12 8 q7 9 16 0" />
      {blush && (
        <>
          <circle cx="-20" cy="6" r="4" fill={blush} stroke="none" />
          <circle cx="22" cy="6" r="4" fill={blush} stroke="none" />
        </>
      )}
    </g>
  )
}

/* ---- Logo ----------------------------------------------------------------- */

export function RenotrackMark({ size = 40, className = '' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="44" height="44" rx="14" fill="var(--c-orange, #ff7a1a)" />
      {/* house */}
      <path d="M24 11 L37 23 H11 Z" fill="#fff" />
      <rect x="15" y="22" width="18" height="15" rx="3" fill="#fff" />
      {/* track ties under the house */}
      <rect x="13" y="39.5" width="22" height="2.6" rx="1.3" fill="#fff" opacity="0.9" />
      <rect x="16" y="36.5" width="2.4" height="5" rx="1.2" fill="#fff" opacity="0.55" />
      <rect x="29.6" y="36.5" width="2.4" height="5" rx="1.2" fill="#fff" opacity="0.55" />
      {/* tiny smile */}
      <path d="M21 29 q3 3.5 6 0" stroke="var(--c-orange, #ff7a1a)" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export function RenotrackWordmark({ className = '' }) {
  return (
    <span className={`rt-wordmark ${className}`}>
      Reno<span className="rt-wordmark-accent">track</span>
    </span>
  )
}

/* ---- Decorative organic shapes -------------------------------------------- */

export function Blob({ color = 'var(--c-orange)', className = '', style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 200 200" aria-hidden="true">
      <path
        fill={color}
        d="M44 -67C58 -57 70 -45 76 -30C82 -14 81 5 75 22C68 39 56 53 41 63C25 73 6 78 -12 75C-31 72 -50 60 -62 44C-73 27 -78 6 -74 -13C-71 -32 -58 -50 -41 -61C-24 -72 -3 -76 14 -75C31 -74 30 -77 44 -67Z"
        transform="translate(100 100)"
      />
    </svg>
  )
}

export function Squiggle({ color = 'var(--c-purple)', className = '', style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 80 40" fill="none" aria-hidden="true">
      <path d="M4 28 q12 -24 24 0 q12 24 24 0 q12 -24 24 0" stroke={color} strokeWidth="6" strokeLinecap="round" />
    </svg>
  )
}

/* ---- Characters ----------------------------------------------------------- */

export function HouseChar({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 200 190" fill="none" aria-hidden="true">
      {/* track */}
      <rect x="20" y="168" width="160" height="6" rx="3" fill="#cdbfa8" />
      <rect x="20" y="178" width="160" height="6" rx="3" fill="#cdbfa8" />
      {[34, 64, 94, 124, 154].map((x) => (
        <rect key={x} x={x} y="164" width="7" height="24" rx="3" fill="#bdae95" />
      ))}
      {/* body */}
      <rect x="44" y="84" width="112" height="80" rx="12" fill="#fff5ec" />
      {/* roof */}
      <path d="M100 22 L168 86 H32 Z" fill="var(--c-orange)" strokeLinejoin="round" />
      {/* chimney */}
      <rect x="132" y="40" width="16" height="26" rx="4" fill="var(--c-orange-strong, #e86a0c)" />
      {/* window */}
      <rect x="118" y="104" width="26" height="26" rx="6" fill="var(--c-blue-soft)" stroke="var(--c-blue)" strokeWidth="3" />
      <Face x="84" y="118" scale="1.05" blush="var(--c-pink)" />
    </svg>
  )
}

export function MailChar({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 200 180" fill="none" aria-hidden="true">
      <rect x="26" y="44" width="148" height="104" rx="20" fill="var(--c-blue)" />
      <path d="M26 60 L100 108 L174 60" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.45" />
      {/* little AI sparkle */}
      <path d="M150 28 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4 z" fill="var(--c-yellow)" />
      <Face x="100" y="118" scale="1.1" stroke="#fff" />
    </svg>
  )
}

export function CoinChar({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 200 190" fill="none" aria-hidden="true">
      <ellipse cx="100" cy="170" rx="54" ry="10" fill="#000" opacity="0.06" />
      <circle cx="100" cy="98" r="76" fill="var(--c-yellow-strong, #e8a020)" />
      <circle cx="100" cy="92" r="76" fill="var(--c-yellow)" />
      <circle cx="100" cy="92" r="60" fill="none" stroke="var(--c-yellow-strong, #e8a020)" strokeWidth="4" opacity="0.6" />
      <text x="62" y="78" fontSize="34" fontWeight="800" fill="var(--c-yellow-strong, #e8a020)" opacity="0.5">€</text>
      <Face x="100" y="104" scale="1.2" blush="var(--c-pink)" />
    </svg>
  )
}

export function ClipboardChar({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 180 200" fill="none" aria-hidden="true">
      <rect x="30" y="34" width="120" height="150" rx="18" fill="var(--c-green)" />
      <rect x="44" y="50" width="92" height="118" rx="12" fill="#fff" />
      <rect x="66" y="22" width="48" height="26" rx="10" fill="var(--c-green-strong, #2f8f6b)" />
      {/* checked lines */}
      {[78, 100, 122].map((y, i) => (
        <g key={y}>
          <circle cx="62" cy={y} r="7" fill={i === 2 ? '#e9e2d6' : 'var(--c-green-soft)'} stroke="var(--c-green)" strokeWidth="2.5" />
          {i < 2 && <path d={`M58 ${y} l3 3 5 -6`} stroke="var(--c-green)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
          <rect x="78" y={y - 4} width={i === 2 ? 36 : 48} height="7" rx="3.5" fill="#ece5da" />
        </g>
      ))}
      <Face x="90" y="150" scale="0.85" />
    </svg>
  )
}

/* ---- Section dividers (organic, not straight lines) ----------------------- */

export function Wave({ fill, flip = false, className = '' }) {
  return (
    <div className={`lp-wave ${flip ? 'lp-wave--flip' : ''} ${className}`} aria-hidden="true">
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" fill="none">
        <path
          d="M0 60 C 240 120 480 0 720 40 C 960 80 1200 120 1440 60 L1440 120 L0 120 Z"
          fill={fill}
        />
      </svg>
    </div>
  )
}

export function Bump({ fill, className = '' }) {
  return (
    <div className={`lp-wave ${className}`} aria-hidden="true">
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" fill="none">
        <path d="M0 120 L0 70 Q720 -40 1440 70 L1440 120 Z" fill={fill} />
      </svg>
    </div>
  )
}
