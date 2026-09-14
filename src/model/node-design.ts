import type { KindId } from './types'

/**
 * Visual silhouette of a node. `card` is the default horizontal chip with a glyph;
 * the others draw a signature shape so a type is recognizable at a glance
 * (a database looks like a cylinder, a server like a rack, and so on).
 */
export type NodeShape = 'card' | 'cylinder' | 'rack' | 'cloud' | 'circle' | 'pill' | 'stack' | 'hexagon'

/** Names in the glyph library (see KindGlyph). Used for `card` nodes and badges. */
export type GlyphName =
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
  | 'dot'

export type FieldHints = {
  subtitleLabel: string
  subtitlePlaceholder: string
  itemsLabel: string
  itemsPlaceholder: string
  /** Types where a source path makes no sense (databases, people…) hide it. */
  showPath: boolean
}

export type NodeDesign = {
  shape: NodeShape
  glyph: GlyphName
  fields: FieldHints
}

const DEFAULT_FIELDS: FieldHints = {
  subtitleLabel: 'Подзаголовок',
  subtitlePlaceholder: 'Короткое пояснение',
  itemsLabel: 'Пункты',
  itemsPlaceholder: 'Строка списка',
  showPath: true,
}

function design(shape: NodeShape, glyph: GlyphName, fields: Partial<FieldHints> = {}): NodeDesign {
  return { shape, glyph, fields: { ...DEFAULT_FIELDS, ...fields } }
}

/** Per-kind look and field hints. Kinds without an entry (custom types) fall back to a card. */
const DESIGNS: Record<string, NodeDesign> = {
  entry: design('pill', 'entry', {
    subtitleLabel: 'Маршрут',
    subtitlePlaceholder: 'POST /api/chat',
    itemsLabel: 'Параметры',
  }),
  module: design('hexagon', 'module', {
    subtitlePlaceholder: 'Что делает модуль',
    itemsLabel: 'Функции',
  }),
  service: design('rack', 'service', {
    subtitleLabel: 'Роль сервиса',
    subtitlePlaceholder: 'Node · порт 3000',
    itemsLabel: 'Эндпоинты',
    itemsPlaceholder: 'GET /health',
  }),
  store: design('cylinder', 'store', {
    subtitleLabel: 'Движок',
    subtitlePlaceholder: 'Postgres · Drizzle',
    itemsLabel: 'Таблицы',
    itemsPlaceholder: 'users',
    showPath: false,
  }),
  cache: design('cylinder', 'cache', {
    subtitleLabel: 'Движок',
    subtitlePlaceholder: 'Redis · Upstash',
    itemsLabel: 'Ключи',
    showPath: false,
  }),
  api: design('card', 'api', {
    subtitleLabel: 'Метод и путь',
    subtitlePlaceholder: 'GET /api/history',
    itemsLabel: 'Параметры',
  }),
  tool: design('card', 'tool', {
    subtitlePlaceholder: 'Что вызывает',
    itemsLabel: 'Аргументы',
  }),
  agent: design('card', 'agent', {
    subtitleLabel: 'Режим',
    subtitlePlaceholder: 'streamText, maxSteps=5',
    itemsLabel: 'Модели',
    itemsPlaceholder: 'GPT-4o',
  }),
  model: design('card', 'model', {
    subtitleLabel: 'Провайдер',
    subtitlePlaceholder: '@ai-sdk/openai',
    itemsLabel: 'Возможности',
    showPath: false,
  }),
  external: design('cloud', 'external', {
    subtitleLabel: 'Сервис',
    subtitlePlaceholder: 'OpenAI API',
    itemsLabel: 'Методы',
    showPath: false,
  }),
  person: design('circle', 'person', {
    subtitleLabel: 'Роль',
    subtitlePlaceholder: 'Пользователь',
    itemsLabel: 'Действия',
    showPath: false,
  }),
  queue: design('stack', 'queue', {
    subtitlePlaceholder: 'Очередь сообщений',
    itemsLabel: 'Сообщения',
    showPath: false,
  }),
  event: design('card', 'event', {
    subtitlePlaceholder: 'Когда происходит',
    itemsLabel: 'Данные',
    showPath: false,
  }),
  file: design('card', 'file', {
    subtitleLabel: 'Формат',
    subtitlePlaceholder: 'PDF · вложение',
  }),
  env: design('card', 'env', {
    subtitlePlaceholder: 'Переменные окружения',
    itemsLabel: 'Ключи',
  }),
  test: design('card', 'test', {
    subtitlePlaceholder: 'Что проверяет',
    itemsLabel: 'Кейсы',
  }),
  job: design('card', 'job', {
    subtitleLabel: 'Расписание',
    subtitlePlaceholder: 'cron · каждый час',
    itemsLabel: 'Шаги',
  }),
  webhook: design('card', 'webhook', {
    subtitleLabel: 'Событие',
    subtitlePlaceholder: 'POST от Stripe',
  }),
  auth: design('card', 'auth', {
    subtitlePlaceholder: 'NextAuth · сессия',
    itemsLabel: 'Провайдеры',
  }),
}

const FALLBACK = design('card', 'dot')

export function nodeDesign(kindId: KindId): NodeDesign {
  return DESIGNS[kindId] ?? FALLBACK
}

/** The glyph for a known kind, or null for custom kinds (which fall back to a letter badge). */
export function glyphFor(kindId: KindId): GlyphName | null {
  return DESIGNS[kindId]?.glyph ?? null
}

/** Signature shapes are drawn as an icon-with-caption; cards are horizontal chips. */
export function isShapeNode(shape: NodeShape): boolean {
  return shape !== 'card'
}
