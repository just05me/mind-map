import { motion, useReducedMotion } from 'motion/react'
import { LAYOUT_MESSY, LAYOUT_TIDY_POSITIONS } from '../content/demo-scenes'
import { KINDS } from '../content/tokens'
import { Icon } from '../ui/Icon'
import { EdgeLabel } from './DemoEdge'
import { DemoNode } from './DemoNode'
import { DemoFrame } from './DemoFrame'
import { edgePath } from './scene-geometry'
import { SceneViewport } from './SceneViewport'
import type { Rect } from './scene-types'
import { usePhaseLoop } from './use-scene-player'

const MOVE = { type: 'spring' as const, bounce: 0.1, duration: 0.9 }

/** Nodes jump from a messy pile into left-to-right ranks, like «Упорядочить → слева направо». */
export function AutoLayoutDemo() {
  return (
    <DemoFrame
      title="Каталог"
      dock={false}
      toolbar={
        <span className="flex items-center gap-1.5 text-muted">
          <Icon name="layout" size={13} />
          Упорядочить · слева направо
        </span>
      }
    >
      {(active) => <LayoutScene active={active} />}
    </DemoFrame>
  )
}

function LayoutScene({ active }: { active: boolean }) {
  const reduced = Boolean(useReducedMotion())
  const tidy = usePhaseLoop(2, 2600, active) === 1
  const rects = new Map<string, Rect>(
    LAYOUT_MESSY.nodes.map((node) => {
      const position = tidy ? LAYOUT_TIDY_POSITIONS[node.id] ?? node : node
      return [node.id, { x: position.x, y: position.y, w: node.w, h: node.h }]
    }),
  )
  const transition = reduced ? { duration: 0 } : MOVE
  const edges = LAYOUT_MESSY.edges.flatMap((edge) => {
    const source = rects.get(edge.source)
    const target = rects.get(edge.target)
    const sourceNode = LAYOUT_MESSY.nodes.find((node) => node.id === edge.source)
    if (!source || !target || !sourceNode) return []
    return [{ edge, path: edgePath(source, target), color: KINDS[sourceNode.kind ?? 'module'].color }]
  })

  return (
    <SceneViewport width={LAYOUT_MESSY.width} height={LAYOUT_MESSY.height}>
      <svg className="pointer-events-none absolute inset-0 overflow-visible" width={LAYOUT_MESSY.width} height={LAYOUT_MESSY.height}>
        {edges.map(({ edge, path, color }) => (
          <g key={edge.id}>
            <motion.path
              fill="none"
              stroke={color}
              strokeWidth={1.6}
              strokeLinecap="round"
              initial={false}
              animate={{ d: path.d }}
              transition={transition}
            />
            <motion.polygon fill={color} initial={false} animate={{ points: path.arrow }} transition={transition} />
          </g>
        ))}
      </svg>
      {LAYOUT_MESSY.nodes.map((node) => {
        const rect = rects.get(node.id)
        if (!rect) return null
        return (
          <motion.div
            key={node.id}
            className="absolute left-0 top-0"
            style={{ width: node.w, height: node.h }}
            initial={false}
            animate={{ x: rect.x, y: rect.y }}
            transition={transition}
          >
            <DemoNode node={node} />
          </motion.div>
        )
      })}
      {edges.map(({ edge, path }) =>
        edge.label ? <EdgeLabel key={edge.id} x={path.labelX} y={path.labelY} label={edge.label} morph /> : null,
      )}
    </SceneViewport>
  )
}
