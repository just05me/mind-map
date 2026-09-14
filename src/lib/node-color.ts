import { requireKind } from '../kinds/catalog'
import type { AppNode, KindDef, NodeData, Project } from '../types'

export function nodeAccent(data: NodeData, kind: KindDef): string {
  return data.accentColor || kind.color
}

export function nodeFill(data: NodeData, fallback: string): string {
  return data.fillColor || fallback
}

export function resolveNodeColors(project: Project, node: AppNode): { accent: string; fill: string } {
  const kind = requireKind(project.kinds, node.data.kind)
  return {
    accent: nodeAccent(node.data, kind),
    fill: nodeFill(node.data, 'var(--panel-solid)'),
  }
}
