import { motion, useReducedMotion } from 'motion/react'
import { BOARD_ITEMS, BOARD_PHASES } from '../content/demo-scenes'
import { STATUS_META, STATUSES, type Status } from '../content/tokens'
import { BoardCard } from './DemoNode'
import { DemoFrame } from './DemoFrame'
import { SceneViewport } from './SceneViewport'
import { usePhaseLoop } from './use-scene-player'

const COL_W = 200
const COL_GAP = 12
const PAD = 16
const CARD_H = 64
const CARD_GAP = 8
const HEADER_H = 44
const ROWS = tallestColumn()
const WIDTH = PAD * 2 + STATUSES.length * COL_W + (STATUSES.length - 1) * COL_GAP
const HEIGHT = PAD * 2 + HEADER_H + ROWS * (CARD_H + CARD_GAP) + 8

const SPRING = { type: 'spring' as const, bounce: 0.15, duration: 0.7 }

export function StatusBoardDemo() {
  return (
    <DemoFrame title="Оплата заказа" view="board" dock={false}>
      {(active) => <BoardScene active={active} />}
    </DemoFrame>
  )
}

/** Rows needed so the fullest column in any phase never overflows. */
function tallestColumn(): number {
  let rows = 1
  for (let phase = 0; phase < BOARD_PHASES; phase += 1) {
    const counts: Record<Status, number> = { planned: 0, doing: 0, done: 0, broken: 0 }
    for (const item of BOARD_ITEMS) counts[item.statuses[phase] ?? 'planned'] += 1
    rows = Math.max(rows, ...STATUSES.map((status) => counts[status]))
  }
  return rows
}

function columnX(index: number): number {
  return PAD + index * (COL_W + COL_GAP)
}

function BoardScene({ active }: { active: boolean }) {
  const phase = usePhaseLoop(BOARD_PHASES, 2200, active)
  const reduced = Boolean(useReducedMotion())
  const counts: Record<Status, number> = { planned: 0, doing: 0, done: 0, broken: 0 }
  const slots = BOARD_ITEMS.map((item) => {
    const status = item.statuses[phase] ?? 'planned'
    const row = counts[status]
    counts[status] += 1
    return {
      item,
      status,
      x: columnX(STATUSES.indexOf(status)) + 8,
      y: PAD + HEADER_H + row * (CARD_H + CARD_GAP),
    }
  })

  return (
    <SceneViewport width={WIDTH} height={HEIGHT} paper={false}>
      {STATUSES.map((status, index) => (
        <section
          key={status}
          className="chrome-heavy absolute flex flex-col rounded-frame"
          style={{ left: columnX(index), top: PAD, width: COL_W, height: HEIGHT - PAD * 2 }}
        >
          <header className="flex items-center justify-between px-3 py-3">
            <h3 className="display text-[15px] font-semibold">{STATUS_META[status].label}</h3>
            <span className="rounded-full bg-panel-solid px-2 py-0.5 text-xs text-muted">{counts[status]}</span>
          </header>
          {counts[status] === 0 ? (
            <div className="mx-2 rounded-xl border border-dashed border-line px-3 py-6 text-center text-xs text-muted">
              Перетащите карточку сюда
            </div>
          ) : null}
        </section>
      ))}
      {slots.map(({ item, x, y }) => (
        <motion.div
          key={item.id}
          className="absolute"
          style={{ width: COL_W - 16, height: CARD_H }}
          initial={false}
          animate={{ x, y }}
          transition={reduced ? { duration: 0 } : SPRING}
        >
          <BoardCard node={{ id: item.id, type: 'kind', kind: item.kind, title: item.title, x, y, w: COL_W - 16, h: CARD_H, step: 0 }} />
        </motion.div>
      ))}
    </SceneViewport>
  )
}
