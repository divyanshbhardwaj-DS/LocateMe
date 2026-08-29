import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Radar from './Radar.jsx'
import { reverseGeocode, submitLocation } from '../services/locationApi.js'
import {
  acquireBestPosition,
  cancelAcquisition,
  queryPermission,
} from '../services/geoAcquire.js'
import { confirmDemoLocation, getDemoLocation } from '../services/locationStore.js'

/**
 * Minimal, polished location-requirement screen. The browser's native
 * permission dialog is only ever triggered by the user's explicit "Continue
 * with current location" action — never silently, disguised, or spoofed.
 *
 * state:
 *  intro      -> "Confirm your location" (mandatory copy + CTA)
 *  requesting -> "Finding your location…" (browser prompt active / acquiring fix)
 *  done       -> "Location confirmed ✓" then reveal the demo
 *  denied     -> "Location access is required" + "Try again" (+ settings guidance)
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
        setErrorDetail('We could not establish a location fix on this device.')
        return
      }
      setState('unavailable')
      setErrorDetail(err.message || 'Location unavailable.')
      return
    }

    const { latitude, longitude, accuracy } = position.position.coords
    const timestamp = position.position.timestamp

    // Reverse-geocode for a safer, human-readable display area only.
    let city = null
    let area = null
    try {
      const geo = await reverseGeocode(latitude, longitude)
      city = geo.city || null
      area = geo.address || null
    } catch {
      /* geocoding is best-effort — the demo still proceeds */
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

    // Best-effort secure submission to the backend; the demo proceeds regardless.
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
        {/* Sticky subject: stay on the gate until a valid location exists. */}
        {!getDemoLocation().confirmed && <GateStickyHead />}

        <AnimatePresence mode="wait">
          {state === 'intro' && (
            <motion.div key="intro" {...fade} className="text-center">
              <span className="chip border border-line2 bg-panel2 text-mint">
                <span className="h-1.5 w-1.5 rounded-full bg-mint animate-pulse" />
                Location access is mandatory
              </span>
              <h2 className="mt-6 font-display text-3xl font-semibold text-snow sm:text-4xl">
                Send your location to continue
              </h2>
              <p className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-fog">
                Your current location is required to continue. You&apos;ll be redirected
                to Nykaa the moment we confirm it.
              </p>
              <button onClick={requestLocation} className="btn-primary mt-9 w-full">
                <PinIcon />
                Continue with current location
              </button>
              <p className="mt-4 text-xs leading-relaxed text-fog/80">
                Nothing is collected until you allow it, and you&apos;ll stay on this
                screen until your location is confirmed.
              </p>
            </motion.div>
          )}

          {state === 'requesting' && (
            <motion.div key="requesting" {...fade} className="flex flex-col items-center py-6 text-center">
              <Radar active />
              <h2 className="mt-8 font-display text-2xl font-semibold text-snow sm:text-3xl">
                Finding your location…
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-fog">
                Confirm the permission in the prompt your browser just showed. For the
                best accuracy, keep location services on.
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
              <div className="relative">
                <Radar success />
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: reduceMotion ? 0 : 0.3, type: 'spring', stiffness: 300, damping: 18 }}
                  className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-mint text-night shadow-glow"
                >
                  <CheckIcon />
                </motion.span>
              </div>
              <h2 className="mt-8 font-display text-3xl font-semibold text-snow">
                Location confirmed ✓
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-fog">
                You&apos;re all set. Opening your personalized demo…
              </p>
            </motion.div>
          )}

          {state === 'denied' && (
            <motion.div key="denied" {...fade} className="flex flex-col items-center text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-danger/10 text-danger ring-1 ring-danger/25">
                <DenyIcon />
              </div>
              <h2 className="mt-6 font-display text-2xl font-semibold text-snow sm:text-3xl">
                Location access is required
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-fog">
                Please enable location access to continue.
              </p>
              <div className="mt-5 w-full max-w-sm space-y-2 rounded-2xl border border-line bg-panel2/60 p-4 text-left font-mono text-xs text-fog">
                <p className="text-cloud">To restore access:</p>
                <p className="text-fog/70">Browser settings → Site permissions → Location → Allow (and Precise).</p>
                <p className="text-fog/50">On phones also check System Settings → Privacy → Location services.</p>
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
                Finding your exact position timed out — often just a weak signal. You
                can safely try again.
              </p>
              <button onClick={requestLocation} className="btn-primary mt-6 w-full">
                Try again
              </button>
            </motion.div>
          )}

          {state === 'unavailable' && (
            <motion.div key="unavailable" {...fade} className="flex flex-col items-center text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-warning/10 text-warning ring-1 ring-warning/25">
                <PinIcon />
              </div>
              <h2 className="mt-6 font-display text-2xl font-semibold text-snow sm:text-3xl">
                Location is unavailable
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-fog">
                We couldn&apos;t determine your position. Please check that GPS or
                location services are enabled and that you have a connection.
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

      <p className="mt-4 max-w-xs text-center text-xs leading-relaxed text-fog/70">
        A valid location is required to enter this demo. Your exact coordinates are
        never shown here.
      </p>
    </div>
  )
}

function GateStickyHead() {
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

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
      <path d="M12 21.5c4-4.7 6-8.1 6-11.2A6 6 0 0 0 6 10.3c0 3.1 2 6.5 6 11.2Z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="10.3" r="2" fill="currentColor" />
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function DenyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" aria-hidden>
      <path d="M12 21.5c4-4.7 6-8.1 6-11.2A6 6 0 0 0 6 10.3c0 3.1 2 6.5 6 11.2Z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="10.3" r="2" fill="currentColor" />
      <path d="m9 7 6 6M15 7l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
