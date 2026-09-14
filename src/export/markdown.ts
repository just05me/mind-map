import { requireKind } from '../kinds/catalog'
import { downloadText, slugify } from '../lib/download'
import { isStatusBoardType } from '../lib/node-type'
import { STATUSES, statusLabel } from '../lib/status'
import type { Project } from '../types'

export function projectToMarkdown(project: Project): string {
  const lines: string[] = [`# ${project.title}`, '']
  if (project.description) {
    lines.push(project.description, '')
  }

  lines.push('## Статусы', '')
  for (const status of STATUSES) {
    const nodes = project.nodes.filter((node) => node.data.status === status && isStatusBoardType(node.type))
    lines.push(`### ${statusLabel(status)} (${nodes.length})`, '')
    if (nodes.length === 0) {
      lines.push('_пусто_', '')
      continue
    }
    for (const node of nodes) {
      const kind = requireKind(project.kinds, node.data.kind)
      lines.push(`- **${node.data.title}** (${kind.name})`)
      if (node.data.path) lines.push(`  - путь: \`${node.data.path}\``)
      if (node.data.subtitle) lines.push(`  - ${node.data.subtitle}`)
      if (node.data.description) lines.push(`  - ${node.data.description}`)
      if (node.data.items?.length) {
        for (const item of node.data.items) lines.push(`  - ${item}`)
      }
    }
    lines.push('')
  }

  lines.push('## Связи', '')
  if (project.edges.length === 0) {
    lines.push('_нет связей_', '')
  } else {
    for (const edge of project.edges) {
      const source = project.nodes.find((node) => node.id === edge.source)
      const target = project.nodes.find((node) => node.id === edge.target)
      if (!source || !target) continue
      lines.push(`- ${source.data.title} → ${target.data.title}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

export function exportProjectMarkdown(project: Project): void {
  downloadText(`${slugify(project.title)}.md`, projectToMarkdown(project), 'text/markdown')
}

