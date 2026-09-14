import { AnimatePresence, motion } from 'motion/react'
import { KindBadge } from '../canvas/nodes/KindBadge'
import { requireKind } from '../kinds/catalog'
import { useUiMotion } from '../lib/motion'
import { isStatusBoardType } from '../lib/node-type'
import { matchPaperPreset, PAPER_PRESETS, paperColor } from '../lib/paper'
import { STATUSES, parseStatus, statusLabel } from '../lib/status'
import { useApp } from '../store/AppContext'
import type { AppNode, TextAlign, TextWeight } from '../types'
import { ColorField, KindColorRow } from './ColorField'

export function Sidebar() {
  const { project, state } = useApp()
  const node = project.nodes.find((item) => item.id === state.selectedNodeId)
  const edge = project.edges.find((item) => item.id === state.selectedEdgeId)
  const motionUi = useUiMotion()

  return (
    <aside className="chrome-heavy flex h-full w-[280px] flex-col overflow-hidden rounded-[1.35rem]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={node?.id ?? edge?.id ?? 'board'}
          initial={motionUi.panelEnter}
          animate={motionUi.panelShown}
          exit={motionUi.panelLeave}
          transition={motionUi.spring}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto"
        >
          {node ? (
            <NodeInspector node={node} />
          ) : edge ? (
            <EdgeInspector edgeId={edge.id} color={edge.data?.color} />
          ) : (
            <BoardInspector />
          )}
        </motion.div>
      </AnimatePresence>
    </aside>
  )
}

function BoardInspector() {
  const { project, state, setCanvasColor, updateKind, selectNode } = useApp()
  const preset = matchPaperPreset(project.canvasColor, state.theme)
  const used = project.nodes.filter((node) => isStatusBoardType(node.type) || node.type === 'text')

  return (
    <div className="px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
        Доска
      </div>
      <h2 className="display mt-1 text-[17px] font-semibold">Где я и что дальше</h2>
      <p className="mt-1 text-[12px] leading-5 text-[var(--muted)]">
        Карта слева, свойства здесь. Двойной клик по холсту пишет текст. Выберите инструмент сверху.
      </p>

      <div className="mt-4">
        <div className="mb-2 text-xs text-[var(--muted)]">Бумага холста</div>
        <div className="grid grid-cols-2 gap-1.5">
          {PAPER_PRESETS.map((item) => {
            const color = paperColor(item, state.theme)
            const active = preset === item.id
            return (
              <button
                key={item.id}
                type="button"
                className={`pressable rounded-xl border px-2 py-2 text-left text-[11px] ${
                  active ? 'border-[var(--accent)]' : 'border-[var(--border)]'
                }`}
                onPointerDown={() => setCanvasColor(item.id === 'auto' ? undefined : color)}
              >
                <span
                  className="mb-1 block h-5 rounded-md border border-black/5"
                  style={{ background: color }}
                />
                {item.label}
              </button>
            )
          })}
        </div>
        <div className="mt-2">
          <ColorField
            label="Свой цвет холста"
            value={preset === 'custom' ? project.canvasColor : undefined}
            fallback={paperColor(PAPER_PRESETS[0], state.theme)}
            allowClear
            onChange={(color) => setCanvasColor(color)}
          />
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 text-xs text-[var(--muted)]">Цвета типов</div>
        <div className="space-y-1.5">
          {project.kinds.map((kind) => (
            <KindColorRow
              key={kind.id}
              kind={kind}
              onChange={(color) => updateKind({ ...kind, color })}
            />
          ))}
        </div>
      </div>

      {used.length > 0 ? (
        <div className="mt-5">
          <div className="mb-2 text-xs text-[var(--muted)]">На доске</div>
          <div className="space-y-1">
            {used.slice(0, 8).map((item) => (
              <button
                key={item.id}
                type="button"
                className="pressable flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left text-xs hover:bg-[var(--panel-muted)]"
                onPointerDown={() => selectNode(item.id)}
              >
                <KindBadge kind={requireKind(project.kinds, item.data.kind)} size={18} />
                <span className="truncate">{item.data.title || 'Без названия'}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function EdgeInspector({ edgeId, color }: { edgeId: string; color?: string }) {
  const { project, updateEdgeData, selectEdge } = useApp()
  const edge = project.edges.find((item) => item.id === edgeId)
  const source = project.nodes.find((node) => node.id === edge?.source)
  const fallback = source ? requireKind(project.kinds, source.data.kind).color : '#8e8e93'

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
            Связь
          </div>
          <div className="mt-1 text-[15px] font-medium">Цвет линии</div>
        </div>
        <button
          type="button"
          className="pressable rounded-lg px-2 text-lg leading-none text-[var(--muted)]"
          onPointerDown={() => selectEdge(null)}
          aria-label="Закрыть"
        >
          ×
        </button>
      </div>
      <div className="mt-4">
        <ColorField
          label="Цвет связи"
          value={color}
          fallback={fallback}
          allowClear
          onChange={(next) => updateEdgeData(edgeId, { color: next })}
        />
      </div>
    </div>
  )
}

function NodeInspector({ node }: { node: AppNode }) {
  const { project, updateNodeData, detachFromGroup, removeCustomKind, selectNode, updateKind } = useApp()
  const kind = requireKind(project.kinds, node.data.kind)
  const outgoing = project.edges
    .filter((edge) => edge.source === node.id)
    .map((edge) => project.nodes.find((item) => item.id === edge.target))
    .filter((item) => item != null)
  const incoming = project.edges
    .filter((edge) => edge.target === node.id)
    .map((edge) => project.nodes.find((item) => item.id === edge.source))
    .filter((item) => item != null)
  const items = node.data.items ?? []
  const showTextControls = node.type === 'text'

  return (
    <>
      <div className="flex items-center gap-2 px-4 pt-4">
        <KindBadge kind={kind} />
        <div className="min-w-0 flex-1">
          <div className="text-xs text-[var(--muted)]">{kind.name}</div>
          <input
            className="w-full bg-transparent text-[15px] font-medium tracking-[-0.015em] outline-none"
            value={node.data.title}
            onChange={(event) => updateNodeData(node.id, { title: event.target.value })}
          />
        </div>
        <button
          type="button"
          className="pressable rounded-lg px-2 text-lg leading-none text-[var(--muted)]"
          onPointerDown={() => selectNode(null)}
          aria-label="Закрыть"
        >
          ×
        </button>
      </div>

      <div className="space-y-3 px-4 py-4 text-sm">
        <ColorField
          label="Заливка узла"
          value={node.data.fillColor}
          fallback={node.type === 'note' ? '#f5d76e' : undefined}
          allowClear
          onChange={(color) => updateNodeData(node.id, { fillColor: color })}
        />
        <ColorField
          label="Акцент"
          value={node.data.accentColor}
          fallback={kind.color}
          allowClear
          onChange={(color) => updateNodeData(node.id, { accentColor: color })}
        />
        <ColorField
          label="Цвет типа по умолчанию"
          value={kind.color}
          onChange={(color) => {
            if (color) updateKind({ ...kind, color })
          }}
        />

        {showTextControls ? <TextControls node={node} /> : null}

        {node.type !== 'text' && node.type !== 'divider' ? (
          <label className="block">
            <span className="mb-1 block text-xs text-[var(--muted)]">Статус</span>
            <select
              className="field"
              value={node.data.status}
              onChange={(event) => updateNodeData(node.id, { status: parseStatus(event.target.value) })}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {node.type === 'kind' || node.type === 'comment' || node.type === 'note' ? (
          <>
            <label className="block">
              <span className="mb-1 block text-xs text-[var(--muted)]">Подзаголовок</span>
              <input
                className="field"
                value={node.data.subtitle ?? ''}
                onChange={(event) => updateNodeData(node.id, { subtitle: event.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-[var(--muted)]">Описание</span>
              <textarea
                className="field min-h-[72px]"
                value={node.data.description ?? ''}
                onChange={(event) => updateNodeData(node.id, { description: event.target.value })}
              />
            </label>
          </>
        ) : null}

        {node.type === 'kind' ? (
          <>
            <label className="block">
              <span className="mb-1 block text-xs text-[var(--muted)]">Путь в коде</span>
              <input
                className="field font-mono text-xs"
                placeholder="src/lib/example.ts"
                value={node.data.path ?? ''}
                onChange={(event) => updateNodeData(node.id, { path: event.target.value })}
              />
            </label>
            <div>
              <div className="mb-1 text-xs text-[var(--muted)]">Пункты</div>
              <div className="space-y-1">
                {items.map((item, index) => (
                  <div key={`${item}-${index}`} className="flex gap-1">
                    <input
                      className="field flex-1 text-xs"
                      value={item}
                      onChange={(event) => {
                        const next = [...items]
                        next[index] = event.target.value
                        updateNodeData(node.id, { items: next })
                      }}
                    />
                    <button
                      type="button"
                      className="pressable px-2 text-xs text-[var(--muted)]"
                      onClick={() =>
                        updateNodeData(node.id, { items: items.filter((_, i) => i !== index) })
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="pressable text-xs text-[var(--accent)]"
                  onClick={() => updateNodeData(node.id, { items: [...items, ''] })}
                >
                  + пункт
                </button>
              </div>
            </div>
          </>
        ) : null}

        {node.parentId ? (
          <button
            type="button"
            className="pressable text-xs text-[var(--muted)] underline"
            onClick={() => detachFromGroup(node.id)}
          >
            Убрать из группы
          </button>
        ) : null}

        {!kind.builtin ? (
          <button
            type="button"
            className="pressable text-xs text-red-500"
            onClick={() => removeCustomKind(kind.id)}
          >
            Удалить свой тип
          </button>
        ) : null}
      </div>

      <RelationList title="Вызывает" nodes={outgoing} onOpen={selectNode} />
      <RelationList title="Вызывается" nodes={incoming} onOpen={selectNode} />
    </>
  )
}

function TextControls({ node }: { node: AppNode }) {
  const { updateNodeData } = useApp()
  const weight = (node.data.fontWeight ?? 500) as TextWeight
  const align = (node.data.textAlign ?? 'left') as TextAlign

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-xs text-[var(--muted)]">Кегль · {node.data.fontSize ?? 28}</span>
        <input
          type="range"
          min={12}
          max={72}
          value={node.data.fontSize ?? 28}
          className="w-full"
          onChange={(event) => updateNodeData(node.id, { fontSize: Number(event.target.value) })}
        />
      </label>
      <div>
        <div className="mb-1 text-xs text-[var(--muted)]">Насыщенность</div>
        <div className="flex gap-1">
          {([400, 500, 600, 700] as const).map((item) => (
            <button
              key={item}
              type="button"
              className={`pressable flex-1 rounded-lg border px-2 py-1 text-[11px] ${
                weight === item ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border)]'
              }`}
              onPointerDown={() => updateNodeData(node.id, { fontWeight: item })}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-1 text-xs text-[var(--muted)]">Выравнивание</div>
        <div className="flex gap-1">
          {([
            ['left', 'Слева'],
            ['center', 'Центр'],
            ['right', 'Справа'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`pressable flex-1 rounded-lg border px-2 py-1 text-[11px] ${
                align === value ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border)]'
              }`}
              onPointerDown={() => updateNodeData(node.id, { textAlign: value })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <ColorField
        label="Цвет текста"
        value={node.data.textColor}
        fallback="#1d1d1f"
        allowClear
        onChange={(color) => updateNodeData(node.id, { textColor: color })}
      />
    </div>
  )
}

function RelationList({
  title,
  nodes,
  onOpen,
}: {
  title: string
  nodes: { id: string; data: { title: string; kind: string } }[]
  onOpen: (id: string) => void
}) {
  const { project } = useApp()
  return (
    <section className="border-t border-[var(--border)] px-4 py-3">
      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        {title}
      </div>
      {nodes.length === 0 ? (
        <div className="text-xs text-[var(--muted)]">Нет связей</div>
      ) : (
        <div className="space-y-1">
          {nodes.map((item) => {
            const kind = requireKind(project.kinds, item.data.kind)
            return (
              <button
                key={item.id}
                type="button"
                onPointerDown={() => onOpen(item.id)}
                className="pressable flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left text-xs hover:bg-[var(--panel-muted)]"
              >
                <KindBadge kind={kind} size={18} />
                <span className="truncate">{item.data.title}</span>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
