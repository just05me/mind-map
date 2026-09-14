import { type NodeProps } from '@xyflow/react'
import { nodeAccent, nodeFill } from '../../model/color'
import { requireKind } from '../../model/kinds'
import { statusLabel } from '../../model/status'
import { useApp } from '../../store/AppContext'
import type { AppNode } from '../../model/types'
import { InlineTitle } from './InlineTitle'
import { NodeHandles } from './NodeHandles'

export function NoteNode({ id, data, selected }: NodeProps<AppNode>) {
  const { project } = useApp()
  const kind = requireKind(project.kinds, data.kind)
  const fill = nodeFill(data, '#f5d76e')
  const accent = nodeAccent(data, kind)

  return (
    <div
      className={`min-w-[180px] max-w-[240px] rounded-[0.9rem] px-3 py-2.5 text-[#2b2110] shadow-md ${
        selected ? 'ring-2 ring-amber-400/70' : ''
      }`}
      style={{ background: fill, boxShadow: `0 10px 24px ${accent}33` }}
    >
      <NodeHandles />
      <div className="text-[11px] font-medium uppercase tracking-wide text-amber-900/70">
        {data.status === 'planned' ? 'Стикер' : `Стикер · ${statusLabel(data.status)}`}
      </div>
      <InlineTitle
        nodeId={id}
        value={data.title}
        placeholder="Заметка"
        className="mt-1 text-[13px] font-semibold leading-5"
      />
      {data.description || selected ? (
        <InlineTitle
          nodeId={id}
          field="description"
          value={data.description ?? ''}
          placeholder="Напишите здесь"
          multiline
          className="mt-1 whitespace-pre-wrap text-[12px] leading-4 text-[#4a3b1f]"
        />
      ) : null}
    </div>
  )
}
