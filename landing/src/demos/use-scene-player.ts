import { useEffect, useState } from 'react'
import { useReducedMotion } from 'motion/react'

export type ScenePlayerOptions = {
  /** Last step index; the player counts 0…steps then loops. */
  steps: number
  /** Delay between steps in ms. */
  stepMs: number
  /** How long the finished scene stays before the loop restarts. */
  holdMs?: number
  /** Pause when the scene is off screen. */
  active: boolean
  loop?: boolean
}

/** Blank frame between loops; nothing has `step <= -1`, so everything exits. */
const BLANK = -1

/**
 * Drives step-by-step scene builds. With reduced motion the final step is
 * returned immediately and nothing moves.
 */
export function useScenePlayer({ steps, stepMs, holdMs = 2600, active, loop = true }: ScenePlayerOptions): number {
  const reduced = Boolean(useReducedMotion())
  const [step, setStep] = useState(reduced ? steps : 0)

  useEffect(() => {
    if (reduced) {
      setStep(steps)
      return undefined
    }
    if (!active) return undefined

    if (step === BLANK) {
      const timer = window.setTimeout(() => setStep(0), 450)
      return () => window.clearTimeout(timer)
    }
    if (step >= steps) {
      if (!loop) return undefined
      const timer = window.setTimeout(() => setStep(BLANK), holdMs)
      return () => window.clearTimeout(timer)
    }
    const timer = window.setTimeout(() => setStep((current) => current + 1), stepMs)
    return () => window.clearTimeout(timer)
  }, [active, holdMs, loop, reduced, step, stepMs, steps])

  return step
}

/** Cycles through `count` phases while active; static last phase with reduced motion. */
export function usePhaseLoop(count: number, phaseMs: number, active: boolean): number {
  const reduced = Boolean(useReducedMotion())
  const [phase, setPhase] = useState(reduced ? count - 1 : 0)

  useEffect(() => {
    if (reduced) {
      setPhase(count - 1)
      return undefined
    }
    if (!active) return undefined
    const timer = window.setTimeout(() => setPhase((current) => (current + 1) % count), phaseMs)
    return () => window.clearTimeout(timer)
  }, [active, count, phase, phaseMs, reduced])

  return phase
}
