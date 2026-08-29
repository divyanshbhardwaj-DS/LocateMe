import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import LocationGate from '../components/LocationGate.jsx'
import BackgroundFX from '../components/BackgroundFX.jsx'

const REDIRECT_URL = 'https://www.nykaa.com'

/**
 * Entry screen: the site opens straight here on a clean, minimal card. The
 * user continues, the browser permission resolves, and we send them on to the
 * partner store. No brand, no product page — just a simple redirect flow.
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
    }, reduceMotion ? 0 : 1000)
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
      Redirecting you now…
    </motion.p>
  )
}
