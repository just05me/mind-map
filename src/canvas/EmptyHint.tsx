import { useReactFlow } from '@xyflow/react'
import { createNodeAt } from './create-node'
import { MOD_KEY } from './shortcuts'
import { nodeTypeForKind } from '../model/node-type'
import { useApp } from '../store/AppContext'
import type { KindId } from '../model/types'
import { Icon, type IconName } from '../ui/Icon'

const QUICK_START: { kind: KindId; label: string; icon: IconName }[] = [
  { kind: 'module', label: 'Узел', icon: 'box' },
  { kind: 'note', label: 'Стикер', icon: 'sticky' },
  { kind: 'text', label: 'Текст', icon: 'text' },
  { kind: 'frame', label: 'Рамка', icon: 'frame' },
]

export function EmptyHint() {
  const { project, state, addNode, setShortcutsOpen } = useApp()
  const { screenToFlowPosition } = useReactFlow()
  if (project.nodes.length > 0 || state.canvasTool !== 'select') return null

  const addInCenter = (kind: KindId) => {
    const center = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
    const offset = nodeTypeForKind(kind) === 'frame' ? { x: 210, y: 160 } : { x: 110, y: 40 }
    addNode(createNodeAt(project, kind, { x: center.x - offset.x, y: center.y - offset.y }), {
      edit: nodeTypeForKind(kind) !== 'frame',
    })
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center pb-16">
      <div className="chrome-heavy pointer-events-auto w-[380px] rounded-[1.4rem] px-6 py-5 text-center">
        <div className="display text-[17px] font-semibold">С чего начнём?</div>
        <p className="mt-1 text-[12px] leading-5 text-[var(--muted)]">
          Добавьте первый элемент или перетащите тип из панели «Элементы».
        </p>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {QUICK_START.map((item) => (
            <button
              key={item.kind}
              type="button"
              className="pressable flex flex-col items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--panel-solid)] px-2 py-3 text-[12px] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              onClick={() => addInCenter(item.kind)}
            >
              <Icon name={item.icon} size={20} />
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-1 text-[11px] text-[var(--muted)]">
          <div>Двойной клик по холсту — текст · Правая кнопка — меню</div>
          <div>
            Потяните от края узла — появится связь и новый узел ·{' '}
            <button type="button" className="underline hover:text-[var(--text)]" onClick={() => setShortcutsOpen(true)}>
              все клавиши
            </button>{' '}
            ({MOD_KEY}Z — отменить)
          </div>
        </div>
      </div>
    </div>
  )
}
