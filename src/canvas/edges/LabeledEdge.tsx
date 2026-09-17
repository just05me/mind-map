import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useInternalNode,
  useStore,
  type EdgeProps,
} from '@xyflow/react'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useAppActions, useNodeScene } from '../../store/AppContext'
import type { AppEdge } from '../../model/types'
import { Icon } from '../../ui/Icon'
import { getEdgeParams, getRoutedPath } from './floating'

export const LabeledEdge = memo(function LabeledEdge({
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
  const { deleteElements, updateEdgeData } = useAppActions()
  const { readOnly } = useNodeScene()
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  // Obstacle routing needs every node's box. `nodeLookup` is one long-lived Map that React Flow
  // refills in place, and `nodes` is replaced whenever any node moves, resizes or is measured —
  // so together they re-run routing exactly when geometry changes, not on every pan/zoom frame.
  const nodeLookup = useStore((store) => store.nodeLookup)
  const nodesVersion = useStore((store) => store.nodes)
  const internalNodes = useMemo(
    () => (nodesVersion ? Array.from(nodeLookup.values()) : []),
    [nodeLookup, nodesVersion],
  )

  // Float the endpoints to the nearest borders once both nodes are measured;
  // fall back to the handle-based coordinates React Flow supplies otherwise.
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)
  const floating =
    sourceNode && targetNode ? getEdgeParams(sourceNode, targetNode) : null

  const [fallbackPath, fallbackLabelX, fallbackLabelY] = getBezierPath({
    sourceX: floating?.sx ?? sourceX,
    sourceY: floating?.sy ?? sourceY,
    targetX: floating?.tx ?? targetX,
    targetY: floating?.ty ?? targetY,
    sourcePosition: floating?.sourcePos ?? sourcePosition,
    targetPosition: floating?.targetPos ?? targetPosition,
    curvature: 0.3,
  })
  // Routing is the expensive part; keyed on the endpoint coordinates and the node geometry version.
  const sx = floating?.sx
  const sy = floating?.sy
  const tx = floating?.tx
  const ty = floating?.ty
  const routed = useMemo(
    () =>
      sx !== undefined && sy !== undefined && tx !== undefined && ty !== undefined
        ? getRoutedPath({ x: sx, y: sy }, { x: tx, y: ty }, internalNodes, new Set([source, target]))
        : null,
    [sx, sy, tx, ty, internalNodes, source, target],
  )
  const path = routed?.path ?? fallbackPath
  const labelX = routed?.labelX ?? fallbackLabelX
  const labelY = routed?.labelY ?? fallbackLabelY
  const label = data?.label ?? ''

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  useEffect(() => {
    if (!selected || readOnly) setEditing(false)
  }, [readOnly, selected])

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
              onDoubleClick={() => {
                if (!readOnly) setEditing(true)
              }}
            >
              {label}
            </button>
          ) : null}
          {selected && !editing && !readOnly ? (
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
})
