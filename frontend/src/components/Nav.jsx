import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'

export function PinMark({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 21.5c4-4.7 6-8.1 6-11.2A6 6 0 0 0 6 10.3c0 3.1 2 6.5 6 11.2Z"
        stroke="url(#pinGrad)"
        strokeWidth="1.8"
        fill="rgba(60,224,168,0.14)"
      />
      <circle cx="12" cy="10.3" r="2.1" fill="url(#pinGrad)" />
      <defs>
        <linearGradient id="pinGrad" x1="8" y1="6" x2="16" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3CE0A8" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function Nav({ onGetStarted }) {
  const reduce = useReducedMotion()

  return (
    <motion.header
      initial={reduce ? false : { opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="sticky top-0 z-40 glass border-b border-line"
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <a
          href="#top"
          className="group flex items-center gap-2.5"
          aria-label="LocateMe home"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-panel2 ring-1 ring-line transition-transform group-hover:scale-105">
            <PinMark className="h-5 w-5" />
          </span>
          <span className="font-display text-lg tracking-tight text-snow">
            Locate<span className="text-mint">Me</span>
          </span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#how" className="nav-link">How it works</a>
          <a href="#privacy" className="nav-link">Privacy</a>
          <a href="#features" className="nav-link">Features</a>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/login" className="hidden sm:inline-flex nav-link px-2 py-2">
            Admin
          </Link>
          <button
            onClick={onGetStarted}
            className="btn-primary !px-5 !py-2.5"
          >
            Get started
          </button>
        </div>
      </nav>
    </motion.header>
  )
}
