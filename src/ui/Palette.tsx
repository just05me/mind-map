import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { KindBadge } from '../canvas/nodes/KindBadge'
import { KIND_GROUPS, createCustomKind, kindsInGroup } from '../kinds/catalog'
import { useUiMotion } from '../lib/motion'
import { useApp } from '../store/AppContext'
import type { KindGroupId } from '../kinds/catalog'

export function Palette() {
  const { project, state, setPendingKind, addCustomKind } = useApp()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [letter, setLetter] = useState('')
  const [color, setColor] = useState('#8e8e93')
  const [collapsed, setCollapsed] = useState<Partial<Record<KindGroupId, boolean>>>({})
  const motionUi = useUiMotion()

  return (
    <aside className="chrome-heavy flex h-full w-[212px] flex-col overflow-hidden rounded-[1.35rem]">
      <div className="px-3 pt-3 pb-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
          Палитра
        </div>
        <div className="mt-0.5 text-[11px] text-[var(--muted)]">
          Группы по смыслу. Перетащите или выберите.
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-3">
        {KIND_GROUPS.map((group) => {
          const kinds = kindsInGroup(project.kinds, group)
          if (kinds.length === 0) return null
          const hidden = Boolean(collapsed[group.id])
          return (
            <section key={group.id}>
              <button
                type="button"
                className="pressable mb-1 flex w-full items-center justify-between px-1 text-[11px] font-medium text-[var(--muted)]"
                onPointerDown={() =>
                  setCollapsed((current) => ({ ...current, [group.id]: !current[group.id] }))
                }
              >
                <span>{group.title}</span>
                <span>{hidden ? '+' : '–'}</span>
              </button>
              {hidden ? null : (
                <div className="space-y-0.5">
                  {kinds.map((kind) => {
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
                        onPointerDown={() => setPendingKind(active ? null : kind.id)}
                        className={`pressable flex w-full items-center gap-2 rounded-[0.85rem] px-2 py-1.5 text-left text-[13px] ${
                          active
                            ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                            : 'hover:bg-[var(--panel-muted)]'
                        }`}
                      >
                        <KindBadge kind={kind} size={22} />
                        <span className="truncate">{kind.name}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </section>
          )
        })}
      </div>
      <div className="border-t border-[var(--border)] p-2">
        <AnimatePresence initial={false}>
          {open ? (
            <motion.form
              initial={motionUi.popEnter}
              animate={motionUi.popShown}
              exit={motionUi.popLeave}
              transition={motionUi.spring}
              className="space-y-2"
              style={{ transformOrigin: 'bottom center' }}
              onSubmit={(event) => {
                event.preventDefault()
                addCustomKind(createCustomKind({ name, letter, color }))
                setName('')
                setLetter('')
                setOpen(false)
              }}
            >
              <input
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
                  className="h-8 flex-1 rounded-lg border border-[var(--border)] bg-[var(--panel-solid)]"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="pressable flex-1 rounded-lg bg-[var(--accent)] px-2 py-1 text-xs text-white">
                  Добавить
                </button>
                <button
                  type="button"
                  className="pressable rounded-lg px-2 py-1 text-xs text-[var(--muted)]"
                  onClick={() => setOpen(false)}
                >
                  Отмена
                </button>
              </div>
            </motion.form>
          ) : (
            <button
              type="button"
              className="pressable w-full rounded-xl border border-dashed border-[var(--border)] px-2 py-2 text-xs text-[var(--muted)]"
              onPointerDown={() => setOpen(true)}
            >
              + Свой тип
            </button>
          )}
        </AnimatePresence>
      </div>
    </aside>
  )
}
