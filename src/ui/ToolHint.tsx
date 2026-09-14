import { AnimatePresence, motion } from 'motion/react'
import { requireKind } from '../kinds/catalog'
import { useUiMotion } from '../lib/motion'
import { useApp } from '../store/AppContext'
import { Icon } from './Icon'

/** Tells the user what the next click does while a non-default tool is active. */
export function ToolHint() {
  const { state, project, setCanvasTool } = useApp()
  const motionUi = useUiMotion()
  const message = hintFor(state.canvasTool, state.pendingKind, state.connectSourceId, project)

  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center">
      <AnimatePresence>
        {message ? (
          <motion.div
            key={message}
            initial={motionUi.popEnter}
            animate={motionUi.popShown}
            exit={motionUi.popLeave}
            transition={motionUi.spring}
            className="chrome pointer-events-auto flex items-center gap-2 rounded-full py-1 pl-3.5 pr-1 text-[12px]"
          >
            <span>{message}</span>
            <button
              type="button"
              className="flex items-center gap-1 rounded-full px-2 py-1 text-[var(--muted)] hover:bg-[var(--panel-muted)] hover:text-[var(--text)]"
              onClick={() => setCanvasTool('select')}
            >
              <kbd className="kbd-hint">Esc</kbd>
              <Icon name="close" size={13} />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function hintFor(
  tool: ReturnType<typeof useApp>['state']['canvasTool'],
  pendingKind: string | null,
  connectSourceId: string | null,
  project: ReturnType<typeof useApp>['project'],
): string | null {
  switch (tool) {
    case 'add':
      return `Кликните на холсте — появится «${requireKind(project.kinds, pendingKind ?? 'module').name}»`
    case 'text':
      return 'Кликните и пишите'
    case 'frame':
      return 'Кликните, чтобы поставить рамку. Перетащите в неё узлы'
    case 'connect':
      return connectSourceId ? 'Теперь кликните второй узел' : 'Кликните первый узел'
    case 'pan':
      return 'Двигайте холст мышью'
    case 'select':
      return null
    default: {
      const _never: never = tool
      return _never
    }
  }
}
