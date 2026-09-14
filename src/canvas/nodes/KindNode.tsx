import { Handle, Position, type NodeProps } from '@xyflow/react'
import { contrastText } from '../../lib/color'
import { nodeAccent, nodeFill } from '../../lib/node-color'
import { requireKind } from '../../kinds/catalog'
import { statusClass, statusLabel } from '../../lib/status'
import { useApp } from '../../store/AppContext'
import { ColorSwatch } from '../../ui/ColorField'
import type { AppNode } from '../../types'
import { InlineTitle } from './InlineTitle'
import { KindBadge } from './KindBadge'

export function KindNode({ id, data, selected }: NodeProps<AppNode>) {
  const { project, updateNodeData } = useApp()
  const kind = requireKind(project.kinds, data.kind)
  const items = data.items?.filter(Boolean) ?? []
  const accent = nodeAccent(data, kind)
  const fill = nodeFill(data, 'var(--panel-solid)')
  const customFill = Boolean(data.fillColor)
  const textColor = customFill ? contrastText(fill) : undefined

  return (
    <div
      className={`node-card min-w-[220px] max-w-[280px] rounded-[1.05rem] border px-3 py-2.5 ${
        selected ? 'ring-2 ring-[var(--accent)]/30' : ''
      }`}
      style={{
        background: fill,
        borderColor: selected ? accent : 'var(--border)',
        color: textColor,
        boxShadow: `inset 3px 0 0 ${accent}`,
      }}
    >
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border-[var(--panel-solid)] !bg-zinc-400" />
      <div className="flex items-start gap-2.5">
        <KindBadge kind={{ ...kind, color: accent }} />
        <div className="min-w-0 flex-1">
          <InlineTitle
            nodeId={id}
            value={data.title}
            placeholder={kind.name}
            className="truncate text-[13px] font-medium leading-5 tracking-[-0.01em]"
          />
          {data.subtitle ? (
            <div className="truncate text-[11px] opacity-70">{data.subtitle}</div>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-1">
          <ColorSwatch
            color={accent}
            title="Цвет узла"
            onChange={(color) => updateNodeData(id, { accentColor: color })}
          />
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${statusClass(data.status)}`}>
            {statusLabel(data.status)}
          </span>
        </div>
      </div>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-0.5 pl-[38px] text-[11px] opacity-70">
          {items.slice(0, 4).map((item) => (
            <li key={item} className="truncate">
              {item}
            </li>
          ))}
        </ul>
      ) : null}
      <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !border-[var(--panel-solid)] !bg-zinc-400" />
    </div>
  )
}
