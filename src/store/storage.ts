import { mergeBuiltinKinds } from '../model/kinds'
import type { PersistedStore, Project, ThemeMode } from '../model/types'
import { createEmptyProject } from './project-factory'

const STORAGE_KEY = 'mind-map.store.v1'

export function isProject(value: unknown): value is Project {
  if (!value || typeof value !== 'object') return false
  const project = value as Partial<Project>
  return (
    typeof project.id === 'string' &&
    typeof project.title === 'string' &&
    Array.isArray(project.kinds) &&
    Array.isArray(project.nodes) &&
    Array.isArray(project.edges) &&
    typeof project.updatedAt === 'string'
  )
}

export function hydrateProject(project: Project): Project {
  return {
    ...project,
    kinds: mergeBuiltinKinds(project.kinds),
    canvasColor: typeof project.canvasColor === 'string' ? project.canvasColor : undefined,
  }
}

export function loadStore(): { projects: Project[]; currentId: string; theme: ThemeMode } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const project = createEmptyProject()
      return { projects: [project], currentId: project.id, theme: 'dark' }
    }
    const parsed = JSON.parse(raw) as Partial<PersistedStore>
    const projects = Array.isArray(parsed.projects)
      ? parsed.projects.filter(isProject).map(hydrateProject)
      : []
    if (projects.length === 0) {
      const project = createEmptyProject()
      return {
        projects: [project],
        currentId: project.id,
        theme: parsed.theme === 'light' ? 'light' : 'dark',
      }
    }
    const currentId =
      typeof parsed.currentId === 'string' && projects.some((item) => item.id === parsed.currentId)
        ? parsed.currentId
        : projects[0].id
    return {
      projects,
      currentId,
      theme: parsed.theme === 'light' ? 'light' : 'dark',
    }
  } catch {
    const project = createEmptyProject()
    return { projects: [project], currentId: project.id, theme: 'dark' }
  }
}

export function toPersistedProject(project: Project): Project {
  return {
    ...project,
    nodes: project.nodes.map(({ selected: _selected, dragging: _dragging, ...node }) => node),
    edges: project.edges.map(({ selected: _selected, ...edge }) => edge),
  }
}

export function saveStore(payload: {
  projects: Project[]
  currentId: string
  theme: ThemeMode
}): void {
  const data: PersistedStore = {
    version: 1,
    currentId: payload.currentId,
    // Selection and drag flags are session state; reopening should start clean.
    projects: payload.projects.map(toPersistedProject),
    theme: payload.theme,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
