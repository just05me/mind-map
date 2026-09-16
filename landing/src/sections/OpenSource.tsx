import { LINKS } from '../content/tokens'
import { LinkButton } from '../ui/Button'
import { Icon, type IconName } from '../ui/Icon'
import { Reveal, Section } from '../ui/Section'

const POINTS: Array<{ icon: IconName; title: string; text: string }> = [
  {
    icon: 'gift',
    title: 'Без оплаты и тарифов',
    text: 'Нет платного плана, лимита на проекты или узлы. Всё, что есть в приложении, доступно каждому.',
  },
  {
    icon: 'code',
    title: 'Весь код открыт',
    text: 'Фронтенд, API, миграции и Docker-файлы лежат в одном репозитории на GitHub. Читайте, форкайте, присылайте PR.',
  },
  {
    icon: 'terminal',
    title: 'Поднимается у себя',
    text: 'Одна команда docker compose up --build -d поднимает приложение и базу на вашем сервере.',
  },
  {
    icon: 'database',
    title: 'Данные — в вашей PostgreSQL',
    text: 'Схемы пишутся в вашу базу через Prisma. Никаких сторонних облаков: экспорт в JSON — в любой момент.',
  },
]

export function OpenSource() {
  return (
    <Section id="free" tight>
      <Reveal>
        <div className="chrome-heavy relative overflow-hidden rounded-[1.75rem] p-6 md:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <div className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-accent">Бесплатно и open source</div>
              <h2 className="display text-[28px] font-semibold md:text-[36px]">
                Инструмент, который не попросит карту
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-muted md:text-[17px]">
                Доска схем — открытый проект. Пользуйтесь на ffinance.uz или разверните собственную копию: код,
                Docker Compose и миграции уже в репозитории.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <LinkButton href={LINKS.stars} external icon="star">
                  Звезда на GitHub
                </LinkButton>
                <LinkButton href={LINKS.github} variant="secondary" external icon="github">
                  just05me/mind-map
                </LinkButton>
              </div>
              <code className="mt-5 inline-block rounded-lg bg-ink/6 px-3 py-1.5 font-mono text-[12.5px] text-ink">
                docker compose up --build -d
              </code>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {POINTS.map((point) => (
                <li key={point.title} className="node-card rounded-node p-4">
                  <span className="grid h-8 w-8 place-items-center rounded-[0.6rem] bg-accent-soft text-accent">
                    <Icon name={point.icon} size={17} />
                  </span>
                  <div className="mt-3 text-[14px] font-semibold">{point.title}</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{point.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </Section>
  )
}
