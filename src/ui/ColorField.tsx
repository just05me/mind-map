import type { KindDef } from '../types'

export function ColorField({
  label,
  value,
  fallback,
  onChange,
  allowClear = false,
}: {
  label: string
  value?: string
  fallback?: string
  onChange: (next: string | undefined) => void
  allowClear?: boolean
}) {
  const shown = value || fallback || '#8e8e93'
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-[var(--muted)]">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          className="pressable h-8 w-10 cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--panel-solid)] p-0.5"
          value={normalizeHex(shown)}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          className="field font-mono text-xs"
          value={value ?? ''}
          placeholder={fallback ?? '#000000'}
          onChange={(event) => {
            const next = event.target.value.trim()
            onChange(next || undefined)
          }}
        />
        {allowClear && value ? (
          <button
            type="button"
            className="pressable text-xs text-[var(--muted)]"
            onClick={() => onChange(undefined)}
          >
            Сброс
          </button>
        ) : null}
      </div>
    </label>
  )
}

export function ColorSwatch({
  color,
  onChange,
  title,
}: {
  color: string
  onChange?: (color: string) => void
  title?: string
}) {
  if (!onChange) {
    return (
      <span
        title={title}
        className="inline-block h-3 w-3 shrink-0 rounded-full border border-black/10 dark:border-white/15"
        style={{ background: color }}
      />
    )
  }
  return (
    <label title={title} className="nodrag relative inline-block h-3 w-3 shrink-0">
      <span
        className="absolute inset-0 rounded-full border border-black/10 dark:border-white/15"
        style={{ background: color }}
      />
      <input
        type="color"
        className="absolute inset-0 cursor-pointer opacity-0"
        value={normalizeHex(color)}
        onChange={(event) => onChange(event.target.value)}
        onPointerDown={(event) => event.stopPropagation()}
      />
    </label>
  )
}

export function KindColorRow({
  kind,
  onChange,
}: {
  kind: KindDef
  onChange: (color: string) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        className="pressable h-7 w-8 cursor-pointer rounded-md border border-[var(--border)] bg-transparent p-0.5"
        value={normalizeHex(kind.color)}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="min-w-0 flex-1 truncate text-xs">{kind.name}</span>
    </div>
  )
}

function normalizeHex(value: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    return `#${value
      .slice(1)
      .split('')
      .map((ch) => ch + ch)
      .join('')}`
  }
  return '#8e8e93'
}
