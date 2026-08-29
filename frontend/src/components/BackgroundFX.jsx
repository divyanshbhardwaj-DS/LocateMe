import { motion, useReducedMotion } from 'framer-motion'

/** Ambient gradient orbs + subtle grid used behind hero sections. */
export default function BackgroundFX({ intensity = 'default' }) {
  const reduce = useReducedMotion()
  const animate = reduce ? {} : { opacity: [0.5, 0.85, 0.5] }

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="grid-bg mask-radial absolute inset-0" />
      {['top-[-10%] left-[5%] w-[42rem] h-[42rem] bg-mint/10', 'top-[20%] right-[-8%] w-[38rem] h-[38rem] bg-mint2/10'].map(
        (pos) => (
          <motion.div
            key={pos}
            animate={animate}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            className={`absolute rounded-full blur-[120px] ${pos}`}
          />
        )
      )}
    </div>
  )
}
