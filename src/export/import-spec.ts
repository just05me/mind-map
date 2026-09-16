import type { AppNodeType } from '../model/types'

/**
 * Contract of the center-relative layout format shared by the parser and the AI prompt.
 * Legacy exports and `boards/*.json` carry neither `format` nor `coordinateSpace`,
 * so their coordinates stay absolute.
 */
export const LAYOUT_FORMAT_ID = 'mind-map.layout.v1'

export type CoordinateSpace = 'center' | 'absolute'

export const CENTER_SPACE: CoordinateSpace = 'center'

export type NodeSize = { width: number; height: number }

/** Box used for centering math when the JSON omits `width` / `height`. */
export const DEFAULT_NODE_SIZE: Record<AppNodeType, NodeSize> = {
  kind: { width: 240, height: 96 },
  note: { width: 240, height: 150 },
  text: { width: 320, height: 56 },
  frame: { width: 460, height: 320 },
  group: { width: 320, height: 280 },
  divider: { width: 240, height: 16 },
  decision: { width: 148, height: 148 },
  comment: { width: 230, height: 130 },
}

export const APP_NODE_TYPES = Object.keys(DEFAULT_NODE_SIZE) as AppNodeType[]

/** Inner padding of a frame or group; children are centered inside what is left. */
export const CONTAINER_PADDING = { x: 20, top: 46, bottom: 20 }

/** Suggested distance between neighbouring boxes, used in the prompt. */
export const LAYOUT_STEP = { x: 340, y: 200 }

export const MIN_NODE_SIDE = 16
export const MAX_NODE_SIDE = 8000
export const MAX_IMPORT_NODES = 1500
export const MAX_IMPORT_EDGES = 3000
export const MAX_NODE_ITEMS = 20

export type StyledSize = 'box' | 'width' | 'content'

/**
 * Which size fields land in `node.style`. Cards, notes, comments and decisions measure
 * themselves by their content, so JSON sizes only feed the layout math for them.
 */
export function styledSizeOf(type: AppNodeType): StyledSize {
  switch (type) {
    case 'frame':
    case 'group':
    case 'divider':
      return 'box'
    case 'text':
      return 'width'
    case 'kind':
    case 'note':
    case 'decision':
    case 'comment':
      return 'content'
    default: {
      const _never: never = type
      return _never
    }
  }
}
