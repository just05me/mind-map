import { useState, type ReactNode } from 'react'
import { KindBadge } from '../canvas/nodes/KindBadge'
import { QUICK_COLORS } from '../canvas/SelectionToolbar'
import { requireKind } from '../model/kinds'
import { nodeDesign } from '../model/node-design'
import { isStatusBoardType } from '../model/node-type'
import { matchPaperPreset, PAPER_PRESETS, paperColor } from '../model/paper'
import { STATUSES, statusClass, statusLabel } from '../model/status'
import { useApp } from '../store/AppContext'
import type { AppEdge, AppNode, Status, TextAlign, TextWeight } from '../model/types'
import { ColorField, KindColorRow } from './ColorField'
import { Icon } from './Icon'

export function Sidebar() {
  const { project, state } = useApp()
  const selectedNodes = project.nodes.filter((item) => item.selected)
  const node = project.nodes.find((item) => item.id === state.selectedNodeId)
  const edge = project.edges.find((item) => item.id === state.selectedEdgeId)

  if (node) return <NodeInspector key={node.id} node={node} />
  if (edge) return <EdgeInspector key={edge.id} edgeId={edge.id} />
  if (selectedNodes.length > 1) return <MultiInspector nodes={selectedNodes} />
  return <BoardInspector />
}

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="border-b border-[var(--border)] last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center gap-1 px-3 py-2.5 text-[11px] font-semibold text-[var(--muted)] hover:text-[var(--text)]"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="chevronDown" size={12} className={`transition-transform ${open ? '' : '-rotate-90'}`} />
        {title}
      </button>
      {open ? <div className="space-y-3 px-3 pb-3">{children}</div> : null}
    </section>
  )
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="mb-1 block text-[11px] text-[var(--muted)]">{children}</span>
}

function StatusPicker({ value, onChange }: { value?: Status; onChange: (status: Status) => void }) {
  return (
    <div className="grid grid-cols-2 gap-1">
      {STATUSES.map((status) => (
        <button
          key={status}
          type="button"
          aria-pressed={value === status}
          className={`rounded-lg border px-2 py-1 text-[11px] ${
            value === status
              ? `border-transparent ${statusClass(status)} font-medium`
              : 'border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
          }`}
          onClick={() => onChange(status)}
        >
          {statusLabel(status)}
        </button>
      ))}
    </div>
  )
}

function SwatchRow({
  value,
  onChange,
}: {
  value?: string
  onChange: (color: string | undefined) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {QUICK_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`Цвет ${color}`}
          className={`swatch !h-5 !w-5 ${value === color ? 'is-active' : ''}`}
          style={{ background: color }}
          onClick={() => onChange(color)}
        />
      ))}
      <label className="swatch swatch-custom !h-5 !w-5" title="Свой цвет">
        <input
          type="color"
          className="absolute inset-0 cursor-pointer opacity-0"
          value={value && /^#[0-9a-f]{6}$/i.test(value) ? value : '#8e8e93'}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      {value ? (
        <button type="button" className="ml-auto text-[11px] text-[var(--muted)] hover:text-[var(--text)]" onClick={() => onChange(undefined)}>
          Сброс
        </button>
      ) : null}
    </div>
  )
}

function InspectorHeader({
  eyebrow,
  children,
  onDuplicate,
  onDelete,
}: {
  eyebrow: ReactNode
  children: ReactNode
  onDuplicate?: () => void
  onDelete: () => void
}) {
  return (
    <div className="border-b border-[var(--border)] px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 text-[11px] text-[var(--muted)]">{eyebrow}</div>
        <div className="flex shrink-0 items-center gap-0.5">
          {onDuplicate ? (
            <button type="button" className="icon-btn" aria-label="Дублировать" data-tip="Дублировать" data-tip-side="left" onClick={onDuplicate}>
              <Icon name="copy" size={15} />
            </button>
          ) : null}
          <button type="button" className="icon-btn danger" aria-label="Удалить" data-tip="Удалить" data-tip-side="left" onClick={onDelete}>
            <Icon name="trash" size={15} />
          </button>
        </div>
      </div>
      {children}
    </div>
  )
}

function BoardInspector() {
  const { project, state, setCanvasColor, updateKind, selectNode, setShortcutsOpen } = useApp()
  const preset = matchPaperPreset(project.canvasColor, state.theme)
  const cards = project.nodes.filter((node) => isStatusBoardType(node.type))
  const kindCounts = new Map<string, number>()
  for (const node of cards) kindCounts.set(node.data.kind, (kindCounts.get(node.data.kind) ?? 0) + 1)
  const listed = project.nodes.filter((node) => isStatusBoardType(node.type) || node.type === 'text' || node.type === 'frame')

  return (
    <>
      <div className="px-3 py-3 text-[12px] leading-5 text-[var(--muted)]">
        Выберите элемент на холсте, чтобы изменить его.{' '}
        <button type="button" className="underline hover:text-[var(--text)]" onClick={() => setShortcutsOpen(true)}>
          Горячие клавиши
        </button>
      </div>

      <Section title="Сводка">
        {cards.length === 0 ? (
          <div className="text-[12px] text-[var(--muted)]">Пока пусто</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-1">
              {STATUSES.map((status) => (
                <div key={status} className={`flex items-center justify-between rounded-lg px-2 py-1 text-[11px] ${statusClass(status)}`}>
                  <span>{statusLabel(status)}</span>
                  <span className="font-semibold tabular-nums">
                    {cards.filter((node) => node.data.status === status).length}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {[...kindCounts.entries()].map(([kindId, count]) => {
                const kind = requireKind(project.kinds, kindId)
                return (
                  <span key={kindId} className="flex items-center gap-1.5 text-[11px]">
                    <span className="kind-dot" style={{ background: kind.color }} />
                    {kind.name} <span className="text-[var(--muted)]">{count}</span>
                  </span>
                )
              })}
            </div>
          </>
        )}
      </Section>

      {listed.length > 0 ? (
        <Section title={`Элементы · ${listed.length}`}>
          <div className="-mx-1 max-h-[240px] space-y-px overflow-y-auto">
            {listed.map((item) => (
              <button
                key={item.id}
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left text-[12px] hover:bg-[var(--panel-muted)]"
                onClick={() => selectNode(item.id)}
              >
                <KindBadge kind={requireKind(project.kinds, item.data.kind)} size={18} shape="square" />
                <span className="truncate">{item.data.title || 'Без названия'}</span>
              </button>
            ))}
          </div>
        </Section>
      ) : null}

      <Section title="Холст">
        <div className="grid grid-cols-3 gap-1.5">
          {PAPER_PRESETS.map((item) => {
            const color = paperColor(item, state.theme)
            const active = preset === item.id
            return (
              <button
                key={item.id}
                type="button"
                className={`rounded-lg border p-1 text-left text-[10px] ${
                  active ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-[var(--border)] text-[var(--muted)]'
                }`}
                onClick={() => setCanvasColor(item.id === 'auto' ? undefined : color)}
              >
                <span className="mb-1 block h-5 rounded-md border border-black/5" style={{ background: color }} />
                {item.label}
              </button>
            )
          })}
        </div>
        <ColorField
          label="Свой цвет"
          value={preset === 'custom' ? project.canvasColor : undefined}
          fallback={paperColor(PAPER_PRESETS[0], state.theme)}
          allowClear
          onChange={(color) => setCanvasColor(color)}
        />
      </Section>

      <Section title="Цвета типов" defaultOpen={false}>
        <div className="space-y-1.5">
          {project.kinds.map((kind) => (
            <KindColorRow key={kind.id} kind={kind} onChange={(color) => updateKind({ ...kind, color })} />
          ))}
        </div>
      </Section>
    </>
  )
}

function MultiInspector({ nodes }: { nodes: AppNode[] }) {
  const { updateNodeData, duplicateNodes, deleteElements } = useApp()
  const ids = nodes.map((node) => node.id)
  const cards = nodes.filter((node) => isStatusBoardType(node.type))
  const sharedStatus = cards.every((node) => node.data.status === cards[0]?.data.status)
    ? cards[0]?.data.status
    : undefined

  return (
    <>
      <InspectorHeader
        eyebrow="Несколько элементов"
        onDuplicate={() => duplicateNodes(ids)}
        onDelete={() => deleteElements(ids)}
      >
        <div className="mt-1 text-[15px] font-medium">Выбрано: {nodes.length}</div>
      </InspectorHeader>
      {cards.length > 0 ? (
        <Section title="Статус">
          <StatusPicker
            value={sharedStatus}
            onChange={(status) => {
              for (const node of cards) updateNodeData(node.id, { status })
            }}
          />
        </Section>
      ) : null}
      <Section title="Цвет">
        <SwatchRow
          onChange={(color) => {
            for (const id of ids) updateNodeData(id, { accentColor: color })
          }}
        />
      </Section>
    </>
  )
}

function EdgeInspector({ edgeId }: { edgeId: string }) {
  const { project, updateEdgeData, deleteElements, selectNode } = useApp()
  const edge = project.edges.find((item) => item.id === edgeId)
  if (!edge) return null
  const source = project.nodes.find((node) => node.id === edge.source)
  const target = project.nodes.find((node) => node.id === edge.target)

  return (
    <>
      <InspectorHeader eyebrow="Связь" onDelete={() => deleteElements([], [edgeId])}>
        <div className="mt-1 flex items-center gap-1.5 text-[13px]">
          <button type="button" className="truncate hover:underline" onClick={() => source && selectNode(source.id)}>
            {source?.data.title || '—'}
          </button>
          <span className="text-[var(--muted)]">→</span>
          <button type="button" className="truncate hover:underline" onClick={() => target && selectNode(target.id)}>
            {target?.data.title || '—'}
          </button>
        </div>
      </InspectorHeader>
      <Section title="Подпись">
        <input
          className="field text-[13px]"
          placeholder="Например: session, first message"
          value={edge.data?.label ?? ''}
          onChange={(event) => updateEdgeData(edgeId, { label: event.target.value || undefined })}
        />
      </Section>
      <Section title="Цвет линии">
        <SwatchRow value={edge.data?.color} onChange={(color) => updateEdgeData(edgeId, { color })} />
      </Section>
    </>
  )
}

function NodeInspector({ node }: { node: AppNode }) {
  const {
    project,
    updateNodeData,
    detachFromGroup,
    removeCustomKind,
    duplicateNodes,
    deleteElements,
  } = useApp()
  const kind = requireKind(project.kinds, node.data.kind)
  const items = node.data.items ?? []
  const hasStatus = isStatusBoardType(node.type)
  const hasDetails = node.type === 'kind' || node.type === 'comment' || node.type === 'note'
  const fields = node.type === 'kind' ? nodeDesign(node.data.kind).fields : null
  const parent = node.parentId ? project.nodes.find((item) => item.id === node.parentId) : undefined

  return (
    <>
      <InspectorHeader
        eyebrow={
          <span className="flex items-center gap-1.5">
            <KindBadge kind={{ ...kind, color: node.data.accentColor ?? kind.color }} size={16} shape="square" />
            {kind.name}
            {parent ? <span className="truncate">· в «{parent.data.title}»</span> : null}
          </span>
        }
        onDuplicate={() => duplicateNodes([node.id])}
        onDelete={() => deleteElements([node.id])}
      >
        {node.type === 'text' ? null : (
          <input
            className="mt-1 w-full rounded-md bg-transparent px-1 -mx-1 text-[15px] font-medium tracking-[-0.015em] outline-none hover:bg-[var(--panel-muted)] focus:bg-[var(--panel-muted)]"
            value={node.data.title}
            placeholder="Название"
            onChange={(event) => updateNodeData(node.id, { title: event.target.value })}
          />
        )}
      </InspectorHeader>

      {node.type === 'text' ? (
        <Section title="Текст">
          <textarea
            className="field min-h-[64px] text-[13px]"
            value={node.data.title}
            onChange={(event) => updateNodeData(node.id, { title: event.target.value })}
          />
          <TextControls node={node} />
        </Section>
      ) : null}

      {hasStatus ? (
        <Section title="Статус">
          <StatusPicker value={node.data.status} onChange={(status) => updateNodeData(node.id, { status })} />
        </Section>
      ) : null}

      {node.type !== 'text' ? (
        <Section title="Цвет">
          <div>
            <FieldLabel>Акцент</FieldLabel>
            <SwatchRow value={node.data.accentColor} onChange={(color) => updateNodeData(node.id, { accentColor: color })} />
          </div>
          <div>
            <FieldLabel>Заливка</FieldLabel>
            <SwatchRow value={node.data.fillColor} onChange={(color) => updateNodeData(node.id, { fillColor: color })} />
          </div>
        </Section>
      ) : null}

      {hasDetails ? (
        <Section title="Описание">
          <label className="block">
            <FieldLabel>{fields?.subtitleLabel ?? 'Подзаголовок'}</FieldLabel>
            <input
              className="field text-[13px]"
              placeholder={fields?.subtitlePlaceholder ?? 'Короткое пояснение'}
              value={node.data.subtitle ?? ''}
              onChange={(event) => updateNodeData(node.id, { subtitle: event.target.value })}
            />
          </label>
          <label className="block">
            <FieldLabel>Заметки</FieldLabel>
            <textarea
              className="field min-h-[72px] text-[13px]"
              value={node.data.description ?? ''}
              onChange={(event) => updateNodeData(node.id, { description: event.target.value })}
            />
          </label>
        </Section>
      ) : null}

      {node.type === 'kind' ? (
        <Section title="Детали" defaultOpen={Boolean(node.data.path || items.length)}>
          {fields?.showPath ? (
            <label className="block">
              <FieldLabel>Путь в коде</FieldLabel>
              <input
                className="field font-mono text-xs"
                placeholder="src/lib/example.ts"
                value={node.data.path ?? ''}
                onChange={(event) => updateNodeData(node.id, { path: event.target.value })}
              />
            </label>
          ) : null}
          <div>
            <FieldLabel>{fields?.itemsLabel ?? 'Пункты'}</FieldLabel>
            <div className="space-y-1">
              {items.map((item, index) => (
                <div key={index} className="flex gap-1">
                  <input
                    className="field flex-1 text-xs"
                    placeholder={fields?.itemsPlaceholder}
                    value={item}
                    onChange={(event) => {
                      const next = [...items]
                      next[index] = event.target.value
                      updateNodeData(node.id, { items: next })
                    }}
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Убрать пункт"
                    onClick={() => updateNodeData(node.id, { items: items.filter((_, i) => i !== index) })}
                  >
                    <Icon name="close" size={13} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-[var(--accent)]"
                onClick={() => updateNodeData(node.id, { items: [...items, ''] })}
              >
                <Icon name="plus" size={12} /> Пункт
              </button>
            </div>
          </div>
        </Section>
      ) : null}

      <RelationsSection node={node} />

      {parent || !kind.builtin ? (
        <div className="flex flex-col items-start gap-2 px-3 py-3">
          {parent ? (
            <button type="button" className="btn-ghost !px-0" onClick={() => detachFromGroup(node.id)}>
              <Icon name="unlink" size={14} /> Вынести из «{parent.data.title}»
            </button>
          ) : null}
          {!kind.builtin ? (
            <button type="button" className="btn-ghost !px-0 !text-red-500" onClick={() => removeCustomKind(kind.id)}>
              Удалить тип «{kind.name}»
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  )
}

function TextControls({ node }: { node: AppNode }) {
  const { updateNodeData } = useApp()
  const weight = (node.data.fontWeight ?? 500) as TextWeight
  const align = (node.data.textAlign ?? 'left') as TextAlign

  return (
    <>
      <label className="block">
        <FieldLabel>Размер · {node.data.fontSize ?? 28}</FieldLabel>
        <input
          type="range"
          min={12}
          max={72}
          value={node.data.fontSize ?? 28}
          className="w-full accent-[var(--accent)]"
          onChange={(event) => updateNodeData(node.id, { fontSize: Number(event.target.value) })}
        />
      </label>
      <div className="flex gap-2">
        <div className="segmented flex-1">
          {([
            [400, 'Aa'],
            [600, 'Aa'],
            [700, 'Aa'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={weight === value}
              style={{ fontWeight: value }}
              onClick={() => updateNodeData(node.id, { fontWeight: value })}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="segmented flex-1">
          {([
            ['left', '⇤'],
            ['center', '↔'],
            ['right', '⇥'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={align === value}
              onClick={() => updateNodeData(node.id, { textAlign: value })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel>Цвет текста</FieldLabel>
        <SwatchRow value={node.data.textColor} onChange={(color) => updateNodeData(node.id, { textColor: color })} />
      </div>
    </>
  )
}

function RelationsSection({ node }: { node: AppNode }) {
  const { project, selectNode, deleteElements } = useApp()
  const relations = project.edges.flatMap((edge): { edge: AppEdge; other: AppNode; direction: 'in' | 'out' }[] => {
    if (edge.source === node.id) {
      const other = project.nodes.find((item) => item.id === edge.target)
      return other ? [{ edge, other, direction: 'out' }] : []
    }
    if (edge.target === node.id) {
      const other = project.nodes.find((item) => item.id === edge.source)
      return other ? [{ edge, other, direction: 'in' }] : []
    }
    return []
  })

  return (
    <Section title={`Связи · ${relations.length}`} defaultOpen={relations.length > 0}>
      {relations.length === 0 ? (
        <div className="text-[12px] text-[var(--muted)]">
          Потяните от точки на краю узла к другому узлу.
        </div>
      ) : (
        <div className="-mx-1 space-y-px">
          {relations.map(({ edge, other, direction }) => (
            <div key={edge.id} className="group flex items-center gap-1 rounded-lg px-1 hover:bg-[var(--panel-muted)]">
              <span className="w-4 text-center text-[11px] text-[var(--muted)]" title={direction === 'out' ? 'Вызывает' : 'Вызывается'}>
                {direction === 'out' ? '→' : '←'}
              </span>
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left text-[12px]"
                onClick={() => selectNode(other.id)}
              >
                <KindBadge kind={requireKind(project.kinds, other.data.kind)} size={16} shape="square" />
                <span className="truncate">{other.data.title || 'Без названия'}</span>
                {edge.data?.label ? (
                  <span className="truncate text-[10px] text-[var(--muted)]">{edge.data.label}</span>
                ) : null}
              </button>
              <button
                type="button"
                className="icon-btn danger opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                aria-label="Удалить связь"
                onClick={() => deleteElements([], [edge.id])}
              >
                <Icon name="close" size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Section>
  )
}
