# LocateMe

Permission-first location collection app. A visitor grants browser location
access, sees their coordinates reverse-geocoded into a readable address, and
the record is stored for review in an authenticated admin dashboard.

## Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env        # edit ADMIN_SECRET before deploying
python create_admin.py admin your-password   # create the first admin login
uvicorn main:app --reload --port 8000
```

Endpoints:
- `GET /` — health check
- `POST /location` — public, stores a submitted location
- `POST /admin/login` — form-encoded username/password, returns a JWT
- `GET /locations` — admin-only, list of all submissions
- `GET /locations/{id}` — admin-only, single record
- `GET /stats` — admin-only, total count

## Frontend (React + Vite)

```bash
cd frontend
npm install
cp .env.example .env         # point VITE_API_URL at your backend
npm run dev
```

- `/` — mandatory location gate (access is required; user is redirected to Nykaa once location is confirmed)
- `/home` — landing page / permission flow (marketing)
- `/admin/login` — admin sign-in
- `/admin/dashboard` — protected dashboard (table + map, auto-refreshing)

Reverse geocoding runs on the **backend** via the Google Maps Platform
Geocoding API (server-side key, never exposed to the browser). Address
components (street, locality, district, state, postal code, country, Plus
Code, Place ID) are stored alongside the original coordinates. If no Google
key is set, the client-supplied Nominatim-derived values are stored as a
fallback so core capture still works. The admin dashboard renders the location
with the Google Maps JavaScript API (marker at the exact captured coordinates +
accuracy circle) and an "Open in Google Maps" link.

## Deployment

- Frontend → Vercel or Netlify (set `VITE_API_URL` to your backend's URL)
- Backend → Render (set `DATABASE_URL`, `ADMIN_SECRET`, `CORS_ORIGINS` as env vars)
- Swap `DATABASE_URL` to a PostgreSQL connection string in production;
  SQLAlchemy handles the rest.

## Notes

- The app never attempts to bypass the browser's permission prompt — denial
  always leads to an explanation and a retry button, never a workaround.
- Location acquisition uses high-accuracy `watchPosition()` collection: it
  gathers multiple readings, evaluates each reading's reported `accuracy`,
  guards against outliers, and keeps the best reliable fix. The device's own
  GPS/Wi-Fi/cellular positioning is the primary source; no IP-geolocation
  override is used.
- Each stored record may include `accuracy`, `source` (e.g.
  `browser_high_accuracy`), and `captured_at`. The admin dashboard surfaces
  these; normal visitors only ever see a confirmation, never raw coordinates.
- Acquisition quality is also captured per record: `quality_class`
  (excellent ≤10 m / good ≤25 m / acceptable ≤50 m / poor), `acquisition_status`
  (confirmed vs approximate), `acquisition_ms` (how long the fix took), and
  `readings_count` (how many readings were evaluated). The UI classifies UX
  quality but never fakes the device's reported accuracy.
- If reverse geocoding or the save request fails, the captured location is
  still recorded from the best fix gathered.

## Google Maps Platform setup

Two separate keys are used, each restricted:

- **`GOOGLE_MAPS_SERVER_KEY`** (backend `.env`) — used by the server for the
  Geocoding API. Never expose this in the frontend. Enable the **Geocoding API**
  and restrict the key by API / IP as you prefer.
- **`VITE_GOOGLE_MAPS_JS_KEY`** (frontend `.env`) — used by the Maps JavaScript
  API on the admin dashboard only. Enable the **Maps JavaScript API** and restrict
  the key by **HTTP referrer** to your site(s).

When a key is absent, the app degrades gracefully: it still captures and stores
the best device coordinates, and the dashboard shows coordinates/accuracy with
the address as unresolvable.
