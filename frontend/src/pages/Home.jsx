import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Nav, { PinMark } from '../components/Nav.jsx'
import BackgroundFX from '../components/BackgroundFX.jsx'
import LocationConsent from '../components/LocationConsent.jsx'
import Radar from '../components/Radar.jsx'
import { Features, HowItWorks, Privacy, Reveal } from '../components/Sections.jsx'

export default function Home() {
  const consentRef = useRef(null)
  const [located, setLocated] = useState(null)

  const scrollToConsent = () =>
    consentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div id="top" className="relative min-h-screen bg-night text-snow">
      <Nav onGetStarted={scrollToConsent} />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <BackgroundFX />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-24 pt-16 sm:px-8 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <span className="chip border border-line2 bg-panel2 text-mint">
                <span className="h-1.5 w-1.5 rounded-full bg-mint animate-pulse" />
                Permission-first by design
              </span>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="mt-6 font-display text-hero font-semibold leading-[1.05] text-snow">
                Location, <span className="text-gradient">handled right.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-fog">
                LocateMe pairs the accuracy of your real position with the privacy you
                expect. One clear permission, one stated purpose — and your details stay
                private, never shared with other visitors.
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button onClick={scrollToConsent} className="btn-primary w-full sm:w-auto">
                  Get started
                </button>
                <Link to="/demo" className="btn-ghost w-full sm:w-auto">
                  Try the location-gated demo
                </Link>
                <a href="#how" className="btn-ghost w-full sm:w-auto">
                  See how it works
                </a>
              </div>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-fog/80">
                <TrustItem label="Private by design" />
                <TrustItem label="No dark patterns" />
                <TrustItem label="Revoke anytime" />
              </div>
            </Reveal>
          </div>

          {/* Animated location visual */}
          <Reveal delay={0.2} className="mx-auto">
            <div className="relative grid place-items-center">
              <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-mint/10 blur-[90px]" />
              <Radar active size="lg" />
              <FloatingBadge className="left-0 top-2" icon={<ShieldS />} text="Private" />
              <FloatingBadge className="right-0 top-10" icon={<CheckS />} text="Verified" delay />
              <FloatingBadge className="bottom-2 left-8" icon={<LockS />} text="Secure" />
            </div>
          </Reveal>
        </div>
      </section>

      <HowItWorks />
      <Features />
      <Privacy />

      {/* CONSENT / GET STARTED SECTION */}
      <section
        ref={consentRef}
        id="consent"
        className="relative scroll-mt-20 border-t border-line bg-night2/30 py-20 sm:py-28"
      >
        <BackgroundFX />
        <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
          <AnimatePresence mode="wait">
            {!located ? (
              <motion.div
                key="consent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="mx-auto mb-10 max-w-2xl text-center">
                  <span className="chip border border-line2 bg-panel2 font-mono uppercase tracking-widest text-mint">
                    Ready when you are
                  </span>
                  <h2 className="mt-4 font-display text-3xl font-semibold text-snow sm:text-4xl">
                    Grant one permission for a better experience
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-fog">
                    Here&apos;s everything we ask for, why, and exactly who can see it —
                    before you decide.
                  </p>
                </div>
                <LocationConsent onLocated={setLocated} />
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="mx-auto flex max-w-2xl flex-col items-center text-center"
              >
                <div className="relative">
                  <Radar success size="lg" />
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 16 }}
                    className="absolute -bottom-2 -right-2 grid h-12 w-12 place-items-center rounded-full bg-mint text-night shadow-glow"
                  >
                    <CheckBig />
                  </motion.span>
                </div>
                <h2 className="mt-10 font-display text-4xl font-semibold text-snow">
                  Location successfully verified
                </h2>
                <p className="mt-4 max-w-md text-base leading-relaxed text-fog">
                  You&apos;re all set. Your location has been securely received and you&apos;re
                  ready to go. Your exact coordinates remain private — never shown to
                  other visitors, and only reviewable by an authorized owner.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <span className="chip border border-mint/25 bg-mint/10 text-mint">
                    <span className="h-1.5 w-1.5 rounded-full bg-mint" />
                    Securely received
                  </span>
                  <span className="chip border border-line2 bg-panel2 text-fog">Private by design</span>
                </div>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Link to="/demo" className="btn-primary w-full sm:w-auto">
                    Continue to the demo →
                  </Link>
                  <button
                    onClick={() => {
                      setLocated(null)
                      scrollToConsent()
                    }}
                    className="btn-ghost w-full sm:w-auto"
                  >
                    {located.saveFailed ? 'Retry verification' : 'Start over'}
                  </button>
                </div>
                {located.saveFailed && (
                  <p className="mt-4 max-w-md rounded-xl border border-warning/25 bg-warning/10 px-4 py-3 text-sm text-warning">
                    Your location was detected, but we hit a temporary snag saving it.
                    You can retry — your details were not lost.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-line py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-5 text-center sm:flex-row sm:justify-between sm:px-8 sm:text-left">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-panel2 ring-1 ring-line">
                <PinMark className="h-5 w-5" />
              </span>
              <span className="font-display text-base text-snow">
                Locate<span className="text-mint">Me</span>
              </span>
            </div>
            <p className="max-w-xs text-xs leading-relaxed text-fog/70">
              Permission-first location verification, built on trust and handled
              responsibly.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 text-xs text-fog/70 sm:items-end">
            <p>
              Your location is only sent to our server after you allow it. Revoke it any
              time from your browser&apos;s site settings.
            </p>
            <p className="font-mono text-fog/50">LocateMe · privacy-first by design</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function TrustItem({ label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-mint">
        <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </span>
  )
}

function FloatingBadge({ className = '', icon, text, delay }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      animate={reduce ? undefined : { y: [0, -10, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: delay ? 1.2 : 0 }}
      className={`absolute z-10 hidden items-center gap-1.5 rounded-full border border-line2 bg-panel/80 px-3 py-1.5 text-xs font-medium text-cloud shadow-card backdrop-blur sm:inline-flex ${className}`}
    >
      <span className="text-mint">{icon}</span>
      {text}
    </motion.div>
  )
}

function ShieldS() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
      <path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6l-8-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}
function CheckS() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function LockS() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
      <rect x="5" y="10" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}
function CheckBig() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
