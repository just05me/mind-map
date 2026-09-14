import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { SHORTCUT_GROUPS } from '../canvas/shortcuts'
import { useUiMotion } from '../lib/motion'
import { useApp } from '../store/AppContext'
import { Icon } from './Icon'

export function ShortcutsDialog() {
  const { state, setShortcutsOpen } = useApp()
  const motionUi = useUiMotion()
  const open = state.shortcutsOpen

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShortcutsOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setShortcutsOpen])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/25 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={motionUi.fade}
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) setShortcutsOpen(false)
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Горячие клавиши"
            initial={motionUi.popEnter}
            animate={motionUi.popShown}
            exit={motionUi.popLeave}
            transition={motionUi.spring}
            className="chrome-heavy max-h-full w-full max-w-[760px] overflow-y-auto rounded-[1.4rem] p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="display text-[17px] font-semibold">Горячие клавиши</h2>
              <button type="button" className="icon-btn" onClick={() => setShortcutsOpen(false)} aria-label="Закрыть">
                <Icon name="close" />
              </button>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              {SHORTCUT_GROUPS.map((group) => (
                <section key={group.title}>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                    {group.title}
                  </h3>
                  <ul className="space-y-1.5">
                    {group.items.map(([keys, label]) => (
                      <li key={label} className="flex items-baseline justify-between gap-3 text-[12px]">
                        <span>{label}</span>
                        <kbd className="kbd-hint shrink-0">{keys}</kbd>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
