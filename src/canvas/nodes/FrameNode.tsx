import { NodeResizer, type NodeProps } from '@xyflow/react'
import { nodeAccent, nodeFill } from '../../lib/node-color'
import { requireKind } from '../../kinds/catalog'
import { useApp } from '../../store/AppContext'
import type { AppNode } from '../../types'
import { InlineTitle } from './InlineTitle'
import { NodeHandles } from './NodeHandles'

export function FrameNode({ id, data, selected }: NodeProps<AppNode>) {
  const { project } = useApp()
  const kind = requireKind(project.kinds, data.kind)
  const accent = nodeAccent(data, kind)
  const fill = data.fillColor ? nodeFill(data, 'transparent') : `${accent}14`

  return (
    <div
      className="h-full min-h-[180px] w-full min-w-[220px] rounded-[1.25rem] border px-2 pt-1"
      style={{
        borderColor: selected ? accent : `${accent}66`,
        background: fill,
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={220}
        minHeight={180}
        lineClassName="!border-[var(--accent)]"
        handleClassName="!h-2 !w-2 !border-[var(--accent)] !bg-white"
      />
      <InlineTitle
        nodeId={id}
        value={data.title}
        placeholder="Рамка"
        className="px-2 py-1 text-[12px] font-medium tracking-[-0.01em] text-[var(--muted)]"
      />
      <NodeHandles />
    </div>
  )
}
