const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function reverseGeocode(latitude, longitude) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('Reverse geocoding failed')
  const data = await res.json()
  const addr = data.address || {}
  return {
    address: data.display_name || null,
    city: addr.city || addr.town || addr.village || addr.county || null,
    state: addr.state || null,
    country: addr.country || null,
    postal_code: addr.postcode || null,
  }
}

export async function submitLocation(payload) {
  const res = await fetch(`${API_URL}/location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to submit location')
  return res.json()
}

export async function adminLogin(username, password) {
  const body = new URLSearchParams()
  body.set('username', username)
  body.set('password', password)
  const res = await fetch(`${API_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error('Invalid username or password')
  return res.json()
}

function authHeaders() {
  const token = localStorage.getItem('locateme_token')
  return { Authorization: `Bearer ${token}` }
}

export async function fetchLocations() {
  const res = await fetch(`${API_URL}/locations`, { headers: authHeaders() })
  if (res.status === 401) throw new Error('unauthorized')
  if (!res.ok) throw new Error('Failed to fetch locations')
  return res.json()
}

export async function fetchStats() {
  const res = await fetch(`${API_URL}/stats`, { headers: authHeaders() })
  if (res.status === 401) throw new Error('unauthorized')
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}
