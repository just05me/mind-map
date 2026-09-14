import { requireKind } from '../model/kinds'
import { createId } from '../lib/id'
import { nodeTypeForKind } from '../model/node-type'
import type { AppNode, AppNodeType, KindId, Project } from '../model/types'

export function createNodeAt(
  project: Project,
  kindId: KindId,
  position: { x: number; y: number },
  parentId?: string,
): AppNode {
  const kind = requireKind(project.kinds, kindId)
  const type = nodeTypeForKind(kindId)
  const base: AppNode = {
    id: createId('n'),
    type,
    position,
    parentId,
    expandParent: parentId ? true : undefined,
    data: {
      kind: kind.id,
      title: kind.name,
      status: 'planned',
      items: [],
    },
  }

  return decorateNode(type, base)
}

function decorateNode(type: AppNodeType, base: AppNode): AppNode {
  switch (type) {
    case 'group':
      return {
        ...base,
        style: { width: 320, height: 280 },
        data: { ...base.data, title: 'Группа' },
      }
    case 'frame':
      return {
        ...base,
        style: { width: 420, height: 320 },
        data: { ...base.data, title: 'Рамка' },
      }
    case 'note':
      return {
        ...base,
        data: { ...base.data, title: 'Заметка', description: '' },
      }
    case 'text':
      return {
        ...base,
        style: { width: 280 },
        data: {
          ...base.data,
          title: '',
          fontSize: 28,
          fontWeight: 500,
          textAlign: 'left',
        },
      }
    case 'divider':
      return {
        ...base,
        style: { width: 240, height: 16 },
        data: { ...base.data, title: '' },
      }
    case 'decision':
      return {
        ...base,
        data: { ...base.data, title: 'Решение?' },
      }
    case 'comment':
      return {
        ...base,
        data: { ...base.data, title: 'Комментарий', description: '' },
      }
    case 'kind':
      return base
    default: {
      const _never: never = type
      return _never
    }
  }
}
