import { type NodeProps } from '@xyflow/react'
import { contrastText, nodeAccent, nodeFill } from '../../model/color'
import { requireKind } from '../../model/kinds'
import { statusClass, statusLabel } from '../../model/status'
import type { AppNode } from '../../model/types'
import { useApp } from '../../store/AppContext'
import { InlineTitle } from './InlineTitle'
import { NodeHandles } from './NodeHandles'
import { KindBadge } from './KindBadge'

export function KindNode({ id, data, selected }: NodeProps<AppNode>) {
  const { project } = useApp()
  const kind = requireKind(project.kinds, data.kind)
  const items = data.items?.filter(Boolean) ?? []
  const accent = nodeAccent(data, kind)
  const fill = nodeFill(data, 'var(--panel-solid)')
  const customFill = Boolean(data.fillColor)
  const textColor = customFill ? contrastText(fill) : undefined

  return (
    <div
      className={`node-card min-w-[220px] max-w-[280px] rounded-[0.9rem] border px-3 py-2.5 ${
        selected ? 'is-selected' : ''
      }`}
      style={{
        background: fill,
        borderColor: 'var(--border)',
        color: textColor,
      }}
    >
      <NodeHandles />
      <div className="flex items-start gap-2.5">
        <KindBadge kind={{ ...kind, color: accent }} shape="square" />
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
        {data.status !== 'planned' ? (
          <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] ${statusClass(data.status)}`}>
            {statusLabel(data.status)}
          </span>
        ) : null}
      </div>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-0.5 border-t border-[var(--border)] pt-2 text-[11px] opacity-80">
          {items.slice(0, 4).map((item) => (
            <li key={item} className="flex items-center gap-1.5 truncate">
              <span className="kind-dot !h-1.5 !w-1.5" style={{ background: accent }} />
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
