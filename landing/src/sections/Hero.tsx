import { motion, useReducedMotion } from 'motion/react'
import { LINKS } from '../content/tokens'
import { HeroCanvasDemo } from '../demos/HeroCanvasDemo'
import { LinkButton, Pill } from '../ui/Button'

export function Hero() {
  const reduced = Boolean(useReducedMotion())
  const rise = (delay: number) => ({
    initial: reduced ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { type: 'spring' as const, bounce: 0, duration: 0.7, delay },
  })

  return (
    <section id="top" className="relative overflow-hidden pb-16 pt-14 md:pb-24 md:pt-20">
      <div className="paper pointer-events-none absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div className="flex flex-wrap justify-center gap-2" {...rise(0)}>
            <Pill icon="gift" tone="green">
              Абсолютно бесплатно
            </Pill>
            <Pill icon="github">Open source</Pill>
            <Pill icon="sparkle" tone="amber">
              Без ограничений
            </Pill>
          </motion.div>
          <motion.h1 className="display mt-6 text-[36px] font-semibold md:text-[56px]" {...rise(0.05)}>
            Карта архитектуры и статусы задач на одном холсте
          </motion.h1>
          <motion.p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-muted md:text-[19px]" {...rise(0.1)}>
            Модули, сервисы, API, агенты и заметки — как в FigJam, только про вашу систему. Соедините узлы
            подписанными стрелками, а потом откройте тот же граф видом «Статусы»: задумано, в работе, готово.
          </motion.p>
          <motion.div className="mt-8 flex flex-wrap items-center justify-center gap-3" {...rise(0.15)}>
            <LinkButton href={LINKS.app} size="lg" external iconRight="arrowRight">
              Открыть бесплатно
            </LinkButton>
            <LinkButton href={LINKS.github} size="lg" variant="secondary" icon="github" external>
              Код на GitHub
            </LinkButton>
          </motion.div>
          <motion.p className="mt-4 text-[13px] text-muted" {...rise(0.2)}>
            Без карты и тарифов. Аккаунт нужен только чтобы схемы жили на сервере, а не в одном браузере.
          </motion.p>
        </div>

        <motion.div
          className="mt-12 md:mt-16"
          initial={reduced ? false : { opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.9, delay: 0.25 }}
        >
          <HeroCanvasDemo />
        </motion.div>
      </div>
    </section>
  )
}
