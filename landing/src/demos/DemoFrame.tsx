import { useInView } from 'motion/react'
import { useRef, type ReactNode } from 'react'
import { Icon, type IconName } from '../ui/Icon'

const DOCK: IconName[] = ['cursor', 'box', 'sticky', 'frame', 'connect']

/**
 * Window-like shell around a demo: app-style top bar and bottom dock.
 * Reports viewport visibility so demos pause off screen.
 */
export function DemoFrame({
  title,
  view,
  children,
  dock = true,
  toolbar,
}: {
  title: string
  view?: 'map' | 'board'
  children: (active: boolean) => ReactNode
  dock?: boolean
  toolbar?: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const active = useInView(ref, { amount: 0.3 })

  return (
    <div ref={ref} className="chrome-heavy relative overflow-hidden rounded-frame">
      <div className="chrome-bar flex h-10 items-center justify-between gap-2 px-3 text-[12px]">
        <div className="flex min-w-0 items-center gap-1.5 text-muted">
          <Icon name="folder" size={14} />
          <span className="truncate font-semibold text-ink">{title}</span>
        </div>
        {toolbar ??
          (view ? (
            <div className="segmented" aria-hidden>
              <button type="button" tabIndex={-1} aria-pressed={view === 'map'}>
                <Icon name="map" size={13} />
                Схема
              </button>
              <button type="button" tabIndex={-1} aria-pressed={view === 'board'}>
                <Icon name="columns" size={13} />
                Статусы
              </button>
            </div>
          ) : null)}
      </div>
      <div className="relative">
        {children(active)}
        {dock ? (
          <div
            className="chrome pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-2xl p-1.5"
            aria-hidden
          >
            {DOCK.map((name, index) => (
              <span
                key={name}
                className={`grid h-8 w-8 place-items-center rounded-[0.7rem] ${index === 0 ? 'bg-accent text-white' : 'text-ink'}`}
              >
                <Icon name={name} size={15} />
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
