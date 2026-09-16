import { motion } from 'motion/react'
import { useUiMotion } from '../lib/motion'
import { useApp } from '../store/AppContext'
import { Icon, type IconName } from '../ui/Icon'
import { MOD_KEY } from './shortcuts'

type DockTool = {
  id: string
  label: string
  hint: string
  icon: IconName
}

const TOOLS: DockTool[] = [
  { id: 'select', label: 'Выбор', hint: 'V', icon: 'cursor' },
  { id: 'pan', label: 'Рука', hint: 'H или пробел', icon: 'hand' },
  { id: 'node', label: 'Узел', hint: 'N', icon: 'box' },
  { id: 'sticky', label: 'Стикер', hint: 'S', icon: 'sticky' },
  { id: 'text', label: 'Текст', hint: 'T', icon: 'text' },
  { id: 'frame', label: 'Рамка', hint: 'F', icon: 'frame' },
  { id: 'connect', label: 'Связь', hint: 'L', icon: 'connect' },
]

export function CanvasToolbar() {
  const { state, setCanvasTool, setPendingKind, undo, redo } = useApp()
  const motionUi = useUiMotion()
  const readOnly = state.interactionMode === 'view'

  const activeId = (() => {
    if (state.canvasTool === 'add') return state.pendingKind === 'note' ? 'sticky' : 'node'
    return state.canvasTool
  })()

  const choose = (id: string) => {
    switch (id) {
      case 'node':
        setPendingKind(state.pendingKind && state.pendingKind !== 'note' ? state.pendingKind : 'module')
        return
      case 'sticky':
        setPendingKind('note')
        return
      case 'select':
      case 'pan':
      case 'text':
      case 'frame':
      case 'connect':
        setCanvasTool(id)
        return
      default:
        return
    }
  }

  if (readOnly) {
    return (
      <motion.div
        initial={motionUi.reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={motionUi.spring}
        className="chrome-heavy pointer-events-auto flex items-center gap-2 rounded-2xl px-3 py-2 text-[12px] text-[var(--muted)]"
        role="status"
        aria-label="Режим просмотра"
      >
        <Icon name="eye" size={16} />
        Просмотр: можно двигать холст и выбирать элементы
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={motionUi.reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={motionUi.spring}
      className="chrome-heavy pointer-events-auto flex items-center gap-0.5 rounded-2xl p-1.5"
      role="toolbar"
      aria-label="Инструменты холста"
    >
      {TOOLS.map((tool, index) => (
        <span key={tool.id} className="flex items-center">
          {index === 2 ? <span className="toolbar-sep" /> : null}
          <button
            type="button"
            aria-pressed={activeId === tool.id}
            data-tip={`${tool.label} · ${tool.hint}`}
            aria-label={`${tool.label} · ${tool.hint}`}
            data-tip-side="top"
            className={`dock-btn ${activeId === tool.id ? 'is-active' : ''}`}
            onClick={() => choose(tool.id)}
          >
            <Icon name={tool.icon} size={18} />
          </button>
        </span>
      ))}
      <span className="toolbar-sep" />
      <button
        type="button"
        className="dock-btn"
        disabled={state.past.length === 0}
        data-tip={`Отменить · ${MOD_KEY}Z`}
        aria-label={`Отменить · ${MOD_KEY}Z`}
        data-tip-side="top"
        onClick={undo}
      >
        <Icon name="undo" size={18} />
      </button>
      <button
        type="button"
        className="dock-btn"
        disabled={state.future.length === 0}
        data-tip={`Повторить · ${MOD_KEY}⇧Z`}
        aria-label={`Повторить · ${MOD_KEY}⇧Z`}
        data-tip-side="top"
        onClick={redo}
      >
        <Icon name="redo" size={18} />
      </button>
    </motion.div>
  )
}
