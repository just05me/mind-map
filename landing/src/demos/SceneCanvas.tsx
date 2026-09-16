import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { KINDS } from '../content/tokens'
import { DemoEdge, EdgeLabel } from './DemoEdge'
import { DemoNode } from './DemoNode'
import { edgePath } from './scene-geometry'
import type { Scene, SceneNode } from './scene-types'

const POP = { type: 'spring' as const, bounce: 0.2, duration: 0.45 }

/**
 * Draws a scene up to `step`: frames under everything, then edges, nodes and
 * finally edge labels on top. Wrap in SceneViewport for scaling.
 */
export function SceneCanvas({ scene, step }: { scene: Scene; step: number }) {
  const reduced = Boolean(useReducedMotion())
  const byId = new Map(scene.nodes.map((node) => [node.id, node]))
  const visibleNodes = scene.nodes.filter((node) => node.step <= step)
  const visibleEdges = scene.edges
    .filter((edge) => edge.step <= step)
    .flatMap((edge) => {
      const source = byId.get(edge.source)
      const target = byId.get(edge.target)
      return source && target ? [{ edge, source, target }] : []
    })
  const frames = visibleNodes.filter((node) => node.type === 'frame')
  const others = visibleNodes.filter((node) => node.type !== 'frame')
  const enter = reduced ? { opacity: 0 } : { opacity: 0, scale: 0.92 }
  const shown = { opacity: 1, scale: 1 }

  return (
    <div className="absolute inset-0">
      <AnimatePresence>
        {frames.map((node) => (
          <NodeLayer key={node.id} node={node} enter={enter} shown={shown} />
        ))}
      </AnimatePresence>
      <svg className="pointer-events-none absolute inset-0 overflow-visible" width={scene.width} height={scene.height}>
        <AnimatePresence>
          {visibleEdges.map(({ edge, source, target }) => (
            <DemoEdge
              key={edge.id}
              source={source}
              target={target}
              color={source.type === 'kind' ? KINDS[source.kind ?? 'module'].color : '#8e8e93'}
            />
          ))}
        </AnimatePresence>
      </svg>
      <AnimatePresence>
        {others.map((node) => (
          <NodeLayer key={node.id} node={node} enter={enter} shown={shown} />
        ))}
      </AnimatePresence>
      <AnimatePresence>
        {visibleEdges.map(({ edge, source, target }) => {
          if (!edge.label) return null
          const path = edgePath(source, target)
          return <EdgeLabel key={edge.id} x={path.labelX} y={path.labelY} label={edge.label} />
        })}
      </AnimatePresence>
    </div>
  )
}

function NodeLayer({
  node,
  enter,
  shown,
}: {
  node: SceneNode
  enter: { opacity: number; scale?: number }
  shown: { opacity: number; scale: number }
}) {
  return (
    <motion.div
      className="absolute"
      style={{ left: node.x, top: node.y, width: node.w, height: node.h }}
      initial={enter}
      animate={shown}
      exit={enter}
      transition={POP}
    >
      <DemoNode node={node} />
    </motion.div>
  )
}
