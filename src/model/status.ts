import type { Status } from './types'

export function statusLabel(status: Status): string {
  switch (status) {
    case 'planned':
      return 'Задумано'
    case 'doing':
      return 'В работе'
    case 'done':
      return 'Готово'
    case 'broken':
      return 'Сломано'
    default: {
      const _never: never = status
      return _never
    }
  }
}

export function statusClass(status: Status): string {
  switch (status) {
    case 'planned':
      return 'bg-slate-500/15 text-slate-600 dark:text-slate-300'
    case 'doing':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
    case 'done':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
    case 'broken':
      return 'bg-red-500/15 text-red-700 dark:text-red-300'
    default: {
      const _never: never = status
      return _never
    }
  }
}

export const STATUSES: Status[] = ['planned', 'doing', 'done', 'broken']
