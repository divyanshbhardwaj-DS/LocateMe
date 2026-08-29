import { motion, useReducedMotion } from 'framer-motion'

const ease = [0.16, 1, 0.3, 1]

export function SectionHeading({ eyebrow, title, sub, center = true }) {
  return (
    <div className={`max-w-2xl ${center ? 'mx-auto text-center' : ''}`}>
      <span className="chip border border-line2 bg-panel2 font-mono uppercase tracking-widest text-mint">
        {eyebrow}
      </span>
      <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-snow sm:text-4xl">
        {title}
      </h2>
      {sub && <p className="mt-4 text-base leading-relaxed text-fog">{sub}</p>}
    </div>
  )
}

export function Reveal({ children, delay = 0, className = '' }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const features = [
  {
    icon: <CrosshairIcon />,
    title: 'Accurate to where you are',
    text: 'We use your position to surface the right on-the-ground details — matched to your real location, not a guess.',
  },
  {
    icon: <ConsentIcon />,
    title: 'Consent before anything',
    text: 'No tracking in the background. We only receive your location when you explicitly choose to share it.',
  },
  {
    icon: <VaultIcon />,
    title: 'Stored securely, kept private',
    text: 'Your location is handled responsibly and is never exposed to other visitors in the public experience.',
  },
  {
    icon: <ControlIcon />,
    title: 'You stay in control',
    text: 'Grant, change, or revoke access any time from your browser settings. Your call, always.',
  },
]

export function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
      <Reveal>
        <SectionHeading
          eyebrow="Why Orbit"
          title="Built to be trusted with a detail that matters"
          sub="Location is personal. We treat it that way — with clear permission, honest explanations, and no hidden collection."
        />
      </Reveal>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f, i) => (
          <Reveal key={f.title} delay={i * 0.08}>
            <FeatureCard {...f} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export function HowItWorks() {
  const steps = [
    {
      n: '01',
      title: 'Start',
      text: 'Hit “Get started.” We tell you plainly why your location matters — before anything is requested.',
    },
    {
      n: '02',
      title: 'Allow',
      text: 'A single, clear permission prompt. Approve once and your browser confirms your position securely.',
    },
    {
      n: '03',
      title: 'Verified',
      text: 'Your location is received and stored privately. You see a clean confirmation — nothing exposed.',
    },
  ]

  return (
    <section id="how" className="relative border-y border-line bg-night2/40">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <Reveal>
          <SectionHeading
            eyebrow="The flow"
            title="Simple, honest, and over in seconds"
            sub="Three steps from start to verified — transparent at every point, with no surprises along the way."
          />
        </Reveal>

        <div className="relative mt-16 grid gap-8 md:grid-cols-3 md:gap-6">
          <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-mint/0 via-mint/30 to-mint/0 md:block" />
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1}>
              <div className="relative flex flex-col items-center text-center">
                <div className="relative z-10 grid h-14 w-14 place-items-center rounded-2xl border border-line2 bg-panel font-mono text-lg font-medium text-mint shadow-card">
                  {s.n}
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold text-snow">{s.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-fog">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Privacy() {
  return (
    <section id="privacy" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <SectionHeading
            center={false}
            eyebrow="Your privacy"
            title="We made sure your location stays yours"
            sub="The single most common worry is: “where does my location go?” So we made the answer simple and visible."
          />
          <div className="mt-8 space-y-4">
            {[
              ['Never public', 'Your exact location is never shown to other users in the normal experience.'],
              ['One clear purpose', 'Your location is collected for precisely one reason, stated up front.'],
              ['Private, not hidden', 'Only an authorized owner can review submission details — enforced server-side.'],
            ].map(([t, d]) => (
              <div key={t} className="flex items-start gap-3.5">
                <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mint/15 text-mint">
                  <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                    <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-snow">{t}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-fog">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="relative overflow-hidden rounded-3xl border border-line bg-panel/60 p-8 shadow-card backdrop-blur">
            <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-mint/10 blur-[70px]" />
            <p className="font-mono text-xs uppercase tracking-widest text-fog">Our data promise</p>
            <ul className="mt-6 space-y-5">
              {[
                'Collected only with your explicit consent',
                'Used for one transparent purpose',
                'Stored securely and responsibly',
                'Never surfaced publicly to visitors',
                'Revocable any time via browser settings',
              ].map((item, i) => (
                <li key={item} className="flex items-center gap-3">
                  <motion.span
                    initial={false}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-mint/10 text-mint ring-1 ring-mint/20"
                  >
                    {i + 1}
                  </motion.span>
                  <span className="text-sm text-cloud">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function FeatureCard({ icon, title, text }) {
  const reduce = useReducedMotion()
  return (
    <div
      onMouseMove={
        reduce
          ? undefined
          : (e) => {
              const r = e.currentTarget.getBoundingClientRect()
              const x = (e.clientX - r.left) / r.width - 0.5
              const y = (e.clientY - r.top) / r.height - 0.5
              e.currentTarget.style.setProperty('--ry', `${x * 7}deg`)
              e.currentTarget.style.setProperty('--rx', `${-y * 7}deg`)
            }
      }
      onMouseLeave={(e) => {
        e.currentTarget.style.setProperty('--ry', '0deg')
        e.currentTarget.style.setProperty('--rx', '0deg')
      }}
      className="tilt-card group rounded-3xl border border-line bg-panel/60 p-6 shadow-card backdrop-blur"
    >
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-mint/10 text-mint ring-1 ring-mint/20 transition-transform duration-300 group-hover:scale-110">
        {icon}
      </div>
      <h3 className="font-display text-lg font-semibold text-snow">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-fog">{text}</p>
    </div>
  )
}

function CrosshairIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      <path d="M12 2v3.5M12 18.5V22M2 12h3.5M18.5 12H22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
function ConsentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
      <rect x="5" y="10" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.6" />
      <path d="m9.5 15 2 2 3.5-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function VaultIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
      <path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6l-8-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ControlIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
      <path d="M12 3a3 3 0 0 1 3 3v1h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3V6a3 3 0 0 1 3-3Z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12.5" r="1.6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}
