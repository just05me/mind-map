import { Position, type InternalNode, type Node } from '@xyflow/react'

type Point = { x: number; y: number }
type Rect = { id?: string; x: number; y: number; cx: number; cy: number; w: number; h: number }

export type RoutedPath = {
  path: string
  labelX: number
  labelY: number
}

function rectOf(node: InternalNode<Node>): Rect {
  const { x, y } = node.internals.positionAbsolute
  const w = node.measured.width ?? 0
  const h = node.measured.height ?? 0
  return { id: node.id, x, y, cx: x + w / 2, cy: y + h / 2, w, h }
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

function inflate(rect: Rect, padding: number): Rect {
  return {
    ...rect,
    x: rect.x - padding,
    y: rect.y - padding,
    w: rect.w + padding * 2,
    h: rect.h + padding * 2,
    cx: rect.cx,
    cy: rect.cy,
  }
}

function rectRight(rect: Rect): number {
  return rect.x + rect.w
}

function rectBottom(rect: Rect): number {
  return rect.y + rect.h
}

function segmentIntersectsRect(a: Point, b: Point, rect: Rect): boolean {
  if (a.x === b.x) {
    return a.x > rect.x && a.x < rectRight(rect) && Math.max(a.y, b.y) > rect.y && Math.min(a.y, b.y) < rectBottom(rect)
  }
  if (a.y === b.y) {
    return a.y > rect.y && a.y < rectBottom(rect) && Math.max(a.x, b.x) > rect.x && Math.min(a.x, b.x) < rectRight(rect)
  }
  return false
}

function routeIntersections(route: Point[], obstacles: Rect[]): number {
  let count = 0
  for (let index = 1; index < route.length; index += 1) {
    const a = route[index - 1]
    const b = route[index]
    count += obstacles.filter((rect) => segmentIntersectsRect(a, b, rect)).length
  }
  return count
}

function routeLength(route: Point[]): number {
  let length = 0
  for (let index = 1; index < route.length; index += 1) {
    const a = route[index - 1]
    const b = route[index]
    length += Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
  }
  return length
}

function dedupeRoute(route: Point[]): Point[] {
  return route.filter((point, index) => {
    const previous = route[index - 1]
    return !previous || previous.x !== point.x || previous.y !== point.y
  })
}

function bestRoute(start: Point, end: Point, obstacles: Rect[]): Point[] {
  const candidates: Point[][] = [
    [start, { x: end.x, y: start.y }, end],
    [start, { x: start.x, y: end.y }, end],
  ]
  if (start.x === end.x || start.y === end.y) candidates.push([start, end])

  for (const rect of obstacles) {
    for (const x of [rect.x, rectRight(rect)]) {
      candidates.push([start, { x, y: start.y }, { x, y: end.y }, end])
    }
    for (const y of [rect.y, rectBottom(rect)]) {
      candidates.push([start, { x: start.x, y }, { x: end.x, y }, end])
    }
  }

  const scored = candidates
    .map(dedupeRoute)
    .map((route) => ({
      route,
      intersections: routeIntersections(route, obstacles),
      score: routeLength(route) + route.length * 8,
    }))
    .sort((a, b) => a.intersections - b.intersections || a.score - b.score)

  return scored[0]?.route ?? [start, end]
}

function labelPoint(route: Point[]): Point {
  const total = routeLength(route)
  if (total === 0) return route[0] ?? { x: 0, y: 0 }
  let walked = 0
  for (let index = 1; index < route.length; index += 1) {
    const a = route[index - 1]
    const b = route[index]
    const length = Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
    if (walked + length >= total / 2) {
      const ratio = (total / 2 - walked) / (length || 1)
      return { x: a.x + (b.x - a.x) * ratio, y: a.y + (b.y - a.y) * ratio }
    }
    walked += length
  }
  return route.at(-1) ?? { x: 0, y: 0 }
}

export function getRoutedPath(
  start: Point,
  end: Point,
  nodes: InternalNode<Node>[],
  excludedIds: Set<string>,
  padding = 18,
): RoutedPath {
  const obstacles = nodes
    .filter((node) => !excludedIds.has(node.id) && node.measured.width && node.measured.height)
    .map((node) => inflate(rectOf(node), padding))
  const route = bestRoute(start, end, obstacles)
  const label = labelPoint(route)
  return {
    path: route.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' '),
    labelX: label.x,
    labelY: label.y,
  }
}
