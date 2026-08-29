/**
 * High-accuracy location acquisition pipeline.
 *
 * Instead of accepting the first reading from `getCurrentPosition`, this:
 *   1. (optionally) pre-checks permission state via the Permissions API
 *   2. starts a high-accuracy `watchPosition` watcher
 *   3. collects multiple readings over a capped time window
 *   4. evaluates each reading's reported `accuracy`
 *   5. selects the best reliable reading (lowest accuracy, with outlier guards)
 *   6. clears the watcher and returns the final result
 *
 * It never fabricates coordinates and never claims an exact position — it
 * simply allows the device's positioning to settle toward its best real fix.
 */

// UX quality tiers (indicators, not guarantees).
export const ACCURACY_QUALITY = [
  { max: 10, tier: 'excellent', label: 'Excellent' },
  { max: 25, tier: 'good', label: 'Good' },
  { max: 50, tier: 'acceptable', label: 'Acceptable' },
  { max: Infinity, tier: 'poor', label: 'Poor' },
]

export function qualityTier(accuracy) {
  if (typeof accuracy !== 'number' || !isFinite(accuracy)) return 'unknown'
  for (const q of ACCURACY_QUALITY) {
    if (accuracy <= q.max) return q.tier
  }
  return 'poor'
}

export function tierLabel(tier) {
  const map = {
    excellent: 'Excellent',
    good: 'Good',
    acceptable: 'Acceptable',
    poor: 'Poor',
    unknown: 'Unknown',
  }
  return map[tier] || 'Unknown'
}

// Backward-compatible alias returning a human label for an accuracy value.
export function accuracyQuality(accuracy) {
  return tierLabel(qualityTier(accuracy))
}

// Stop as soon as we reach a "good" fix (<= 25m).
const ACCEPT_ACCURACY = 25
// Minimum number of readings before we finalize, so a single lucky fix is guarded.
const MIN_READINGS = 3
// Hard cap on the acquisition window (ms) — never leave the user waiting forever.
const MAX_WINDOW = 20000
// The single-call timeout handed to the browser for the initial fix.
const FIX_TIMEOUT = 15000
// After best accuracy stops improving for this long, finalize with best-available.
const SETTLE_MS = 1300
// Safety cap — never retain more than this many raw readings (avoids waste).
const MAX_READINGS = 40
// A "fresh" reading must not be older than this (ms) at acquisition time.
const MAX_STALENESS_MS = 120000
// A reading that snaps more than this (meters) from the running best in one
// step is treated as an anomaly and ignored unless it keeps reappearing.
const ANOMALY_JUMP_M = 150

let currentWatchId = null
let cancelSignal = null

/** Abort an in-progress acquisition and release the watcher. */
export function cancelAcquisition() {
  if (cancelSignal) cancelSignal()
}

/**
 * Resolve true/false/unsupported for the geolocation permission state.
 * Returns one of: 'granted' | 'prompt' | 'denied' | 'unsupported'
 */
export async function queryPermission() {
  try {
    if (!navigator.permissions || !navigator.permissions.query) return 'unsupported'
    const status = await navigator.permissions.query({ name: 'geolocation' })
    return status.state
  } catch {
    return 'unsupported'
  }
}

function cleanCoords(c) {
  return {
    latitude: c.latitude,
    longitude: c.longitude,
    accuracy: typeof c.accuracy === 'number' && isFinite(c.accuracy) ? c.accuracy : null,
    altitude: typeof c.altitude === 'number' && isFinite(c.altitude) ? c.altitude : null,
    altitudeAccuracy:
      typeof c.altitudeAccuracy === 'number' && isFinite(c.altitudeAccuracy) ? c.altitudeAccuracy : null,
    heading: typeof c.heading === 'number' && isFinite(c.heading) ? c.heading : null,
    speed: typeof c.speed === 'number' && isFinite(c.speed) ? c.speed : null,
  }
}

function isValidCoordinates(coords) {
  return (
    coords &&
    typeof coords.latitude === 'number' &&
    isFinite(coords.latitude) &&
    coords.latitude >= -90 &&
    coords.latitude <= 90 &&
    typeof coords.longitude === 'number' &&
    isFinite(coords.longitude) &&
    coords.longitude >= -180 &&
    coords.longitude <= 180
  )
}

function isFresh(timestamp) {
  if (!timestamp) return true
  const age = Date.now() - timestamp
  return age >= -10000 && age <= MAX_STALENESS_MS
}

// Haversine distance in meters between two coordinate pairs.
function distanceMeters(a, b) {
  const R = 6371000
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180
  const la1 = (a.latitude * Math.PI) / 180
  const la2 = (b.latitude * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// A reading is kept only if it is plausible: valid coords, fresh timestamp,
// and (once we have a baseline) not an unphysical one-step jump.
function isUsableReading(reading, baseline) {
  if (!isValidCoordinates(reading.coords)) return false
  if (!isFresh(reading.timestamp)) return false
  if (baseline && distanceMeters(reading.coords, baseline.coords) > ANOMALY_JUMP_M) {
    return false
  }
  return true
}

function pickBest(readings) {
  // Prefer the reading with the lowest reported accuracy (finest fix).
  const valid = readings.filter((r) => r.coords.accuracy != null && isValidCoordinates(r.coords))
  if (!valid.length) return null
  return [...valid].sort((a, b) => a.coords.accuracy - b.coords.accuracy)[0]
}

/**
 * Acquire the best reliable location.
 *
 * Keeps collecting readings while the reported accuracy is still improving, and
 * only locks in once a good threshold is reached or the fix stops improving
 * (settle). If `watchPosition` never yields a usable fix, it falls back to a
 * single high-accuracy `getCurrentPosition` call so we still obtain the best
 * position the device can offer rather than failing outright.
 *
 * @param {{onProgress?: (best: {accuracy: number, timestamp: number, tier: string}) => void}} opts
 * @returns {Promise<{position, readings, source: string, quality: string, quality_label: string, acquisition_ms: number, status: string}>}
 */
export function acquireBestPosition(opts = {}) {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('unsupported'))
      return
    }

    const readings = []
    const startedAt = Date.now()
    let watcherId = null
    let settleTimer = null
    let previousBestAccuracy = Infinity
    let finalized = false
    let fallbackTried = false
    let establishedBest = null

    const finish = () => {
      if (finalized) return
      finalized = true
      clearTimeout(windowTimer)
      if (settleTimer) clearTimeout(settleTimer)
      if (watcherId != null) {
        navigator.geolocation.clearWatch(watcherId)
        watcherId = null
      }
      const best = pickBest(readings)
      if (!best) {
        reject(new Error('no-fix'))
        return
      }
      const quality = qualityTier(best.coords.accuracy)
      resolve({
        position: best,
        readings,
        source: 'browser_high_accuracy',
        quality,
        quality_label: tierLabel(quality),
        acquisition_ms: Date.now() - startedAt,
        status: quality === 'excellent' || quality === 'good' ? 'confirmed' : 'approximate',
      })
    }

    const windowTimer = setTimeout(() => finish(), MAX_WINDOW)

    cancelSignal = () => {
      if (finalized) return
      finalized = true
      clearTimeout(windowTimer)
      if (settleTimer) clearTimeout(settleTimer)
      if (watcherId != null) {
        navigator.geolocation.clearWatch(watcherId)
        watcherId = null
      }
      reject(new Error('cancelled'))
    }

    function handleReading(pos) {
      if (finalized) return

      const candidate = {
        coords: cleanCoords(pos.coords),
        timestamp: pos.timestamp || Date.now(),
      }
      // Reject invalid coordinates, stale timestamps, and acute one-step jumps
      // from an already-established best — unless the new point is clearly and
      // substantially better (e.g. a Wi-Fi fix refining to a GPS fix).
      if (!isValidCoordinates(candidate.coords)) return
      if (!isFresh(candidate.timestamp)) return
      if (
        establishedBest &&
        !isUsableReading(candidate, establishedBest) &&
        !(
          candidate.coords.accuracy != null &&
          establishedBest.coords.accuracy != null &&
          candidate.coords.accuracy <= establishedBest.coords.accuracy / 2
        )
      ) {
        return
      }
      if (readings.length < MAX_READINGS) readings.push(candidate)

      const best = pickBest(readings)
      if (opts.onProgress && best) {
        opts.onProgress({
          accuracy: best.coords.accuracy,
          timestamp: best.timestamp,
          tier: qualityTier(best.coords.accuracy),
        })
      }
      if (!best) return
      establishedBest = best

      const accuracy = best.coords.accuracy
      const improved = accuracy < previousBestAccuracy
      previousBestAccuracy = accuracy

      if (settleTimer) clearTimeout(settleTimer)

      // watchPosition failed on this device — a single fallback reading is the
      // best we can get, so finalize promptly instead of waiting for more.
      if (fallbackTried) {
        settleTimer = setTimeout(finish, 400)
        return
      }

      // Good enough fix → lock it in shortly, so GPS can confirm before we stop.
      if (readings.length >= MIN_READINGS && accuracy <= ACCEPT_ACCURACY) {
        settleTimer = setTimeout(finish, 900)
        return
      }

      // Not yet good enough: keep collecting while accuracy improves. If it has
      // stalled (not improving), settle with the best we have after a pause.
      if (readings.length >= MIN_READINGS) {
        const wait = improved ? SETTLE_MS : Math.min(SETTLE_MS * 2, 2600)
        settleTimer = setTimeout(finish, wait)
      }
    }

    function handleError(err) {
      if (finalized) return
      // If we already have a usable fix, keep the best of it rather than failing.
      const best = pickBest(readings)
      if (best) {
        finish()
        return
      }

      // No fix from watchPosition: some devices/webviews only support a one-shot
      // request. Fall back to a single high-accuracy getCurrentPosition so we
      // still obtain the best position the browser can offer instead of failing.
      if (!fallbackTried) {
        fallbackTried = true
        navigator.geolocation.getCurrentPosition(
          (pos) => handleReading(pos),
          (err2) => {
            if (finalized) return
            finalized = true
            clearTimeout(windowTimer)
            if (settleTimer) clearTimeout(settleTimer)
            reject(err2)
          },
          { enableHighAccuracy: true, timeout: FIX_TIMEOUT, maximumAge: 0 }
        )
        return
      }

      finalized = true
      clearTimeout(windowTimer)
      if (settleTimer) clearTimeout(settleTimer)
      if (watcherId != null) {
        navigator.geolocation.clearWatch(watcherId)
        watcherId = null
      }
      reject(err)
    }

    if (currentWatchId != null) {
      // Guard: never leave a stale watcher from a previous run alive.
      navigator.geolocation.clearWatch(currentWatchId)
    }
    watcherId = currentWatchId = navigator.geolocation.watchPosition(
      handleReading,
      handleError,
      { enableHighAccuracy: true, timeout: FIX_TIMEOUT, maximumAge: 0 }
    )
  })
}
