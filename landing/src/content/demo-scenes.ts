import { CARD_H, CARD_W, SHAPE_H, SHAPE_W, type Scene } from '../demos/scene-types'
import type { KindId, Status } from './tokens'

/** «Схема»: payment flow with a frame, shapes, cards and labeled edges. */
export const SCHEMA_SCENE: Scene = {
  width: 720,
  height: 470,
  nodes: [
    { id: 'buyer', type: 'kind', kind: 'person', title: 'Покупатель', subtitle: 'веб и мобайл', x: 20, y: 40, w: SHAPE_W, h: SHAPE_H, step: 1 },
    { id: 'checkout', type: 'kind', kind: 'entry', title: 'Checkout', subtitle: 'POST /checkout', x: 250, y: 30, w: SHAPE_W, h: SHAPE_H, step: 2 },
    { id: 'backend', type: 'frame', title: 'Бэкенд', x: 440, y: 16, w: 268, h: 400, step: 4 },
    { id: 'payments', type: 'kind', kind: 'module', title: 'Платежи', subtitle: 'оркестратор', status: 'doing', parentId: 'backend', x: 490, y: 46, w: SHAPE_W, h: SHAPE_H, step: 5 },
    { id: 'db', type: 'kind', kind: 'store', title: 'PostgreSQL', subtitle: 'orders, payments', status: 'done', parentId: 'backend', x: 490, y: 250, w: SHAPE_W, h: SHAPE_H, step: 7 },
    { id: 'stripe', type: 'kind', kind: 'external', title: 'Stripe', subtitle: 'внешний PSP', status: 'broken', x: 250, y: 216, w: SHAPE_W, h: SHAPE_H, step: 9 },
    { id: 'hook', type: 'kind', kind: 'webhook', title: 'Вебхук Stripe', subtitle: 'payment_intent.succeeded', x: 204, y: 396, w: CARD_W, h: CARD_H, step: 11 },
  ],
  edges: [
    { id: 'e1', source: 'buyer', target: 'checkout', label: 'оформляет', step: 3 },
    { id: 'e2', source: 'checkout', target: 'payments', label: 'создать платёж', step: 6 },
    { id: 'e3', source: 'payments', target: 'db', label: 'запись', step: 8 },
    { id: 'e4', source: 'payments', target: 'stripe', label: 'списание', step: 10 },
    { id: 'e5', source: 'stripe', target: 'hook', label: 'событие', step: 12 },
    { id: 'e6', source: 'hook', target: 'payments', label: 'подтвердить', step: 13 },
  ],
}

export type BoardItem = {
  id: string
  kind: KindId
  title: string
  /** Status per phase; the demo loops through the phases. */
  statuses: Status[]
}

export const BOARD_PHASES = 4

export const BOARD_ITEMS: BoardItem[] = [
  { id: 'api', kind: 'api', title: 'POST /checkout', statuses: ['planned', 'doing', 'done', 'done'] },
  { id: 'payments', kind: 'module', title: 'Платежи', statuses: ['doing', 'doing', 'done', 'done'] },
  { id: 'db', kind: 'store', title: 'PostgreSQL', statuses: ['done', 'done', 'done', 'done'] },
  { id: 'hook', kind: 'webhook', title: 'Вебхук Stripe', statuses: ['planned', 'planned', 'doing', 'done'] },
  { id: 'stripe', kind: 'external', title: 'Stripe', statuses: ['broken', 'broken', 'doing', 'done'] },
  { id: 'e2e', kind: 'test', title: 'E2E оплаты', statuses: ['planned', 'planned', 'planned', 'doing'] },
  { id: 'recon', kind: 'job', title: 'Сверка платежей', statuses: ['planned', 'doing', 'broken', 'doing'] },
]

/** «Схема ↔ Статусы»: card nodes with both canvas positions and statuses. */
export const SWITCH_SCENE: Scene = {
  width: 720,
  height: 400,
  nodes: [
    { id: 'api', type: 'kind', kind: 'api', title: 'POST /api/chat', subtitle: 'Hono', status: 'doing', x: 40, y: 40, w: CARD_W, h: CARD_H, step: 0 },
    { id: 'agent', type: 'kind', kind: 'agent', title: 'Агент ответа', subtitle: 'streamText', status: 'doing', x: 300, y: 140, w: CARD_W, h: CARD_H, step: 0 },
    { id: 'tool', type: 'kind', kind: 'tool', title: 'Поиск по базе', subtitle: 'searchDocs()', status: 'planned', x: 40, y: 240, w: CARD_W, h: CARD_H, step: 0 },
    { id: 'model', type: 'kind', kind: 'model', title: 'GPT-4o', subtitle: '@ai-sdk/openai', status: 'done', x: 480, y: 40, w: CARD_W, h: CARD_H, step: 0 },
    { id: 'event', type: 'kind', kind: 'event', title: 'Ответ готов', subtitle: 'response.done', status: 'planned', x: 480, y: 300, w: CARD_W, h: CARD_H, step: 0 },
    { id: 'slack', type: 'kind', kind: 'webhook', title: 'Уведомление в Slack', subtitle: 'POST hooks.slack.com', status: 'done', x: 220, y: 320, w: CARD_W, h: CARD_H, step: 0 },
  ],
  edges: [
    { id: 'e1', source: 'api', target: 'agent', label: 'стрим', step: 0 },
    { id: 'e2', source: 'agent', target: 'model', label: 'промпт', step: 0 },
    { id: 'e3', source: 'agent', target: 'tool', label: 'вызов', step: 0 },
    { id: 'e4', source: 'agent', target: 'event', label: 'готово', step: 0 },
    { id: 'e5', source: 'event', target: 'slack', label: 'пост', step: 0 },
  ],
}

export const SWITCH_COLUMNS: Status[] = ['planned', 'doing', 'done']

/** «Автораскладка»: the same graph, messy vs left-to-right ranks. */
export const LAYOUT_MESSY: Scene = {
  width: 700,
  height: 300,
  nodes: [
    { id: 'entry', type: 'kind', kind: 'entry', title: 'Вход', subtitle: 'GET /', x: 380, y: 150, w: SHAPE_W, h: SHAPE_H, step: 0 },
    { id: 'module', type: 'kind', kind: 'module', title: 'Каталог', subtitle: 'модуль', x: 30, y: 20, w: SHAPE_W, h: SHAPE_H, step: 0 },
    { id: 'db', type: 'kind', kind: 'store', title: 'PostgreSQL', subtitle: 'products', x: 500, y: 10, w: SHAPE_W, h: SHAPE_H, step: 0 },
    { id: 'cache', type: 'kind', kind: 'cache', title: 'Redis', subtitle: 'кэш', x: 200, y: 160, w: SHAPE_W, h: SHAPE_H, step: 0 },
  ],
  edges: [
    { id: 'l1', source: 'entry', target: 'module', label: 'запрос', step: 0 },
    { id: 'l2', source: 'module', target: 'db', label: 'SQL', step: 0 },
    { id: 'l3', source: 'module', target: 'cache', label: 'get / set', step: 0 },
  ],
}

export const LAYOUT_TIDY_POSITIONS: Record<string, { x: number; y: number }> = {
  entry: { x: 24, y: 83 },
  module: { x: 266, y: 83 },
  db: { x: 508, y: 8 },
  cache: { x: 508, y: 158 },
}
