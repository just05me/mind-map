import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { KindBadge } from '../canvas/nodes/KindBadge'
import { useUiMotion } from '../lib/motion'
import { KIND_GROUPS, createCustomKind, kindsInGroup, type KindGroupId } from '../model/kinds'
import type { KindDef } from '../model/types'
import { useApp } from '../store/AppContext'
import { Icon } from './Icon'

export function Palette() {
  const { project, state, setPendingKind, addCustomKind } = useApp()
  const [formOpen, setFormOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [name, setName] = useState('')
  const [letter, setLetter] = useState('')
  const [color, setColor] = useState('#8e8e93')
  const [collapsed, setCollapsed] = useState<Partial<Record<KindGroupId, boolean>>>({})
  const motionUi = useUiMotion()
  const needle = query.trim().toLowerCase()

  const renderKind = (kind: KindDef) => {
    const active = state.pendingKind === kind.id
    return (
      <button
        key={kind.id}
        type="button"
        draggable
        onDragStart={(event) => {
          event.dataTransfer.setData('application/mind-map-kind', kind.id)
          event.dataTransfer.effectAllowed = 'copy'
        }}
        onClick={() => setPendingKind(active ? null : kind.id)}
        title="Кликните и поставьте на холст, или перетащите"
        className={`pressable flex w-full cursor-grab items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] active:cursor-grabbing ${
          active ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'hover:bg-[var(--panel-muted)]'
        }`}
      >
        <KindBadge kind={kind} size={20} shape="square" />
        <span className="truncate">{kind.name}</span>
      </button>
    )
  }

  return (
    <>
      <div className="px-2 pt-2">
        <label className="flex items-center gap-2 rounded-lg bg-[var(--panel-muted)] px-2 py-1.5 text-[var(--muted)] focus-within:ring-1 focus-within:ring-[var(--accent)]">
          <Icon name="search" size={14} />
          <input
            className="w-full bg-transparent text-[12px] text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
            placeholder="Найти тип"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query ? (
            <button type="button" aria-label="Очистить" onClick={() => setQuery('')}>
              <Icon name="close" size={12} />
            </button>
          ) : null}
        </label>
      </div>
      <div className="flex-1 space-y-1 px-2 py-2">
        {KIND_GROUPS.map((group) => {
          const kinds = kindsInGroup(project.kinds, group).filter(
            (kind) => !needle || kind.name.toLowerCase().includes(needle),
          )
          if (kinds.length === 0) return null
          const hidden = !needle && Boolean(collapsed[group.id])
          return (
            <section key={group.id}>
              <button
                type="button"
                className="flex w-full items-center gap-1 rounded-md px-1 py-1 text-[11px] font-medium text-[var(--muted)] hover:text-[var(--text)]"
                aria-expanded={!hidden}
                onClick={() =>
                  setCollapsed((current) => ({ ...current, [group.id]: !current[group.id] }))
                }
              >
                <Icon
                  name="chevronDown"
                  size={12}
                  className={`transition-transform ${hidden ? '-rotate-90' : ''}`}
                />
                <span>{group.title}</span>
                <span className="ml-auto opacity-60">{kinds.length}</span>
              </button>
              {hidden ? null : <div className="space-y-px">{kinds.map(renderKind)}</div>}
            </section>
          )
        })}
      </div>
      <div className="sticky bottom-0 border-t border-[var(--border)] bg-[var(--panel-solid)] p-2">
        <AnimatePresence initial={false} mode="wait">
          {formOpen ? (
            <motion.form
              key="form"
              initial={motionUi.popEnter}
              animate={motionUi.popShown}
              exit={motionUi.popLeave}
              transition={motionUi.spring}
              className="space-y-2"
              onSubmit={(event) => {
                event.preventDefault()
                addCustomKind(createCustomKind({ name, letter, color }))
                setName('')
                setLetter('')
                setFormOpen(false)
              }}
            >
              <input
                autoFocus
                className="field text-xs"
                placeholder="Название типа"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <div className="flex gap-2">
                <input
                  className="field w-16 text-xs"
                  placeholder="Буква"
                  maxLength={2}
                  value={letter}
                  onChange={(event) => setLetter(event.target.value)}
                />
                <input
                  type="color"
                  aria-label="Цвет типа"
                  className="h-8 flex-1 cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--panel-solid)]"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">
                  Добавить
                </button>
                <button type="button" className="btn-ghost" onClick={() => setFormOpen(false)}>
                  Отмена
                </button>
              </div>
            </motion.form>
          ) : (
            <button
              key="open"
              type="button"
              className="pressable flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--border)] px-2 py-1.5 text-xs text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              onClick={() => setFormOpen(true)}
            >
              <Icon name="plus" size={13} />
              Свой тип
            </button>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
