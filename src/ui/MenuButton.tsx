import { Icon, type IconName } from './Icon'

export function MenuButton({
  label,
  icon,
  hint,
  danger,
  onClick,
}: {
  label: string
  icon?: IconName
  hint?: string
  danger?: boolean
  onClick: () => void
}) {
  return (
    <button type="button" role="menuitem" className={`menu-item ${danger ? 'danger' : ''}`} onClick={onClick}>
      {icon ? <Icon name={icon} size={15} className="opacity-80" /> : null}
      <span className="flex-1">{label}</span>
      {hint ? <kbd className="kbd-hint">{hint}</kbd> : null}
    </button>
  )
}
