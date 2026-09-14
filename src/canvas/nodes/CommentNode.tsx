import { Handle, Position, type NodeProps } from '@xyflow/react'
import { nodeAccent, nodeFill } from '../../lib/node-color'
import { requireKind } from '../../kinds/catalog'
import { useApp } from '../../store/AppContext'
import type { AppNode } from '../../types'
import { InlineTitle } from './InlineTitle'

export function CommentNode({ id, data, selected }: NodeProps<AppNode>) {
  const { project } = useApp()
  const kind = requireKind(project.kinds, data.kind)
  const fill = nodeFill(data, '#fff3d6')
  const accent = nodeAccent(data, kind)

  return (
    <div
      className={`min-w-[168px] max-w-[230px] rounded-[1rem] px-3 py-2.5 text-[#2c2416] ${
        selected ? 'ring-2 ring-amber-400/60' : ''
      }`}
      style={{
        background: fill,
        boxShadow: 'var(--shadow-soft)',
        borderLeft: `3px solid ${accent}`,
      }}
    >
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !bg-amber-700" />
      <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-800/70">
        Комментарий
      </div>
      <InlineTitle
        nodeId={id}
        value={data.title}
        placeholder="Комментарий"
        className="mt-0.5 text-[13px] font-medium leading-5"
      />
      <InlineTitle
        nodeId={id}
        field="description"
        value={data.description ?? ''}
        placeholder="Напишите мысль"
        multiline
        className="mt-1 whitespace-pre-wrap text-[12px] leading-4 text-[#5a4a2a]"
      />
      <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !bg-amber-700" />
    </div>
  )
}
