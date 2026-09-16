import { LINKS } from '../content/tokens'
import { LinkButton } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { Reveal, Section } from '../ui/Section'
import { Logo } from './Header'

export function FinalCta() {
  return (
    <Section tight>
      <Reveal>
        <div className="relative overflow-hidden rounded-[1.75rem] bg-accent px-6 py-12 text-center text-white md:px-12 md:py-16">
          <div className="paper pointer-events-none absolute inset-0 opacity-15 [--canvas-dot:rgba(255,255,255,0.7)] [background-color:transparent]" />
          <div className="relative">
            <h2 className="display text-[28px] font-semibold md:text-[40px]">Нарисуйте систему сегодня</h2>
            <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-white/85 md:text-[17px]">
              Бесплатно, без ограничений и с открытым кодом. Откройте доску в браузере или поднимите свою копию.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <LinkButton
                href={LINKS.app}
                size="lg"
                external
                iconRight="arrowRight"
                className="!bg-white !text-accent hover:!brightness-95"
              >
                Открыть доску
              </LinkButton>
              <LinkButton
                href={LINKS.github}
                size="lg"
                external
                icon="github"
                className="!bg-white/15 !text-white ring-1 ring-white/30 hover:!bg-white/25"
              >
                Код на GitHub
              </LinkButton>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-center gap-3">
          <Logo size={26} />
          <div>
            <div className="text-[14px] font-semibold">Доска схем</div>
            <div className="text-[12.5px] text-muted">Если доска полезна — поставьте звезду репозиторию.</div>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]" aria-label="Ссылки">
          <a href={LINKS.app} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 text-muted hover:text-ink">
            <Icon name="external" size={13} />
            Доска
          </a>
          <a href={LINKS.github} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 text-muted hover:text-ink">
            <Icon name="github" size={13} />
            GitHub
          </a>
          <a href={LINKS.issues} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 text-muted hover:text-ink">
            <Icon name="help" size={13} />
            Issues
          </a>
          <a href={LINKS.stars} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 text-accent hover:brightness-110">
            <Icon name="star" size={13} />
            Поставить звезду
          </a>
        </nav>
      </div>
    </footer>
  )
}
