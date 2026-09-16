import { Icon } from './Icon'
import type { ThemeMode } from './use-theme'

export function ThemeToggle({ theme, onToggle }: { theme: ThemeMode; onToggle: () => void }) {
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      className="pressable grid h-9 w-9 place-items-center rounded-[0.7rem] text-ink hover:bg-ink/8"
      aria-label={dark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      title={dark ? 'Светлая тема' : 'Тёмная тема'}
      onClick={onToggle}
    >
      <Icon name={dark ? 'sun' : 'moon'} size={17} />
    </button>
  )
}
