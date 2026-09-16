import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'md' | 'lg'

const BASE =
  'pressable inline-flex items-center justify-center gap-2 rounded-[0.8rem] font-medium whitespace-nowrap transition-colors'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-white shadow-soft hover:brightness-110',
  secondary: 'chrome text-ink hover:bg-panel-solid',
  ghost: 'text-ink hover:bg-ink/8',
}

const SIZES: Record<Size, string> = {
  md: 'h-9 px-3.5 text-[13px]',
  lg: 'h-11 px-5 text-[15px]',
}

export function LinkButton({
  href,
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  external = false,
  className = '',
  ariaLabel,
}: {
  href: string
  children: ReactNode
  variant?: Variant
  size?: Size
  icon?: IconName
  iconRight?: IconName
  external?: boolean
  className?: string
  ariaLabel?: string
}) {
  return (
    <a
      href={href}
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer noopener' : undefined}
      aria-label={ariaLabel}
    >
      {icon ? <Icon name={icon} size={size === 'lg' ? 17 : 15} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={size === 'lg' ? 17 : 15} /> : null}
    </a>
  )
}

export function Pill({ children, icon, tone = 'accent' }: { children: ReactNode; icon?: IconName; tone?: 'accent' | 'green' | 'amber' }) {
  const tones = {
    accent: 'bg-accent-soft text-accent',
    green: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ${tones[tone]}`}>
      {icon ? <Icon name={icon} size={13} /> : null}
      {children}
    </span>
  )
}
