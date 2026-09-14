import type { AppNodeType, KindId } from '../types'

export function nodeTypeForKind(kind: KindId): AppNodeType {
  switch (kind) {
    case 'group':
      return 'group'
    case 'note':
      return 'note'
    case 'text':
      return 'text'
    case 'frame':
      return 'frame'
    case 'divider':
      return 'divider'
    case 'decision':
      return 'decision'
    case 'comment':
      return 'comment'
    default:
      return 'kind'
  }
}

export function isContainerType(type: AppNodeType | undefined): boolean {
  switch (type) {
    case 'group':
    case 'frame':
      return true
    case 'kind':
    case 'note':
    case 'text':
    case 'divider':
    case 'decision':
    case 'comment':
    case undefined:
      return false
    default: {
      const _never: never = type
      return _never
    }
  }
}

export function isStatusBoardType(type: AppNodeType | undefined): boolean {
  switch (type) {
    case 'kind':
    case 'note':
    case 'decision':
    case 'comment':
      return true
    case 'group':
    case 'frame':
    case 'text':
    case 'divider':
    case undefined:
      return false
    default: {
      const _never: never = type
      return _never
    }
  }
}

export function supportsInlineTitle(type: AppNodeType | undefined): boolean {
  switch (type) {
    case 'kind':
    case 'note':
    case 'text':
    case 'group':
    case 'frame':
    case 'decision':
    case 'comment':
      return true
    case 'divider':
    case undefined:
      return false
    default: {
      const _never: never = type
      return _never
    }
  }
}
