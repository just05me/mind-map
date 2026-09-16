import { KIND_GROUPS, kindsInGroup } from '../model/kinds'
import { STATUSES, statusLabel } from '../model/status'
import type { AppNodeType, Project } from '../model/types'
import {
  APP_NODE_TYPES,
  CENTER_SPACE,
  CONTAINER_PADDING,
  DEFAULT_NODE_SIZE,
  LAYOUT_FORMAT_ID,
  LAYOUT_STEP,
  MAX_IMPORT_NODES,
  MAX_NODE_ITEMS,
  styledSizeOf,
} from './import-spec'

/** What each renderer is for. Shown to the model next to the default box size. */
const NODE_TYPE_HINT: Record<AppNodeType, string> = {
  kind: 'обычная карточка: модуль, сервис, API, агент — основной тип',
  note: 'жёлтый стикер: заметка с заголовком и текстом',
  text: 'просто текст на холсте, без рамки — заголовки разделов',
  frame: 'рамка-контейнер с подписью: группирует узлы, может быть родителем',
  group: 'группа-контейнер без подписи сверху, тоже может быть родителем',
  divider: 'горизонтальная линия-разделитель',
  decision: 'ромб решения: вопрос с ветвлением',
  comment: 'комментарий на светлом фоне: замечание к схеме',
}

const EXAMPLE = {
  format: LAYOUT_FORMAT_ID,
  coordinateSpace: CENTER_SPACE,
  title: 'Пример: чат с ИИ',
  description: 'Мини-схема из пяти узлов.',
  nodes: [
    {
      id: 'f_client',
      type: 'frame',
      title: 'Клиент',
      x: -560,
      y: 0,
      width: 520,
      height: 380,
      accentColor: '#0071e3',
    },
    {
      id: 'page',
      type: 'kind',
      kind: 'entry',
      title: 'Страница чата',
      subtitle: 'GET /chat',
      status: 'done',
      parentId: 'f_client',
      x: 0,
      y: -70,
    },
    {
      id: 'hint',
      type: 'note',
      title: 'Черновик',
      description: 'Проверить мобильную вёрстку.',
      parentId: 'f_client',
      x: 0,
      y: 80,
    },
    {
      id: 'api',
      type: 'kind',
      kind: 'api',
      title: 'POST /api/chat',
      items: ['messages', 'model'],
      status: 'doing',
      x: 0,
      y: 0,
    },
    {
      id: 'db',
      type: 'kind',
      kind: 'store',
      title: 'История',
      subtitle: 'Postgres',
      x: 520,
      y: 0,
    },
  ],
  edges: [
    { source: 'page', target: 'api', label: 'запрос' },
    { source: 'api', target: 'db', label: 'пишет', color: '#5856d6', width: 2 },
  ],
}

/**
 * Prompt for an external chat model that has to produce an importable JSON layout.
 * The catalogs come from the project itself, so custom kinds are listed too.
 */
export function buildImportPrompt(project: Project): string {
  return [
    'Ты собираешь макет для приложения «Доска схем»: схема архитектуры на холсте.',
    'Верни ОДИН JSON-файл по спецификации ниже: только JSON, без пояснений и без обрамления кода.',
    'Файл я загружу кнопкой «Импортировать макет (JSON)» — он должен открыться без правок.',
    '',
    '## Что построить',
    `Проект: «${project.title || 'Без названия'}»`,
    ...(project.description ? [`Описание: ${project.description}`] : []),
    ...boardSummary(project),
    'Задача: ← опиши здесь своими словами, что должно быть на доске.',
    '',
    '## Каркас файла',
    '```json',
    JSON.stringify(
      {
        format: LAYOUT_FORMAT_ID,
        coordinateSpace: CENTER_SPACE,
        title: 'Название проекта',
        description: 'Одна-две строки о схеме',
        kinds: [{ id: 'my_type', name: 'Свой тип', letter: 'C', color: '#0a84ff' }],
        nodes: [],
        edges: [],
      },
      null,
      2,
    ),
    '```',
    'Поля format и coordinateSpace обязательны: по ним приложение понимает, что координаты заданы от центра.',
    'Блок kinds нужен только для своих типов, которых нет в каталоге ниже; id придумай латиницей.',
    '',
    '## Система координат',
    'Единица — пиксель холста при масштабе 100%. Точка 0,0 — центр доски.',
    'x и y узла — смещение ЦЕНТРА его бокса от центра доски. Вправо и вниз — плюс.',
    'У вложенного узла x и y считаются от центра родителя, а не от центра доски.',
    `Комфортный шаг между соседними боксами: ${LAYOUT_STEP.x} по x и ${LAYOUT_STEP.y} по y.`,
    'viewport задавать не нужно: приложение само подгонит масштаб под содержимое.',
    '',
    '## Узел',
    'Обязательны только id и title, остальное — по смыслу:',
    '- id — короткая строка латиницей, уникальная в файле; на неё ссылаются parentId и связи',
    '- type — рендерер из списка ниже, по умолчанию kind',
    '- kind — тип из каталога ниже; неизвестный kind заменяется на module',
    `- title, subtitle, description, path — строки; items — список строк (до ${MAX_NODE_ITEMS})`,
    `- status — ${STATUSES.join(' | ')}, по умолчанию ${STATUSES[0]}`,
    '- x, y — координаты центра бокса (см. выше)',
    '- width, height — размер бокса в пикселях',
    '- fillColor, accentColor, textColor — цвет в hex, например #0a84ff',
    '- fontSize, fontWeight (400 | 500 | 600 | 700), textAlign (left | center | right) — только для type: "text"',
    '- parentId — id рамки или группы, внутри которой лежит узел',
    '',
    '## Типы (поле type)',
    ...APP_NODE_TYPES.map((type) => nodeTypeLine(type)),
    'Размеры в списке — то, что подставится без width и height. Указывай их, когда бокс должен быть крупнее: для типов «по содержимому» они всё равно учитываются при расчёте раскладки.',
    '',
    '## Вложенность',
    'Родителем может быть только frame или group. Вложенность допускает несколько уровней.',
    `Внутри родителя сверху остаётся ${CONTAINER_PADDING.top} px под подпись, по краям ${CONTAINER_PADDING.x} px.`,
    'Если дети не влезают в заданный размер, рамка растянется сама — центр рамки останется там, где указано.',
    'Связи между узлами из разных рамок разрешены.',
    '',
    '## Каталог kinds',
    ...kindCatalog(project),
    '',
    '## Статусы',
    ...STATUSES.map((status) => `- ${status} — ${statusLabel(status)}`),
    '',
    '## Связи',
    'Каждая связь: { "source": "id", "target": "id", "label": "подпись", "color": "#8e8e93", "width": 2 }.',
    'source и target — id узлов из этого же файла. label, color и width необязательны, width от 1 до 8.',
    'Связь рисуется стрелкой от source к target. Дубли одной пары и связь узла с самим собой отбрасываются.',
    '',
    '## Пример валидного файла',
    '```json',
    JSON.stringify(EXAMPLE, null, 2),
    '```',
    '',
    '## Правила',
    `- узлов не больше ${MAX_IMPORT_NODES}`,
    '- не добавляй полей, которых нет в спецификации, и не переименовывай существующие',
    '- заголовки и подписи — на русском, id — латиницей',
    '- раскладывай так, чтобы боксы не перекрывались: считай их размеры',
    '- ответ — только содержимое JSON-файла',
  ].join('\n')
}

function nodeTypeLine(type: AppNodeType): string {
  const size = DEFAULT_NODE_SIZE[type]
  return `- ${type} — ${NODE_TYPE_HINT[type]}; ${size.width}×${size.height}, ${sizeNote(type)}`
}

function sizeNote(type: AppNodeType): string {
  const styled = styledSizeOf(type)
  switch (styled) {
    case 'box':
      return 'размер задают width и height'
    case 'width':
      return 'ширину задаёт width, высота — по тексту'
    case 'content':
      return 'размер по содержимому'
    default: {
      const _never: never = styled
      return _never
    }
  }
}

function kindCatalog(project: Project): string[] {
  const lines: string[] = []
  for (const group of KIND_GROUPS) {
    const kinds = kindsInGroup(project.kinds, group)
    if (kinds.length === 0) continue
    lines.push(`${group.title}: ${kinds.map((kind) => `${kind.id} — ${kind.name}`).join(', ')}`)
  }
  return lines
}

/** Titles already on the board, so the model can continue the same schema. */
function boardSummary(project: Project): string[] {
  const titles = project.nodes
    .map((node) => node.data.title.trim())
    .filter((title) => title.length > 0)
    .slice(0, 20)
  if (titles.length === 0) return ['Доска пока пустая.']
  return [
    `На доске уже ${project.nodes.length} элементов: ${titles.join(', ')}${
      project.nodes.length > titles.length ? '…' : ''
    }`,
    'Импорт создаёт отдельный проект и не затирает эту доску.',
  ]
}
