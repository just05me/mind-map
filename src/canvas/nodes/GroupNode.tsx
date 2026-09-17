import { NodeResizer, type NodeProps } from '@xyflow/react'
import { memo } from 'react'
import { nodeAccent } from '../../model/color'
import { requireKind } from '../../model/kinds'
import { useNodeScene } from '../../store/AppContext'
import type { AppNode } from '../../model/types'
import { InlineTitle } from './InlineTitle'
import { NodeHandles } from './NodeHandles'

export const GroupNode = memo(function GroupNode({ id, data, selected }: NodeProps<AppNode>) {
  const { kinds } = useNodeScene()
  const kind = requireKind(kinds, data.kind)
  const accent = nodeAccent(data, kind)
  const fill = data.fillColor ?? (selected ? `${accent}14` : 'color-mix(in srgb, var(--text) 4%, transparent)')

  return (
    <div
      className="h-full min-h-[160px] w-full min-w-[200px] rounded-[1.25rem] border px-2 pt-1"
      style={{
        borderColor: selected ? accent : 'color-mix(in srgb, var(--text) 16%, transparent)',
        background: fill,
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={200}
        minHeight={160}
        lineClassName="!border-[var(--accent)]"
        handleClassName="!h-2 !w-2 !border-[var(--accent)] !bg-white"
      />
      <InlineTitle
        nodeId={id}
        value={data.title}
        placeholder="Группа"
        className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]"
      />
      <NodeHandles />
    </div>
  )
})
