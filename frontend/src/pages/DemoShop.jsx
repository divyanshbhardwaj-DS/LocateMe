import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { getDemoLocation } from '../services/locationStore.js'

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'fashion', label: 'Fashion' },
  { id: 'home', label: 'Home & Living' },
  { id: 'sports', label: 'Sports' },
]

const PRODUCTS = [
  { id: 1, name: 'Aurora Wireless Earbuds', cat: 'electronics', price: 129, was: 179, rating: 4.8, tag: 'Bestseller', hue: '#3CE0A8' },
  { id: 2, name: 'Trail Hiking Backpack 32L', cat: 'sports', price: 89, was: 119, rating: 4.7, tag: 'Hot', hue: '#FF8A5C' },
  { id: 3, name: 'Noir Minimal Watch', cat: 'fashion', price: 199, was: 249, rating: 4.9, tag: 'Premium', hue: '#22D3EE' },
  { id: 4, name: 'Nordic Ceramic Dinner Set', cat: 'home', price: 149, was: 189, rating: 4.6, tag: 'Sale', hue: '#FFC24B' },
  { id: 5, name: 'Pulse Smart Water Bottle', cat: 'sports', price: 49, was: 69, rating: 4.5, tag: 'New', hue: '#3CE0A8' },
  { id: 6, name: 'Velvet Lounge Chair', cat: 'home', price: 329, was: 420, rating: 4.8, tag: null, hue: '#9457EB' },
  { id: 7, name: 'Orbit Mechanical Keyboard', cat: 'electronics', price: 159, was: 199, rating: 4.7, tag: 'Hot', hue: '#FFC24B' },
  { id: 8, name: 'Falcon Running Shoes', cat: 'fashion', price: 119, was: 149, rating: 4.6, tag: 'Bestseller', hue: '#FF8A5C' },
  { id: 9, name: 'Glow Desk Lamp', cat: 'home', price: 59, was: 79, rating: 4.4, tag: null, hue: '#22D3EE' },
  { id: 10, name: 'Summit Insulated Flask', cat: 'sports', price: 39, was: 55, rating: 4.7, tag: 'New', hue: '#3CE0A8' },
  { id: 11, name: 'Zen Yoga Mat', cat: 'sports', price: 45, was: 65, rating: 4.5, tag: 'Sale', hue: '#9457EB' },
  { id: 12, name: 'Apex Over-Ear Headphones', cat: 'electronics', price: 249, was: 320, rating: 4.9, tag: 'Premium', hue: '#22D3EE' },
]

const GIFT_ESTIMATES = { none: 0, express: 9, priority: 14 }

export default function DemoShop() {
  const loc = getDemoLocation()
  const reduceMotion = useReducedMotion()
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('all')
  const [cart, setCart] = useState({})
  const [cartOpen, setCartOpen] = useState(false)

  const view = useMemo(() => {
    const q = query.trim().toLowerCase()
    return PRODUCTS.filter(
      (p) =>
        (cat === 'all' || p.cat === cat) &&
        (!q || p.name.toLowerCase().includes(q)),
    )
  }, [query, cat])

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)
  const cartSubtotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = PRODUCTS.find((x) => x.id === Number(id))
    return sum + (p ? p.price * qty : 0)
  }, 0)

  const addItem = (id) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }))
  const removeItem = (id) =>
    setCart((c) => {
      const next = { ...c }
      if (next[id]) next[id] -= 1
      if (next[id] <= 0) delete next[id]
      return next
    })

  const locationLabel = loc.city || (loc.area && loc.area.split(',').slice(0, 2).join(',')) || 'your area'

  return (
    <div className="relative min-h-screen bg-night text-snow">
      <Navbar
        count={cartCount}
        onCart={() => setCartOpen(true)}
        locationLabel={locationLabel}
      />

      <main className="relative mx-auto max-w-6xl px-5 pb-24 pt-6 sm:px-8">
        {/* Location-aware banner */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-mint/20 bg-mint/5 px-5 py-3.5"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-mint/15 text-mint ring-1 ring-mint/25">
            <PinIcon />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-snow">
              Delivering to {locationLabel}
            </p>
            <p className="text-xs text-fog">
              In-stock items and offers tailored to your confirmed area.
            </p>
          </div>
          <span className="chip border border-line2 bg-panel2 text-fog">
            <span className="h-1.5 w-1.5 rounded-full bg-mint animate-pulse" />
            Location confirmed
          </span>
        </motion.div>

        {/* Hero strip */}
        <section className="mt-8 overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-panel via-panel2 to-panel p-8 sm:p-10">
          <div className="relative max-w-xl">
            <span className="chip border border-mint/25 bg-mint/10 text-mint">This week&apos;s offers</span>
            <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-snow sm:text-4xl">
              Everything you need, <span className="text-gradient">right here.</span>
            </h1>
            <p className="mt-3 text-base leading-relaxed text-fog">
              A fully synthetic demo catalog to showcase the location-gated
              experience. Nothing is real — nothing is tracked beyond your consent.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#catalog" className="btn-primary">Shop the catalog</a>
              <a href="#top" className="btn-ghost">Browse categories</a>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-mint/10 blur-[80px]" />
        </section>

        {/* Search + categories */}
        <section className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fog">
              <SearchIcon />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              aria-label="Search products"
              className="w-full rounded-full border border-line bg-panel/70 py-3 pl-11 pr-4 text-sm text-snow placeholder:text-fog/60 outline-none transition-colors focus:border-mint/40"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  cat === c.id
                    ? 'bg-mint text-night'
                    : 'border border-line bg-panel/60 text-fog hover:border-line2 hover:text-snow'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </section>

        {/* Product grid */}
        <section id="catalog" className="mt-8 scroll-mt-24" aria-label="Product catalog">
          {view.length === 0 ? (
            <div className="col-span-full flex flex-col items-center gap-3 rounded-3xl border border-line bg-panel/50 py-16 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-panel2 text-fog ring-1 ring-line">
                <SearchIcon />
              </div>
              <p className="font-semibold text-snow">No products found</p>
              <p className="max-w-xs text-sm text-fog">Try a different search or category.</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {view.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  index={i}
                  reduce={reduceMotion}
                  onAdd={() => addItem(p.id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />

      {/* Cart drawer */}
      <AnimatePresence>
        {cartOpen && (
          <CartDrawer
            cart={cart}
            products={PRODUCTS}
            subtotal={cartSubtotal}
            count={cartCount}
            onClose={() => setCartOpen(false)}
            onAdd={addItem}
            onRemove={removeItem}
            onCheckout={() => setCartOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ---------- Navbar ---------- */

function Navbar({ count, onCart, locationLabel }) {
  return (
    <header id="top" className="sticky top-0 z-30 glass border-b border-line">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <Link to="/" className="group flex items-center gap-2.5" aria-label="LocateMe home">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-panel2 ring-1 ring-line transition-transform group-hover:scale-105">
            <PinMark />
          </span>
          <span className="font-display text-lg tracking-tight text-snow">
            Locate<span className="text-mint">Me</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#catalog" className="nav-link">Catalog</a>
          <a href="#offers" className="nav-link">Offers</a>
          <span className="flex items-center gap-1.5 text-sm text-fog">
            <PinMark small /> {locationLabel}
          </span>
        </div>

        <button
          onClick={onCart}
          aria-label={`Cart with ${count} items`}
          className="relative inline-flex items-center gap-2 rounded-full border border-line bg-panel2/60 px-4 py-2 text-sm font-medium text-fog transition-colors hover:border-line2 hover:text-snow"
        >
          <CartIcon />
          <span className="hidden sm:inline">Cart</span>
          <AnimatePresence>
            {count > 0 && (
              <motion.span
                initial={count === 1 ? { scale: 0 } : false}
                animate={{ scale: 1 }}
                className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-mint px-1 font-mono text-[10px] font-bold text-night"
              >
                {count}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </nav>
    </header>
  )
}

/* ---------- Product card ---------- */

function ProductCard({ product, index, reduce, onAdd }) {
  const discount = Math.round(((product.was - product.price) / product.was) * 100)
  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: (index % 4) * 0.05 }}
      className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-panel/70 shadow-card backdrop-blur transition-all hover:-translate-y-1 hover:shadow-cardlift"
    >
      <div className="relative aspect-square overflow-hidden" style={{ background: `linear-gradient(140deg, ${product.hue}22, ${product.hue}08)` }}>
        <ProductArt hue={product.hue} />
        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {product.tag && (
            <span className="rounded-full bg-night/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-snow backdrop-blur">
              {product.tag}
            </span>
          )}
          {discount > 0 && (
            <span className="rounded-full bg-mint px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-night">
              -{discount}%
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-widest text-fog/70">{product.cat}</p>
          <span className="flex items-center gap-1 text-xs text-mint">
            <StarIcon /> {product.rating ?? ''}
          </span>
        </div>
        <h3 className="mt-1.5 font-display text-base font-semibold text-snow">{product.name}</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-semibold text-snow">${product.price}</span>
          <span className="text-sm text-fog line-through">${product.was}</span>
        </div>
        <button onClick={onAdd} className="btn-primary mt-4 !py-2.5 text-sm">
          Add to cart
        </button>
      </div>
    </motion.article>
  )
}

/* Mock product artwork (SVG) — no external images, no tracking. */
function ProductArt({ hue }) {
  return (
    <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`g-${hue.replace('#', '')}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={hue} stopOpacity="0.18" />
          <stop offset="1" stopColor={hue} stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill={`url(#g-${hue.replace('#', '')})`} />
      <rect x="30" y="34" width="60" height="52" rx="8" fill={hue} opacity="0.16" />
      <rect x="38" y="44" width="44" height="10" rx="5" fill={hue} opacity="0.45" />
      <rect x="38" y="60" width="30" height="8" rx="4" fill={hue} opacity="0.3" />
    </svg>
  )
}

/* ---------- Cart drawer ---------- */

const GIFT_ESTIMATES_LABEL = { none: 'Standard (free)', express: 'Express +$9', priority: 'Priority +$14' }

function CartDrawer({ cart, products, subtotal, count, onClose, onAdd, onRemove, onCheckout }) {
  const [ship, setShip] = useState('none')
  const [ordered, setOrdered] = useState(false)
  const items = Object.entries(cart)
    .map(([id, qty]) => ({ p: products.find((x) => x.id === Number(id)), qty }))
    .filter((x) => x.p)
  const total = subtotal + GIFT_ESTIMATES[ship]

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-night/70 backdrop-blur-sm"
      />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-line bg-panel text-snow shadow-cardlift"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-mint">Your cart</p>
            <h2 className="font-display text-lg font-semibold">{count} {count === 1 ? 'item' : 'items'}</h2>
          </div>
          <button onClick={onClose} aria-label="Close cart" className="grid h-9 w-9 place-items-center rounded-full border border-line text-fog hover:text-snow">
            <CloseIcon />
          </button>
        </div>

        {ordered ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-mint/15 text-mint ring-1 ring-mint/25">
              <CheckIcon />
            </div>
            <h3 className="font-display text-xl font-semibold">Order confirmed (demo)</h3>
            <p className="max-w-xs text-sm text-fog">This is a synthetic demo — no real order was placed and no payment was taken.</p>
            <button onClick={onClose} className="btn-primary mt-4">Continue browsing</button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-panel2 text-fog ring-1 ring-line">
              <CartIcon />
            </div>
            <h3 className="font-display text-lg font-semibold">Your cart is empty</h3>
            <p className="max-w-xs text-sm text-fog">Add a few demo products to see the checkout flow.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
              {items.map(({ p, qty }) => (
                <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-line bg-panel2/50 p-3">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl" style={{ background: `${p.hue}18` }}>
                    <ProductArt hue={p.hue} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-snow">{p.name}</p>
                    <p className="text-xs text-mint">${p.price} × {qty}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => onRemove(p.id)} aria-label="Decrease" className="grid h-7 w-7 place-items-center rounded-full border border-line text-fog hover:text-snow">−</button>
                    <span className="w-6 text-center font-mono text-sm">{qty}</span>
                    <button onClick={() => onAdd(p.id)} aria-label="Increase" className="grid h-7 w-7 place-items-center rounded-full border border-line text-fog hover:text-snow">+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 border-t border-line px-6 py-5">
              <div>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-fog/70">Delivery estimate (demo)</p>
                <div className="flex gap-2">
                  {Object.keys(GIFT_ESTIMATES_LABEL).map((k) => (
                    <button
                      key={k}
                      onClick={() => setShip(k)}
                      className={`flex-1 rounded-full border px-3 py-2 text-xs transition-colors ${
                        ship === k ? 'border-mint/40 bg-mint/10 text-mint' : 'border-line bg-panel2/50 text-fog'
                      }`}
                    >
                      {GIFT_ESTIMATES_LABEL[k]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-fog">Subtotal</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-fog">Delivery</span>
                <span className="font-semibold">{ship === 'none' ? 'Free' : `$${GIFT_ESTIMATES[ship]}.00`}</span>
              </div>
              <div className="flex items-center justify-between border-t border-line pt-3 text-base">
                <span className="font-semibold">Total</span>
                <span className="font-display text-xl font-semibold text-mint">${total.toFixed(2)}</span>
              </div>
              <button onClick={() => { setOrdered(true) }} className="btn-primary w-full">Checkout (demo)</button>
            </div>
          </>
        )}
      </motion.aside>
    </>
  )
}

/* ---------- Footer ---------- */

function Footer() {
  const loc = getDemoLocation()
  return (
    <footer className="border-t border-line py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-5 text-center sm:flex-row sm:justify-between sm:px-8 sm:text-left">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-panel2 ring-1 ring-line">
            <PinMark />
          </span>
          <span className="font-display text-base">Locate<span className="text-mint">Me</span></span>
        </div>
        <p className="max-w-md text-xs leading-relaxed text-fog/70">
          This shopping page is a location-gated demo. Products and prices are mock
          content. {loc.city ? `Currently personalized for ${loc.city}.` : ''}
        </p>
      </div>
    </footer>
  )
}

/* ---------- Icons ---------- */

function PinMark({ small }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={small ? 'h-4 w-4' : 'h-5 w-5'} aria-hidden>
      <path d="M12 21.5c4-4.7 6-8.1 6-11.2A6 6 0 0 0 6 10.3c0 3.1 2 6.5 6 11.2Z" stroke="currentColor" strokeWidth="1.8" fill="currentColor" opacity="0.15" />
      <circle cx="12" cy="10.3" r="2.1" fill="currentColor" />
    </svg>
  )
}
function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
      <path d="M12 21.5c4-4.7 6-8.1 6-11.2A6 6 0 0 0 6 10.3c0 3.1 2 6.5 6 11.2Z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="10.3" r="2" fill="currentColor" />
    </svg>
  )
}
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
      <path d="M3 4h2l2.5 12.5a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L20 8H6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.5" cy="20" r="1.3" fill="currentColor" />
      <circle cx="17.5" cy="20" r="1.3" fill="currentColor" />
    </svg>
  )
}
function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3" aria-hidden>
      <path d="M12 2.5 14.9 8.8l6.9.6-5.3 4.5 1.7 6.7L12 17.2 5.8 20.6l1.7-6.7L2.2 9.4l6.9-.6L12 2.5Z" />
    </svg>
  )
}
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
