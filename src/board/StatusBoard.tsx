import { useState } from 'react'
import { KindBadge } from '../canvas/nodes/KindBadge'
import { requireKind } from '../kinds/catalog'
import { isStatusBoardType } from '../lib/node-type'
import { STATUSES, statusLabel } from '../lib/status'
import { useApp } from '../store/AppContext'
import type { AppNode, Status } from '../types'

export function StatusBoard() {
  const { project, updateNodeData, selectNode, state } = useApp()
  const [overColumn, setOverColumn] = useState<Status | null>(null)
  const cards = project.nodes.filter((node) => isStatusBoardType(node.type))

  return (
    <div className="flex h-full gap-3 overflow-x-auto bg-[var(--bg)] p-4">
      {STATUSES.map((status) => {
        const columnCards = cards.filter((node) => node.data.status === status)
        return (
          <section
            key={status}
            className={`chrome-heavy flex w-[248px] shrink-0 flex-col rounded-[1.25rem] ${
              overColumn === status ? 'border-[var(--accent)]' : ''
            }`}
            onDragOver={(event) => {
              event.preventDefault()
              setOverColumn(status)
            }}
            onDragLeave={() => setOverColumn((current) => (current === status ? null : current))}
            onDrop={(event) => {
              event.preventDefault()
              const id = event.dataTransfer.getData('application/mind-map-node')
              if (id) updateNodeData(id, { status })
              setOverColumn(null)
            }}
          >
            <header className="flex items-center justify-between px-3 py-3">
              <h2 className="display text-[15px] font-semibold">{statusLabel(status)}</h2>
              <span className="rounded-full bg-[var(--panel-solid)] px-2 py-0.5 text-xs text-[var(--muted)]">
                {columnCards.length}
              </span>
            </header>
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-3">
              {columnCards.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] px-3 py-6 text-center text-xs text-[var(--muted)]">
                  Перетащите карточку сюда
                </div>
              ) : null}
              {columnCards.map((node) => (
                <BoardCard
                  key={node.id}
                  node={node}
                  selected={state.selectedNodeId === node.id}
                  onSelect={() => selectNode(node.id)}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function BoardCard({
  node,
  selected,
  onSelect,
}: {
  node: AppNode
  selected: boolean
  onSelect: () => void
}) {
  const { project } = useApp()
  const kind = requireKind(project.kinds, node.data.kind)
  const accent = node.data.accentColor || kind.color
  const fill = node.data.fillColor || 'var(--panel-solid)'

  return (
    <article
      aria-label={node.data.title}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('application/mind-map-node', node.id)
        event.dataTransfer.effectAllowed = 'move'
      }}
      onPointerDown={onSelect}
      className={`pressable cursor-grab rounded-[1rem] border p-3 ${
        selected ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/20' : 'border-[var(--border)]'
      }`}
      style={{ background: fill, boxShadow: `inset 3px 0 0 ${accent}` }}
    >
      <div className="flex items-start gap-2">
        <KindBadge kind={{ ...kind, color: accent }} size={24} />
        <div className="min-w-0">
          <div className="truncate text-[13px] font-medium tracking-[-0.01em]">{node.data.title}</div>
          <div className="truncate text-[11px] text-[var(--muted)]">{kind.name}</div>
          {node.data.path ? (
            <div className="mt-1 truncate font-mono text-[10px] text-[var(--muted)]">
              {node.data.path}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}
