import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { fetchLocations, fetchStats } from '../services/locationApi.js'
import { MultiLocationMap } from '../components/LocationMap.jsx'
import GoogleLocationMap from '../components/GoogleLocationMap.jsx'
import LoadingState from '../components/LoadingState.jsx'
import BackgroundFX from '../components/BackgroundFX.jsx'
import { PinMark } from '../components/Nav.jsx'

const ease = [0.16, 1, 0.3, 1]

export default function Dashboard() {
  const [locations, setLocations] = useState([])
  const [stats, setStats] = useState(null)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()

  // Live refresh: poll the backend while the dashboard is open so a newly
  // granted location appears in near real-time without extra infrastructure.
  useEffect(() => {
    let active = true
    let interval

    async function load(silent) {
      try {
        const [locs, s] = await Promise.all([fetchLocations(), fetchStats()])
        if (!active) return
        setLocations(locs)
        setStats(s)
        setLoadError(false)
      } catch (err) {
        if (!active) return
        if (err.message === 'unauthorized') {
          localStorage.removeItem('locateme_token')
          navigate('/admin/login')
        } else {
          setLoadError(true)
        }
      } finally {
        if (active && !silent) setLoading(false)
      }
    }

    load(false)
    // Background refresh every 6s. If the error screen is showing, a manual
    // "Retry" already re-reads on mount — stop polling to avoid hammering.
    interval = setInterval(() => load(true), 6000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [navigate])

  const logout = () => {
    localStorage.removeItem('locateme_token')
    navigate('/admin/login')
  }

  const cities = useMemo(() => {
    const set = new Set(locations.map((l) => l.city || l.country).filter(Boolean))
    return set.size
  }, [locations])

  return (
    <div className="relative min-h-screen bg-night pb-16">
      <BackgroundFX />

      {/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-panel2 ring-1 ring-line">
              <PinMark className="h-6 w-6" />
            </span>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-mint">LocateMe · Owner</p>
              <h1 className="font-display text-lg font-semibold text-snow">Location dashboard</h1>
            </div>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-panel2/60 px-4 py-2 text-sm font-medium text-fog transition-colors hover:border-line2 hover:text-snow"
          >
            <LogoutIcon />
            Sign out
          </button>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-5 pt-8 sm:px-8">
        {loading ? (
          <LoadingState label="Loading your dashboard…" />
        ) : loadError ? (
          <div className="mx-auto mt-16 max-w-md rounded-3xl border border-danger/25 bg-danger/5 p-10 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-danger/10 text-danger">
              <WarnIcon />
            </div>
            <h2 className="font-display text-xl font-semibold text-snow">Couldn&apos;t load your data</h2>
            <p className="mt-2 text-sm leading-relaxed text-fog">
              We hit a problem reaching the server. Please check your connection and try again.
            </p>
            <button onClick={() => { setLoading(true); setLoadError(false); window.location.reload() }} className="btn-primary mt-6">
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Overview stats */}
            <section aria-label="Overview">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  icon={<PinStatIcon />}
                  label="Total submissions"
                  value={stats?.total_locations ?? locations.length}
                  note="Location records collected"
                  delay={0}
                />
                <StatCard
                  icon={<ClockStatIcon />}
                  label="Latest submission"
                  value={locations[0] ? timeAgo(locations[0].created_at) : '—'}
                  note={locations[0]?.city ? `from ${locationLabel(locations[0])}` : 'No activity yet'}
                  delay={0.06}
                />
                <StatCard
                  icon={<GlobeStatIcon />}
                  label="Locations mapped"
                  value={locations.length ? 'Live' : '—'}
                  note={`${cities} ${cities === 1 ? 'place' : 'places'} covered`}
                  delay={0.12}
                />
                <StatCard
                  icon={<CheckStatIcon />}
                  label="Permission grant rate"
                  value={locations.length ? '100%' : '—'}
                  note="Consent-only collection"
                  delay={0.18}
                />
              </div>
            </section>

            {/* Map + detail */}
            <section aria-label="Location map" className="mt-8">
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease }}
                className="overflow-hidden rounded-3xl border border-line bg-panel/60 shadow-card backdrop-blur"
              >
                <div className="flex items-center justify-between border-b border-line px-6 py-4">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-snow">Submission map</h2>
                    <p className="text-xs text-fog">Live positions of every received submission · auto-refreshing</p>
                  </div>
                  <span className="chip border border-line2 bg-panel2 text-fog">
                    <span className="h-1.5 w-1.5 rounded-full bg-mint animate-pulse" />
                    Live · {locations.length} {locations.length === 1 ? 'pin' : 'pins'}
                  </span>
                </div>
                <MultiLocationMap locations={locations} onSelect={setSelected} />
              </motion.div>
            </section>

            {/* Detail panel for selected record */}
            <AnimatePresence>
              {selected && (
                <motion.section
                  key={selected.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
                  aria-label={`Submission ${selected.id} details`}
                  className="mt-6 overflow-hidden rounded-3xl border border-mint/20 bg-panel/80 shadow-card backdrop-blur"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-mint/15 text-mint ring-1 ring-mint/25">
                        <PinMark className="h-5 w-5" />
                      </span>
                      <div>
                        <h2 className="font-display text-base font-semibold text-snow">Submission #{selected.id}</h2>
                        <p className="text-xs text-fog">{formatDate(selected.created_at)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelected(null)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-fog transition-colors hover:text-snow"
                    >
                      Close
                    </button>
                  </div>
                  <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
                    <Detail label="Location source" value={sourceLabel(selected.source)} />
                    <Detail
                      label="Accuracy"
                      value={
                        selected.accuracy != null
                          ? `~${Math.round(selected.accuracy)} m`
                          : '—'
                      }
                    />
                    <Detail label="Location quality" value={qualityLabel(selected.accuracy, selected.quality_class)} />
                    <Detail label="Acquisition status" value={acquisitionStatusLabel(selected.acquisition_status)} />
                    <Detail label="Captured" value={selected.captured_at ? formatDate(selected.captured_at) : formatDate(selected.created_at)} />
                    <Detail label="Acquisition duration" value={selected.acquisition_ms != null ? `${(selected.acquisition_ms / 1000).toFixed(1)} s` : '—'} />
                    <Detail label="Readings used" value={selected.readings_count != null ? String(selected.readings_count) : '—'} />
                    <Detail label="Latitude" value={selected.latitude.toFixed(6)} mono />
                    <Detail label="Longitude" value={selected.longitude.toFixed(6)} mono />
                    <Detail label="Google Place ID" value={selected.place_id || '—'} mono />
                    <Detail label="Plus Code" value={selected.plus_code || '—'} mono />
                    <Detail label="Street" value={selected.street || '—'} />
                    <Detail label="Street number" value={selected.street_number || '—'} />
                    <Detail label="Neighborhood / Area" value={selected.neighborhood || '—'} />
                    <Detail label="Locality / City" value={selected.locality || selected.city || '—'} />
                    <Detail label="District" value={selected.district || '—'} />
                    <Detail label="State" value={selected.state || '—'} />
                    <Detail label="Postal code" value={selected.postal_code || '—'} />
                    <Detail label="Country" value={selected.country || '—'} />
                    <div className="sm:col-span-2 lg:col-span-3">
                      <Detail
                        label={selected.geocode_source === 'google' ? 'Formatted address (Google)' : 'Address'}
                        value={selected.formatted_address || selected.address || '—'}
                      />
                    </div>
                    <div className="flex sm:col-span-2 lg:col-span-1 items-end">
                      <a
                        href={`https://www.google.com/maps?q=${selected.latitude},${selected.longitude}&z=17`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-mint/30 bg-mint/10 px-4 py-2 text-sm font-medium text-mint transition-colors hover:bg-mint/20"
                      >
                        <MapPinIcon />
                        Open in Google Maps
                      </a>
                    </div>
                  </div>

                  <div className="border-t border-line px-6 py-5">
                    <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-fog/70">
                      Map · marker at exact captured coordinates
                    </p>
                    <GoogleLocationMap
                      latitude={selected.latitude}
                      longitude={selected.longitude}
                      accuracy={selected.accuracy}
                      label={`Submission #${selected.id}`}
                    />
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* Records table */}
            <section aria-label="Submission records" className="mt-8">
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.16, ease }}
                className="overflow-hidden rounded-3xl border border-line bg-panel/60 shadow-card backdrop-blur"
              >
                <div className="border-b border-line px-6 py-4">
                  <h2 className="font-display text-lg font-semibold text-snow">All submissions</h2>
                  <p className="text-xs text-fog">Select a record to inspect its details</p>
                </div>

                {locations.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-panel2 text-fog ring-1 ring-line">
                      <PinStatIcon />
                    </div>
                    <p className="font-semibold text-snow">No submissions yet</p>
                    <p className="max-w-xs text-sm text-fog">
                      Share the link and when visitors grant permission, their records will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] font-body text-sm">
                      <thead>
                        <tr className="border-b border-line text-left font-mono text-[11px] uppercase tracking-widest text-fog/70">
                          <th className="px-6 py-3">ID</th>
                          <th className="px-6 py-3">Place</th>
                          <th className="px-6 py-3">Region</th>
                          <th className="px-6 py-3">Accuracy</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {locations.map((loc, idx) => (
                          <tr
                            key={loc.id}
                            onClick={() => setSelected(loc)}
                            className={`cursor-pointer border-b border-line/60 transition-colors hover:bg-panel2/70 ${
                              selected?.id === loc.id ? 'bg-mint/5' : ''
                            }`}
                            style={{
                              animation: reduceMotion ? undefined : `fadeUp 0.4s ${(idx * 0.03).toFixed(2)}s both`,
                            }}
                          >
                            <td className="px-6 py-3.5 font-mono text-fog">#{loc.id}</td>
                            <td className="px-6 py-3.5 font-medium text-snow">{loc.city || '—'}</td>
                            <td className="px-6 py-3.5 text-fog">
                              {loc.state || '—'}
                              {loc.country ? `, ${loc.country}` : ''}
                            </td>
                            <td className="px-6 py-3.5 text-fog">
                              {loc.accuracy ? `${Math.round(loc.accuracy)} m` : '—'}
                            </td>
                            <td className="px-6 py-3.5">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/10 px-2.5 py-0.5 text-xs text-mint ring-1 ring-mint/20">
                                <span className="h-1.5 w-1.5 rounded-full bg-mint" /> Granted
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-fog">{formatDate(loc.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

function StatCard({ icon, label, value, note, delay }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease }}
      className="rounded-3xl border border-line bg-panel/60 p-5 shadow-card backdrop-blur"
    >
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-mint/10 text-mint ring-1 ring-mint/20">
        {icon}
      </div>
      <p className="font-mono text-[11px] uppercase tracking-widest text-fog/70">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-snow">{value}</p>
      <p className="mt-0.5 text-xs text-fog/70">{note}</p>
    </motion.div>
  )
}

function Detail({ label, value, mono, success }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-widest text-fog/70">{label}</p>
      <p
        className={`mt-1 break-words text-sm text-snow ${
          mono ? 'font-mono tabular-nums' : 'font-medium'
        } ${success ? '!text-mint' : ''}`}
      >
        {value}
      </p>
    </div>
  )
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function sourceLabel(source) {
  const map = {
    browser_high_accuracy: 'High-accuracy device geolocation',
    ip_fallback: 'IP-based (fallback)',
  }
  return (source && map[source]) || source || '—'
}

function qualityLabel(accuracy, qualityClass) {
  const q = qualityClass
  if (q === 'excellent') return '★★★★★ Excellent (≤10 m)'
  if (q === 'good') return '★★★★ Good (≤25 m)'
  if (q === 'acceptable') return '★★★ Acceptable (≤50 m)'
  if (q === 'poor') return '★★ Poor (>50 m)'
  // Fall back to the reported accuracy value.
  if (accuracy == null) return '—'
  if (accuracy < 10) return '★★★★★ Excellent (≤10 m)'
  if (accuracy < 25) return '★★★★ Good (≤25 m)'
  if (accuracy < 50) return '★★★ Acceptable (≤50 m)'
  return '★★ Poor (>50 m)'
}

function acquisitionStatusLabel(status) {
  const map = {
    confirmed: 'Confirmed · high precision',
    approximate: 'Approximate · area-level',
  }
  return (status && map[status]) || status || '—'
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'Just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

function locationLabel(loc) {
  return loc.city || loc.state || loc.country || 'unknown location'
}

function PinStatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M12 21.5c4-4.7 6-8.1 6-11.2A6 6 0 0 0 6 10.3c0 3.1 2 6.5 6 11.2Z" stroke="currentColor" strokeWidth="1.6" fill="currentColor" opacity="0.15" />
      <circle cx="12" cy="10.3" r="2.2" fill="currentColor" />
    </svg>
  )
}
function ClockStatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function GlobeStatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9S14.5 18.5 12 21c-2.5-2.5-3.5-5.5-3.5-9S9.5 5.5 12 3Z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}
function CheckStatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function WarnIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
      <path d="M12 3 2 20h20L12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 10v4M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path d="M12 21.5c4-4.7 6-8.1 6-11.2A6 6 0 0 0 6 10.3c0 3.1 2 6.5 6 11.2Z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="10.3" r="2" fill="currentColor" />
    </svg>
  )
}
