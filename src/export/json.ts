import { mergeBuiltinKinds } from '../model/kinds'
import { downloadText, slugify } from './download'
import { createEmptyProject } from '../store/project-factory'
import type { Project } from '../model/types'

export function exportProjectJson(project: Project): void {
  downloadText(
    `${slugify(project.title)}.json`,
    JSON.stringify(project, null, 2),
    'application/json',
  )
}

export function parseImportedProject(raw: string): Project {
  const parsed = JSON.parse(raw) as Partial<Project>
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Некорректный JSON')
  }
  const fallback = createEmptyProject(typeof parsed.title === 'string' ? parsed.title : 'Импорт')
  return {
    ...fallback,
    ...parsed,
    id: fallback.id,
    title: typeof parsed.title === 'string' ? parsed.title : fallback.title,
    kinds: mergeBuiltinKinds(Array.isArray(parsed.kinds) ? parsed.kinds : fallback.kinds),
    nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
    edges: Array.isArray(parsed.edges) ? parsed.edges : [],
    canvasColor: typeof parsed.canvasColor === 'string' ? parsed.canvasColor : undefined,
    updatedAt: new Date().toISOString(),
  }
}
