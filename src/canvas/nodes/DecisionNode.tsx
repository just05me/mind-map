import { Handle, Position, type NodeProps } from '@xyflow/react'
import { memo } from 'react'
import { contrastText, nodeAccent } from '../../model/color'
import { requireKind } from '../../model/kinds'
import { useNodeScene } from '../../store/AppContext'
import type { AppNode } from '../../model/types'
import { InlineTitle } from './InlineTitle'

export const DecisionNode = memo(function DecisionNode({ id, data, selected }: NodeProps<AppNode>) {
  const { kinds } = useNodeScene()
  const kind = requireKind(kinds, data.kind)
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
      <Handle type="target" position={Position.Top} className="app-handle" />
      <Handle type="source" position={Position.Right} className="app-handle" />
      <Handle type="target" position={Position.Left} id="in-left" className="app-handle" />
      <Handle type="source" position={Position.Bottom} id="out-bottom" className="app-handle" />
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
})
