import { motion, useReducedMotion } from 'motion/react'
import { FEATURES } from '../content/features'
import { Icon } from '../ui/Icon'
import { Section, SectionHeading } from '../ui/Section'

export function Features() {
  const reduced = Boolean(useReducedMotion())

  return (
    <Section id="features">
      <SectionHeading
        eyebrow="Возможности"
        title="Всё, что нужно для карты системы"
        lead="Редактор в духе FigJam с типами узлов под архитектуру: от входов и API до агентов и очередей."
      />
      <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, index) => (
          <motion.li
            key={feature.title}
            className="node-card group rounded-node p-5"
            initial={reduced ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.55, delay: reduced ? 0 : (index % 3) * 0.06 }}
          >
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[0.65rem] bg-accent-soft text-accent">
                <Icon name={feature.icon} size={18} />
              </span>
              <h3 className="text-[15px] font-semibold tracking-[-0.01em]">{feature.title}</h3>
            </div>
            <p className="mt-3 text-[13.5px] leading-relaxed text-muted">{feature.text}</p>
          </motion.li>
        ))}
      </ul>
    </Section>
  )
}
