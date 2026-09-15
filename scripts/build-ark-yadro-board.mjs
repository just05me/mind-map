/**
 * Builds the persistent mind-map project JSON for «Арк ядро — ТЗ разработчика v1».
 * Native app format: frames, kind nodes, notes, decisions, labeled edges.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const KINDS = [
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

const TYPE_OF = {
  group: 'group',
  note: 'note',
  text: 'text',
  frame: 'frame',
  divider: 'divider',
  decision: 'decision',
  comment: 'comment',
}

const SHAPE = new Set(['entry', 'module', 'service', 'store', 'cache', 'external', 'person', 'queue'])

const nodes = []
const edges = []
let edgeSeq = 0

function nodeType(kind) {
  return TYPE_OF[kind] ?? 'kind'
}

function cardW(kind) {
  const type = nodeType(kind)
  if (type === 'note' || type === 'comment') return 240
  if (type === 'decision') return 200
  if (type === 'text') return 300
  if (SHAPE.has(kind)) return 176
  return 268
}

function cardH(spec) {
  const type = nodeType(spec.kind)
  const items = Math.min((spec.items ?? []).length, 6)
  if (type === 'text') return 64
  if (type === 'decision') return 96
  if (type === 'note' || type === 'comment') {
    const desc = spec.description ? Math.ceil(spec.description.length / 28) * 16 : 0
    return 88 + desc
  }
  let h = SHAPE.has(spec.kind) ? 122 : 62
  if (spec.subtitle) h += 16
  if (items) h += 18 + items * 17
  return h
}

function addNode(spec) {
  const type = nodeType(spec.kind)
  const node = {
    id: spec.id,
    type,
    position: spec.position,
    parentId: spec.parentId,
    expandParent: spec.parentId ? true : undefined,
    extent: spec.parentId ? 'parent' : undefined,
    data: {
      kind: spec.kind,
      title: spec.title,
      subtitle: spec.subtitle,
      description: spec.description,
      status: spec.status ?? 'planned',
      items: spec.items ?? [],
      fillColor: spec.fillColor,
      accentColor: spec.accentColor,
      fontSize: spec.fontSize,
      fontWeight: spec.fontWeight,
      textAlign: spec.textAlign,
      textColor: spec.textColor,
    },
  }
  if (spec.style) node.style = spec.style
  if (type === 'text' && !node.style) {
    node.style = { width: spec.width ?? 320 }
  }
  nodes.push(node)
  return spec.id
}

function addEdge(source, target, label, color) {
  edgeSeq += 1
  edges.push({
    id: `e_${edgeSeq}`,
    source,
    target,
    data: {
      ...(label ? { label } : {}),
      ...(color ? { color } : {}),
    },
  })
}

/** Row-major: left→right, top→bottom. Optional lead note sits on top across columns. */
function layoutChildren(parentId, specs, opts = {}) {
  const padX = opts.padX ?? 20
  const padTop = opts.padTop ?? 46
  const gapX = opts.gapX ?? 16
  const gapY = opts.gapY ?? 14
  const body = specs.filter((s) => !s.lead)
  const leads = specs.filter((s) => s.lead)
  const cols = opts.cols ?? (body.length > 5 ? 2 : 1)
  const colW =
    opts.colW ??
    Math.max(268, ...body.map((s) => cardW(s.kind)), ...leads.map((s) => cardW(s.kind)), 0)
  const placed = []
  let y = padTop

  for (const lead of leads) {
    placed.push({ ...lead, parentId, position: { x: padX, y } })
    y += cardH(lead) + gapY
  }

  body.forEach((spec, index) => {
    const col = index % cols
    const row = Math.floor(index / cols)
    const rowSpecs = body.slice(row * cols, row * cols + cols)
    const rowH = Math.max(...rowSpecs.map((s) => cardH(s)))
    const rowY = y + row * (rowH + gapY)
    placed.push({
      ...spec,
      parentId,
      position: { x: padX + col * (colW + gapX), y: rowY },
    })
  })

  const rows = Math.ceil(body.length / cols)
  const bodyH =
    rows === 0
      ? 0
      : Array.from({ length: rows }, (_, row) => {
          const rowSpecs = body.slice(row * cols, row * cols + cols)
          return Math.max(...rowSpecs.map((s) => cardH(s)))
        }).reduce((sum, h, i) => sum + h + (i === 0 ? 0 : gapY), 0)
  const width = padX * 2 + cols * colW + (cols - 1) * gapX
  const height = y + bodyH + 20
  return { placed, width, height }
}

function addFrame(id, title, position, children, color, cols) {
  const { placed, width, height } = layoutChildren(id, children, { cols })
  addNode({
    id,
    kind: 'frame',
    title,
    position,
    accentColor: color,
    fillColor: `${color}14`,
    style: { width: Math.max(width, 320), height: Math.max(height, 220) },
  })
  for (const child of placed) addNode(child)
  return { id, width: Math.max(width, 320), height: Math.max(height, 220) }
}

const C = {
  blue: '#0071e3',
  purple: '#5e5ce6',
  brown: '#ac8e68',
  green: '#30d158',
  yellow: '#ffd60a',
  cyan: '#64d2ff',
  pink: '#ff375f',
  indigo: '#5856d6',
  orange: '#ff9f0a',
  red: '#ff453a',
  teal: '#32ade6',
  gray: '#8e8e93',
  violet: '#bf5af2',
}

const GUIDE_TEXT =
  'Внутреннее ТЗ разработчика «Арк ядро», v1, 15.09.2026. Заказчику не передаётся.\n' +
  'Читать слева направо, рамки 1→21. Жёлтый стикер в рамке — зачем раздел и связи. Клик по стикеру открывает «Заметки» справа.\n' +
  'Приоритет: функциональность — ТЗ заказчика (Арк_ядро.html, вкладка «ТЗ»); реализация — этот документ.\n' +
  'Карта: 1 границы · 2 архитектура · 3 среды · 4 роли · 5 ЖЦ · 6 отделы · 7 мосты · 8 БЗ · 9 таблицы · 10 доступ · 11 API · 12 UI · 13 бот · 14 коннекторы · 15 парсер · 16 скиллы · 17 лимиты · 18 инфра · 19 тесты · 20 вехи · 21 риски.\n' +
  'MVP: ТЗ заказчика, разделы 4–16. Не входит: 1С, МойСклад, amoCRM, Bitrix24, Payme, Click, IP-телефония, узбекский UI, локальная LLM, нативные мобильные.'

const sections = []

function section(id, title, color, children, cols) {
  sections.push({ id, title, color, children, cols })
}

const SECTION_NOTES = {
  f_ctx:
    'Границы продукта и этапов. Цикл: оценка → план → декомпозиция → выполнение → техпроверка → приём → доработка. MVP = ТЗ заказчика, разделы 4–16. Связь: этапы → среды (3) и вехи (20).',
  f_arch:
    'Клиенты → BFF (Node 20) → Core C++20 из Anton; Redis, Workers, PG+pgvector; Claude Sonnet 5 и DeepSeek V4 Flash. Берём supervisor, todo, оркестратор, kb, org.yaml, bff/web; удаляем mock и PixiJS. Связь: стек внутри; SPA → 12, бот → 13.',
  f_env:
    'local = docker compose + mock; prod = VPS + managed PG, .env.prod. Переход: полный цикл на реальных моделях для 4 отделов, RBAC, дашборд/орг/Todo/чат/бот/Mini App, бэкап, CI зелёный. Связь: инфра (18), маршрутизация как в 19, веха M8.',
  f_roles:
    'Восемь ролей, JSON fail-closed, 1 повтор, затем эскалация. confidence<0.6 → +1 уровень; simple+found=false → предложить задачу; out_of_scope → временный отдел; needs_clarification → чат. Связь: шаги ЖЦ (5), отделы (6).',
  f_lc:
    'queued → triage → (direct_answer → done) или planning → in_work → review → acceptance → awaiting_approval? → done. Rework назад; любой шаг → stopped|failed|escalated. max_rework=3, max_rounds=12, 120с×2, бюджет → approval. Durable-before-publish. Связь: роли (4), подтверждения (17).',
  f_dept:
    'config/org.yaml (sales: lead claude max1, executor deepseek max4, budget 150, idle 15). out_of_scope → DeptTemplateDraft → шаблон после done; похожий домен ≥0.8; promote в core. Idle → dormant + agent_despawned. Связь: bridges в мостах (7).',
  f_bridge:
    'bridge_request/response по bridges; совместные блоки с deps; ACL БЗ; контур 24/7: маркетинг → заявка → сделка → продажи. UI анимирует по bridge_*. Связь: отделы (6), БЗ (8), граф (12).',
  f_kb:
    'Узлы topic/doc/lesson; рёбра in_topic/relates/fixes/supersedes/derived_from. +embedding vector(1024) HNSW, fts GIN, department_id/acl. Hybrid RRF → ACL → до 8 фрагментов. API GET /kb/graph, /kb/nodes/:id, /kb/search. Связь: таблицы (9), REST KB (11).',
  f_db:
    'Все таблицы PG: users…audit_log. Миграции node-pg-migrate. Core пишет только свои таблицы. Связь: kb_nodes/edges/requests из БЗ (8).',
  f_sec:
    'admin → owner → employee; argon2id; cookie httpOnly 12ч в Redis; TOTP admin/owner; RBAC на каждый REST/WS; audit_log; Telegram /start; Mini App HMAC initData ≤1ч; rate 5/15 мин. Связь: API (11), бот (13).',
  f_api:
    'REST: Auth, Users, Tasks, Todo/schedules/templates, Approvals, Org, KB, Clients, Chat+SSE+STT, Services/Skills, Dashboard. WS /stream. Durable vs ephemeral события. Связь: экраны (12), статусы ЖЦ (5).',
  f_fe:
    'Экраны от входа до настроек. Граф Canvas 2D force-layout 60fps при ≤200, пульсы, prefers-reduced-motion. Чат SSE + голос. Темы Авто/Светлая/Тёмная. Mini App ?tg=1. Связь: API (11), бот (13).',
  f_bot:
    '/start код, /app, /status, /tasks; текст/голос; inline подтвердить/отклонить; intent через триаж. Связь: Первичная оценка (4), HMAC (10).',
  f_int:
    'ServiceConnector {id, kind default|custom, auth oauth2|api_key|webhook, health, actions}. Telegram, Google, WhatsApp, Meta, Serper/Brave, STT. Секреты AES-GCM. Связь: парсер (15), STT → чат/бот.',
  f_par:
    'BullMQ: поиск → загрузка → текст → дедуп → суммаризация → kb_requests. robots.txt, 1 rps/домен, защита от prompt injection. Связь: БЗ (8), коннекторы (14).',
  f_sk:
    'Поля: name/description/departments/instructions/tools/examples. skill_versions: review → active. Подбор top-3 по эмбеддингу. Связь: эмбеддинги парсера (15).',
  f_appr:
    'approvals.yaml, пауза шага. Стек: Budgeted → RateLimited → CircuitBroken → Retrying → Throttled. model_usage. Fallback Claude → DeepSeek V4 Pro + событие model_fallback. Связь: awaiting_approval (5).',
  f_infra:
    'compose: caddy, web, backend, core, workers, embeddings, redis, postgres. TLS Cloudflare+Caddy, .env.prod 600, pg_dump 14 дней R2/B2, JSON logs, Sentry/Grafana/UptimeRobot, GHA SSH, TZ Asia/Tashkent. Связь: среды (3).',
  f_test:
    'Unit ctest/Vitest, контракты Zod, интеграция docker, E2E Playwright, оценка ≥30 задач ≥85%, безопасность RBAC + injection. Связь: критерии перехода в среды (3).',
  f_ms:
    'M0 репо/CI → M1 Core → M2 отделы/мосты → M3 БД/БЗ → M4 Backend → M5 Web → M6 Telegram → M7 парсер/коннекторы/скиллы → M8 прод-критерии → M9 деплой/тестовый месяц → M10 отчёт этап 2. Связь: слои 2, 6–8, 12–16 и этапы (1).',
  f_risk:
    'Объём vs $3000; KbStore SQLite→PG; DeepSeek uz; одобрения WhatsApp/Meta; цена WA в РУз; нужны ли Закупки/Склад/Логистика; учётка 1С/МойСклад/Excel. Связь: «не входит» (1), перенос БЗ (2, 8).',
}

function childrenWithNote(s) {
  const note = SECTION_NOTES[s.id]
  if (!note) return s.children
  return [
    {
      id: `n_note_${s.id}`,
      kind: 'note',
      title: `Заметка: ${s.title}`,
      description: note,
      lead: true,
    },
    ...s.children,
  ]
}

// 1. Контекст
section(
  'f_ctx',
  '1. Контекст и границы',
  C.blue,
  [
    {
      id: 'n_ctx_product',
      kind: 'entry',
      title: 'Продукт',
      subtitle: 'Мультиагентная платформа',
      items: ['Опт · Ташкент', 'Задача на верхнем уровне', 'Дальше цикл агентов'],
      status: 'doing',
    },
    {
      id: 'n_ctx_cycle',
      kind: 'job',
      title: 'Цикл агентов',
      subtitle: 'Сквозной конвейер',
      items: ['оценка → планирование', 'декомпозиция → выполнение', 'техпроверка → приём', 'доработка'],
      status: 'doing',
    },
    {
      id: 'n_ctx_dev',
      kind: 'env',
      title: 'Разработка',
      subtitle: 'local docker compose',
      items: ['API моделей', 'Локальный контур'],
    },
    {
      id: 'n_ctx_s1',
      kind: 'env',
      title: 'Этап 1 — тестовый месяц',
      subtitle: 'VPS + управляемая PostgreSQL',
      items: ['Claude + DeepSeek'],
    },
    {
      id: 'n_ctx_s2',
      kind: 'env',
      title: 'Этап 2 — выбор архитектуры',
      subtitle: 'Без переписывания',
      items: ['облако РУз', 'свой сервер', 'локальная LLM'],
    },
    {
      id: 'n_ctx_s3',
      kind: 'env',
      title: 'Этап 3 — релиз',
      subtitle: 'Сопровождение',
    },
    {
      id: 'n_ctx_mvp',
      kind: 'module',
      title: 'Входит в MVP',
      subtitle: 'ТЗ заказчика, разделы 4–16',
      items: ['Всё из ТЗ заказчика 4–16'],
      status: 'doing',
    },
    {
      id: 'n_ctx_out',
      kind: 'note',
      title: 'Не входит',
      description: '1С, МойСклад, amoCRM, Bitrix24, Payme, Click, IP-телефония; узбекский язык UI; локальная LLM; нативные мобильные приложения.',
      status: 'broken',
    },
  ],
  2,
)

// 2. Архитектура
section(
  'f_arch',
  '2. Архитектура',
  C.purple,
  [
    {
      id: 'n_arch_spa',
      kind: 'entry',
      title: 'Web SPA',
      subtitle: 'React',
      items: ['HTTPS / WSS'],
      status: 'doing',
    },
    {
      id: 'n_arch_mini',
      kind: 'entry',
      title: 'Telegram Mini App',
      subtitle: '?tg=1',
      items: ['HMAC initData'],
    },
    {
      id: 'n_arch_bot',
      kind: 'entry',
      title: 'Telegram Bot',
      subtitle: 'telegraf',
      items: ['текст / голос', 'inline-кнопки'],
    },
    {
      id: 'n_arch_bff',
      kind: 'service',
      title: 'Backend BFF',
      subtitle: 'Node 20 + TypeScript',
      items: ['auth · RBAC · API', 'бот · STT · cron', 'интеграции'],
      status: 'doing',
    },
    {
      id: 'n_arch_core',
      kind: 'service',
      title: 'Core C++20',
      subtitle: 'из Anton · оркестрация',
      items: ['REST / WS + events', 'пишет только свои таблицы'],
      status: 'doing',
    },
    {
      id: 'n_arch_redis',
      kind: 'cache',
      title: 'Redis 7',
      subtitle: 'очереди BullMQ',
      items: ['сессии cookie 12ч'],
    },
    {
      id: 'n_arch_workers',
      kind: 'queue',
      title: 'Workers',
      subtitle: 'BullMQ',
      items: ['парсер', 'эмбеддинги'],
    },
    {
      id: 'n_arch_pg',
      kind: 'store',
      title: 'PostgreSQL 16',
      subtitle: 'pgvector',
      items: ['BFF → PG', 'Core → PG'],
      status: 'doing',
    },
    {
      id: 'n_arch_claude',
      kind: 'model',
      title: 'Claude Sonnet 5',
      subtitle: 'Anthropic',
      items: ['Оркестратор', 'Планировщик', 'Рук. отдела', 'Ревьюер · Акцептор'],
    },
    {
      id: 'n_arch_ds',
      kind: 'model',
      title: 'DeepSeek V4 Flash',
      subtitle: 'триаж / исполнитель / базовый ИИ',
      items: ['Первичная оценка', 'Базовый ИИ', 'Исполнитель'],
    },
    {
      id: 'n_anton_take',
      kind: 'file',
      title: 'Из Anton — берём',
      subtitle: 'github.com/just05me/anton',
      items: ['supervisor / scheduler', 'teamcore/todo · dispatcher', 'orchestrator + гейт', 'providers · bus · kb', 'org.yaml · bff · web admin'],
      status: 'done',
    },
    {
      id: 'n_anton_drop',
      kind: 'note',
      title: 'Из Anton — удаляем',
      description: 'web/src/data/* · PixiJS офис · server/ mock. claude_code не в проде. kb: SQLite → PG+pgvector. sqlite_store только для тестов + PgStore.',
      status: 'broken',
    },
    {
      id: 'n_stack_core',
      kind: 'tool',
      title: 'Стек · Core',
      subtitle: 'C++20 CMake + vcpkg',
      items: ['REST + WS', 'libpqxx'],
    },
    {
      id: 'n_stack_be',
      kind: 'tool',
      title: 'Стек · Backend',
      subtitle: 'Node 20 · TS · Express',
      items: ['Zod', 'telegraf', 'BullMQ'],
    },
    {
      id: 'n_stack_fe',
      kind: 'tool',
      title: 'Стек · Frontend',
      subtitle: 'React 18 · Vite · TS',
      items: ['Canvas 2D'],
    },
    {
      id: 'n_stack_data',
      kind: 'tool',
      title: 'Стек · данные / ML',
      subtitle: 'PG16 · Redis7',
      items: ['pgvector · tsvector', 'bge-m3 CPU/облако', 'Yandex SpeechKit + Whisper'],
    },
    {
      id: 'n_stack_ops',
      kind: 'tool',
      title: 'Стек · ops',
      subtitle: 'Caddy LE · Compose · GHA',
      items: ['Cloudflare DNS'],
    },
  ],
  3,
)

// 3. Среды
section(
  'f_env',
  '3. Среды',
  C.brown,
  [
    {
      id: 'n_env_local',
      kind: 'env',
      title: 'local',
      subtitle: 'docker compose + mock',
      items: ['.env локально'],
    },
    {
      id: 'n_env_prod',
      kind: 'env',
      title: 'prod',
      subtitle: 'VPS + managed PG',
      items: ['.env.prod', 'права 600'],
    },
    {
      id: 'n_env_go',
      kind: 'decision',
      title: 'Критерии перехода',
      subtitle: 'local → prod',
    },
    {
      id: 'n_env_cycle',
      kind: 'job',
      title: 'Полный цикл',
      subtitle: 'реальные модели · 4 отдела',
    },
    {
      id: 'n_env_route',
      kind: 'module',
      title: 'Маршрутизация',
      subtitle: 'раздел 19 / роли',
    },
    {
      id: 'n_env_rbac',
      kind: 'auth',
      title: 'RBAC готов',
      subtitle: 'admin → owner → employee',
    },
    {
      id: 'n_env_ui',
      kind: 'entry',
      title: 'Поверхности живы',
      items: ['дашборд / орг / Todo', 'чат / бот / Mini App'],
    },
    {
      id: 'n_env_ops',
      kind: 'file',
      title: 'Операции',
      items: ['бэкап локально', 'CI зелёный'],
    },
  ],
  2,
)

// 4. Роли
section(
  'f_roles',
  '4. Роли агентов',
  C.green,
  [
    {
      id: 'n_role_valid',
      kind: 'comment',
      title: 'Контракты JSON',
      description: 'Валидация fail-closed. 1 повтор, затем эскалация.',
      status: 'doing',
    },
    {
      id: 'n_role_triage',
      kind: 'agent',
      title: 'Первичная оценка',
      subtitle: 'DeepSeek V4 Flash → TriageResult',
      items: ['level: simple|medium|complex|out_of_scope', 'departments', 'confidence 0..1', 'reason', 'needs_clarification?'],
    },
    {
      id: 'n_role_base',
      kind: 'agent',
      title: 'Базовый ИИ',
      subtitle: 'DeepSeek → DirectAnswer',
      items: ['answer', 'sources', 'found', 'suggest_task?'],
    },
    {
      id: 'n_role_orch',
      kind: 'agent',
      title: 'Оркестратор',
      subtitle: 'Claude Sonnet 5',
      items: ['ведёт цикл', 'стоп-условия'],
    },
    {
      id: 'n_role_plan',
      kind: 'agent',
      title: 'Планировщик',
      subtitle: 'Claude → Plan',
      items: ['blocks[{id,department,title}]', 'description · deps', 'acceptance_criteria'],
    },
    {
      id: 'n_role_lead',
      kind: 'agent',
      title: 'Руководитель отдела',
      subtitle: 'Claude',
      items: ['подзадачи на борд'],
    },
    {
      id: 'n_role_exec',
      kind: 'agent',
      title: 'Исполнитель',
      subtitle: 'DeepSeek → WorkResult',
      items: ['status done|blocked', 'artifact', 'used_sources', 'blockers?'],
    },
    {
      id: 'n_role_rev',
      kind: 'agent',
      title: 'Ревьюер',
      subtitle: 'Claude → ReviewVerdict',
      items: ['pass | rework', 'issues'],
    },
    {
      id: 'n_role_acc',
      kind: 'agent',
      title: 'Акцептор',
      subtitle: 'Claude → AcceptanceVerdict',
      items: ['accept | rework | escalate', 'unmet_requirements', 'comment'],
    },
    {
      id: 'n_role_r1',
      kind: 'decision',
      title: 'confidence < 0.6',
      subtitle: '+1 уровень',
    },
    {
      id: 'n_role_r2',
      kind: 'decision',
      title: 'simple + found=false',
      subtitle: 'предложить задачу',
    },
    {
      id: 'n_role_r3',
      kind: 'decision',
      title: 'out_of_scope',
      subtitle: 'временный отдел',
    },
    {
      id: 'n_role_r4',
      kind: 'decision',
      title: 'needs_clarification',
      subtitle: 'вопрос в чат',
    },
  ],
  2,
)

// 5. ЖЦ
section(
  'f_lc',
  '5. Жизненный цикл задачи',
  C.yellow,
  [
    {
      id: 'n_lc_flow',
      kind: 'job',
      title: 'Основной поток',
      subtitle: 'queued → … → done',
      items: ['queued → triage', 'direct_answer → done', 'или planning → in_work', 'review → acceptance', 'awaiting_approval? → done'],
      status: 'doing',
    },
    {
      id: 'n_lc_rework',
      kind: 'event',
      title: 'Rework',
      subtitle: 'обратно по циклу',
      items: ['с issues', 'max_rework_cycles = 3'],
    },
    {
      id: 'n_lc_stop',
      kind: 'event',
      title: 'С любого шага',
      items: ['stopped', 'failed', 'escalated'],
      status: 'broken',
    },
    {
      id: 'n_lc_limits',
      kind: 'env',
      title: 'Лимиты цикла',
      items: ['max_rounds = 12', 'таймаут 120с ×2 backoff', 'стоп Anton', 'бюджет → awaiting_approval'],
    },
    {
      id: 'n_lc_durable',
      kind: 'module',
      title: 'Durable-before-publish',
      subtitle: 'сначала запись, потом событие',
      items: ['recovery fold', 'rework с issues'],
      status: 'doing',
    },
    {
      id: 'n_lc_approval',
      kind: 'auth',
      title: 'awaiting_approval',
      subtitle: 'бюджет / стоп',
    },
  ],
  2,
)

// 6. Отделы
section(
  'f_dept',
  '6. Отделы',
  C.cyan,
  [
    {
      id: 'n_dept_yaml',
      kind: 'file',
      title: 'config/org.yaml',
      subtitle: 'sales — пример',
      items: ['core', 'lead claude max1', 'executor deepseek max4', 'skills · bridges', 'budget 150 · idle 15'],
    },
    {
      id: 'n_dept_tmp',
      kind: 'module',
      title: 'Временные отделы',
      subtitle: 'out_of_scope',
      items: ['DeptTemplateDraft', 'TeamCore', 'после done → dept_templates', 'событие dept_template_saved'],
    },
    {
      id: 'n_dept_sim',
      kind: 'decision',
      title: 'Похожий домен',
      subtitle: 'эмбеддинг ≥ 0.8',
    },
    {
      id: 'n_dept_promo',
      kind: 'person',
      title: 'Promote в core',
      subtitle: 'admin / owner',
    },
    {
      id: 'n_dept_idle',
      kind: 'event',
      title: 'Расформирование',
      subtitle: 'агенты runtime',
      items: ['idle_despawn_minutes', 'dormant + agent_despawned', 'новая задача → agent_spawned'],
    },
  ],
  2,
)

// 7. Мосты
section(
  'f_bridge',
  '7. Мосты',
  C.pink,
  [
    {
      id: 'n_br_req',
      kind: 'event',
      title: 'Запрос данных',
      subtitle: 'bridge_request / response',
      items: ['по bridges из org.yaml'],
    },
    {
      id: 'n_br_joint',
      kind: 'job',
      title: 'Совместная задача',
      subtitle: 'блоки с deps',
    },
    {
      id: 'n_br_acl',
      kind: 'auth',
      title: 'ACL базы знаний',
      subtitle: 'доступ по мостам',
    },
    {
      id: 'n_br_247',
      kind: 'module',
      title: 'Контур продаж 24/7',
      items: ['маркетинг → заявка', 'сделка → продажи'],
      status: 'doing',
    },
    {
      id: 'n_br_ui',
      kind: 'entry',
      title: 'UI анимация',
      subtitle: 'по событиям bridge_*',
    },
  ],
  2,
)

// 8. БЗ
section(
  'f_kb',
  '8. База знаний',
  C.indigo,
  [
    {
      id: 'n_kb_nodes',
      kind: 'store',
      title: 'Узлы Anton',
      items: ['topic', 'doc', 'lesson'],
    },
    {
      id: 'n_kb_edges',
      kind: 'module',
      title: 'Рёбра',
      items: ['in_topic', 'relates', 'fixes', 'supersedes', 'derived_from'],
    },
    {
      id: 'n_kb_meta',
      kind: 'file',
      title: 'Мета Anton',
      items: ['librarian', 'kb_requests', 'confidence / uses', 'retrieved_count', 'retract_flags'],
    },
    {
      id: 'n_kb_vec',
      kind: 'store',
      title: 'embedding vector(1024)',
      subtitle: 'HNSW',
    },
    {
      id: 'n_kb_fts',
      kind: 'store',
      title: 'fts tsvector',
      subtitle: 'GIN',
    },
    {
      id: 'n_kb_acl',
      kind: 'auth',
      title: 'Поля доступа',
      items: ['department_id', 'acl', 'entity + fields jsonb', 'root'],
    },
    {
      id: 'n_kb_search',
      kind: 'tool',
      title: 'Hybrid search',
      subtitle: 'RRF → ACL → до 8 фрагментов',
    },
    {
      id: 'n_kb_api',
      kind: 'api',
      title: 'API БЗ',
      items: ['GET /kb/graph', 'GET /kb/nodes/:id', 'GET /kb/search'],
    },
  ],
  2,
)

// 9. Модель данных
const TABLES = [
  'users',
  'permissions',
  'departments',
  'dept_templates',
  'tasks',
  'task_steps',
  'todo_items',
  'schedules',
  'task_templates',
  'approvals',
  'clients',
  'deals',
  'funnel_stages',
  'kb_nodes',
  'kb_edges',
  'kb_requests',
  'skills',
  'skill_versions',
  'services',
  'model_usage',
  'chat_sessions',
  'chat_messages',
  'event_log',
  'audit_log',
]
section(
  'f_db',
  '9. Модель данных',
  C.yellow,
  [
    {
      id: 'n_db_mig',
      kind: 'tool',
      title: 'Миграции',
      subtitle: 'node-pg-migrate',
    },
    {
      id: 'n_db_core',
      kind: 'comment',
      title: 'Граница Core',
      description: 'Core пишет только свои таблицы.',
    },
    ...TABLES.map((name) => ({
      id: `n_db_${name}`,
      kind: 'store',
      title: name,
      subtitle: 'PostgreSQL 16',
    })),
  ],
  3,
)

// 10. Безопасность
section(
  'f_sec',
  '10. Доступ и безопасность',
  C.orange,
  [
    {
      id: 'n_sec_rbac',
      kind: 'auth',
      title: 'RBAC',
      subtitle: 'admin → owner → employee',
      items: ['на каждый REST / WS'],
      status: 'doing',
    },
    {
      id: 'n_sec_pwd',
      kind: 'auth',
      title: 'Пароли',
      items: ['argon2id', 'must_change_password'],
    },
    {
      id: 'n_sec_sess',
      kind: 'cache',
      title: 'Сессия',
      subtitle: 'cookie httpOnly 12ч',
      items: ['хранилище Redis'],
    },
    {
      id: 'n_sec_totp',
      kind: 'auth',
      title: 'TOTP',
      subtitle: 'admin / owner',
    },
    {
      id: 'n_sec_audit',
      kind: 'file',
      title: 'audit_log',
      subtitle: 'все чувствительные действия',
    },
    {
      id: 'n_sec_tg',
      kind: 'webhook',
      title: 'Telegram /start',
      subtitle: 'код привязки',
    },
    {
      id: 'n_sec_mini',
      kind: 'auth',
      title: 'Mini App HMAC',
      subtitle: 'initData ≤ 1ч',
    },
    {
      id: 'n_sec_rate',
      kind: 'env',
      title: 'Rate limit',
      subtitle: '5 / 15 мин',
    },
  ],
  2,
)

// 11. API
section(
  'f_api',
  '11. API',
  C.indigo,
  [
    {
      id: 'n_api_rest',
      kind: 'api',
      title: 'REST-группы',
      items: ['Auth · Users · Tasks', 'Todo / schedules / templates', 'Approvals · Org · KB', 'Clients · Chat+SSE+STT', 'Services / Skills', 'Dashboard'],
      status: 'doing',
    },
    {
      id: 'n_api_ws',
      kind: 'api',
      title: 'WS /stream',
      subtitle: 'живой поток',
    },
    {
      id: 'n_api_dur',
      kind: 'event',
      title: 'Durable events',
      items: ['task_triaged · plan_created', 'review_verdict · acceptance_verdict', 'rework_requested · task_escalated', 'approval_requested / decided', 'dept_* · bridge_* · direct_answer'],
    },
    {
      id: 'n_api_eph',
      kind: 'event',
      title: 'Ephemeral events',
      items: ['agent_step', 'agent_tokens_updated', 'provider_call_*', 'model_fallback', 'service_status'],
    },
  ],
  2,
)

// 12. Frontend
section(
  'f_fe',
  '12. Frontend',
  C.blue,
  [
    {
      id: 'n_fe_screens',
      kind: 'entry',
      title: 'Экраны',
      items: ['вход · дашборд · орг', 'процессы · Todo · подтверждения', 'клиенты / воронка · БЗ', 'скиллы · сервисы · модели/расходы', 'журнал · пользователи · настройки'],
      status: 'doing',
    },
    {
      id: 'n_fe_graph',
      kind: 'module',
      title: 'Граф Canvas 2D',
      subtitle: 'force-layout',
      items: ['60 fps при ≤ 200 узлов', 'пульсы', 'prefers-reduced-motion'],
    },
    {
      id: 'n_fe_chat',
      kind: 'entry',
      title: 'Чат',
      items: ['SSE', 'голос'],
    },
    {
      id: 'n_fe_theme',
      kind: 'env',
      title: 'Темы',
      items: ['Авто', 'Светлая', 'Тёмная'],
    },
    {
      id: 'n_fe_mini',
      kind: 'entry',
      title: 'Mini App',
      subtitle: '?tg=1',
    },
  ],
  2,
)

// 13. Бот
section(
  'f_bot',
  '13. Telegram-бот',
  C.teal,
  [
    {
      id: 'n_bot_start',
      kind: 'webhook',
      title: '/start',
      subtitle: 'код привязки',
    },
    { id: 'n_bot_app', kind: 'entry', title: '/app', subtitle: 'открыть Mini App' },
    { id: 'n_bot_status', kind: 'api', title: '/status', subtitle: 'состояние' },
    { id: 'n_bot_tasks', kind: 'api', title: '/tasks', subtitle: 'список задач' },
    {
      id: 'n_bot_io',
      kind: 'entry',
      title: 'Текст / голос',
      subtitle: 'STT → триаж',
    },
    {
      id: 'n_bot_inline',
      kind: 'job',
      title: 'Inline',
      items: ['подтвердить', 'отклонить'],
    },
    {
      id: 'n_bot_intent',
      kind: 'agent',
      title: 'Intent',
      subtitle: 'через триаж',
    },
  ],
  2,
)

// 14. Интеграции
section(
  'f_int',
  '14. Интеграции / ServiceConnector',
  C.red,
  [
    {
      id: 'n_int_sc',
      kind: 'module',
      title: 'ServiceConnector',
      items: ['id', 'kind default|custom', 'auth oauth2|api_key|webhook', 'health', 'actions'],
    },
    { id: 'n_int_tg', kind: 'external', title: 'Telegram' },
    { id: 'n_int_g', kind: 'external', title: 'Google' },
    { id: 'n_int_wa', kind: 'external', title: 'WhatsApp' },
    { id: 'n_int_meta', kind: 'external', title: 'Meta' },
    { id: 'n_int_search', kind: 'external', title: 'Serper / Brave' },
    { id: 'n_int_stt', kind: 'external', title: 'STT', subtitle: 'SpeechKit + Whisper' },
    {
      id: 'n_int_sec',
      kind: 'auth',
      title: 'Секреты',
      subtitle: 'AES-GCM',
    },
  ],
  2,
)

// 15. Парсер
section(
  'f_par',
  '15. Парсер',
  C.green,
  [
    {
      id: 'n_par_q',
      kind: 'queue',
      title: 'BullMQ pipeline',
      items: ['поиск', 'загрузка', 'текст', 'дедуп', 'суммаризация → kb_requests'],
      status: 'doing',
    },
    { id: 'n_par_robots', kind: 'file', title: 'robots.txt', subtitle: 'соблюдаем' },
    { id: 'n_par_rps', kind: 'env', title: '1 rps / домен', subtitle: 'вежливый обход' },
    {
      id: 'n_par_inj',
      kind: 'auth',
      title: 'Защита',
      subtitle: 'prompt injection',
      status: 'doing',
    },
  ],
  2,
)

// 16. Скиллы
section(
  'f_sk',
  '16. Скиллы',
  C.orange,
  [
    {
      id: 'n_sk_fields',
      kind: 'file',
      title: 'Поля скилла',
      items: ['name / description', 'departments', 'instructions', 'tools', 'examples'],
    },
    {
      id: 'n_sk_ver',
      kind: 'file',
      title: 'skill_versions',
      subtitle: 'review → active',
    },
    {
      id: 'n_sk_pick',
      kind: 'tool',
      title: 'Подбор',
      subtitle: 'top-3 по эмбеддингу',
    },
  ],
  1,
)

// 17. Подтверждения
section(
  'f_appr',
  '17. Подтверждения, лимиты, расходы',
  C.yellow,
  [
    { id: 'n_ap_yaml', kind: 'file', title: 'approvals.yaml', subtitle: 'правила паузы' },
    { id: 'n_ap_pause', kind: 'job', title: 'Пауза шага', subtitle: 'ждём решение' },
    {
      id: 'n_ap_stack',
      kind: 'module',
      title: 'Provider stack',
      items: ['Budgeted', 'RateLimited', 'CircuitBroken', 'Retrying', 'Throttled'],
    },
    { id: 'n_ap_usage', kind: 'store', title: 'model_usage', subtitle: 'учёт токенов / $' },
    {
      id: 'n_ap_fb',
      kind: 'event',
      title: 'Fallback',
      subtitle: 'Claude → DeepSeek V4 Pro',
      items: ['событие model_fallback'],
    },
  ],
  2,
)

// 18. Инфраструктура
section(
  'f_infra',
  '18. Инфраструктура',
  C.gray,
  [
    {
      id: 'n_inf_compose',
      kind: 'service',
      title: 'compose (local)',
      items: ['caddy · web · backend', 'core · workers · embeddings', 'redis · postgres'],
    },
    { id: 'n_inf_tls', kind: 'auth', title: 'TLS', subtitle: 'Cloudflare + Caddy' },
    { id: 'n_inf_env', kind: 'env', title: '.env.prod', subtitle: 'права 600' },
    {
      id: 'n_inf_bak',
      kind: 'store',
      title: 'Бэкапы',
      subtitle: 'pg_dump 14 дней',
      items: ['R2 / B2'],
    },
    { id: 'n_inf_logs', kind: 'file', title: 'JSON logs' },
    { id: 'n_inf_obs', kind: 'tool', title: 'Наблюдение', items: ['Sentry', 'Grafana', 'UptimeRobot'] },
    { id: 'n_inf_ci', kind: 'tool', title: 'GHA deploy', subtitle: 'SSH' },
    { id: 'n_inf_tz', kind: 'env', title: 'TZ', subtitle: 'Asia/Tashkent' },
  ],
  2,
)

// 19. Тестирование
section(
  'f_test',
  '19. Тестирование',
  C.teal,
  [
    { id: 'n_t_unit', kind: 'test', title: 'Unit', items: ['ctest', 'Vitest'] },
    { id: 'n_t_zod', kind: 'test', title: 'Контракты', subtitle: 'Zod fail-closed' },
    { id: 'n_t_int', kind: 'test', title: 'Интеграция', subtitle: 'docker' },
    { id: 'n_t_e2e', kind: 'test', title: 'E2E', subtitle: 'Playwright' },
    {
      id: 'n_t_eval',
      kind: 'test',
      title: 'Оценка агентов',
      items: ['≥ 30 задач', '≥ 85%'],
    },
    {
      id: 'n_t_sec',
      kind: 'test',
      title: 'Безопасность',
      items: ['RBAC', 'injection'],
    },
  ],
  2,
)

// 20. Вехи
section(
  'f_ms',
  '20. Вехи M0–M10',
  C.violet,
  [
    { id: 'n_m0', kind: 'job', title: 'M0', subtitle: 'репо / CI' },
    { id: 'n_m1', kind: 'job', title: 'M1', subtitle: 'Core: оценка / план / гейт / PgStore' },
    { id: 'n_m2', kind: 'job', title: 'M2', subtitle: 'временные отделы / мосты' },
    { id: 'n_m3', kind: 'job', title: 'M3', subtitle: 'БД / БЗ / бэкапы' },
    { id: 'n_m4', kind: 'job', title: 'M4', subtitle: 'Backend auth / RBAC / задачи' },
    { id: 'n_m5', kind: 'job', title: 'M5', subtitle: 'Web' },
    { id: 'n_m6', kind: 'job', title: 'M6', subtitle: 'Telegram' },
    { id: 'n_m7', kind: 'job', title: 'M7', subtitle: 'парсер / коннекторы / скиллы' },
    { id: 'n_m8', kind: 'job', title: 'M8', subtitle: 'прод-критерии + демо' },
    { id: 'n_m9', kind: 'job', title: 'M9', subtitle: 'деплой + тестовый месяц' },
    { id: 'n_m10', kind: 'job', title: 'M10', subtitle: 'отчёт этап 2' },
  ],
  2,
)

// 21. Риски
section(
  'f_risk',
  '21. Риски и открытые вопросы',
  C.red,
  [
    { id: 'n_rk_vol', kind: 'note', title: 'Объём vs $3000', description: 'Риск расползания скоупа относительно бюджета.' },
    { id: 'n_rk_kb', kind: 'note', title: 'KbStore SQLite → PG', description: 'Перенос логики БЗ Anton на PostgreSQL + pgvector.' },
    { id: 'n_rk_uz', kind: 'note', title: 'DeepSeek uz', description: 'Качество узбекского у DeepSeek — открытый вопрос.' },
    { id: 'n_rk_meta', kind: 'note', title: 'WhatsApp / Meta', description: 'Нужны одобрения платформ.' },
    { id: 'n_rk_wa', kind: 'note', title: 'Цена WA в РУз', description: 'Стоимость WhatsApp в Узбекистане неясна.' },
    {
      id: 'n_rk_depts',
      kind: 'note',
      title: 'Нужны ли отделы?',
      description: 'Закупки / Склад / Логистика — открытый вопрос.',
    },
    {
      id: 'n_rk_acc',
      kind: 'note',
      title: 'Учётка',
      description: '1С / МойСклад / Excel — не в MVP, но вопрос учёта остаётся.',
    },
  ],
  2,
)

const GRID_COLS = 4
const COL_GAP = 88
const ROW_GAP = 88
const ORIGIN_X = 80
const ORIGIN_Y = 40

const measured = sections.map((s) => {
  const kids = childrenWithNote(s)
  const { width, height } = layoutChildren('tmp', kids, { cols: s.cols })
  return { ...s, children: kids, width: Math.max(width, 320), height: Math.max(height, 220) }
})

const colWidths = Array.from({ length: GRID_COLS }, (_, c) =>
  Math.max(...measured.filter((_, i) => i % GRID_COLS === c).map((s) => s.width), 320),
)
const rowCount = Math.ceil(measured.length / GRID_COLS)
const rowHeights = Array.from({ length: rowCount }, (_, r) =>
  Math.max(
    ...measured.filter((_, i) => Math.floor(i / GRID_COLS) === r).map((s) => s.height),
    220,
  ),
)

const colX = []
{
  let x = ORIGIN_X
  for (let c = 0; c < GRID_COLS; c += 1) {
    colX[c] = x
    x += colWidths[c] + COL_GAP
  }
}

const guideKids = [
  {
    id: 'n_root',
    kind: 'text',
    title: 'Арк ядро — внутреннее ТЗ разработчика v1',
    fontSize: 28,
    fontWeight: 700,
    textAlign: 'left',
    width: 560,
    style: { width: 560 },
    lead: true,
  },
  {
    id: 'n_guide',
    kind: 'note',
    title: 'Как читать схему',
    description: GUIDE_TEXT,
    lead: true,
  },
  {
    id: 'n_root_product',
    kind: 'entry',
    title: 'Продукт',
    subtitle: 'Оптовая компания · Ташкент',
    description: 'Мультиагентная платформа. Задача ставится на верхнем уровне, дальше агенты проходят цикл.',
    items: ['оценка → планирование', 'декомпозиция → выполнение', 'техпроверка → приём → доработка'],
    status: 'doing',
  },
]
const guideLayout = layoutChildren('f_guide', guideKids, { cols: 2, colW: 280 })
const gridWidth = colX[GRID_COLS - 1] + colWidths[GRID_COLS - 1] - ORIGIN_X
const guideW = Math.max(guideLayout.width, gridWidth)
const guideH = Math.max(guideLayout.height, 280)

addFrame(
  'f_guide',
  'Точка входа',
  { x: ORIGIN_X, y: ORIGIN_Y },
  guideKids,
  C.blue,
  2,
)
{
  const guideNode = nodes.find((n) => n.id === 'f_guide')
  if (guideNode) {
    guideNode.style = { ...guideNode.style, width: guideW, height: guideH }
  }
}

const rowY = []
{
  let y = ORIGIN_Y + guideH + ROW_GAP
  for (let r = 0; r < rowCount; r += 1) {
    rowY[r] = y
    y += rowHeights[r] + ROW_GAP
  }
}

for (let i = 0; i < measured.length; i += 1) {
  const s = measured[i]
  const col = i % GRID_COLS
  const row = Math.floor(i / GRID_COLS)
  addFrame(s.id, s.title, { x: colX[col], y: rowY[row] }, s.children, s.color, s.cols)
}

// Root → sections
const ROOT_LINKS = [
  ['f_ctx', 'границы'],
  ['f_arch', 'как устроено'],
  ['f_env', 'где крутится'],
  ['f_roles', 'кто делает'],
  ['f_lc', 'как идёт задача'],
  ['f_dept', 'оргструктура'],
  ['f_bridge', 'связки'],
  ['f_kb', 'память'],
  ['f_db', 'таблицы'],
  ['f_sec', 'доступ'],
  ['f_api', 'контракты'],
  ['f_fe', 'экраны'],
  ['f_bot', 'мессенджер'],
  ['f_int', 'внешний мир'],
  ['f_par', 'сбор данных'],
  ['f_sk', 'навыки'],
  ['f_appr', 'деньги и паузы'],
  ['f_infra', 'прод'],
  ['f_test', 'качество'],
  ['f_ms', 'план'],
  ['f_risk', 'неясно'],
]
for (const [target, label] of ROOT_LINKS) addEdge('n_root', target, label, C.gray)

addEdge('n_guide', 'f_ctx', 'начать с границ', C.blue)
addEdge('n_root', 'n_root_product', 'о чём', C.blue)
addEdge('n_root_product', 'f_ctx', 'детали', C.blue)

// Intra-architecture
addEdge('n_arch_spa', 'n_arch_bff', 'HTTPS/WSS', C.purple)
addEdge('n_arch_mini', 'n_arch_bff', 'HTTPS/WSS', C.purple)
addEdge('n_arch_bot', 'n_arch_bff', 'HTTPS/WSS', C.purple)
addEdge('n_arch_bff', 'n_arch_core', 'REST/WS + events', C.purple)
addEdge('n_arch_bff', 'n_arch_redis', 'очереди', C.purple)
addEdge('n_arch_redis', 'n_arch_workers', 'BullMQ', C.green)
addEdge('n_arch_workers', 'n_arch_pg', 'эмбеддинги / парсер', C.yellow)
addEdge('n_arch_bff', 'n_arch_pg', 'данные', C.yellow)
addEdge('n_arch_core', 'n_arch_pg', 'свои таблицы', C.yellow)
addEdge('n_arch_core', 'n_arch_claude', 'оркестрация', C.green)
addEdge('n_arch_bff', 'n_stack_be', 'слой', C.orange)
addEdge('n_arch_core', 'n_stack_core', 'слой', C.orange)
addEdge('n_arch_spa', 'n_stack_fe', 'слой', C.orange)
addEdge('n_anton_take', 'n_arch_core', 'база', C.green)
addEdge('n_anton_take', 'n_arch_bff', 'bff-основа', C.green)

// Roles ↔ lifecycle
addEdge('n_role_triage', 'n_lc_flow', 'triage', C.green)
addEdge('n_role_base', 'n_lc_flow', 'direct_answer', C.green)
addEdge('n_role_plan', 'n_lc_flow', 'planning', C.green)
addEdge('n_role_exec', 'n_lc_flow', 'in_work', C.green)
addEdge('n_role_rev', 'n_lc_flow', 'review', C.green)
addEdge('n_role_acc', 'n_lc_flow', 'acceptance', C.green)
addEdge('n_role_orch', 'n_lc_stop', 'стоп-условия', C.red)
addEdge('n_role_rev', 'n_lc_rework', 'rework', C.orange)
addEdge('n_role_acc', 'n_lc_rework', 'rework', C.orange)
addEdge('n_lc_limits', 'n_lc_approval', 'бюджет', C.yellow)
addEdge('n_ap_yaml', 'n_lc_approval', 'пауза', C.yellow)

// Routing
addEdge('n_role_triage', 'n_role_r1', 'маршрутизация', C.violet)
addEdge('n_role_r3', 'n_dept_tmp', 'временный отдел', C.cyan)
addEdge('n_role_r4', 'n_fe_chat', 'вопрос', C.blue)
addEdge('n_role_r2', 'n_lc_flow', 'suggest_task', C.green)

// Depts ↔ bridges
addEdge('n_dept_yaml', 'n_br_req', 'bridges', C.pink)
addEdge('n_dept_tmp', 'n_br_joint', 'совместные блоки', C.pink)
addEdge('n_br_acl', 'n_kb_acl', 'ACL БЗ', C.indigo)
addEdge('n_br_247', 'n_fe_graph', 'пульсы bridge_*', C.blue)

// KB ↔ data
addEdge('n_kb_nodes', 'n_db_kb_nodes', 'таблица', C.yellow)
addEdge('n_kb_edges', 'n_db_kb_edges', 'таблица', C.yellow)
addEdge('n_kb_api', 'n_api_rest', 'группа KB', C.indigo)
addEdge('n_kb_search', 'n_stack_data', 'pgvector + FTS', C.orange)

// Security ↔ API
addEdge('n_sec_rbac', 'n_api_rest', 'RBAC', C.orange)
addEdge('n_sec_rbac', 'n_api_ws', 'RBAC', C.orange)
addEdge('n_sec_tg', 'n_bot_start', 'код', C.teal)
addEdge('n_sec_mini', 'n_fe_mini', 'HMAC', C.blue)

// API ↔ FE
addEdge('n_api_rest', 'n_fe_screens', 'экраны', C.blue)
addEdge('n_api_ws', 'n_fe_graph', '/stream', C.blue)
addEdge('n_fe_chat', 'n_api_rest', 'Chat+SSE+STT', C.blue)

// Bot
addEdge('n_bot_intent', 'n_role_triage', 'intent', C.green)
addEdge('n_bot_inline', 'n_ap_pause', 'подтвердить/отклонить', C.yellow)
addEdge('n_arch_bot', 'f_bot', 'контур', C.teal)

// Integrations / parser / skills
addEdge('n_int_sc', 'n_par_q', 'поиск', C.green)
addEdge('n_par_q', 'n_kb_meta', 'kb_requests', C.indigo)
addEdge('n_sk_pick', 'n_par_q', 'эмбеддинги', C.orange)
addEdge('n_int_stt', 'n_fe_chat', 'голос', C.teal)
addEdge('n_int_stt', 'n_bot_io', 'голос', C.teal)

// Env ↔ infra
addEdge('n_env_local', 'n_inf_compose', 'local', C.brown)
addEdge('n_env_prod', 'n_inf_env', '.env.prod', C.brown)
addEdge('n_env_go', 'n_m8', 'прод-критерии', C.violet)
addEdge('n_env_ops', 'n_inf_bak', 'бэкап', C.gray)

// Milestones ↔ layers
addEdge('n_m1', 'n_arch_core', 'Core', C.violet)
addEdge('n_m2', 'n_dept_tmp', 'отделы', C.violet)
addEdge('n_m2', 'n_br_req', 'мосты', C.violet)
addEdge('n_m3', 'n_arch_pg', 'БД/БЗ', C.violet)
addEdge('n_m4', 'n_arch_bff', 'Backend', C.violet)
addEdge('n_m5', 'n_fe_screens', 'Web', C.violet)
addEdge('n_m6', 'n_bot_start', 'Telegram', C.violet)
addEdge('n_m7', 'n_par_q', 'парсер', C.violet)
addEdge('n_m7', 'n_int_sc', 'коннекторы', C.violet)
addEdge('n_m7', 'n_sk_fields', 'скиллы', C.violet)
addEdge('n_m8', 'n_env_go', 'критерии', C.violet)
addEdge('n_m9', 'n_ctx_s1', 'тестовый месяц', C.violet)
addEdge('n_m10', 'n_ctx_s2', 'этап 2', C.violet)

// Risks
addEdge('n_rk_kb', 'n_anton_drop', 'SQLite→PG', C.red)
addEdge('n_rk_acc', 'n_ctx_out', 'не в MVP', C.red)
addEdge('n_rk_vol', 'n_m8', 'бюджет', C.red)

// Cycle inside context
addEdge('n_ctx_product', 'n_ctx_cycle', 'цикл', C.blue)
addEdge('n_ctx_dev', 'n_ctx_s1', 'далее', C.brown)
addEdge('n_ctx_s1', 'n_ctx_s2', 'далее', C.brown)
addEdge('n_ctx_s2', 'n_ctx_s3', 'далее', C.brown)

// Parents must precede children — already true because frames are added first per section.
function orderParentsFirst(list) {
  const byId = new Map(list.map((n) => [n.id, n]))
  const placed = new Set()
  const result = []
  const visit = (node, trail) => {
    if (placed.has(node.id) || trail.has(node.id)) return
    trail.add(node.id)
    const parent = node.parentId ? byId.get(node.parentId) : undefined
    if (parent) visit(parent, trail)
    placed.add(node.id)
    result.push(node)
  }
  for (const node of list) visit(node, new Set())
  return result
}

const project = {
  id: 'proj_ark_yadro_tz_dev_v1',
  title: 'Арк ядро — ТЗ разработчика v1',
  description:
    'Внутреннее ТЗ разработчика «Арк ядро» · v1 · 15.09.2026. Полная схема разделов 1–21.',
  kinds: KINDS,
  nodes: orderParentsFirst(nodes),
  edges,
  viewport: { x: 24, y: 16, zoom: 0.38 },
  canvasColor: undefined,
  updatedAt: new Date().toISOString(),
}

const out = join(__dirname, '..', 'boards', 'ark-yadro-tz-developer-v1.json')
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify(project, null, 2))
console.log(
  JSON.stringify(
    {
      file: out,
      id: project.id,
      title: project.title,
      nodes: project.nodes.length,
      edges: project.edges.length,
      frames: project.nodes.filter((n) => n.type === 'frame').length,
      notes: project.nodes.filter((n) => n.type === 'note').length,
      guide: Boolean(project.nodes.find((n) => n.id === 'n_guide')),
    },
    null,
    2,
  ),
)
