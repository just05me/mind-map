import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { LINKS } from '../content/tokens'
import { LinkButton } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { ThemeToggle } from '../ui/ThemeToggle'
import type { ThemeMode } from '../ui/use-theme'

const NAV: Array<{ href: string; label: string }> = [
  { href: '#free', label: 'Бесплатно' },
  { href: '#features', label: 'Возможности' },
  { href: '#demos', label: 'Примеры' },
  { href: '#stack', label: 'Устройство' },
  { href: '#selfhost', label: 'Запуск' },
  { href: '#usage', label: 'Как пользоваться' },
]

export function Header({ theme, onToggleTheme }: { theme: ThemeMode; onToggleTheme: () => void }) {
  const [open, setOpen] = useState(false)
  const reduced = Boolean(useReducedMotion())

  return (
    <header className="chrome-bar sticky top-0 z-40">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-5 md:px-8">
        <a href="#top" className="flex items-center gap-2.5 rounded-lg" aria-label="Доска схем — на главную">
          <Logo />
          <span className="text-[15px] font-semibold tracking-[-0.01em]">Доска схем</span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Разделы">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-2.5 py-1.5 text-[13px] text-muted transition-colors hover:bg-ink/6 hover:text-ink"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <div className="hidden sm:block">
            <LinkButton href={LINKS.github} variant="ghost" icon="github" external>
              GitHub
              <span className="ml-0.5 inline-flex items-center gap-0.5 rounded-full bg-ink/8 px-1.5 py-0.5 text-[11px] text-muted">
                <Icon name="star" size={11} />
                Звезда
              </span>
            </LinkButton>
          </div>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <div className="hidden sm:block">
            <LinkButton href={LINKS.app} external iconRight="arrowRight">
              Открыть
            </LinkButton>
          </div>
          <button
            type="button"
            className="pressable grid h-9 w-9 place-items-center rounded-[0.7rem] text-ink hover:bg-ink/8 lg:hidden"
            aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
          >
            <Icon name={open ? 'close' : 'menu'} size={18} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.nav
            className="border-t border-line bg-panel-heavy px-5 py-3 lg:hidden"
            aria-label="Разделы"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col gap-1">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-[14px] text-ink hover:bg-ink/6"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-2 flex gap-2 sm:hidden">
                <LinkButton href={LINKS.app} external className="flex-1">
                  Открыть
                </LinkButton>
                <LinkButton href={LINKS.github} variant="secondary" icon="github" external className="flex-1">
                  GitHub
                </LinkButton>
              </div>
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  )
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect x="4" y="4" width="56" height="56" rx="16" fill="var(--accent)" />
      <rect x="14" y="18" width="20" height="12" rx="4" fill="#fff" />
      <rect x="30" y="36" width="20" height="12" rx="4" fill="#fff" fillOpacity="0.92" />
      <path d="M24 30v6a4 4 0 0 0 4 4h2" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
