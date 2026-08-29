import { motion, useReducedMotion } from 'framer-motion'

/** Futuristic radar / location visualization used in the hero and consent states. */
export default function Radar({ active = false, success = false, size = 'md' }) {
  const reduce = useReducedMotion()
  const dim = size === 'lg' ? 'h-64 w-64' : 'h-40 w-40'

  return (
    <div className={`relative ${dim} grid place-items-center`} aria-hidden>
      {/* concentric rings */}
      <div className="absolute inset-0 rounded-full border border-line2" />
      <div className="absolute inset-6 rounded-full border border-line" />
      <div className="absolute inset-12 rounded-full border border-line" />

      {/* sweep */}
      <div
        className={`absolute inset-0 rounded-full ${active ? 'animate-radar' : ''}`}
        style={{
          background: 'conic-gradient(from 0deg, rgba(60,224,168,0.28), transparent 25%)',
        }}
      />

      {/* crosshair */}
      <div className="absolute inset-0 rounded-full">
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-line" />
        <div className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-line" />
      </div>

      {/* center core + pulse */}
      <div className="relative grid h-16 w-16 place-items-center">
        <span
          className={`absolute inline-flex h-16 w-16 rounded-full ${
            success ? 'bg-mint/30' : active ? 'bg-mint/30' : 'bg-mint/10'
          } animate-ping2`}
        />
        <span
          className={`relative grid h-12 w-12 place-items-center rounded-full border ${
            success ? 'border-mint bg-mint/20' : active ? 'border-mint bg-mint/15' : 'border-line2 bg-panel2'
          } transition-colors duration-500`}
        >
          <PinCore success={success} active={active} />
        </span>
      </div>
    </div>
  )
}

function PinCore({ success, active }) {
  const on = success || active
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <path
        d="M12 21.5c4-4.7 6-8.1 6-11.2A6 6 0 0 0 6 10.3c0 3.1 2 6.5 6 11.2Z"
        stroke={on ? '#3CE0A8' : '#5b6f92'}
        strokeWidth="1.8"
        fill={on ? 'rgba(60,224,168,0.2)' : 'rgba(148,178,216,0.12)'}
      />
      <circle cx="12" cy="10.3" r="2.1" fill={on ? '#3CE0A8' : '#5b6f92'} />
    </svg>
  )
}
