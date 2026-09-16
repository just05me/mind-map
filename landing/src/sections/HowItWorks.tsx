import { motion, useReducedMotion } from 'motion/react'
import { FLOW, TECH } from '../content/stack'
import { Icon } from '../ui/Icon'
import { Reveal, Section, SectionHeading } from '../ui/Section'

const NOTES = [
  'Правила графа, undo и владение данными — в store и model, не в узлах.',
  'XYFlow рисует холст, но не хранит истину: источник — Project в сторе.',
  'После входа проекты уходят на API; без сессии остаётся локальный кэш в браузере.',
  'Пользователи и права — только на сервере. Из React в базу ходить нельзя.',
]

export function HowItWorks() {
  const reduced = Boolean(useReducedMotion())

  return (
    <Section id="stack">
      <SectionHeading
        eyebrow="Как это устроено"
        title="Один поток данных — от клика до PostgreSQL"
        lead="Простая архитектура без второго движка состояния: действие, reducer, проект, API, база."
      />

      <Reveal className="mt-12">
        <ol className="grid gap-3 md:grid-cols-5">
          {FLOW.map((step, index) => (
            <motion.li
              key={step.title}
              className="node-card relative rounded-node p-4"
              initial={reduced ? false : { opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.5, delay: reduced ? 0 : index * 0.12 }}
            >
              <div className="text-[11px] font-semibold uppercase tracking-wide text-accent">Шаг {index + 1}</div>
              <div className="mt-1 text-[14.5px] font-semibold tracking-[-0.01em]">{step.title}</div>
              <div className="mt-1 text-[12.5px] text-muted">{step.note}</div>
              {index < FLOW.length - 1 ? (
                <span className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-muted md:block" aria-hidden>
                  <Icon name="arrowRight" size={14} />
                </span>
              ) : null}
            </motion.li>
          ))}
        </ol>
      </Reveal>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <Reveal>
          <ul className="space-y-3">
            {NOTES.map((note) => (
              <li key={note} className="flex items-start gap-3 text-[14.5px] leading-relaxed text-muted">
                <span className="mt-1.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                  <Icon name="check" size={11} />
                </span>
                {note}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1}>
          <ul className="flex flex-wrap gap-2" aria-label="Технологии">
            {TECH.map((tech) => (
              <li key={tech.name}>
                <a
                  href={tech.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="chrome pressable inline-flex items-center gap-2 rounded-full py-1.5 pl-2 pr-3 text-[13px] hover:bg-panel-solid"
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: tech.color }} aria-hidden />
                  <span className="font-medium">{tech.name}</span>
                  <span className="text-muted">{tech.role}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[13px] text-muted">
            В dev Vite проксирует <code className="rounded bg-ink/6 px-1 py-0.5 font-mono text-[12px]">/api</code> на Hono
            (порт 3000). В production тот же процесс отдаёт API и собранный фронтенд.
          </p>
        </Reveal>
      </div>
    </Section>
  )
}
