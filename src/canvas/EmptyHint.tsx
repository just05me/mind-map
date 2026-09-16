import { useReactFlow } from '@xyflow/react'
import { useEffect, useRef, useState } from 'react'
import { createNodeAt } from './create-node'
import { MOD_KEY } from './shortcuts'
import { buildImportPrompt } from '../export/ai-prompt'
import { copyText } from '../export/clipboard'
import { parseImportedProject } from '../export/json'
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
  const { project, state, addNode, importProject, setShortcutsOpen } = useApp()
  const { screenToFlowPosition } = useReactFlow()
  const fileRef = useRef<HTMLInputElement>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(null), 2400)
    return () => window.clearTimeout(timer)
  }, [notice])

  if (project.nodes.length > 0 || state.canvasTool !== 'select' || state.interactionMode === 'view') return null

  const addInCenter = (kind: KindId) => {
    const center = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
    const offset = nodeTypeForKind(kind) === 'frame' ? { x: 210, y: 160 } : { x: 110, y: 40 }
    addNode(createNodeAt(project, kind, { x: center.x - offset.x, y: center.y - offset.y }), {
      edit: nodeTypeForKind(kind) !== 'frame',
    })
  }

  const copyPrompt = () => {
    setError(null)
    void copyText(buildImportPrompt(project))
      .then(() => setNotice('Промпт скопирован'))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Не удалось скопировать'))
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
        <div className="mt-4 border-t border-[var(--border)] pt-3">
          <div className="text-[11px] text-[var(--muted)]">Или соберите доску целиком из JSON</div>
          <div className="mt-2 flex flex-col gap-2">
            <button
              type="button"
              className="pressable flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--panel-solid)] px-2 py-2 text-[12px] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              onClick={() => fileRef.current?.click()}
            >
              <Icon name="folder" size={15} />
              Импортировать макет (JSON)
            </button>
            <button
              type="button"
              className="pressable flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--panel-solid)] px-2 py-2 text-[12px] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              onClick={copyPrompt}
            >
              <Icon name="copy" size={15} />
              Скопировать промпт для ИИ
            </button>
          </div>
          {error ? (
            <div className="mt-2 text-[11px] text-red-500">{error}</div>
          ) : notice ? (
            <div className="mt-2 text-[11px] text-[var(--accent)]">{notice}</div>
          ) : (
            <div className="mt-2 text-[11px] text-[var(--muted)]">
              Промпт попросит ИИ собрать JSON под этот проект
            </div>
          )}
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
            setError(null)
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Не удалось прочитать файл')
          }
        }}
      />
    </div>
  )
}
