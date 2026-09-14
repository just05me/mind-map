import { cloneBuiltinKinds } from '../model/kinds'
import { createId } from '../lib/id'
import type { Project } from '../model/types'

export function createEmptyProject(title = 'Новый проект'): Project {
  return {
    id: createId('proj'),
    title,
    description: '',
    kinds: cloneBuiltinKinds(),
    nodes: [],
    edges: [],
    updatedAt: new Date().toISOString(),
  }
}

export function duplicateProject(project: Project): Project {
  const idMap = new Map<string, string>()
  const nodes = project.nodes.map((node) => {
    const nextId = createId('n')
    idMap.set(node.id, nextId)
    return {
      ...node,
      id: nextId,
      parentId: node.parentId,
      data: { ...node.data, items: node.data.items ? [...node.data.items] : undefined },
    }
  })
  const remapped = nodes.map((node) => ({
    ...node,
    parentId: node.parentId ? (idMap.get(node.parentId) ?? node.parentId) : undefined,
  }))
  const edges = project.edges.map((edge) => ({
    ...edge,
    id: createId('e'),
    source: idMap.get(edge.source) ?? edge.source,
    target: idMap.get(edge.target) ?? edge.target,
  }))
  return {
    ...project,
    id: createId('proj'),
    title: `${project.title} (копия)`,
    nodes: remapped,
    edges,
    updatedAt: new Date().toISOString(),
  }
}
