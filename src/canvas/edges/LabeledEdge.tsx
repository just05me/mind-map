import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useInternalNode,
  type EdgeProps,
} from '@xyflow/react'
import { useEffect, useRef, useState } from 'react'
import { useApp } from '../../store/AppContext'
import type { AppEdge } from '../../model/types'
import { Icon } from '../../ui/Icon'
import { getEdgeParams } from './floating'

export function LabeledEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  selected,
  data,
}: EdgeProps<AppEdge>) {
  const { deleteElements, updateEdgeData } = useApp()
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Float the endpoints to the nearest borders once both nodes are measured;
  // fall back to the handle-based coordinates React Flow supplies otherwise.
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)
  const floating =
    sourceNode && targetNode ? getEdgeParams(sourceNode, targetNode) : null

  const [path, labelX, labelY] = getBezierPath({
    sourceX: floating?.sx ?? sourceX,
    sourceY: floating?.sy ?? sourceY,
    targetX: floating?.tx ?? targetX,
    targetY: floating?.ty ?? targetY,
    sourcePosition: floating?.sourcePos ?? sourcePosition,
    targetPosition: floating?.targetPos ?? targetPosition,
    curvature: 0.3,
  })
  const label = data?.label ?? ''

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  useEffect(() => {
    if (!selected) setEditing(false)
  }, [selected])

  return (
    <>
      <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} interactionWidth={24} />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-auto absolute flex flex-col items-center"
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
        >
          {editing ? (
            <input
              ref={inputRef}
              className="edge-label-input"
              value={label}
              placeholder="Подпись"
              onChange={(event) => updateEdgeData(id, { label: event.target.value || undefined })}
              onBlur={() => setEditing(false)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === 'Escape') setEditing(false)
              }}
            />
          ) : label ? (
            <button
              type="button"
              className={`edge-label ${selected ? 'is-selected' : ''}`}
              onDoubleClick={() => setEditing(true)}
            >
              {label}
            </button>
          ) : null}
          {selected && !editing ? (
            <div className="chrome mt-1 flex items-center gap-0.5 rounded-full p-0.5">
              <button
                type="button"
                className="icon-btn"
                data-tip="Подпись"
                aria-label="Подпись"
                onClick={() => setEditing(true)}
              >
                <Icon name="edit" size={14} />
              </button>
              <button
                type="button"
                className="icon-btn danger"
                data-tip="Удалить связь"
                aria-label="Удалить связь"
                onClick={() => deleteElements([], [id])}
              >
                <Icon name="trash" size={14} />
              </button>
            </div>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
