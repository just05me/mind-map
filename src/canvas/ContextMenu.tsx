import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { supportsInlineTitle } from '../model/node-type'
import { useApp } from '../store/AppContext'
import type { KindId } from '../model/types'
import { Icon, type IconName } from '../ui/Icon'
import { MOD_KEY } from './shortcuts'

export type ContextMenuTarget =
  | { type: 'node'; id: string }
  | { type: 'edge'; id: string }
  | { type: 'pane' }

export type ContextMenuState = {
  client: { x: number; y: number }
  flow: { x: number; y: number }
  target: ContextMenuTarget
}

type Item =
  | { kind: 'action'; label: string; icon?: IconName; hint?: string; danger?: boolean; disabled?: boolean; run: () => void }
  | { kind: 'separator' }

export function ContextMenu({
  menu,
  onClose,
  onPlace,
}: {
  menu: ContextMenuState
  onClose: () => void
  onPlace: (kind: KindId, flow: { x: number; y: number }) => void
}) {
  const app = useApp()
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState(menu.client)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPosition({
      x: Math.min(menu.client.x, window.innerWidth - rect.width - 8),
      y: Math.min(menu.client.y, window.innerHeight - rect.height - 8),
    })
  }, [menu.client])

  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      if (ref.current && event.target instanceof Node && ref.current.contains(event.target)) return
      onClose()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('pointerdown', onPointer, true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('wheel', onClose, { passive: true })
    return () => {
      window.removeEventListener('pointerdown', onPointer, true)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('wheel', onClose)
    }
  }, [onClose])

  const items = buildItems(menu, app, onPlace)

  return (
    <div
      ref={ref}
      role="menu"
      className="chrome-heavy fixed z-50 min-w-[220px] rounded-2xl p-1 text-[13px]"
      style={{ left: position.x, top: position.y }}
      onContextMenu={(event) => event.preventDefault()}
    >
      {items.map((item, index) =>
        item.kind === 'separator' ? (
          <div key={`sep-${index}`} className="my-1 h-px bg-[var(--border)]" />
        ) : (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            className={`menu-item ${item.danger ? 'danger' : ''}`}
            onClick={() => {
              item.run()
              onClose()
            }}
          >
            <span className="flex w-4 justify-center opacity-80">
              {item.icon ? <Icon name={item.icon} size={15} /> : null}
            </span>
            <span className="flex-1">{item.label}</span>
            {item.hint ? <kbd className="kbd-hint">{item.hint}</kbd> : null}
          </button>
        ),
      )}
    </div>
  )
}

function buildItems(
  menu: ContextMenuState,
  app: ReturnType<typeof useApp>,
  onPlace: (kind: KindId, flow: { x: number; y: number }) => void,
): Item[] {
  const { target } = menu
  switch (target.type) {
    case 'node': {
      const node = app.project.nodes.find((item) => item.id === target.id)
      if (!node) return []
      const selectedIds = node.selected
        ? app.project.nodes.filter((item) => item.selected).map((item) => item.id)
        : [node.id]
      const many = selectedIds.length > 1
      return [
        ...(!many && supportsInlineTitle(node.type)
          ? [
              {
                kind: 'action' as const,
                label: 'Переименовать',
                icon: 'edit' as const,
                hint: 'Enter',
                run: () => {
                  app.selectNode(node.id)
                  app.setEditingNode(node.id, 'title')
                },
              },
            ]
          : []),
        {
          kind: 'action',
          label: many ? `Дублировать (${selectedIds.length})` : 'Дублировать',
          icon: 'copy',
          hint: `${MOD_KEY}D`,
          run: () => app.duplicateNodes(selectedIds),
        },
        {
          kind: 'action',
          label: 'Копировать',
          hint: `${MOD_KEY}C`,
          run: () => app.copyNodes(selectedIds),
        },
        ...(!many && node.parentId
          ? [
              {
                kind: 'action' as const,
                label: 'Вынести из рамки',
                icon: 'unlink' as const,
                run: () => app.detachFromGroup(node.id),
              },
            ]
          : []),
        { kind: 'separator' },
        {
          kind: 'action',
          label: many ? `Удалить (${selectedIds.length})` : 'Удалить',
          icon: 'trash',
          hint: 'Del',
          danger: true,
          run: () => app.deleteElements(selectedIds),
        },
      ]
    }
    case 'edge':
      return [
        {
          kind: 'action',
          label: 'Удалить связь',
          icon: 'trash',
          hint: 'Del',
          danger: true,
          run: () => app.deleteElements([], [target.id]),
        },
      ]
    case 'pane':
      return [
        {
          kind: 'action',
          label: 'Вставить сюда',
          hint: `${MOD_KEY}V`,
          disabled: !app.state.clipboard,
          run: () => app.paste(menu.flow),
        },
        { kind: 'separator' },
        { kind: 'action', label: 'Узел', icon: 'box', run: () => onPlace('module', menu.flow) },
        { kind: 'action', label: 'Стикер', icon: 'sticky', run: () => onPlace('note', menu.flow) },
        { kind: 'action', label: 'Текст', icon: 'text', run: () => onPlace('text', menu.flow) },
        { kind: 'action', label: 'Рамка', icon: 'frame', run: () => onPlace('frame', menu.flow) },
        { kind: 'separator' },
        {
          kind: 'action',
          label: 'Выделить всё',
          hint: `${MOD_KEY}A`,
          run: () => app.selectAll(),
        },
        { kind: 'action', label: 'Показать всё', icon: 'fit', hint: '⇧1', run: () => app.requestLayout('fit') },
      ]
    default: {
      const _never: never = target
      return _never
    }
  }
}
