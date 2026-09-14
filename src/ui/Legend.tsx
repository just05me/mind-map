import { requireKind } from '../kinds/catalog'
import { STATUSES, statusClass, statusLabel } from '../lib/status'
import { useApp } from '../store/AppContext'

export function Legend() {
  const { project } = useApp()
  const used = new Set(project.nodes.map((node) => node.data.kind))
  const kinds = project.kinds.filter((kind) => used.has(kind.id)).slice(0, 10)

  if (kinds.length === 0) return null

  return (
    <div className="chrome pointer-events-auto rounded-[1.15rem] px-3 py-2.5">
      <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]">
        На карте
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {kinds.map((kind) => (
          <div key={kind.id} className="flex items-center gap-2 text-[11px]">
            <span className="kind-dot" style={{ background: kind.color }} />
            {kind.name}
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {STATUSES.map((status) => (
          <span key={status} className={`rounded-full px-1.5 py-0.5 text-[10px] ${statusClass(status)}`}>
            {statusLabel(status)}
          </span>
        ))}
      </div>
      <KindCountHint />
    </div>
  )
}

function KindCountHint() {
  const { project } = useApp()
  if (project.nodes.length === 0) return null
  const counts = new Map<string, number>()
  for (const node of project.nodes) {
    if (node.type === 'group' || node.type === 'frame' || node.type === 'divider') continue
    counts.set(node.data.kind, (counts.get(node.data.kind) ?? 0) + 1)
  }
  return (
    <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-[var(--muted)]">
      {[...counts.entries()].map(([kindId, count]) => (
        <span key={kindId}>
          {requireKind(project.kinds, kindId).name}: {count}
        </span>
      ))}
    </div>
  )
}
