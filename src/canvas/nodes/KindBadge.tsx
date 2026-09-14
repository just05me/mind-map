import { contrastText } from '../../model/color'
import { glyphFor } from '../../model/node-design'
import type { KindDef } from '../../model/types'
import { KindGlyph } from './KindGlyph'

export function KindBadge({
  kind,
  size = 28,
  shape = 'round',
}: {
  kind: KindDef
  size?: number
  shape?: 'round' | 'square'
}) {
  const glyph = glyphFor(kind.id)
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center text-[11px] font-semibold leading-none ${
        shape === 'square' ? 'rounded-[0.4rem]' : 'rounded-full'
      }`}
      style={{
        width: size,
        height: size,
        background: kind.color,
        color: contrastText(kind.color),
      }}
    >
      {glyph ? <KindGlyph name={glyph} size={Math.round(size * 0.62)} /> : kind.letter}
    </span>
  )
}
