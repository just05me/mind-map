import { useReactFlow, useViewport } from '@xyflow/react'
import { useApp } from '../store/AppContext'
import { Icon } from '../ui/Icon'

export function ZoomControls() {
  const { zoomIn, zoomOut, zoomTo, fitView } = useReactFlow()
  const { zoom } = useViewport()
  const { state, togglePanel } = useApp()

  return (
    <div className="chrome-heavy flex items-center gap-0.5 rounded-xl p-1">
      <button
        type="button"
        className={`icon-btn ${state.minimapOpen ? 'is-active' : ''}`}
        data-tip="Мини-карта"
        aria-label="Мини-карта"
        data-tip-side="top"
        onClick={() => togglePanel('minimap')}
      >
        <Icon name="minimap" />
      </button>
      <span className="toolbar-sep" />
      <button
        type="button"
        className="icon-btn"
        data-tip="Уменьшить"
        aria-label="Уменьшить"
        data-tip-side="top"
        onClick={() => void zoomOut({ duration: 160 })}
      >
        <span className="text-[16px] leading-none">−</span>
      </button>
      <button
        type="button"
        className="min-w-[48px] rounded-lg px-1 py-1 text-[12px] tabular-nums hover:bg-[var(--panel-muted)]"
        data-tip="Масштаб 100%"
        aria-label="Масштаб 100%"
        data-tip-side="top"
        onClick={() => void zoomTo(1, { duration: 200 })}
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        className="icon-btn"
        data-tip="Увеличить"
        aria-label="Увеличить"
        data-tip-side="top"
        onClick={() => void zoomIn({ duration: 160 })}
      >
        <Icon name="plus" size={15} />
      </button>
      <button
        type="button"
        className="icon-btn"
        data-tip="Показать всё · ⇧1"
        aria-label="Показать всё · ⇧1"
        data-tip-side="top"
        onClick={() => void fitView({ padding: 0.18, duration: 300, maxZoom: 1.2 })}
      >
        <Icon name="fit" />
      </button>
    </div>
  )
}
