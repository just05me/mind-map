import { createId } from '../lib/id'
import type { AppEdge, AppNode } from '../model/types'

export type Graph = { nodes: AppNode[]; edges: AppEdge[] }

/** Ids plus every nested child, so deleting or copying a frame takes its contents along. */
export function withDescendants(nodes: AppNode[], ids: Iterable<string>): Set<string> {
  const result = new Set(ids)
  let grew = true
  while (grew) {
    grew = false
    for (const node of nodes) {
      if (node.parentId && result.has(node.parentId) && !result.has(node.id)) {
        result.add(node.id)
        grew = true
      }
    }
  }
  return result
}

export function removeElements(graph: Graph, nodeIds: string[], edgeIds: string[]): Graph {
  const removedNodes = withDescendants(graph.nodes, nodeIds)
  const removedEdges = new Set(edgeIds)
  return {
    nodes: graph.nodes.filter((node) => !removedNodes.has(node.id)),
    edges: graph.edges.filter(
      (edge) =>
        !removedEdges.has(edge.id) && !removedNodes.has(edge.source) && !removedNodes.has(edge.target),
    ),
  }
}

export function absolutePosition(nodes: AppNode[], id: string): { x: number; y: number } {
  let x = 0
  let y = 0
  let current = nodes.find((node) => node.id === id)
  const seen = new Set<string>()
  while (current && !seen.has(current.id)) {
    seen.add(current.id)
    x += current.position.x
    y += current.position.y
    const parentId = current.parentId
    current = parentId ? nodes.find((node) => node.id === parentId) : undefined
  }
  return { x, y }
}

/** React Flow requires a parent to appear before its children in the array. */
export function orderParentsFirst(nodes: AppNode[]): AppNode[] {
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const placed = new Set<string>()
  const result: AppNode[] = []
  const visit = (node: AppNode, trail: Set<string>) => {
    if (placed.has(node.id) || trail.has(node.id)) return
    trail.add(node.id)
    const parent = node.parentId ? byId.get(node.parentId) : undefined
    if (parent) visit(parent, trail)
    placed.add(node.id)
    result.push(node)
  }
  for (const node of nodes) visit(node, new Set())
  return result
}

export function reparentNode(nodes: AppNode[], id: string, parentId: string | null): AppNode[] {
  const target = nodes.find((node) => node.id === id)
  if (!target || (target.parentId ?? null) === parentId) return nodes
  if (parentId && withDescendants(nodes, [id]).has(parentId)) return nodes
  const abs = absolutePosition(nodes, id)
  const parentAbs = parentId ? absolutePosition(nodes, parentId) : { x: 0, y: 0 }
  const next = nodes.map((node) =>
    node.id === id
      ? {
          ...node,
          parentId: parentId ?? undefined,
          expandParent: parentId ? true : undefined,
          position: { x: abs.x - parentAbs.x, y: abs.y - parentAbs.y },
        }
      : node,
  )
  return orderParentsFirst(next)
}

/**
 * Snapshot of the selection for copy/duplicate: the nodes with their nested children and
 * the edges that run between copied nodes. Top-level copies keep absolute positions.
 */
export function extractSubgraph(graph: Graph, nodeIds: string[]): Graph {
  const ids = withDescendants(graph.nodes, nodeIds)
  const nodes = graph.nodes
    .filter((node) => ids.has(node.id))
    .map((node) => {
      if (node.parentId && ids.has(node.parentId)) return structuredClone(node)
      return {
        ...structuredClone(node),
        parentId: undefined,
        expandParent: undefined,
        position: absolutePosition(graph.nodes, node.id),
      }
    })
  const edges = graph.edges
    .filter((edge) => ids.has(edge.source) && ids.has(edge.target))
    .map((edge) => structuredClone(edge))
  return { nodes, edges }
}

/** Gives a snapshot fresh ids and moves its top-level nodes by offset (or to a point). */
export function instantiateSubgraph(
  snapshot: Graph,
  placement: { offset: { x: number; y: number } } | { at: { x: number; y: number } },
): Graph {
  const idMap = new Map<string, string>()
  for (const node of snapshot.nodes) idMap.set(node.id, createId('n'))
  const roots = snapshot.nodes.filter((node) => !node.parentId)
  const minX = Math.min(...roots.map((node) => node.position.x))
  const minY = Math.min(...roots.map((node) => node.position.y))
  const shift =
    'offset' in placement
      ? placement.offset
      : { x: placement.at.x - minX, y: placement.at.y - minY }

  const nodes = snapshot.nodes.map((node) => {
    const parentId = node.parentId ? idMap.get(node.parentId) : undefined
    return {
      ...structuredClone(node),
      id: idMap.get(node.id) ?? createId('n'),
      parentId,
      selected: !parentId,
      dragging: false,
      position: parentId
        ? node.position
        : { x: node.position.x + shift.x, y: node.position.y + shift.y },
    }
  })
  const edges = snapshot.edges.map((edge) => ({
    ...structuredClone(edge),
    id: createId('e'),
    selected: false,
    source: idMap.get(edge.source) ?? edge.source,
    target: idMap.get(edge.target) ?? edge.target,
  }))
  return { nodes, edges }
}

export function selectedNodeIds(nodes: AppNode[]): string[] {
  return nodes.filter((node) => node.selected).map((node) => node.id)
}

export function selectedEdgeIds(edges: AppEdge[]): string[] {
  return edges.filter((edge) => edge.selected).map((edge) => edge.id)
}
