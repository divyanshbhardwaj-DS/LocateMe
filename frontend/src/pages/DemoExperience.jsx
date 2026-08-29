import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import LocationGate from '../components/LocationGate.jsx'
import BackgroundFX from '../components/BackgroundFX.jsx'

const REDIRECT_URL = 'https://www.nykaa.com'

/**
 * Route-level mandatory gate: the site opens straight into the location
 * requirement screen. Until a valid location is provided the user stays here
 * ("Location access is mandatory"). Once location is acquired — and securely
 * saved to the backend by LocationGate — we show a brief "Location confirmed ✓"
 * moment, then redirect the user to the real Nykaa site.
 */
export default function DemoExperience() {
  const reduceMotion = useReducedMotion()
  const [confirmed, setConfirmed] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    if (!confirmed) return
    setRedirecting(true)
    const t = setTimeout(() => {
      window.location.assign(REDIRECT_URL)
    }, reduceMotion ? 0 : 1200)
    return () => clearTimeout(t)
  }, [confirmed, reduceMotion])

  return (
    <div className="relative min-h-screen bg-night text-snow">
      <BackgroundFX />
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key="gate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex min-h-screen flex-col items-center justify-center px-5 py-16"
          >
            <BrandHead />
            <LocationGate onDone={() => setConfirmed(true)} />
            {redirecting && <RedirectingNote />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function RedirectingNote() {
  return (
    <motion.p
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-5 flex items-center gap-2 text-sm text-fog"
    >
      <span className="h-2 w-2 animate-ping rounded-full bg-mint" />
      Location confirmed — taking you to Nykaa…
    </motion.p>
  )
}

function BrandHead() {
  return (
    <div className="mb-8 flex flex-col items-center gap-3 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-panel2 ring-1 ring-line shadow-card">
        <PinMark />
      </span>
      <div>
        <p className="font-display text-2xl font-semibold tracking-tight text-snow">
          Locate<span className="text-mint">Me</span>
        </p>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-fog/70">
          Location-gated demo
        </p>
      </div>
    </div>
  )
}

function PinMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden>
      <path d="M12 21.5c4-4.7 6-8.1 6-11.2A6 6 0 0 0 6 10.3c0 3.1 2 6.5 6 11.2Z" stroke="url(#lg)" strokeWidth="1.8" fill="rgba(60,224,168,0.14)" />
      <circle cx="12" cy="10.3" r="2.1" fill="url(#lg)" />
      <defs>
        <linearGradient id="lg" x1="8" y1="6" x2="16" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3CE0A8" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
    </svg>
  )
}
