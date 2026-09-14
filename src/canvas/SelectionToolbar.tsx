import { NodeToolbar, Position } from '@xyflow/react'
import { requireKind } from '../kinds/catalog'
import { supportsInlineTitle } from '../lib/node-type'
import { useApp } from '../store/AppContext'
import { Icon } from '../ui/Icon'

export const QUICK_COLORS = ['#0a84ff', '#30d158', '#ff9f0a', '#ff453a', '#bf5af2', '#8e8e93']

/** Figma-style floating actions above the current selection. */
export function SelectionToolbar() {
  const {
    project,
    state,
    updateNodeData,
    duplicateNodes,
    deleteElements,
    setEditingNode,
    detachFromGroup,
  } = useApp()
  const selected = project.nodes.filter((node) => node.selected)
  const dragging = selected.some((node) => node.dragging)

  if (selected.length === 0 || state.editingNodeId || state.canvasTool === 'pan') return null

  const ids = selected.map((node) => node.id)
  const single = selected.length === 1 ? selected[0] : null
  const currentColor = single
    ? (single.data.accentColor ?? requireKind(project.kinds, single.data.kind).color)
    : null
  const colorable = selected.every((node) => node.type !== 'text')

  return (
    <NodeToolbar nodeId={ids} isVisible={!dragging} position={Position.Top} offset={12}>
      <div className="chrome-heavy flex items-center gap-0.5 rounded-full p-1">
        {selected.length > 1 ? (
          <span className="px-2 text-[12px] text-[var(--muted)]">{selected.length} выбрано</span>
        ) : null}
        {colorable ? (
          <div className="flex items-center gap-1 px-1.5">
            {QUICK_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Цвет ${color}`}
                className={`swatch ${currentColor === color ? 'is-active' : ''}`}
                style={{ background: color }}
                onClick={() => {
                  for (const id of ids) updateNodeData(id, { accentColor: color })
                }}
              />
            ))}
          </div>
        ) : null}
        {colorable ? <span className="toolbar-sep" /> : null}
        {single && supportsInlineTitle(single.type) ? (
          <button
            type="button"
            className="icon-btn"
            data-tip="Переименовать · Enter"
            aria-label="Переименовать · Enter"
            onClick={() => setEditingNode(single.id, 'title')}
          >
            <Icon name="edit" />
          </button>
        ) : null}
        {single?.parentId ? (
          <button
            type="button"
            className="icon-btn"
            data-tip="Вынести из рамки"
            aria-label="Вынести из рамки"
            onClick={() => detachFromGroup(single.id)}
          >
            <Icon name="unlink" />
          </button>
        ) : null}
        <button
          type="button"
          className="icon-btn"
          data-tip="Дублировать · ⌘D"
          aria-label="Дублировать · ⌘D"
          onClick={() => duplicateNodes(ids)}
        >
          <Icon name="copy" />
        </button>
        <button
          type="button"
          className="icon-btn danger"
          data-tip="Удалить · Delete"
          aria-label="Удалить · Delete"
          onClick={() => deleteElements(ids)}
        >
          <Icon name="trash" />
        </button>
      </div>
    </NodeToolbar>
  )
}
