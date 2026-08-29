import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect } from 'react'

// Fix default marker icon path issue with bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const customIcon = L.divIcon({
  className: '',
  html: `<div style="position:relative;width:26px;height:26px">
           <span style="position:absolute;inset:0;border-radius:9999px;background:rgba(60,224,168,0.3);animation:ping2 1.8s cubic-bezier(0,0,0.2,1) infinite"></span>
           <span style="position:relative;display:grid;place-items:center;width:26px;height:26px;border-radius:9999px;border:2px solid #3CE0A8;background:#0F1626;box-shadow:0 0 14px rgba(60,224,168,0.5)">
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 21.5c4-4.7 6-8.1 6-11.2A6 6 0 0 0 6 10.3c0 3.1 2 6.5 6 11.2Z" fill="#3CE0A8"/><circle cx="12" cy="10.3" r="2.1" fill="#070B14"/></svg>
           </span>
         </div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  popupAnchor: [0, -24],
})

function Recenter({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], map.getZoom())
  }, [lat, lng])
  return null
}

function SingleLocationMap({ latitude, longitude, accuracy, label }) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={15}
      style={{ height: '260px', width: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude, longitude]} icon={customIcon}>
        {label && <Popup>{label}</Popup>}
      </Marker>
      {accuracy && (
        <Circle
          center={[latitude, longitude]}
          radius={accuracy}
          pathOptions={{ color: '#3CE0A8', fillColor: '#3CE0A8', fillOpacity: 0.12 }}
        />
      )}
      <Recenter lat={latitude} lng={longitude} />
    </MapContainer>
  )
}

function MultiLocationMap({ locations, onSelect }) {
  if (!locations.length) {
    return (
      <div className="flex h-[320px] w-full items-center justify-center rounded-2xl border border-dashed border-line2 bg-panel/50 font-body text-sm text-fog">
        No submissions yet
      </div>
    )
  }

  const center = [locations[0].latitude, locations[0].longitude]

  return (
    <MapContainer center={center} zoom={5} style={{ height: '380px', width: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map((loc) => (
        <Marker
          key={loc.id}
          position={[loc.latitude, loc.longitude]}
          icon={customIcon}
          eventHandlers={{ click: () => onSelect && onSelect(loc) }}
        >
          <Popup>
            <div style={{ fontFamily: 'Inter, sans-serif', minWidth: '160px' }}>
              <p style={{ margin: 0, fontWeight: 700, color: '#141D31' }}>
                Submission #{loc.id}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#4b5b76' }}>
                {loc.city || '—'}
                {loc.state ? `, ${loc.state}` : ''}
                {loc.country ? ` · ${loc.country}` : ''}
              </p>
              <p style={{ margin: '6px 0 0', fontFamily: 'DM Mono, monospace', fontSize: '11px', color: '#0F1626' }}>
                {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
              </p>
              {loc.accuracy && (
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#6b7d99' }}>
                  Accuracy: ~{Math.round(loc.accuracy)}m
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

export { SingleLocationMap, MultiLocationMap }
