import { NodeResizer, type NodeProps } from '@xyflow/react'
import { memo } from 'react'
import { useNodeScene } from '../../store/AppContext'
import type { AppNode, TextAlign, TextWeight } from '../../model/types'
import { InlineTitle } from './InlineTitle'

export const TextNode = memo(function TextNode({ id, data, selected }: NodeProps<AppNode>) {
  const { editingNodeId } = useNodeScene()
  const editing = editingNodeId === id
  const fontSize = data.fontSize ?? 28
  const fontWeight = (data.fontWeight ?? 500) as TextWeight
  const textAlign = (data.textAlign ?? 'left') as TextAlign
  const color = data.textColor ?? 'var(--text)'

  return (
    <div
      className={`min-w-[8rem] px-1 py-0.5 ${selected || editing ? 'rounded-lg ring-1 ring-[var(--accent)]/35' : ''}`}
      style={{
        fontSize: `${fontSize}px`,
        fontWeight,
        textAlign,
        color,
        letterSpacing: fontSize >= 22 ? '-0.02em' : '0',
        lineHeight: fontSize >= 28 ? 1.15 : 1.35,
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={120}
        minHeight={36}
        lineClassName="!border-[var(--accent)]"
        handleClassName="!h-1.5 !w-1.5 !border-[var(--accent)] !bg-white"
      />
      <InlineTitle
        nodeId={id}
        value={data.title}
        placeholder="Текст"
        multiline
        className="w-full whitespace-pre-wrap break-words"
      />
    </div>
  )
})
