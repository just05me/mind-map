import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useUiMotion } from '../lib/motion'

/** Button + popover that closes on outside click or Escape. */
export function Dropdown({
  trigger,
  children,
  align = 'left',
  className = '',
  width = 'w-48',
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode
  children: (close: () => void) => ReactNode
  align?: 'left' | 'right'
  className?: string
  width?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const motionUi = useUiMotion()

  useEffect(() => {
    if (!open) return undefined
    const onPointer = (event: PointerEvent) => {
      if (ref.current && event.target instanceof Node && !ref.current.contains(event.target)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('pointerdown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className={`relative ${className}`}>
      {trigger({ open, toggle: () => setOpen((value) => !value) })}
      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            initial={motionUi.popEnter}
            animate={motionUi.popShown}
            exit={motionUi.popLeave}
            transition={motionUi.spring}
            style={{ transformOrigin: align === 'left' ? 'top left' : 'top right' }}
            className={`chrome-heavy absolute top-full z-50 mt-2 rounded-2xl p-1 ${width} ${
              align === 'left' ? 'left-0' : 'right-0'
            }`}
          >
            {children(() => setOpen(false))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
