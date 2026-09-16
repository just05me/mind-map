/**
 * Product tokens copied from the app (src/model/kinds.ts, status.ts, node-design.ts).
 * The landing cannot import from the app, so the palette lives here in one place.
 */

export const LINKS = {
  app: 'https://ffinance.uz',
  github: 'https://github.com/just05me/mind-map',
  issues: 'https://github.com/just05me/mind-map/issues',
  stars: 'https://github.com/just05me/mind-map/stargazers',
} as const

export type Status = 'planned' | 'doing' | 'done' | 'broken'

export const STATUSES: Status[] = ['planned', 'doing', 'done', 'broken']

export type StatusMeta = {
  label: string
  /** Same Tailwind classes the app's status pill uses. */
  pillClass: string
  /** Column accent for board demos. */
  color: string
}

export const STATUS_META: Record<Status, StatusMeta> = {
  planned: {
    label: 'Задумано',
    pillClass: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
    color: '#8e8e93',
  },
  doing: {
    label: 'В работе',
    pillClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    color: '#ff9f0a',
  },
  done: {
    label: 'Готово',
    pillClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    color: '#30d158',
  },
  broken: {
    label: 'Сломано',
    pillClass: 'bg-red-500/15 text-red-700 dark:text-red-300',
    color: '#ff453a',
  },
}

export type NodeShape = 'card' | 'cylinder' | 'rack' | 'cloud' | 'circle' | 'pill' | 'stack' | 'hexagon'

export type KindId =
  | 'entry'
  | 'module'
  | 'service'
  | 'store'
  | 'api'
  | 'tool'
  | 'agent'
  | 'model'
  | 'external'
  | 'person'
  | 'queue'
  | 'event'
  | 'file'
  | 'env'
  | 'test'
  | 'job'
  | 'webhook'
  | 'cache'
  | 'auth'

export type KindDef = {
  id: KindId
  name: string
  color: string
  shape: NodeShape
}

export const KINDS: Record<KindId, KindDef> = {
  entry: { id: 'entry', name: 'Вход', color: '#0071e3', shape: 'pill' },
  module: { id: 'module', name: 'Модуль', color: '#5e5ce6', shape: 'hexagon' },
  service: { id: 'service', name: 'Сервис', color: '#8e8e93', shape: 'rack' },
  store: { id: 'store', name: 'Хранилище', color: '#ffd60a', shape: 'cylinder' },
  api: { id: 'api', name: 'API', color: '#5856d6', shape: 'card' },
  tool: { id: 'tool', name: 'Инструмент', color: '#ff9f0a', shape: 'card' },
  agent: { id: 'agent', name: 'Агент', color: '#30d158', shape: 'card' },
  model: { id: 'model', name: 'Модель', color: '#d1d1d6', shape: 'card' },
  external: { id: 'external', name: 'Внешнее', color: '#ff453a', shape: 'cloud' },
  person: { id: 'person', name: 'Человек', color: '#64d2ff', shape: 'circle' },
  queue: { id: 'queue', name: 'Очередь', color: '#30d158', shape: 'stack' },
  event: { id: 'event', name: 'Событие', color: '#ff375f', shape: 'card' },
  file: { id: 'file', name: 'Файл', color: '#0a84ff', shape: 'card' },
  env: { id: 'env', name: 'Конфиг', color: '#ac8e68', shape: 'card' },
  test: { id: 'test', name: 'Тест', color: '#32ade6', shape: 'card' },
  job: { id: 'job', name: 'Задача', color: '#ffd60a', shape: 'card' },
  webhook: { id: 'webhook', name: 'Вебхук', color: '#ff6482', shape: 'card' },
  cache: { id: 'cache', name: 'Кэш', color: '#5e5ce6', shape: 'cylinder' },
  auth: { id: 'auth', name: 'Доступ', color: '#ff9f0a', shape: 'card' },
}

/** Sticker and frame colors as in NoteNode / FrameNode. */
export const NOTE_FILL = '#f5d76e'
export const FRAME_COLOR = '#8e8e93'

/** Same rule as src/model/color.ts: dark text on light accents. */
export function contrastText(hex: string): string {
  const normalized = hex.replace('#', '')
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : normalized
  const r = Number.parseInt(full.slice(0, 2), 16)
  const g = Number.parseInt(full.slice(2, 4), 16)
  const b = Number.parseInt(full.slice(4, 6), 16)
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b
  return luminance > 168 ? '#111827' : '#ffffff'
}
