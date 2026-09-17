import { type NodeProps } from '@xyflow/react'
import { memo } from 'react'
import { contrastText, nodeAccent, nodeFill } from '../../model/color'
import { requireKind } from '../../model/kinds'
import { isShapeNode, nodeDesign } from '../../model/node-design'
import { statusClass, statusLabel } from '../../model/status'
import type { AppNode, NodeData } from '../../model/types'
import { useNodeScene } from '../../store/AppContext'
import { InlineTitle } from './InlineTitle'
import { KindGlyph } from './KindGlyph'
import { NodeArt } from './NodeArt'
import { NodeHandles } from './NodeHandles'

export const KindNode = memo(function KindNode({ id, data, selected }: NodeProps<AppNode>) {
  const { kinds } = useNodeScene()
  const kind = requireKind(kinds, data.kind)
  const design = nodeDesign(data.kind)
  const accent = nodeAccent(data, kind)

  if (isShapeNode(design.shape)) {
    return <ShapeNode id={id} data={data} selected={selected} accent={accent} glyph={design.glyph} shape={design.shape} kindName={kind.name} />
  }
  return <CardNode id={id} data={data} selected={selected} accent={accent} glyph={design.glyph} kindName={kind.name} />
})

type BaseProps = {
  id: string
  data: NodeData
  selected: boolean
  accent: string
  glyph: ReturnType<typeof nodeDesign>['glyph']
  kindName: string
}

function StatusPill({ status }: { status: NodeData['status'] }) {
  if (status === 'planned') return null
  return (
    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] ${statusClass(status)}`}>
      {statusLabel(status)}
    </span>
  )
}

function CardNode({ id, data, selected, accent, glyph, kindName }: BaseProps) {
  const items = data.items?.filter(Boolean) ?? []
  const fill = nodeFill(data, 'var(--panel-solid)')
  const textColor = data.fillColor ? contrastText(fill) : undefined

  return (
    <div
      className={`node-card min-w-[220px] max-w-[280px] rounded-[0.9rem] border px-3 py-2.5 ${
        selected ? 'is-selected' : ''
      }`}
      style={{ background: fill, borderColor: 'var(--border)', color: textColor }}
    >
      <NodeHandles />
      <div className="flex items-start gap-2.5">
        <span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-[0.55rem]"
          style={{ background: accent, color: contrastText(accent) }}
        >
          <KindGlyph name={glyph} size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <InlineTitle
            nodeId={id}
            value={data.title}
            placeholder={kindName}
            className="truncate text-[13px] font-medium leading-5 tracking-[-0.01em]"
          />
          {data.subtitle ? (
            <div className="truncate text-[11px] opacity-70">{data.subtitle}</div>
          ) : null}
        </div>
        <StatusPill status={data.status} />
      </div>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-0.5 border-t border-[var(--border)] pt-2 text-[11px] opacity-80">
          {items.slice(0, 5).map((item, index) => (
            <li key={index} className="flex items-center gap-1.5 truncate">
              <span className="kind-dot !h-1.5 !w-1.5" style={{ background: accent }} />
              {item}
            </li>
          ))}
          {items.length > 5 ? <li className="pl-3 opacity-60">+{items.length - 5}…</li> : null}
        </ul>
      ) : null}
    </div>
  )
}

function ShapeNode({
  id,
  data,
  selected,
  accent,
  glyph,
  shape,
  kindName,
}: BaseProps & { shape: ReturnType<typeof nodeDesign>['shape'] }) {
  const items = data.items?.filter(Boolean) ?? []

  return (
    <div
      className={`node-shape relative flex w-[168px] flex-col items-center rounded-[1rem] px-3 pb-2.5 pt-3 ${
        selected ? 'is-selected' : ''
      }`}
      style={data.fillColor ? { background: data.fillColor } : undefined}
    >
      <NodeHandles />
      {data.status !== 'planned' ? (
        <span className="absolute right-2 top-2">
          <StatusPill status={data.status} />
        </span>
      ) : null}
      <NodeArt shape={shape} color={accent} />
      <div className="mt-1.5 w-full text-center">
        <InlineTitle
          nodeId={id}
          value={data.title}
          placeholder={kindName}
          className="truncate text-[13px] font-semibold leading-5 tracking-[-0.01em]"
        />
        {data.subtitle ? (
          <div className="truncate text-[11px] text-[var(--muted)]">{data.subtitle}</div>
        ) : null}
      </div>
      {items.length > 0 ? (
        <div className="mt-1.5 flex flex-wrap justify-center gap-1">
          {items.slice(0, 4).map((item, index) => (
            <span
              key={index}
              className="max-w-[130px] truncate rounded-md px-1.5 py-0.5 text-[10px]"
              style={{ background: `${accent}1f`, color: 'var(--text)' }}
            >
              {item}
            </span>
          ))}
          {items.length > 4 ? <span className="text-[10px] text-[var(--muted)]">+{items.length - 4}</span> : null}
        </div>
      ) : null}
      <span className="mt-1 flex items-center gap-1 text-[10px] uppercase tracking-wide text-[var(--muted)]">
        <KindGlyph name={glyph} size={11} />
        {kindName}
      </span>
    </div>
  )
}
