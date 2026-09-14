import { useApp } from '../store/AppContext'
import type { CanvasTool } from '../types'

export function EmptyHint() {
  const { project, state } = useApp()
  if (project.nodes.length > 0) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center pt-20">
      <div className="chrome max-w-[340px] rounded-[1.25rem] px-5 py-4 text-center">
        <div className="display text-[15px] font-semibold">Пустая доска</div>
        <div className="mt-1 text-xs leading-5 text-[var(--muted)]">
          {emptyMessage(state.canvasTool, Boolean(state.pendingKind))}
        </div>
      </div>
    </div>
  )
}

function emptyMessage(tool: CanvasTool, hasKind: boolean): string {
  switch (tool) {
    case 'text':
      return 'Кликните по холсту и сразу пишите. Escape — закончить.'
    case 'frame':
      return 'Кликните, чтобы поставить рамку-секцию.'
    case 'connect':
      return 'Сначала выберите узел, затем второй — появится связь.'
    case 'add':
      return 'Кликните по холсту, чтобы поставить выбранный тип.'
    case 'pan':
      return 'Перетаскивайте холст. V — вернуться к выбору.'
    case 'select':
      return hasKind
        ? 'Кликните по холсту или потяните связь с узла — появится новый элемент.'
        : 'Двойной клик пишет текст. Выберите тип слева или инструмент сверху: узел, текст, рамка, связь.'
    default: {
      const _never: never = tool
      return _never
    }
  }
}
