import { useEffect, useRef, type CSSProperties, type KeyboardEvent } from 'react'
import { useApp } from '../../store/AppContext'

type InlineTitleProps = {
  nodeId: string
  value: string
  placeholder?: string
  className?: string
  style?: CSSProperties
  multiline?: boolean
  field?: 'title' | 'description'
}

export function InlineTitle({
  nodeId,
  value,
  placeholder = 'Текст',
  className = '',
  style,
  multiline = false,
  field = 'title',
}: InlineTitleProps) {
  const { state, updateNodeData, setEditingNode } = useApp()
  const editing = state.editingNodeId === nodeId && state.editingField === field
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!editing || !ref.current) return
    const el = ref.current
    el.focus()
    el.select()
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [editing])

  const commit = (next: string) => {
    if (field === 'description') {
      updateNodeData(nodeId, { description: next })
      return
    }
    updateNodeData(nodeId, { title: next })
  }

  const finish = () => {
    if (field === 'title' && !value.trim()) {
      updateNodeData(nodeId, { title: placeholder })
    }
    setEditingNode(null)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      finish()
      return
    }
    if (event.key === 'Enter' && !event.shiftKey && !multiline) {
      event.preventDefault()
      finish()
    }
  }

  if (!editing) {
    return (
      <div
        className={className}
        style={style}
        onDoubleClick={(event) => {
          event.stopPropagation()
          setEditingNode(nodeId, field)
        }}
      >
        {value || <span className="opacity-40">{placeholder}</span>}
      </div>
    )
  }

  return (
    <textarea
      ref={ref}
      className={`inline-editor nodrag nowheel nopan ${className}`}
      style={style}
      value={value}
      rows={1}
      onChange={(event) => {
        commit(event.target.value)
        event.currentTarget.style.height = 'auto'
        event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`
      }}
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={onKeyDown}
      onBlur={finish}
      placeholder={placeholder}
    />
  )
}
