import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { parseImportedProject } from '../export/json'
import { useUiMotion } from '../lib/motion'
import { useApp } from '../store/AppContext'

export function ProjectMenu() {
  const {
    state,
    project,
    createProject,
    duplicateCurrent,
    deleteProject,
    switchProject,
    importProject,
  } = useApp()
  const [open, setOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const motionUi = useUiMotion()

  return (
    <div className="relative">
      <button
        type="button"
        className="pressable rounded-full border border-[var(--border)] bg-[var(--panel-solid)] px-3 py-1.5 text-sm"
        onPointerDown={() => setOpen((value) => !value)}
      >
        Проекты
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={motionUi.popEnter}
            animate={motionUi.popShown}
            exit={motionUi.popLeave}
            transition={motionUi.spring}
            style={{ transformOrigin: 'top left' }}
            className="chrome-heavy absolute left-0 top-full z-40 mt-2 w-72 rounded-[1.2rem] p-2"
          >
            <div className="max-h-56 space-y-1 overflow-y-auto">
              {state.projects.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onPointerDown={() => {
                    switchProject(item.id)
                    setOpen(false)
                  }}
                  className={`pressable flex w-full flex-col rounded-xl px-3 py-2 text-left ${
                    item.id === project.id ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--panel-muted)]'
                  }`}
                >
                  <span className="truncate text-sm">{item.title}</span>
                  <span className="text-[11px] text-[var(--muted)]">
                    {item.nodes.length} узлов · {new Date(item.updatedAt).toLocaleString('ru')}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1 border-t border-[var(--border)] pt-2">
              <button
                type="button"
                className="pressable rounded-lg px-2 py-1.5 text-xs hover:bg-[var(--panel-muted)]"
                onPointerDown={() => {
                  createProject()
                  setOpen(false)
                }}
              >
                Создать
              </button>
              <button
                type="button"
                className="pressable rounded-lg px-2 py-1.5 text-xs hover:bg-[var(--panel-muted)]"
                onPointerDown={() => {
                  duplicateCurrent()
                  setOpen(false)
                }}
              >
                Дублировать
              </button>
              <button
                type="button"
                className="pressable rounded-lg px-2 py-1.5 text-xs hover:bg-[var(--panel-muted)]"
                onPointerDown={() => fileRef.current?.click()}
              >
                Импорт JSON
              </button>
              <button
                type="button"
                className="pressable rounded-lg px-2 py-1.5 text-xs text-red-500 hover:bg-red-500/10"
                onPointerDown={() => {
                  deleteProject(project.id)
                  setOpen(false)
                }}
              >
                Удалить
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (!file) return
                const text = await file.text()
                importProject(parseImportedProject(text))
                setOpen(false)
              }}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
