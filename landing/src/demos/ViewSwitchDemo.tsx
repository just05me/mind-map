import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { SWITCH_COLUMNS, SWITCH_SCENE } from '../content/demo-scenes'
import { KINDS, STATUS_META, type Status } from '../content/tokens'
import { Icon } from '../ui/Icon'
import { DemoEdge, EdgeLabel } from './DemoEdge'
import { BoardCard, DemoNode } from './DemoNode'
import { DemoFrame } from './DemoFrame'
import { edgePath } from './scene-geometry'
import { SceneViewport } from './SceneViewport'

type View = 'map' | 'board'

const PAD = 12
const COL_GAP = 10
const COL_W = (SWITCH_SCENE.width - PAD * 2 - COL_GAP * (SWITCH_COLUMNS.length - 1)) / SWITCH_COLUMNS.length
const CARD_H = 64
const CARD_GAP = 8
const HEADER_H = 44
const FLY = { type: 'spring' as const, bounce: 0.12, duration: 0.85 }

export function ViewSwitchDemo() {
  const [view, setView] = useState<View>('map')
  const [manualAt, setManualAt] = useState(0)

  const choose = (next: View) => {
    setView(next)
    setManualAt(Date.now())
  }

  return (
    <DemoFrame
      title="Чат с ИИ"
      dock={false}
      toolbar={
        <div className="segmented pointer-events-auto" role="tablist" aria-label="Вид доски">
          <button type="button" role="tab" aria-pressed={view === 'map'} aria-selected={view === 'map'} onClick={() => choose('map')}>
            <Icon name="map" size={13} />
            Схема
          </button>
          <button type="button" role="tab" aria-pressed={view === 'board'} aria-selected={view === 'board'} onClick={() => choose('board')}>
            <Icon name="columns" size={13} />
            Статусы
          </button>
        </div>
      }
    >
      {(active) => <SwitchScene view={view} active={active} manualAt={manualAt} onAuto={setView} />}
    </DemoFrame>
  )
}

function columnX(index: number): number {
  return PAD + index * (COL_W + COL_GAP)
}

function SwitchScene({
  view,
  active,
  manualAt,
  onAuto,
}: {
  view: View
  active: boolean
  manualAt: number
  onAuto: (view: View) => void
}) {
  const reduced = Boolean(useReducedMotion())

  // Auto-flip every few seconds unless the visitor clicked recently.
  useEffect(() => {
    if (reduced || !active) return undefined
    const sinceManual = Date.now() - manualAt
    const delay = sinceManual < 8000 ? 8000 - sinceManual + 3800 : 3800
    const timer = window.setTimeout(() => onAuto(view === 'map' ? 'board' : 'map'), delay)
    return () => window.clearTimeout(timer)
  }, [active, manualAt, onAuto, reduced, view])

  const counts: Record<Status, number> = { planned: 0, doing: 0, done: 0, broken: 0 }
  const slots = SWITCH_SCENE.nodes.map((node) => {
    const status = node.status ?? 'planned'
    const row = counts[status]
    counts[status] += 1
    const column = Math.max(0, SWITCH_COLUMNS.indexOf(status))
    return {
      node,
      board: { x: columnX(column) + 8, y: PAD + HEADER_H + row * (CARD_H + CARD_GAP), w: COL_W - 16, h: CARD_H },
    }
  })
  const byId = new Map(SWITCH_SCENE.nodes.map((node) => [node.id, node]))
  const edges = SWITCH_SCENE.edges.flatMap((edge) => {
    const source = byId.get(edge.source)
    const target = byId.get(edge.target)
    return source && target ? [{ edge, source, target }] : []
  })
  const isBoard = view === 'board'
  const transition = reduced ? { duration: 0 } : FLY

  return (
    <SceneViewport width={SWITCH_SCENE.width} height={SWITCH_SCENE.height} paper={!isBoard}>
      <AnimatePresence>
        {isBoard
          ? SWITCH_COLUMNS.map((status, index) => (
              <motion.section
                key={status}
                className="chrome-heavy absolute rounded-frame"
                style={{ left: columnX(index), top: PAD, width: COL_W, height: SWITCH_SCENE.height - PAD * 2 }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: reduced ? 0 : 0.3 }}
              >
                <header className="flex items-center justify-between px-3 py-3">
                  <h3 className="display text-[15px] font-semibold">{STATUS_META[status].label}</h3>
                  <span className="rounded-full bg-panel-solid px-2 py-0.5 text-xs text-muted">{counts[status]}</span>
                </header>
              </motion.section>
            ))
          : null}
      </AnimatePresence>

      <svg className="pointer-events-none absolute inset-0 overflow-visible" width={SWITCH_SCENE.width} height={SWITCH_SCENE.height}>
        <AnimatePresence>
          {!isBoard
            ? edges.map(({ edge, source, target }) => (
                <DemoEdge key={edge.id} source={source} target={target} color={KINDS[source.kind ?? 'module'].color} />
              ))
            : null}
        </AnimatePresence>
      </svg>

      {slots.map(({ node, board }) => {
        const target = isBoard ? board : { x: node.x, y: node.y, w: node.w, h: node.h }
        return (
          <motion.div
            key={node.id}
            className="absolute left-0 top-0"
            initial={false}
            animate={{ x: target.x, y: target.y, width: target.w, height: target.h }}
            transition={transition}
          >
            <motion.div className="absolute inset-0" animate={{ opacity: isBoard ? 0 : 1 }} transition={{ duration: 0.25 }}>
              <DemoNode node={node} />
            </motion.div>
            <motion.div className="absolute inset-0" animate={{ opacity: isBoard ? 1 : 0 }} transition={{ duration: 0.25 }}>
              <BoardCard node={node} />
            </motion.div>
          </motion.div>
        )
      })}
      <AnimatePresence>
        {!isBoard
          ? edges.map(({ edge, source, target }) => {
              if (!edge.label) return null
              const path = edgePath(source, target)
              return <EdgeLabel key={edge.id} x={path.labelX} y={path.labelY} label={edge.label} />
            })
          : null}
      </AnimatePresence>
    </SceneViewport>
  )
}
