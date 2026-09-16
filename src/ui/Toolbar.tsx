import { useEffect, useState } from 'react'
import { buildImportPrompt } from '../export/ai-prompt'
import { copyText } from '../export/clipboard'
import { exportProjectJson } from '../export/json'
import { exportProjectMarkdown } from '../export/markdown'
import { exportMapPng } from '../export/png'
import { useApp } from '../store/AppContext'
import type { ViewMode } from '../model/types'
import { AccountMenu } from './AccountMenu'
import { Dropdown } from './Dropdown'
import { Icon } from './Icon'
import { MenuButton } from './MenuButton'
import { ProjectMenu } from './ProjectMenu'

export function Toolbar() {
  const { project, state, setView, setInteractionMode, setTheme, renameProject, requestLayout, setShortcutsOpen, toggleAllPanels } =
    useApp()
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const panelsHidden = !state.leftPanelOpen && !state.rightPanelOpen
  const readOnly = state.interactionMode === 'view'

  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(null), 2400)
    return () => window.clearTimeout(timer)
  }, [notice])

  const copyPrompt = () => {
    setError(null)
    void copyText(buildImportPrompt(project))
      .then(() => setNotice('Промпт скопирован'))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Не удалось скопировать'))
  }

  return (
    <header className="chrome-bar relative z-30 grid h-12 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 px-2">
      <div className="flex min-w-0 items-center gap-1">
        <ProjectMenu />
        <span className="text-[var(--muted)]">/</span>
        <input
          className="min-w-0 max-w-[320px] flex-1 truncate rounded-md bg-transparent px-1.5 py-1 text-[13px] font-semibold outline-none hover:bg-[var(--panel-muted)] focus:bg-[var(--panel-muted)]"
          value={project.title}
          aria-label="Название проекта"
          readOnly={readOnly}
          onChange={(event) => renameProject(event.target.value, project.description)}
        />
      </div>

      <ViewToggle view={state.view} onChange={setView} />

      <div className="flex items-center justify-end gap-1">
        {error ? (
          <button type="button" className="mr-2 text-[11px] text-red-500" onClick={() => setError(null)}>
            {error} ✕
          </button>
        ) : notice ? (
          <span className="mr-2 text-[11px] text-[var(--accent)]">{notice}</span>
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

        <button
          type="button"
          className={`bar-btn ${readOnly ? 'is-active' : ''}`}
          data-tip={readOnly ? 'Вернуться к правке' : 'Только смотреть и выбирать'}
          aria-label={readOnly ? 'Режим просмотра включён' : 'Включить режим просмотра'}
          data-tip-side="bottom"
          onClick={() => setInteractionMode(readOnly ? 'edit' : 'view')}
        >
          <Icon name="eye" size={15} />
          <span className="hidden md:inline">{readOnly ? 'Просмотр' : 'Правка'}</span>
        </button>

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
              <div className="my-1 h-px bg-[var(--border)]" />
              <MenuButton
                icon="copy"
                label="Промпт для ИИ — в буфер"
                onClick={() => { copyPrompt(); close() }}
              />
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
        <AccountMenu />
      </div>
    </header>
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
