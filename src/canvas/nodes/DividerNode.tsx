import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react'
import { memo } from 'react'
import { nodeAccent } from '../../model/color'
import { requireKind } from '../../model/kinds'
import { useNodeScene } from '../../store/AppContext'
import type { AppNode } from '../../model/types'

export const DividerNode = memo(function DividerNode({ data, selected }: NodeProps<AppNode>) {
  const { kinds } = useNodeScene()
  const kind = requireKind(kinds, data.kind)
  const accent = nodeAccent(data, kind)

  return (
    <div className="relative flex h-full min-h-4 w-full min-w-[80px] items-center">
      <NodeResizer
        isVisible={selected}
        minWidth={80}
        minHeight={16}
        maxHeight={24}
        lineClassName="!border-[var(--accent)]"
        handleClassName="!h-2 !w-2 !border-[var(--accent)] !bg-white"
      />
      <div
        className="h-[2px] w-full rounded-full"
        style={{ background: accent, opacity: selected ? 1 : 0.75 }}
      />
      <Handle type="target" position={Position.Left} className="app-handle" />
      <Handle type="source" position={Position.Right} className="app-handle" />
    </div>
  )
})
