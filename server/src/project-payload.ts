export type ProjectPayload = {
  id: string
  title: string
  description?: string
  kinds: unknown[]
  nodes: unknown[]
  edges: unknown[]
  viewport?: unknown
  canvasColor?: string
  updatedAt: string
}

/** Limit on the serialized project; the raw request body is capped a bit above it. */
export const MAX_PAYLOAD_BYTES = 4 * 1024 * 1024
const MAX_ID_LENGTH = 80

export function isProjectPayload(value: unknown): value is ProjectPayload {
  if (!value || typeof value !== 'object') return false
  const project = value as Partial<ProjectPayload>
  return (
    typeof project.id === 'string' &&
    project.id.length > 0 &&
    project.id.length <= MAX_ID_LENGTH &&
    typeof project.title === 'string' &&
    Array.isArray(project.kinds) &&
    Array.isArray(project.nodes) &&
    Array.isArray(project.edges) &&
    typeof project.updatedAt === 'string' &&
    (project.description === undefined || typeof project.description === 'string') &&
    (project.canvasColor === undefined || typeof project.canvasColor === 'string')
  )
}

export function stripSessionFlags(project: ProjectPayload): ProjectPayload {
  const nodes = project.nodes.map((node) => {
    if (!node || typeof node !== 'object') return node
    const { selected: _selected, dragging: _dragging, ...rest } = node as Record<string, unknown>
    return rest
  })
  const edges = project.edges.map((edge) => {
    if (!edge || typeof edge !== 'object') return edge
    const { selected: _selected, ...rest } = edge as Record<string, unknown>
    return rest
  })
  return { ...project, nodes, edges }
}

export function assertPayloadSize(project: ProjectPayload): void {
  const size = Buffer.byteLength(JSON.stringify(project), 'utf8')
  if (size > MAX_PAYLOAD_BYTES) {
    throw new Error('Проект слишком большой')
  }
}
