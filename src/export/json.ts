import { mergeBuiltinKinds } from '../model/kinds'
import { downloadText, slugify } from './download'
import { isLayoutSource, parseLayoutProject } from './import-layout'
import { createEmptyProject } from '../store/project-factory'
import { hydrateEdgeData } from '../store/storage'
import type { Project } from '../model/types'

export function exportProjectJson(project: Project): void {
  downloadText(
    `${slugify(project.title)}.json`,
    JSON.stringify(project, null, 2),
    'application/json',
  )
}

/**
 * Accepts both shapes: a native project (absolute positions, as exported here and stored
 * in `boards/`) and the layout format, where coordinates are offsets from the board center.
 */
export function parseImportedProject(raw: string): Project {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Некорректный JSON')
  }
  if (isLayoutSource(parsed)) {
    return parseLayoutProject(parsed)
  }
  return parseNativeProject(parsed)
}

function parseNativeProject(parsed: unknown): Project {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Некорректный JSON')
  }
  const project = parsed as Partial<Project>
  const fallback = createEmptyProject(
    typeof project.title === 'string' ? project.title : 'Импорт',
  )
  return {
    ...fallback,
    ...project,
    id: fallback.id,
    title: typeof project.title === 'string' ? project.title : fallback.title,
    kinds: mergeBuiltinKinds(Array.isArray(project.kinds) ? project.kinds : fallback.kinds),
    nodes: Array.isArray(project.nodes) ? project.nodes : [],
    edges: Array.isArray(project.edges)
      ? project.edges.map((edge) => ({ ...edge, data: hydrateEdgeData(edge.data) }))
      : [],
    canvasColor: typeof project.canvasColor === 'string' ? project.canvasColor : undefined,
    updatedAt: new Date().toISOString(),
  }
}
