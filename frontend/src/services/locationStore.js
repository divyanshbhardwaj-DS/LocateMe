/**
 * Session-scoped summary of the location the user explicitly confirmed to enter
 * the demo. Deliberately privacy-preserving: it holds only display-level details
 * (city / area / quality tier) and a confirmation flag — never raw coordinates,
 * never postal codes, never the full address. Raw lat/long + address live only
 * in the backend database, viewable solely by authorized admins.
 */

const KEY = 'locateme_demo_location'

let memory = read()

function defaultSummary() {
  return { confirmed: false, city: null, area: null, tier: null, status: null }
}

function read() {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return defaultSummary()
    const parsed = JSON.parse(raw)
    return { ...defaultSummary(), ...parsed }
  } catch {
    return defaultSummary()
  }
}

function persist() {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(memory))
  } catch {
    /* private mode — in-memory is enough for the current session */
  }
}

/** Mark the demo location as confirmed with only display-safe details. */
export function confirmDemoLocation({ city, area, tier, status } = {}) {
  memory = {
    confirmed: true,
    city: city || null,
    area: area || null,
    tier: tier || null,
    status: status || 'confirmed',
  }
  persist()
}

export function getDemoLocation() {
  return { ...memory }
}

export function clearDemoLocation() {
  memory = defaultSummary()
  persist()
}
