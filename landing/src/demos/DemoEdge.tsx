import { motion, useReducedMotion } from 'motion/react'
import { edgePath } from './scene-geometry'
import type { Rect } from './scene-types'

/** Bezier edge with an arrowhead, drawn with a pathLength sweep. Labels live in EdgeLabel above the nodes. */
export function DemoEdge({
  source,
  target,
  color,
  width = 1.6,
}: {
  source: Rect
  target: Rect
  color: string
  width?: number
}) {
  const reduced = Boolean(useReducedMotion())
  const path = edgePath(source, target)
  const draw = reduced ? { duration: 0 } : { duration: 0.55, ease: 'easeInOut' as const }

  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <motion.path
        d={path.d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={draw}
      />
      <motion.polygon
        points={path.arrow}
        fill={color}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduced ? 0 : 0.45, duration: 0.15 }}
      />
    </motion.g>
  )
}

/**
 * Edge caption rendered in an HTML layer above the nodes (like the app's
 * EdgeLabelRenderer), so it is never hidden behind a node.
 */
export function EdgeLabel({
  x,
  y,
  label,
  morph = false,
}: {
  x: number
  y: number
  label: string
  /** Animate position changes (auto-layout) instead of fading in at a fixed spot. */
  morph?: boolean
}) {
  const reduced = Boolean(useReducedMotion())
  if (morph) {
    return (
      <motion.span
        className="edge-label pointer-events-none absolute left-0 top-0"
        style={{ translate: '-50% -50%' }}
        initial={false}
        animate={{ x, y }}
        transition={reduced ? { duration: 0 } : { type: 'spring', bounce: 0.1, duration: 0.9 }}
      >
        {label}
      </motion.span>
    )
  }
  return (
    <motion.span
      className="edge-label pointer-events-none absolute"
      style={{ left: x, top: y, translate: '-50% -50%' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: reduced ? 0 : 0.35, duration: 0.2 }}
    >
      {label}
    </motion.span>
  )
}
