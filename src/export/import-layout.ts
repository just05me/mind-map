import { mergeBuiltinKinds, requireKind } from '../model/kinds'
import { createId } from '../lib/id'
import { isContainerType, nodeTypeForKind } from '../model/node-type'
import { STATUSES } from '../model/status'
import { orderParentsFirst } from '../store/graph'
import { createEmptyProject } from '../store/project-factory'
import { hydrateEdgeData } from '../store/storage'
import type {
  AppEdge,
  AppNode,
  AppNodeType,
  KindDef,
  KindId,
  NodeData,
  Project,
  Status,
  TextAlign,
  TextWeight,
} from '../model/types'
import {
  APP_NODE_TYPES,
  CENTER_SPACE,
  CONTAINER_PADDING,
  DEFAULT_NODE_SIZE,
  LAYOUT_FORMAT_ID,
  MAX_IMPORT_EDGES,
  MAX_IMPORT_NODES,
  MAX_NODE_ITEMS,
  MAX_NODE_SIDE,
  MIN_NODE_SIDE,
  styledSizeOf,
  type NodeSize,
} from './import-spec'

type RawRecord = Record<string, unknown>

type Point = { x: number; y: number }

/** A node read from JSON: `center` is an offset from the board (or parent) center. */
type NodeDraft = {
  id: string
  sourceId: string
  /** Empty string for top-level nodes. */
  parentSourceId: string
  type: AppNodeType
  data: NodeData
  center: Point | null
  size: NodeSize
}

const ROOT_KEY = ''

/** Gap used when a node comes without coordinates and has to be auto-placed. */
const AUTO_GAP = { x: 40, y: 40 }

const TEXT_WEIGHTS: TextWeight[] = [400, 500, 600, 700]
const TEXT_ALIGNS: TextAlign[] = ['left', 'center', 'right']

/**
 * True when the JSON declares the layout format explicitly. Native project files
 * (exports and `boards/*.json`) have neither marker, so they keep absolute coordinates.
 */
export function isLayoutSource(parsed: unknown): boolean {
  const source = asRecord(parsed)
  if (!source) return false
  return source.format !== undefined || readString(source, 'coordinateSpace') === CENTER_SPACE
}

/** Turns a center-relative layout into a project with absolute XYFlow positions. */
export function parseLayoutProject(parsed: unknown): Project {
  const source = asRecord(parsed)
  if (!source) {
    throw new Error('Некорректный JSON')
  }
  const format = readString(source, 'format')
  if (format !== undefined && format !== LAYOUT_FORMAT_ID) {
    throw new Error(`Неизвестный формат макета. Нужен «${LAYOUT_FORMAT_ID}»`)
  }
  const space = readString(source, 'coordinateSpace')
  if (space !== undefined && space !== CENTER_SPACE) {
    throw new Error(`Поддерживается только coordinateSpace «${CENTER_SPACE}»`)
  }
  const rawNodes = Array.isArray(source.nodes) ? source.nodes : []
  if (rawNodes.length === 0) {
    throw new Error('В макете нет узлов')
  }
  if (rawNodes.length > MAX_IMPORT_NODES) {
    throw new Error(`Слишком много узлов: максимум ${MAX_IMPORT_NODES}`)
  }
  const rawEdges = Array.isArray(source.edges) ? source.edges : []
  if (rawEdges.length > MAX_IMPORT_EDGES) {
    throw new Error(`Слишком много связей: максимум ${MAX_IMPORT_EDGES}`)
  }

  const kinds = mergeBuiltinKinds(readKinds(source.kinds))
  const drafts = readNodes(rawNodes, kinds)
  if (drafts.length === 0) {
    throw new Error('Узлы макета не распознаны')
  }
  const nodes = layoutDrafts(drafts)
  const idBySource = new Map(drafts.map((draft) => [draft.sourceId, draft.id]))
  const fallback = createEmptyProject(readString(source, 'title') ?? 'Импорт макета')

  return {
    ...fallback,
    title: readString(source, 'title') ?? fallback.title,
    description: readString(source, 'description') ?? '',
    kinds,
    nodes: orderParentsFirst(nodes),
    edges: readEdges(rawEdges, idBySource),
    canvasColor: readColor(source, 'canvasColor'),
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Converts center offsets into XYFlow positions. Board center is `(0, 0)`; a container
 * grows when its children do not fit, so its own center stays where the JSON asked.
 */
function layoutDrafts(drafts: NodeDraft[]): AppNode[] {
  const childrenOf = new Map<string, NodeDraft[]>()
  for (const draft of drafts) {
    const siblings = childrenOf.get(draft.parentSourceId)
    if (siblings) siblings.push(draft)
    else childrenOf.set(draft.parentSourceId, [draft])
  }
  const sizes = new Map<string, NodeSize>()
  const centers = new Map<string, Point>()
  const positions = new Map<string, Point>()

  const sizeOf = (draft: NodeDraft): NodeSize => sizes.get(draft.sourceId) ?? draft.size
  const centerOf = (draft: NodeDraft): Point => centers.get(draft.sourceId) ?? { x: 0, y: 0 }

  const assignCenters = (children: NodeDraft[]): void => {
    const pending: NodeDraft[] = []
    let bottom: number | null = null
    for (const child of children) {
      if (!child.center) {
        pending.push(child)
        continue
      }
      centers.set(child.sourceId, child.center)
      const edge = child.center.y + sizeOf(child).height / 2
      bottom = bottom === null ? edge : Math.max(bottom, edge)
    }
    if (pending.length === 0) return
    const columns = Math.ceil(Math.sqrt(pending.length))
    const columnWidth = Math.max(...pending.map((item) => sizeOf(item).width)) + AUTO_GAP.x
    const rowHeight = Math.max(...pending.map((item) => sizeOf(item).height)) + AUTO_GAP.y
    const rows = Math.ceil(pending.length / columns)
    const startX = -((columns - 1) * columnWidth) / 2
    const startY =
      bottom === null ? -((rows - 1) * rowHeight) / 2 : bottom + AUTO_GAP.y + rowHeight / 2
    pending.forEach((item, index) => {
      centers.set(item.sourceId, {
        x: startX + (index % columns) * columnWidth,
        y: startY + Math.floor(index / columns) * rowHeight,
      })
    })
  }

  const placeChildren = (children: NodeDraft[], origin: Point): void => {
    for (const child of children) {
      const size = sizeOf(child)
      const center = centerOf(child)
      positions.set(child.sourceId, {
        x: Math.round(origin.x + center.x - size.width / 2),
        y: Math.round(origin.y + center.y - size.height / 2),
      })
    }
  }

  /** Measures a sibling group bottom-up and returns the box its children need. */
  const measureGroup = (children: NodeDraft[]): NodeSize => {
    for (const child of children) measure(child)
    assignCenters(children)
    let halfWidth = 0
    let halfHeight = 0
    for (const child of children) {
      const size = sizeOf(child)
      const center = centerOf(child)
      halfWidth = Math.max(halfWidth, Math.abs(center.x) + size.width / 2)
      halfHeight = Math.max(halfHeight, Math.abs(center.y) + size.height / 2)
    }
    return { width: halfWidth * 2, height: halfHeight * 2 }
  }

  const measure = (draft: NodeDraft): NodeSize => {
    const children = childrenOf.get(draft.sourceId) ?? []
    if (children.length === 0) {
      sizes.set(draft.sourceId, draft.size)
      return draft.size
    }
    const content = measureGroup(children)
    const size = {
      width: Math.round(Math.max(draft.size.width, content.width + CONTAINER_PADDING.x * 2)),
      height: Math.round(
        Math.max(
          draft.size.height,
          content.height + CONTAINER_PADDING.top + CONTAINER_PADDING.bottom,
        ),
      ),
    }
    sizes.set(draft.sourceId, size)
    placeChildren(children, contentCenter(size))
    return size
  }

  const roots = childrenOf.get(ROOT_KEY) ?? []
  measureGroup(roots)
  placeChildren(roots, { x: 0, y: 0 })

  const idBySource = new Map(drafts.map((draft) => [draft.sourceId, draft.id]))
  return drafts.map((draft) => {
    const style = nodeStyle(draft.type, sizeOf(draft))
    const parentId = draft.parentSourceId ? idBySource.get(draft.parentSourceId) : undefined
    return {
      id: draft.id,
      type: draft.type,
      position: positions.get(draft.sourceId) ?? { x: 0, y: 0 },
      data: draft.data,
      ...(style ? { style } : {}),
      ...(parentId ? { parentId, expandParent: true, extent: 'parent' as const } : {}),
    }
  })
}

/** Point children are centered around: the box minus the title strip and padding. */
function contentCenter(size: NodeSize): Point {
  return {
    x: size.width / 2,
    y:
      CONTAINER_PADDING.top +
      (size.height - CONTAINER_PADDING.top - CONTAINER_PADDING.bottom) / 2,
  }
}

function nodeStyle(type: AppNodeType, size: NodeSize): AppNode['style'] {
  const styled = styledSizeOf(type)
  switch (styled) {
    case 'box':
      return { width: size.width, height: size.height }
    case 'width':
      return { width: size.width }
    case 'content':
      return undefined
    default: {
      const _never: never = styled
      return _never
    }
  }
}

function readNodes(raw: unknown[], kinds: KindDef[]): NodeDraft[] {
  const knownKinds = new Set(kinds.map((kind) => kind.id))
  const drafts: NodeDraft[] = []
  const used = new Set<string>()
  raw.forEach((item, index) => {
    const source = asRecord(item)
    if (!source) return
    const sourceId = readString(source, 'id') ?? `node-${index + 1}`
    if (used.has(sourceId)) return
    used.add(sourceId)
    const type = readNodeType(source)
    const kind = readKindId(source, knownKinds, type)
    drafts.push({
      id: createId('n'),
      sourceId,
      parentSourceId: readString(source, 'parentId') ?? ROOT_KEY,
      type,
      data: readNodeData(source, kind, kinds, type),
      center: readCenter(source),
      size: readSize(source, type),
    })
  })
  return resolveParents(drafts)
}

/** Drops a `parentId` that points at a missing node, a non-container or a cycle. */
function resolveParents(drafts: NodeDraft[]): NodeDraft[] {
  const byId = new Map(drafts.map((draft) => [draft.sourceId, draft]))
  return drafts.map((draft) => {
    if (draft.parentSourceId === ROOT_KEY) return draft
    const parent = byId.get(draft.parentSourceId)
    if (!parent || parent === draft || !isContainerType(parent.type) || hasCycle(byId, draft)) {
      return { ...draft, parentSourceId: ROOT_KEY }
    }
    return draft
  })
}

function hasCycle(byId: Map<string, NodeDraft>, draft: NodeDraft): boolean {
  const seen = new Set<string>([draft.sourceId])
  let current = byId.get(draft.parentSourceId)
  while (current) {
    if (seen.has(current.sourceId)) return true
    seen.add(current.sourceId)
    current = current.parentSourceId ? byId.get(current.parentSourceId) : undefined
  }
  return false
}

function readNodeType(source: RawRecord): AppNodeType {
  const declared = readString(source, 'type')
  const known = APP_NODE_TYPES.find((type) => type === declared)
  if (known) return known
  const kind = readString(source, 'kind')
  return kind ? nodeTypeForKind(kind) : 'kind'
}

function readKindId(source: RawRecord, knownKinds: Set<KindId>, type: AppNodeType): KindId {
  const declared = readString(source, 'kind')
  if (declared && knownKinds.has(declared)) return declared
  return fallbackKind(type)
}

function fallbackKind(type: AppNodeType): KindId {
  switch (type) {
    case 'kind':
      return 'module'
    case 'group':
      return 'group'
    case 'note':
      return 'note'
    case 'text':
      return 'text'
    case 'frame':
      return 'frame'
    case 'divider':
      return 'divider'
    case 'decision':
      return 'decision'
    case 'comment':
      return 'comment'
    default: {
      const _never: never = type
      return _never
    }
  }
}

function readNodeData(
  source: RawRecord,
  kind: KindId,
  kinds: KindDef[],
  type: AppNodeType,
): NodeData {
  const subtitle = readString(source, 'subtitle')
  const description = readString(source, 'description')
  const path = readString(source, 'path')
  const fillColor = readColor(source, 'fillColor')
  const accentColor = readColor(source, 'accentColor')
  const textColor = readColor(source, 'textColor')
  const fontSize = readNumber(source, 'fontSize')
  const fontWeight = TEXT_WEIGHTS.find((weight) => weight === readNumber(source, 'fontWeight'))
  const textAlign = TEXT_ALIGNS.find((align) => align === readString(source, 'textAlign'))

  return {
    kind,
    title: readString(source, 'title') ?? defaultTitle(type, kind, kinds),
    status: readStatus(source),
    items: readItems(source),
    ...(subtitle ? { subtitle } : {}),
    ...(description ? { description } : {}),
    ...(path ? { path } : {}),
    ...(fillColor ? { fillColor } : {}),
    ...(accentColor ? { accentColor } : {}),
    ...(textColor ? { textColor } : {}),
    ...(fontSize !== undefined ? { fontSize: Math.min(Math.max(fontSize, 8), 120) } : {}),
    ...(fontWeight ? { fontWeight } : {}),
    ...(textAlign ? { textAlign } : {}),
  }
}

/** Text and dividers look best without a placeholder word baked into the title. */
function defaultTitle(type: AppNodeType, kind: KindId, kinds: KindDef[]): string {
  if (type === 'text' || type === 'divider') return ''
  return requireKind(kinds, kind).name
}

function readStatus(source: RawRecord): Status {
  const value = readString(source, 'status')
  return STATUSES.find((status) => status === value) ?? 'planned'
}

function readItems(source: RawRecord): string[] {
  if (!Array.isArray(source.items)) return []
  return source.items
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, MAX_NODE_ITEMS)
}

function readCenter(source: RawRecord): Point | null {
  const x = readNumber(source, 'x')
  const y = readNumber(source, 'y')
  if (x !== undefined || y !== undefined) return { x: x ?? 0, y: y ?? 0 }
  const position = asRecord(source.position)
  if (!position) return null
  const px = readNumber(position, 'x')
  const py = readNumber(position, 'y')
  return px === undefined && py === undefined ? null : { x: px ?? 0, y: py ?? 0 }
}

function readSize(source: RawRecord, type: AppNodeType): NodeSize {
  const fallback = DEFAULT_NODE_SIZE[type]
  const style = asRecord(source.style)
  const width = readNumber(source, 'width') ?? (style ? readNumber(style, 'width') : undefined)
  const height = readNumber(source, 'height') ?? (style ? readNumber(style, 'height') : undefined)
  return {
    width: clampSide(width) ?? fallback.width,
    height: clampSide(height) ?? fallback.height,
  }
}

function clampSide(value: number | undefined): number | undefined {
  if (value === undefined) return undefined
  return Math.min(Math.max(value, MIN_NODE_SIDE), MAX_NODE_SIDE)
}

function readKinds(value: unknown): KindDef[] {
  if (!Array.isArray(value)) return []
  const kinds: KindDef[] = []
  for (const item of value) {
    const source = asRecord(item)
    const id = source ? readString(source, 'id') : undefined
    if (!source || !id) continue
    const name = readString(source, 'name') ?? id
    kinds.push({
      id,
      name,
      letter: (readString(source, 'letter') ?? name.slice(0, 1)).slice(0, 2),
      color: readColor(source, 'color') ?? '#8e8e93',
      builtin: false,
    })
  }
  return kinds
}

function readEdges(raw: unknown[], idBySource: Map<string, string>): AppEdge[] {
  const edges: AppEdge[] = []
  const pairs = new Set<string>()
  for (const item of raw) {
    const source = asRecord(item)
    if (!source) continue
    const from = idBySource.get(readString(source, 'source') ?? '')
    const to = idBySource.get(readString(source, 'target') ?? '')
    if (!from || !to || from === to) continue
    const pair = `${from}->${to}`
    if (pairs.has(pair)) continue
    pairs.add(pair)
    edges.push({
      id: createId('e'),
      source: from,
      target: to,
      data: hydrateEdgeData({
        label: readString(source, 'label'),
        color: readColor(source, 'color'),
        width: readNumber(source, 'width'),
      }),
    })
  }
  return edges
}

function asRecord(value: unknown): RawRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as RawRecord) : null
}

function readString(source: RawRecord, key: string): string | undefined {
  const value = source[key]
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function readNumber(source: RawRecord, key: string): number | undefined {
  const value = source[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function readColor(source: RawRecord, key: string): string | undefined {
  const value = readString(source, key)
  return value && /^#[0-9a-f]{3,8}$/i.test(value) ? value : undefined
}
