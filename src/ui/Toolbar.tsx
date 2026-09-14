import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { exportProjectJson } from '../export/json'
import { exportProjectMarkdown } from '../export/markdown'
import { exportMapPng } from '../export/png'
import { isStatusBoardType } from '../lib/node-type'
import { useUiMotion } from '../lib/motion'
import { STATUSES, statusLabel } from '../lib/status'
import { useApp } from '../store/AppContext'
import type { LayoutCommand, ViewMode } from '../types'
import { ProjectMenu } from './ProjectMenu'

export function Toolbar() {
  const { project, state, setView, setTheme, renameProject, requestLayout } = useApp()
  const [exportOpen, setExportOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const motionUi = useUiMotion()

  const statusCounts = STATUSES.map((status) => ({
    status,
    count: project.nodes.filter((node) => isStatusBoardType(node.type) && node.data.status === status).length,
  }))

  const kindCounts = project.kinds
    .map((kind) => ({
      kind,
      count: project.nodes.filter((node) => node.data.kind === kind.id && isStatusBoardType(node.type)).length,
    }))
    .filter((item) => item.count > 0)
    .slice(0, 4)

  return (
    <header className="chrome-bar relative z-30 flex h-[58px] shrink-0 items-center gap-3 px-3">
      <ProjectMenu />
      <div className="min-w-[160px] flex-1">
        <input
          className="display w-full bg-transparent text-[15px] font-semibold outline-none"
          value={project.title}
          onChange={(event) => renameProject(event.target.value, project.description)}
        />
        <input
          className="w-full bg-transparent text-[11px] text-[var(--muted)] outline-none"
          placeholder="Описание проекта"
          value={project.description ?? ''}
          onChange={(event) => renameProject(project.title, event.target.value)}
        />
      </div>

      <ViewToggle view={state.view} onChange={setView} />

      <div className="hidden items-center gap-1 xl:flex">
        {kindCounts.map((item) => (
          <span
            key={item.kind.id}
            className="rounded-full border border-[var(--border)] bg-[var(--panel-solid)] px-2 py-0.5 text-[11px] text-[var(--muted)]"
          >
            {item.count} {item.kind.name.toLowerCase()}
          </span>
        ))}
        {statusCounts.map((item) => (
          <span
            key={item.status}
            className="rounded-full border border-[var(--border)] bg-[var(--panel-solid)] px-2 py-0.5 text-[11px] text-[var(--muted)]"
          >
            {item.count} {statusLabel(item.status).toLowerCase()}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-1">
        {(['horizontal', 'vertical', 'fit'] as const).map((command) => (
          <button
            key={command}
            type="button"
            className="pressable rounded-full border border-[var(--border)] bg-[var(--panel-solid)] px-2.5 py-1 text-[12px]"
            onPointerDown={() => requestLayout(command)}
          >
            {layoutLabel(command)}
          </button>
        ))}
      </div>

      <div className="relative">
        <button
          type="button"
          className="pressable rounded-full border border-[var(--border)] bg-[var(--panel-solid)] px-2.5 py-1 text-[12px]"
          onPointerDown={() => setExportOpen((value) => !value)}
        >
          Экспорт
        </button>
        <AnimatePresence>
          {exportOpen ? (
            <motion.div
              initial={motionUi.popEnter}
              animate={motionUi.popShown}
              exit={motionUi.popLeave}
              transition={motionUi.spring}
              style={{ transformOrigin: 'top right' }}
              className="chrome-heavy absolute right-0 top-full z-40 mt-2 w-40 rounded-2xl p-1"
            >
              <button
                type="button"
                className="pressable w-full rounded-xl px-3 py-1.5 text-left text-xs hover:bg-[var(--panel-muted)]"
                onPointerDown={() => {
                  exportProjectJson(project)
                  setExportOpen(false)
                }}
              >
                JSON
              </button>
              <button
                type="button"
                className="pressable w-full rounded-xl px-3 py-1.5 text-left text-xs hover:bg-[var(--panel-muted)]"
                onPointerDown={() => {
                  exportProjectMarkdown(project)
                  setExportOpen(false)
                }}
              >
                Markdown
              </button>
              <button
                type="button"
                className="pressable w-full rounded-xl px-3 py-1.5 text-left text-xs hover:bg-[var(--panel-muted)]"
                onPointerDown={() => {
                  void exportMapPng(project, state.theme).catch((err: unknown) =>
                    setError(err instanceof Error ? err.message : 'Ошибка PNG'),
                  )
                  setExportOpen(false)
                }}
              >
                PNG карты
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <button
        type="button"
        className="pressable rounded-full border border-[var(--border)] bg-[var(--panel-solid)] px-2.5 py-1 text-[12px]"
        onPointerDown={() => setTheme(state.theme === 'dark' ? 'light' : 'dark')}
      >
        {state.theme === 'dark' ? 'Светлая' : 'Тёмная'}
      </button>
      {error ? <span className="text-[11px] text-red-500">{error}</span> : null}
    </header>
  )
}

function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (view: ViewMode) => void }) {
  return (
    <div className="flex rounded-full border border-[var(--border)] bg-[var(--panel-solid)] p-0.5">
      {(['map', 'board'] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onPointerDown={() => onChange(mode)}
          className={`pressable rounded-full px-3 py-1 text-[12px] ${
            view === mode ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)]'
          }`}
        >
          {mode === 'map' ? 'Карта' : 'Доска'}
        </button>
      ))}
    </div>
  )
}

function layoutLabel(command: LayoutCommand): string {
  switch (command) {
    case 'horizontal':
      return 'Горизонт'
    case 'vertical':
      return 'Вертикаль'
    case 'fit':
      return 'Вписать'
    default: {
      const _never: never = command
      return _never
    }
  }
}
