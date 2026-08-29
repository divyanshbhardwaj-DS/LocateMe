import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Radar from './Radar.jsx'
import { reverseGeocode, submitLocation } from '../services/locationApi.js'
import {
  acquireBestPosition,
  cancelAcquisition,
  queryPermission,
} from '../services/geoAcquire.js'

/**
 * states:
 *  intro        -> consent education screen (before any permission prompt)
 *  requesting   -> browser permission prompt active / acquiring a first fix
 *  granted      -> multiple readings being refined towards best accuracy
 *  done         -> captured & submitted (success summary)
 *  denied | unavailable | timeout -> handled error states with guidance
 */
export default function LocationConsent({ onLocated }) {
  const [state, setState] = useState('intro')
  const [errorDetail, setErrorDetail] = useState('')
  const [bestAccuracy, setBestAccuracy] = useState(null)
  const [readsSoFar, setReadsSoFar] = useState(0)
  const [treatedAsRequired, setTreatedAsRequired] = useState(true)
  const reduceMotion = useReducedMotion()

  // Release the geolocation watcher if the user leaves mid-acquisition.
  useEffect(() => {
    return () => cancelAcquisition()
  }, [])

  const requestLocation = useCallback(async () => {
    setState('requesting')
    setErrorDetail('')
    setBestAccuracy(null)
    setReadsSoFar(0)

    if (!('geolocation' in navigator)) {
      setState('unavailable')
      setErrorDetail('This browser does not expose the Geolocation API.')
      return
    }

    // Avoid nagging when the browser has already permanently denied access.
    const perm = await queryPermission()
    if (perm === 'denied') {
      setState('denied')
      return
    }

    let position
    try {
      position = await acquireBestPosition({
        onProgress: ({ accuracy }) => {
          setState('granted')
          setBestAccuracy(accuracy)
          setReadsSoFar((n) => n + 1)
        },
      })
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

    let geo = {}
    let geocodeFailed = false
    try {
      geo = await reverseGeocode(latitude, longitude)
    } catch {
      geocodeFailed = true
    }

    const record = {
      latitude,
      longitude,
      accuracy,
      source: position.source,
      captured_at: new Date(timestamp).toISOString(),
      ...geo,
    }

    let saveFailed = false
    try {
      await submitLocation(record)
    } catch {
      saveFailed = true
    }

    setState('done')
    // Only forward a safe summary to the page — never raw coordinates
    onLocated({ success: !saveFailed, saveFailed, geocodeFailed })
  }, [onLocated])

  return (
    <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-10 md:flex-row md:items-start md:gap-14">
      {/* Left column: consent card */}
      <div className="w-full flex-1">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-panel/70 p-7 shadow-card backdrop-blur-xl sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-mint/10 blur-[80px]" />
          <AnimatePresence mode="wait">
            {state === 'intro' && (
              <motion.div
                key="intro"
                {...fade}
              >
                <span className="chip border border-line2 bg-panel2 text-mint">
                  <span className="h-1.5 w-1.5 rounded-full bg-mint animate-pulse" />
                  Permission-first · transparent
                </span>
                <h2 className="mt-5 font-display text-3xl font-semibold leading-tight text-snow sm:text-4xl">
                  One small permission.
                  <br />
                  A better experience.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-fog">
                  Your location lets LocateMe deliver accurate, personalized
                  on-the-ground information. It&apos;s the single reason we ever ask.
                  Nothing more, nothing hidden.
                </p>

                <div className="mt-7 space-y-3">
                  <ReasonRow
                    icon={<WhyIcon />}
                    title="Why we need it"
                    text="To show you the right, real-time details for where you actually are."
                  />
                  <ReasonRow
                    icon={<PrivacyIcon />}
                    title="Your privacy"
                    text="Your location is used only for this purpose, then stored securely."
                  />
                  <ReasonRow
                    icon={<LockIcon />}
                    title="Who can see it"
                    text="Your exact location is private — not shown to other visitors, ever."
                  />
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button onClick={requestLocation} className="btn-primary w-full sm:w-auto">
                    <DotIcon />
                    Allow location access
                  </button>
                  <button onClick={() => setTreatedAsRequired((v) => !v)} className="btn-ghost w-full sm:w-auto">
                    {treatedAsRequired ? 'Not now' : 'Still need it?'}
                  </button>
                </div>

                {treatedAsRequired && (
                  <p className="mt-4 text-xs leading-relaxed text-fog/80">
                    Location access is genuinely required to continue — it&apos;s how we
                    match the right on-the-ground information to you. You can change or
                    revoke this any time in your browser&apos;s site settings.
                  </p>
                )}
              </motion.div>
            )}

            {state === 'requesting' && (
              <motion.div key="requesting" {...fade} className="flex flex-col items-center py-4 text-center">
                <Radar active />
                <h2 className="mt-8 font-display text-2xl font-semibold text-snow sm:text-3xl">
                  Establishing your location…
                </h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-fog">
                  Confirm permission in the prompt your browser just showed. For the best
                  accuracy, make sure device location services are on and you&apos;re near a
                  window or outdoors if you can.
                </p>
                <div className="mt-6 flex w-full max-w-sm items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel2">
                    <motion.div
                      initial={{ width: '10%' }}
                      animate={reduceMotion ? { width: '60%' } : { width: '100%' }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-mint to-mint2"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {state === 'granted' && (
              <motion.div key="granted" {...fade} className="flex flex-col items-center py-4 text-center">
                <Radar active />
                <h2 className="mt-8 font-display text-2xl font-semibold text-snow sm:text-3xl">
                  Refining precise location…
                </h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-fog">
                  Giving GPS a moment to stabilize for the most accurate fix.
                  {bestAccuracy != null && readsSoFar > 0 && (
                    <> Current best ~<span className="font-medium text-snow">{Math.round(bestAccuracy)} m</span> precision.</>
                  )}
                </p>
                <div className="mt-6 w-full max-w-sm space-y-2">
                  <div className="flex items-center justify-between font-mono text-[11px] text-fog/70">
                    <span>Readings collected</span>
                    <span className="text-mint">{readsSoFar}</span>
                  </div>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={reduceMotion ? { width: '70%' } : { width: '100%' }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-mint to-mint2"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {state === 'done' && (
              <motion.div key="done" {...fade} className="flex flex-col items-center py-4 text-center">
                <div className="relative">
                  <Radar success />
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: reduceMotion ? 0 : 0.3, type: 'spring', stiffness: 300, damping: 18 }}
                    className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-mint text-night shadow glow"
                  >
                    <CheckIcon />
                  </motion.span>
                </div>
                <h2 className="mt-8 font-display text-3xl font-semibold text-snow">
                  You&apos;re all set.
                </h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-fog">
                  Your location has been securely received. Everything from here on uses
                  it to give you the most accurate, on-the-ground experience.
                </p>
              </motion.div>
            )}

            {state === 'denied' && (
              <motion.div key="denied" {...fade} className="flex flex-col items-center text-center">
                <StateIcon kind="denied" />
                <h2 className="mt-6 font-display text-2xl font-semibold text-snow sm:text-3xl">
                  Location access was blocked
                </h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-fog">
                  We understand — no pressure. To use this experience, allow location
                  for this site in your browser settings, then try again.
                </p>
                <div className="mt-6 w-full max-w-sm space-y-2 rounded-2xl border border-line bg-panel2/60 p-4 text-left font-mono text-xs text-fog">
                  <p className="text-cloud">Enable precise location:</p>
                  <p className="text-fog/70">Browser settings → Site permissions → Location → Allow (and Precise).</p>
                  <p className="text-fog/50">On phones also check system Settings → Privacy → Location services.</p>
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button onClick={requestLocation} className="btn-primary w-full sm:w-auto">
                    Try again
                  </button>
                </div>
              </motion.div>
            )}

            {state === 'timeout' && (
              <motion.div key="timeout" {...fade} className="flex flex-col items-center text-center">
                <StateIcon kind="timeout" />
                <h2 className="mt-6 font-display text-2xl font-semibold text-snow sm:text-3xl">
                  That took a little long
                </h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-fog">
                  Finding your exact position timed out — often just a weak signal.
                  You can safely try again.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button onClick={requestLocation} className="btn-primary w-full sm:w-auto">
                    Try again
                  </button>
                </div>
              </motion.div>
            )}

            {state === 'unavailable' && (
              <motion.div key="unavailable" {...fade} className="flex flex-col items-center text-center">
                <StateIcon kind="unavailable" />
                <h2 className="mt-6 font-display text-2xl font-semibold text-snow sm:text-3xl">
                  Location unavailable on this device
                </h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-fog">
                  We couldn&apos;t determine your position. Please check that GPS or
                  location services are enabled, this site has permission, and you have
                  a connection.
                </p>
                {errorDetail && (
                  <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2 font-mono text-xs text-danger">
                    {errorDetail}
                  </p>
                )}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button onClick={requestLocation} className="btn-primary w-full sm:w-auto">
                    Try again
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right column: trust / reassurance panel (desktop) */}
      <div className="hidden w-72 shrink-0 flex-col gap-4 md:flex">
        <TrustCard
          icon={<ShieldIcon />}
          title="Private by design"
          text="Your location is never shown to other visitors, surfaced publicly, or exposed in the normal experience."
        />
        <TrustCard
          icon={<EyeIcon />}
          title="You stay in control"
          text="One clear prompt. Approve once, or decline and revoke any time from your browser's settings."
        />
        <TrustCard
          icon={<ClockIcon />}
          title="Only what's needed"
          text="We collect just the location you choose to share — nothing more, for one stated purpose."
        />
      </div>
    </div>
  )
}

/* ---------- small building blocks ---------- */

const fade = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.32, ease: 'easeOut' },
}

function ReasonRow({ icon, title, text }) {
  return (
    <div className="flex items-start gap-3.5 rounded-2xl border border-line bg-panel2/50 p-3.5 transition-colors hover:border-line2">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-mint/10 text-mint ring-1 ring-mint/20">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-snow">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-fog">{text}</p>
      </div>
    </div>
  )
}

function TrustCard({ icon, title, text }) {
  return (
    <div className="rounded-2xl border border-line bg-panel/60 p-4 backdrop-blur">
      <div className="mb-2 grid h-9 w-9 place-items-center rounded-lg bg-mint/10 text-mint ring-1 ring-mint/20">
        {icon}
      </div>
      <p className="text-sm font-semibold text-snow">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-fog">{text}</p>
    </div>
  )
}

function StateIcon({ kind }) {
  const map = {
    denied: { c: 'text-danger', ring: 'ring-danger/25', bg: 'bg-danger/10' },
    unavailable: { c: 'text-warning', ring: 'ring-warning/25', bg: 'bg-warning/10' },
    timeout: { c: 'text-warning', ring: 'ring-warning/25', bg: 'bg-warning/10' },
  }[kind]
  return (
    <div className={`grid h-16 w-16 place-items-center rounded-2xl ${map.bg} ${map.ring} ring-1`}>
      <svg viewBox="0 0 24 24" fill="none" className={`h-8 w-8 ${map.c}`}>
        <path
          d="M12 21.5c4-4.7 6-8.1 6-11.2A6 6 0 0 0 6 10.3c0 3.1 2 6.5 6 11.2Z"
          stroke="currentColor"
          strokeWidth="1.6"
          fill="none"
        />
        <circle cx="12" cy="10.3" r="2" fill="currentColor" />
      </svg>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DotIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
      <path
        d="M12 21.5c4-4.7 6-8.1 6-11.2A6 6 0 0 0 6 10.3c0 3.1 2 6.5 6 11.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="rgba(7,11,20,0.2)"
      />
      <circle cx="12" cy="10.3" r="2" fill="currentColor" />
    </svg>
  )
}

function WhyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 16v-4m0-3.5v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function PrivacyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6l-8-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <rect x="5" y="10" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}
function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6l-8-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}
function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
