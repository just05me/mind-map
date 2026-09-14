import { useReducedMotion, type Transition } from 'motion/react'

export const UI_SPRING: Transition = { type: 'spring', bounce: 0, duration: 0.35 }
export const FADE: Transition = { duration: 0.2 }

export function useUiMotion() {
  const reduced = useReducedMotion()
  return {
    reduced: Boolean(reduced),
    spring: reduced ? FADE : UI_SPRING,
    fade: FADE,
    panelEnter: reduced ? { opacity: 0 } : { opacity: 0, x: 20 },
    panelShown: { opacity: 1, x: 0 },
    panelLeave: reduced ? { opacity: 0 } : { opacity: 0, x: 20 },
    popEnter: reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -6 },
    popShown: { opacity: 1, scale: 1, y: 0 },
    popLeave: reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -6 },
  }
}
