import { motion, useReducedMotion } from 'motion/react'

/** A floating pointer that drifts between scene points, as if someone is editing. */
export function DemoCursor({ points, duration = 9 }: { points: Array<{ x: number; y: number }>; duration?: number }) {
  const reduced = Boolean(useReducedMotion())
  if (reduced || points.length === 0) return null
  const loop = [...points, points[0]]

  return (
    <motion.div
      className="pointer-events-none absolute left-0 top-0 z-20"
      animate={{ x: loop.map((point) => point.x), y: loop.map((point) => point.y) }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden
    >
      <svg width="22" height="22" viewBox="0 0 24 24" className="drop-shadow-md">
        <path d="M5 3l14 7-6 2-2 6z" fill="#1d1d1f" stroke="#ffffff" strokeWidth={1.6} strokeLinejoin="round" />
      </svg>
      <span className="ml-4 -mt-1 inline-block rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-medium text-white">
        Вы
      </span>
    </motion.div>
  )
}
