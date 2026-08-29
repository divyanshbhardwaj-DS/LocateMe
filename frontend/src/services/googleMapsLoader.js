/**
 * Lazy loader for the Google Maps JavaScript API.
 *
 * Only loads when a browser key is configured, so the app degrades gracefully
 * (to the existing Leaflet map) when no key is present.
 */

let loadPromise = null

function getKey() {
  return (import.meta.env.VITE_GOOGLE_MAPS_JS_KEY || '').trim()
}

export function hasGoogleMaps() {
  return !!getKey()
}

export function loadGoogleMaps(version = 'weekly') {
  const key = getKey()
  if (!key) return Promise.reject(new Error('no-key'))

  if (window.google && window.google.maps && window.google.maps.Map) {
    return Promise.resolve(window.google.maps)
  }

  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      key
    )}&v=${version}&libraries=marker`
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google && window.google.maps) resolve(window.google.maps)
      else reject(new Error('google-maps-load-failed'))
    }
    script.onerror = () => reject(new Error('google-maps-load-failed'))
    document.head.appendChild(script)
  })

  return loadPromise
}
