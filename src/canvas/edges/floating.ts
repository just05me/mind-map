import { Position, type InternalNode, type Node } from '@xyflow/react'

type Point = { x: number; y: number }
type Rect = { cx: number; cy: number; w: number; h: number }

function rectOf(node: InternalNode<Node>): Rect {
  const { x, y } = node.internals.positionAbsolute
  const w = node.measured.width ?? 0
  const h = node.measured.height ?? 0
  return { cx: x + w / 2, cy: y + h / 2, w, h }
}

/** Point where the line from a rect's center toward `to` crosses the rect border. */
function borderPoint(rect: Rect, to: Point): Point {
  const dx = to.x - rect.cx
  const dy = to.y - rect.cy
  if (dx === 0 && dy === 0) return { x: rect.cx, y: rect.cy }
  const halfW = rect.w / 2
  const halfH = rect.h / 2
  const scale = Math.min(
    halfW / (Math.abs(dx) || Number.EPSILON),
    halfH / (Math.abs(dy) || Number.EPSILON),
  )
  return { x: rect.cx + dx * scale, y: rect.cy + dy * scale }
}

function sideOf(rect: Rect, point: Point): Position {
  const dxRatio = (point.x - rect.cx) / (rect.w / 2 || 1)
  const dyRatio = (point.y - rect.cy) / (rect.h / 2 || 1)
  if (Math.abs(dxRatio) > Math.abs(dyRatio)) {
    return dxRatio > 0 ? Position.Right : Position.Left
  }
  return dyRatio > 0 ? Position.Bottom : Position.Top
}

export type EdgeParams = {
  sx: number
  sy: number
  tx: number
  ty: number
  sourcePos: Position
  targetPos: Position
}

/**
 * Anchors an edge to the point on each node's border that faces the other node,
 * so links stay short and clean no matter where the nodes sit relative to each other.
 */
export function getEdgeParams(
  source: InternalNode<Node>,
  target: InternalNode<Node>,
): EdgeParams {
  const s = rectOf(source)
  const t = rectOf(target)
  const sPoint = borderPoint(s, { x: t.cx, y: t.cy })
  const tPoint = borderPoint(t, { x: s.cx, y: s.cy })
  return {
    sx: sPoint.x,
    sy: sPoint.y,
    tx: tPoint.x,
    ty: tPoint.y,
    sourcePos: sideOf(s, sPoint),
    targetPos: sideOf(t, tPoint),
  }
}
