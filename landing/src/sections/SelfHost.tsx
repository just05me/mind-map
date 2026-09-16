import { CLONE, DOCKER_RUN, LOCAL_RUN } from '../content/stack'
import { LINKS } from '../content/tokens'
import { LinkButton } from '../ui/Button'
import { CodeBlock } from '../ui/CodeBlock'
import { Reveal, Section, SectionHeading } from '../ui/Section'

export function SelfHost() {
  return (
    <Section id="selfhost" className="bg-ink/[0.025] dark:bg-white/[0.02]">
      <SectionHeading
        eyebrow="Запусти у себя"
        title="Локально за пять команд, на сервере — за одну"
        lead="Нужны Node.js 20+, npm и PostgreSQL (удобно через Docker). Без секретов в git: всё в .env."
      />
      <div className="mt-12 grid min-w-0 gap-4 lg:grid-cols-2">
        <Reveal className="flex min-w-0 flex-col gap-4">
          <CodeBlock code={CLONE} label="Клонировать" />
          <CodeBlock code={LOCAL_RUN} label="Локальный запуск · http://localhost:5173" />
        </Reveal>
        <Reveal delay={0.08} className="flex min-w-0 flex-col gap-4">
          <CodeBlock code={DOCKER_RUN} label="Деплой через Docker · http://localhost:3000" />
          <div className="chrome rounded-frame p-5 text-[14px] leading-relaxed text-muted">
            <p>
              Задайте случайный <code className="font-mono text-[12.5px] text-ink">SESSION_SECRET</code> не короче 32 символов,
              сильный <code className="font-mono text-[12.5px] text-ink">POSTGRES_PASSWORD</code> и точный{' '}
              <code className="font-mono text-[12.5px] text-ink">CORS_ORIGIN</code> доски. Демо-пользователя в образе нет —
              зарегистрируйтесь на экране входа.
            </p>
            <div className="mt-4">
              <LinkButton href={`${LINKS.github}#readme`} variant="secondary" external icon="github" iconRight="external">
                Подробнее в README
              </LinkButton>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}
