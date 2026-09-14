import { Handle, Position, type NodeProps } from '@xyflow/react'
import { contrastText } from '../../lib/color'
import { nodeAccent } from '../../lib/node-color'
import { requireKind } from '../../kinds/catalog'
import { useApp } from '../../store/AppContext'
import type { AppNode } from '../../types'
import { InlineTitle } from './InlineTitle'

export function DecisionNode({ id, data, selected }: NodeProps<AppNode>) {
  const { project } = useApp()
  const kind = requireKind(project.kinds, data.kind)
  const accent = nodeAccent(data, kind)
  const fill = data.fillColor ?? accent
  const color = contrastText(fill)

  return (
    <div className="relative h-[148px] w-[148px]">
      <div
        className={`absolute inset-[18px] rotate-45 rounded-[1.1rem] ${
          selected ? 'ring-2 ring-[var(--accent)]/40' : ''
        }`}
        style={{ background: fill, boxShadow: 'var(--shadow-soft)' }}
      />
      <Handle type="target" position={Position.Top} className="!h-2.5 !w-2.5 !bg-zinc-400" />
      <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !bg-zinc-400" />
      <Handle type="target" position={Position.Left} id="in-left" className="!h-2.5 !w-2.5 !bg-zinc-400" />
      <Handle type="source" position={Position.Bottom} id="out-bottom" className="!h-2.5 !w-2.5 !bg-zinc-400" />
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <InlineTitle
          nodeId={id}
          value={data.title}
          placeholder="Решение?"
          className="max-w-[96px] text-center text-[12px] font-medium leading-4 tracking-[-0.01em]"
          style={{ color }}
        />
      </div>
    </div>
  )
}
