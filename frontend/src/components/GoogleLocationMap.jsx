import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps, hasGoogleMaps } from '../services/googleMapsLoader.js'

/**
 * Single-location Google Map with a marker at the exact captured coordinates and
 * an accuracy circle corresponding to the reported coords.accuracy.
 * When no Google key is configured, renders a graceful note that a key is needed.
 */
export default function GoogleLocationMap({ latitude, longitude, accuracy, label }) {
  const containerRef = useRef(null)
  const [status, setStatus] = useState(hasGoogleMaps() ? 'loading' : 'missing-key')

  useEffect(() => {
    if (!hasGoogleMaps()) {
      setStatus('missing-key')
      return
    }
    let map = null
    let marker = null
    let accuracyCircle = null
    let infoWindow = null
    let cancelled = false

    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !containerRef.current) return
        setStatus('ready')

        map = new google.maps.Map(containerRef.current, {
          center: { lat: latitude, lng: longitude },
          zoom: 16,
          mapTypeId: 'roadmap',
          fullscreenControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          zoomControl: true,
          disableDefaultUI: false,
        })

        const position = { lat: latitude, lng: longitude }

        if (typeof google.maps.marker !== 'undefined') {
          marker = new google.maps.marker.AdvancedMarkerElement({ map, position })
        } else {
          marker = new google.maps.Marker({ map, position })
        }

        if (accuracy && accuracy > 0) {
          accuracyCircle = new google.maps.Circle({
            map,
            center: position,
            radius: accuracy,
            fillColor: '#3CE0A8',
            fillOpacity: 0.12,
            strokeColor: '#3CE0A8',
            strokeOpacity: 0.5,
            strokeWeight: 1,
          })
        }

        if (label) {
          infoWindow = new google.maps.InfoWindow({ content: label })
          marker.addListener('click', () => infoWindow.open(map, marker))
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [latitude, longitude, accuracy, label])

  if (status === 'missing-key') {
    return (
      <div className="flex h-[260px] w-full items-center justify-center rounded-2xl border border-dashed border-line2 bg-panel/50 px-6 text-center font-body text-sm text-fog">
        Google Map unavailable — add a Google Maps JS API key to view it.
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex h-[260px] w-full items-center justify-center rounded-2xl border border-dashed border-line2 bg-panel/50 px-6 text-center font-body text-sm text-fog">
        We couldn&apos;t load the Google Map (check your API key &amp; referrer restriction).
      </div>
    )
  }

  return <div ref={containerRef} className="h-[260px] w-full rounded-2xl" />
}
