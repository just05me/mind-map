import { contrastText } from '../../model/color'
import type { KindDef } from '../../model/types'

export function KindBadge({
  kind,
  size = 28,
  shape = 'round',
}: {
  kind: KindDef
  size?: number
  shape?: 'round' | 'square'
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center text-[11px] font-semibold leading-none ${
        shape === 'square' ? 'rounded-[0.45rem]' : 'rounded-full'
      }`}
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
