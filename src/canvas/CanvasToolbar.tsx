import { useUiMotion } from '../lib/motion'
import { motion } from 'motion/react'
import { useApp } from '../store/AppContext'
import type { CanvasTool } from '../types'

const TOOLS: { id: CanvasTool; label: string; hint: string }[] = [
  { id: 'select', label: 'Выбор', hint: 'V' },
  { id: 'pan', label: 'Рука', hint: 'H' },
  { id: 'add', label: 'Узел', hint: 'A' },
  { id: 'text', label: 'Текст', hint: 'T' },
  { id: 'frame', label: 'Рамка', hint: 'F' },
  { id: 'connect', label: 'Связь', hint: 'L' },
]

export function CanvasToolbar() {
  const { state, setCanvasTool, setPendingKind } = useApp()
  const motionUi = useUiMotion()

  return (
    <motion.div
      initial={motionUi.popEnter}
      animate={motionUi.popShown}
      transition={motionUi.spring}
      className="chrome flex items-center gap-0.5 rounded-full px-1.5 py-1"
    >
      {TOOLS.map((tool) => {
        const active = state.canvasTool === tool.id
        return (
          <button
            key={tool.id}
            type="button"
            title={`${tool.label} (${tool.hint})`}
            className={`pressable rounded-full px-2.5 py-1 text-[12px] ${
              active
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text)] hover:bg-[var(--accent-soft)]'
            }`}
            onPointerDown={() => {
              setCanvasTool(tool.id)
              if (tool.id === 'add' && !state.pendingKind) setPendingKind('module')
            }}
          >
            {tool.label}
          </button>
        )
      })}
    </motion.div>
  )
}
