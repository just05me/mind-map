import { createId } from '../lib/id'
import type { KindDef, KindId } from '../types'

export const BUILTIN_KINDS: KindDef[] = [
  { id: 'entry', name: 'Вход', letter: 'E', color: '#0071e3', builtin: true },
  { id: 'module', name: 'Модуль', letter: 'M', color: '#5e5ce6', builtin: true },
  { id: 'service', name: 'Сервис', letter: 'S', color: '#8e8e93', builtin: true },
  { id: 'store', name: 'Хранилище', letter: 'D', color: '#ffd60a', builtin: true },
  { id: 'api', name: 'API', letter: 'P', color: '#5856d6', builtin: true },
  { id: 'tool', name: 'Инструмент', letter: 'T', color: '#ff9f0a', builtin: true },
  { id: 'agent', name: 'Агент', letter: 'A', color: '#30d158', builtin: true },
  { id: 'model', name: 'Модель', letter: '○', color: '#d1d1d6', builtin: true },
  { id: 'external', name: 'Внешнее', letter: 'X', color: '#ff453a', builtin: true },
  { id: 'note', name: 'Стикер', letter: 'N', color: '#ffd60a', builtin: true },
  { id: 'group', name: 'Группа', letter: 'G', color: '#636366', builtin: true },
  { id: 'text', name: 'Текст', letter: 'Aa', color: '#1d1d1f', builtin: true },
  { id: 'comment', name: 'Комментарий', letter: '!', color: '#ff9f0a', builtin: true },
  { id: 'frame', name: 'Рамка', letter: '[]', color: '#8e8e93', builtin: true },
  { id: 'divider', name: 'Линия', letter: '—', color: '#636366', builtin: true },
  { id: 'decision', name: 'Решение', letter: '◇', color: '#bf5af2', builtin: true },
  { id: 'person', name: 'Человек', letter: 'Ч', color: '#64d2ff', builtin: true },
  { id: 'queue', name: 'Очередь', letter: 'Q', color: '#30d158', builtin: true },
  { id: 'event', name: 'Событие', letter: 'С', color: '#ff375f', builtin: true },
  { id: 'file', name: 'Файл', letter: 'Ф', color: '#0a84ff', builtin: true },
  { id: 'env', name: 'Конфиг', letter: '$', color: '#ac8e68', builtin: true },
  { id: 'test', name: 'Тест', letter: 't', color: '#32ade6', builtin: true },
  { id: 'job', name: 'Задача', letter: 'J', color: '#ffd60a', builtin: true },
  { id: 'webhook', name: 'Вебхук', letter: 'W', color: '#ff6482', builtin: true },
  { id: 'cache', name: 'Кэш', letter: 'C', color: '#5e5ce6', builtin: true },
  { id: 'auth', name: 'Доступ', letter: '@', color: '#ff9f0a', builtin: true },
]

export type KindGroupId = 'structure' | 'runtime' | 'people' | 'quality' | 'annotate' | 'custom'

export type KindGroup = {
  id: KindGroupId
  title: string
  ids: readonly string[]
}

export const KIND_GROUPS: KindGroup[] = [
  {
    id: 'structure',
    title: 'Структура',
    ids: ['entry', 'module', 'service', 'group', 'frame'],
  },
  {
    id: 'runtime',
    title: 'Среда',
    ids: ['store', 'api', 'queue', 'cache', 'event', 'job', 'webhook'],
  },
  {
    id: 'people',
    title: 'Люди и решения',
    ids: ['person', 'agent', 'tool', 'decision', 'auth'],
  },
  {
    id: 'quality',
    title: 'Качество',
    ids: ['test', 'model', 'file', 'env'],
  },
  {
    id: 'annotate',
    title: 'На холсте',
    ids: ['text', 'note', 'comment', 'divider', 'external'],
  },
  {
    id: 'custom',
    title: 'Свои типы',
    ids: [],
  },
]

export function cloneBuiltinKinds(): KindDef[] {
  return BUILTIN_KINDS.map((kind) => ({ ...kind }))
}

export function findKind(kinds: KindDef[], id: KindId): KindDef | undefined {
  return kinds.find((kind) => kind.id === id)
}

export function requireKind(kinds: KindDef[], id: KindId): KindDef {
  return (
    findKind(kinds, id) ?? {
      id,
      name: id,
      letter: id.slice(0, 1).toUpperCase() || '?',
      color: '#6e6e73',
      builtin: false,
    }
  )
}

export function createCustomKind(input: {
  name: string
  letter: string
  color: string
}): KindDef {
  const name = input.name.trim() || 'Свой тип'
  const letter = (input.letter.trim() || name.slice(0, 1) || '?').slice(0, 2)
  return {
    id: createId('kind'),
    name,
    letter,
    color: input.color || '#8e8e93',
    builtin: false,
  }
}

export function upsertKind(kinds: KindDef[], next: KindDef): KindDef[] {
  const exists = kinds.some((kind) => kind.id === next.id)
  if (!exists) {
    return [...kinds, next]
  }
  return kinds.map((kind) => (kind.id === next.id ? next : kind))
}

export function removeKind(kinds: KindDef[], id: KindId): KindDef[] {
  return kinds.filter((kind) => kind.id !== id || kind.builtin)
}

export function mergeBuiltinKinds(kinds: KindDef[]): KindDef[] {
  const byId = new Map(kinds.map((kind) => [kind.id, kind]))
  const merged: KindDef[] = []
  for (const builtin of BUILTIN_KINDS) {
    const existing = byId.get(builtin.id)
    if (existing) {
      merged.push({
        ...builtin,
        ...existing,
        id: builtin.id,
        builtin: true,
      })
      byId.delete(builtin.id)
    } else {
      merged.push({ ...builtin })
    }
  }
  for (const rest of byId.values()) {
    merged.push(rest)
  }
  return merged
}

export function kindsInGroup(kinds: KindDef[], group: KindGroup): KindDef[] {
  switch (group.id) {
    case 'custom':
      return kinds.filter((kind) => !kind.builtin)
    case 'structure':
    case 'runtime':
    case 'people':
    case 'quality':
    case 'annotate':
      return group.ids
        .map((id) => kinds.find((kind) => kind.id === id))
        .filter((kind): kind is KindDef => kind != null)
    default: {
      const _never: never = group.id
      return _never
    }
  }
}
