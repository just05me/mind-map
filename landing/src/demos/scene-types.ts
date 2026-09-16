import type { KindId, Status } from '../content/tokens'

export type Rect = { x: number; y: number; w: number; h: number }

export type SceneNodeType = 'kind' | 'note' | 'frame' | 'comment'

export type SceneNode = Rect & {
  id: string
  type: SceneNodeType
  /** Catalog type for `kind` nodes; ignored for stickers, frames and comments. */
  kind?: KindId
  title: string
  subtitle?: string
  status?: Status
  /** Frame this node sits in; used only to sort frames under their children. */
  parentId?: string
  /** Player step at which the node appears (0 = visible from the start). */
  step: number
}

export type SceneEdge = {
  id: string
  source: string
  target: string
  label?: string
  step: number
}

export type Scene = {
  width: number
  height: number
  nodes: SceneNode[]
  edges: SceneEdge[]
}

/** Default box sizes matching the app's node components. */
export const CARD_W = 220
export const CARD_H = 60
export const SHAPE_W = 168
export const SHAPE_H = 134
export const NOTE_W = 200
export const NOTE_H = 86

export function sceneSteps(scene: Scene): number {
  let max = 0
  for (const node of scene.nodes) max = Math.max(max, node.step)
  for (const edge of scene.edges) max = Math.max(max, edge.step)
  return max
}
