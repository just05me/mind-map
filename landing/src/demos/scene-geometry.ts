import type { Rect } from './scene-types'

export type EdgePath = {
  d: string
  labelX: number
  labelY: number
  /** Arrowhead polygon points at the target end, in scene px. */
  arrow: string
}

type Point = { x: number; y: number }

function center(rect: Rect): Point {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 }
}

/**
 * Floating edge like the app's LabeledEdge: leaves from the side of the source
 * box facing the target and enters the nearest side of the target box.
 */
export function edgePath(source: Rect, target: Rect): EdgePath {
  const sc = center(source)
  const tc = center(target)
  const dx = tc.x - sc.x
  const dy = tc.y - sc.y
  // Leave along the axis with the wider clear gap between the two boxes.
  const gapX = Math.max(target.x - (source.x + source.w), source.x - (target.x + target.w))
  const gapY = Math.max(target.y - (source.y + source.h), source.y - (target.y + target.h))
  const horizontal = gapX >= gapY

  let start: Point
  let end: Point
  let c1: Point
  let c2: Point

  if (horizontal) {
    const dir = dx >= 0 ? 1 : -1
    start = { x: dir > 0 ? source.x + source.w : source.x, y: sc.y }
    end = { x: dir > 0 ? target.x : target.x + target.w, y: tc.y }
    const offset = Math.max(Math.abs(end.x - start.x) * 0.5, 40) * dir
    c1 = { x: start.x + offset, y: start.y }
    c2 = { x: end.x - offset, y: end.y }
  } else {
    const dir = dy >= 0 ? 1 : -1
    start = { x: sc.x, y: dir > 0 ? source.y + source.h : source.y }
    end = { x: tc.x, y: dir > 0 ? target.y : target.y + target.h }
    const offset = Math.max(Math.abs(end.y - start.y) * 0.5, 40) * dir
    c1 = { x: start.x, y: start.y + offset }
    c2 = { x: end.x, y: end.y - offset }
  }

  const d = `M${start.x},${start.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${end.x},${end.y}`
  const labelX = (start.x + 3 * c1.x + 3 * c2.x + end.x) / 8
  const labelY = (start.y + 3 * c1.y + 3 * c2.y + end.y) / 8

  return { d, labelX, labelY, arrow: arrowhead(c2, end) }
}

/** Closed arrow (as XYFlow's MarkerType.ArrowClosed) pointing along the last tangent. */
function arrowhead(from: Point, tip: Point): string {
  const length = 11
  const half = 4.5
  const vx = tip.x - from.x
  const vy = tip.y - from.y
  const len = Math.hypot(vx, vy) || 1
  const ux = vx / len
  const uy = vy / len
  const bx = tip.x - ux * length
  const by = tip.y - uy * length
  const px = -uy
  const py = ux
  return [
    `${tip.x},${tip.y}`,
    `${bx + px * half},${by + py * half}`,
    `${bx - px * half},${by - py * half}`,
  ].join(' ')
}
