import { useState } from 'react'
import { exportProjectJson } from '../export/json'
import { exportProjectMarkdown } from '../export/markdown'
import { exportMapPng } from '../export/png'
import { useApp } from '../store/AppContext'
import type { ViewMode } from '../types'
import { Dropdown } from './Dropdown'
import { Icon, type IconName } from './Icon'
import { ProjectMenu } from './ProjectMenu'

export function Toolbar() {
  const { project, state, setView, setTheme, renameProject, requestLayout, setShortcutsOpen, toggleAllPanels } =
    useApp()
  const [error, setError] = useState<string | null>(null)
  const panelsHidden = !state.leftPanelOpen && !state.rightPanelOpen

  return (
    <header className="chrome-bar relative z-30 grid h-12 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 px-2">
      <div className="flex min-w-0 items-center gap-1">
        <ProjectMenu />
        <span className="text-[var(--muted)]">/</span>
        <input
          className="min-w-0 max-w-[320px] flex-1 truncate rounded-md bg-transparent px-1.5 py-1 text-[13px] font-semibold outline-none hover:bg-[var(--panel-muted)] focus:bg-[var(--panel-muted)]"
          value={project.title}
          aria-label="Название проекта"
          onChange={(event) => renameProject(event.target.value, project.description)}
        />
      </div>

      <ViewToggle view={state.view} onChange={setView} />

      <div className="flex items-center justify-end gap-1">
        {error ? (
          <button type="button" className="mr-2 text-[11px] text-red-500" onClick={() => setError(null)}>
            {error} ✕
          </button>
        ) : null}

        {state.view === 'map' ? (
          <Dropdown
            align="right"
            trigger={({ toggle, open }) => (
              <button type="button" className={`bar-btn ${open ? 'is-active' : ''}`} onClick={toggle}>
                <Icon name="layout" size={15} />
                <span className="hidden md:inline">Упорядочить</span>
              </button>
            )}
          >
            {(close) => (
              <>
                <MenuButton icon="columns" label="Выстроить слева направо" onClick={() => { requestLayout('horizontal'); close() }} />
                <MenuButton icon="layout" label="Выстроить сверху вниз" onClick={() => { requestLayout('vertical'); close() }} />
                <MenuButton icon="fit" label="Показать всё" hint="⇧1" onClick={() => { requestLayout('fit'); close() }} />
              </>
            )}
          </Dropdown>
        ) : null}

        <Dropdown
          align="right"
          trigger={({ toggle, open }) => (
            <button type="button" className={`bar-btn ${open ? 'is-active' : ''}`} onClick={toggle}>
              <Icon name="download" size={15} />
              <span className="hidden md:inline">Экспорт</span>
            </button>
          )}
        >
          {(close) => (
            <>
              <MenuButton label="PNG — картинка карты" onClick={() => {
                void exportMapPng(project, state.theme).catch((err: unknown) =>
                  setError(err instanceof Error ? err.message : 'Ошибка PNG'),
                )
                close()
              }} />
              <MenuButton label="Markdown — текстом" onClick={() => { exportProjectMarkdown(project); close() }} />
              <MenuButton label="JSON — для импорта" onClick={() => { exportProjectJson(project); close() }} />
            </>
          )}
        </Dropdown>

        <span className="toolbar-sep" />

        <button
          type="button"
          className={`icon-btn ${panelsHidden ? 'is-active' : ''}`}
          data-tip={panelsHidden ? 'Показать панели · ⌘\\' : 'Скрыть панели · ⌘\\'}
          aria-label={panelsHidden ? 'Показать панели · ⌘\\' : 'Скрыть панели · ⌘\\'}
          data-tip-side="bottom"
          onClick={toggleAllPanels}
        >
          <Icon name="panelLeft" />
        </button>
        <button
          type="button"
          className="icon-btn"
          data-tip={state.theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          aria-label={state.theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          data-tip-side="bottom"
          onClick={() => setTheme(state.theme === 'dark' ? 'light' : 'dark')}
        >
          <Icon name={state.theme === 'dark' ? 'sun' : 'moon'} />
        </button>
        <button
          type="button"
          className="icon-btn"
          data-tip="Горячие клавиши · ?"
          aria-label="Горячие клавиши · ?"
          data-tip-side="bottom"
          onClick={() => setShortcutsOpen(true)}
        >
          <Icon name="keyboard" />
        </button>
      </div>
    </header>
  )
}

export function MenuButton({
  label,
  icon,
  hint,
  danger,
  onClick,
}: {
  label: string
  icon?: IconName
  hint?: string
  danger?: boolean
  onClick: () => void
}) {
  return (
    <button type="button" role="menuitem" className={`menu-item ${danger ? 'danger' : ''}`} onClick={onClick}>
      {icon ? <Icon name={icon} size={15} className="opacity-80" /> : null}
      <span className="flex-1">{label}</span>
      {hint ? <kbd className="kbd-hint">{hint}</kbd> : null}
    </button>
  )
}

function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (view: ViewMode) => void }) {
  return (
    <div className="segmented" role="tablist">
      {(['map', 'board'] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          role="tab"
          aria-pressed={view === mode}
          aria-selected={view === mode}
          onClick={() => onChange(mode)}
        >
          <Icon name={mode === 'map' ? 'map' : 'columns'} size={14} />
          {mode === 'map' ? 'Схема' : 'Статусы'}
        </button>
      ))}
    </div>
  )
}
