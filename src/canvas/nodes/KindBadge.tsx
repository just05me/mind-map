import { contrastText } from '../../lib/color'
import type { KindDef } from '../../types'

export function KindBadge({ kind, size = 28 }: { kind: KindDef; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full text-[11px] font-semibold leading-none"
      style={{
        width: size,
        height: size,
        background: kind.color,
        color: contrastText(kind.color),
      }}
    >
      {kind.letter}
    </span>
  )
}
