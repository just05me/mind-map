import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

export function Section({
  id,
  children,
  className = '',
  tight = false,
}: {
  id?: string
  children: ReactNode
  className?: string
  tight?: boolean
}) {
  return (
    <section id={id} className={`scroll-mt-20 ${tight ? 'py-12 md:py-16' : 'py-16 md:py-24'} ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-5 md:px-8">{children}</div>
    </section>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = 'center',
}: {
  eyebrow?: string
  title: ReactNode
  lead?: ReactNode
  align?: 'center' | 'left'
}) {
  return (
    <Reveal className={`${align === 'center' ? 'mx-auto text-center' : ''} max-w-2xl`}>
      {eyebrow ? <div className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-accent">{eyebrow}</div> : null}
      <h2 className="display text-[28px] font-semibold md:text-[36px]">{title}</h2>
      {lead ? <p className="mt-4 text-[16px] leading-relaxed text-muted md:text-[17px]">{lead}</p> : null}
    </Reveal>
  )
}

/** Fade-and-rise once when scrolled into view; static with reduced motion. */
export function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const reduced = Boolean(useReducedMotion())
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ type: 'spring', bounce: 0, duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  )
}
