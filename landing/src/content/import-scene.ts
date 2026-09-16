import { CARD_H, CARD_W, SHAPE_H, SHAPE_W, type Scene } from '../demos/scene-types'

/** JSON typed on the left of the import demo; `mind-map.layout.v1` as in the README. */
export const IMPORT_JSON_LINES: string[] = [
  '{',
  '  "format": "mind-map.layout.v1",',
  '  "coordinateSpace": "center",',
  '  "title": "Чат с ИИ",',
  '  "nodes": [',
  '    { "id": "f", "type": "frame", "title": "Клиент",',
  '      "x": -150, "y": 0, "width": 200, "height": 240 },',
  '    { "id": "page", "kind": "entry", "title": "Страница чата",',
  '      "parentId": "f", "x": 0, "y": 0 },',
  '    { "id": "api", "kind": "api", "title": "POST /api/chat",',
  '      "x": 120, "y": -80, "status": "doing" },',
  '    { "id": "db", "kind": "store", "title": "PostgreSQL",',
  '      "x": 120, "y": 60 }',
  '  ],',
  '  "edges": [',
  '    { "source": "page", "target": "api", "label": "запрос" },',
  '    { "source": "api", "target": "db", "label": "история" }',
  '  ]',
  '}',
]

/** Nodes appear when the line that declares them has been typed (1-based line count). */
export const IMPORT_SCENE: Scene = {
  width: 480,
  height: 300,
  nodes: [
    { id: 'f', type: 'frame', title: 'Клиент', x: 16, y: 30, w: 200, h: 240, step: 7 },
    { id: 'page', type: 'kind', kind: 'entry', title: 'Страница чата', subtitle: 'entry', parentId: 'f', x: 32, y: 82, w: SHAPE_W, h: SHAPE_H, step: 9 },
    { id: 'api', type: 'kind', kind: 'api', title: 'POST /api/chat', subtitle: 'api', status: 'doing', x: 250, y: 40, w: CARD_W, h: CARD_H, step: 11 },
    { id: 'db', type: 'kind', kind: 'store', title: 'PostgreSQL', subtitle: 'store', x: 276, y: 136, w: SHAPE_W, h: SHAPE_H, step: 13 },
  ],
  edges: [
    { id: 'i1', source: 'page', target: 'api', label: 'запрос', step: 16 },
    { id: 'i2', source: 'api', target: 'db', label: 'история', step: 17 },
  ],
}
