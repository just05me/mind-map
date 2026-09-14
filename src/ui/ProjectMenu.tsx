import { useRef, useState } from 'react'
import { parseImportedProject } from '../export/json'
import { useApp } from '../store/AppContext'
import { Dropdown } from './Dropdown'
import { Icon } from './Icon'
import { MenuButton } from './Toolbar'

export function ProjectMenu() {
  const { state, project, createProject, duplicateCurrent, deleteProject, switchProject, importProject } = useApp()
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  return (
    <>
      <Dropdown
        width="w-72"
        trigger={({ toggle, open }) => (
          <button
            type="button"
            className={`bar-btn ${open ? 'is-active' : ''}`}
            onClick={() => {
              setConfirmDelete(false)
              setImportError(null)
              toggle()
            }}
          >
            <Icon name="folder" size={15} />
            Проекты
            <Icon name="chevronDown" size={12} className="opacity-60" />
          </button>
        )}
      >
        {(close) => (
          <>
            <div className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold text-[var(--muted)]">
              Мои проекты · {state.projects.length}
            </div>
            <div className="max-h-64 space-y-px overflow-y-auto">
              {state.projects.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    switchProject(item.id)
                    close()
                  }}
                  className={`flex w-full flex-col rounded-xl px-2.5 py-1.5 text-left ${
                    item.id === project.id ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--panel-muted)]'
                  }`}
                >
                  <span className="truncate text-[13px]">{item.title || 'Без названия'}</span>
                  <span className="text-[11px] text-[var(--muted)]">
                    {item.nodes.length} элементов · {new Date(item.updatedAt).toLocaleDateString('ru')}
                  </span>
                </button>
              ))}
            </div>
            <div className="my-1 h-px bg-[var(--border)]" />
            <MenuButton icon="plus" label="Новый проект" onClick={() => { createProject(); close() }} />
            <MenuButton icon="copy" label="Дублировать текущий" onClick={() => { duplicateCurrent(); close() }} />
            <MenuButton icon="folder" label="Импорт из JSON…" onClick={() => fileRef.current?.click()} />
            {importError ? <div className="px-2.5 py-1 text-[11px] text-red-500">{importError}</div> : null}
            <div className="my-1 h-px bg-[var(--border)]" />
            {confirmDelete ? (
              <div className="flex items-center gap-1 px-1 py-1">
                <span className="flex-1 px-1.5 text-[12px]">Удалить «{project.title}»?</span>
                <button
                  type="button"
                  className="rounded-lg bg-red-500 px-2 py-1 text-[12px] text-white"
                  onClick={() => {
                    deleteProject(project.id)
                    setConfirmDelete(false)
                    close()
                  }}
                >
                  Удалить
                </button>
                <button type="button" className="btn-ghost" onClick={() => setConfirmDelete(false)}>
                  Нет
                </button>
              </div>
            ) : (
              <MenuButton icon="trash" label="Удалить текущий" danger onClick={() => setConfirmDelete(true)} />
            )}
          </>
        )}
      </Dropdown>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (!file) return
          try {
            importProject(parseImportedProject(await file.text()))
            setImportError(null)
          } catch (err) {
            setImportError(err instanceof Error ? err.message : 'Не удалось прочитать файл')
          }
        }}
      />
    </>
  )
}
