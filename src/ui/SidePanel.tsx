import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'
import { useUiMotion } from '../lib/motion'
import { useApp } from '../store/AppContext'
import { Icon, type IconName } from './Icon'

/** A floating panel that collapses into a small tab at the screen edge. */
export function SidePanel({
  side,
  title,
  icon,
  children,
}: {
  side: 'left' | 'right'
  title: string
  icon: IconName
  children: ReactNode
}) {
  const { state, togglePanel } = useApp()
  const motionUi = useUiMotion()
  const open = side === 'left' ? state.leftPanelOpen : state.rightPanelOpen
  const offset = side === 'left' ? -24 : 24
  const hotkey = side === 'left' ? '[' : ']'

  return (
    <AnimatePresence initial={false} mode="popLayout">
      {open ? (
        <motion.div
          key="panel"
          initial={motionUi.reduced ? { opacity: 0 } : { opacity: 0, x: offset }}
          animate={{ opacity: 1, x: 0 }}
          exit={motionUi.reduced ? { opacity: 0 } : { opacity: 0, x: offset }}
          transition={motionUi.spring}
          className={`absolute top-3 z-20 flex max-h-[calc(100%-5.5rem)] flex-col ${
            side === 'left' ? 'left-3' : 'right-3'
          }`}
        >
          <aside
            className={`chrome-heavy flex min-h-0 flex-col overflow-hidden rounded-[1.1rem] ${
              side === 'left' ? 'w-[232px]' : 'w-[288px]'
            }`}
          >
            <header className="flex h-10 shrink-0 items-center gap-2 border-b border-[var(--border)] pl-3 pr-1.5">
              <span className="flex-1 text-[12px] font-semibold">{title}</span>
              <button
                type="button"
                className="icon-btn"
                data-tip={`Скрыть панель · ${hotkey}`}
                aria-label={`Скрыть панель · ${hotkey}`}
                data-tip-side="left"
                onClick={() => togglePanel(side, false)}
              >
                <Icon name={side === 'left' ? 'chevronLeft' : 'chevronRight'} />
              </button>
            </header>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
          </aside>
        </motion.div>
      ) : (
        <motion.button
          key="tab"
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={motionUi.fade}
          className={`chrome pressable absolute top-3 z-20 flex h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium hover:text-[var(--accent)] ${
            side === 'left' ? 'left-3' : 'right-3'
          }`}
          data-tip={`Показать · ${hotkey}`}
          aria-label={`${title} — показать панель`}
          data-tip-side="bottom"
          onClick={() => togglePanel(side, true)}
        >
          <Icon name={icon} size={15} />
          {title}
        </motion.button>
      )}
    </AnimatePresence>
  )
}
