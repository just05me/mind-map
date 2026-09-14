import Dagre from '@dagrejs/dagre'
import type { AppEdge, AppNode, AppNodeType } from '../model/types'

function nodeSize(node: AppNode): { width: number; height: number } {
  const measuredW = node.measured?.width
  const measuredH = node.measured?.height
  const styleW = typeof node.style?.width === 'number' ? node.style.width : undefined
  const styleH = typeof node.style?.height === 'number' ? node.style.height : undefined
  const fallback = sizeForType(node.type)
  return {
    width: measuredW ?? styleW ?? fallback.width,
    height: measuredH ?? styleH ?? fallback.height,
  }
}

function sizeForType(type: AppNodeType | undefined): { width: number; height: number } {
  switch (type) {
    case 'group':
      return { width: 320, height: 280 }
    case 'frame':
      return { width: 420, height: 320 }
    case 'note':
    case 'comment':
      return { width: 200, height: 120 }
    case 'text':
      return { width: 280, height: 64 }
    case 'divider':
      return { width: 240, height: 16 }
    case 'decision':
      return { width: 148, height: 148 }
    case 'kind':
    case undefined:
      return { width: 240, height: 80 }
    default: {
      const _never: never = type
      return _never
    }
  }
}

export function layoutGraph(
  nodes: AppNode[],
  edges: AppEdge[],
  direction: 'LR' | 'TB',
): AppNode[] {
  const graph = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))
  graph.setGraph({ rankdir: direction, nodesep: 48, ranksep: 90, marginx: 40, marginy: 40 })

  const topLevel = nodes.filter((node) => !node.parentId)
  for (const node of topLevel) {
    const size = nodeSize(node)
    graph.setNode(node.id, { width: size.width, height: size.height })
  }

  for (const edge of edges) {
    const source = nodes.find((node) => node.id === edge.source)
    const target = nodes.find((node) => node.id === edge.target)
    if (!source || !target || source.parentId || target.parentId) continue
    graph.setEdge(edge.source, edge.target)
  }

  Dagre.layout(graph)

  return nodes.map((node) => {
    if (node.parentId) return node
    const placed = graph.node(node.id)
    if (!placed) return node
    return {
      ...node,
      position: {
        x: placed.x - placed.width / 2,
        y: placed.y - placed.height / 2,
      },
    }
  })
}
