import { contrastText, FRAME_COLOR, KINDS, NOTE_FILL, STATUS_META, type KindId, type Status } from '../content/tokens'
import { KindGlyph } from '../ui/KindGlyph'
import { NodeArt } from './NodeArt'
import type { SceneNode } from './scene-types'

/** Static node visuals reproducing the app's KindNode, NoteNode, FrameNode and CommentNode. */
export function DemoNode({ node }: { node: SceneNode }) {
  switch (node.type) {
    case 'kind':
      return <KindCard node={node} kindId={node.kind ?? 'module'} />
    case 'note':
      return <NoteCard node={node} />
    case 'frame':
      return <FrameBox node={node} />
    case 'comment':
      return <CommentCard node={node} />
    default: {
      const _never: never = node.type
      return _never
    }
  }
}

export function StatusPill({ status }: { status: Status | undefined }) {
  if (!status || status === 'planned') return null
  const meta = STATUS_META[status]
  return (
    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] leading-none ${meta.pillClass}`}>
      {meta.label}
    </span>
  )
}

function KindCard({ node, kindId }: { node: SceneNode; kindId: KindId }) {
  const kind = KINDS[kindId]
  if (kind.shape === 'card') {
    return (
      <div className="node-card box-border flex h-full w-full items-start gap-2.5 rounded-node px-3 py-2.5">
        <span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-[0.55rem]"
          style={{ background: kind.color, color: contrastText(kind.color) }}
        >
          <KindGlyph kind={kind.id} size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium leading-5 tracking-[-0.01em]">{node.title}</div>
          {node.subtitle ? <div className="truncate text-[11px] opacity-70">{node.subtitle}</div> : null}
        </div>
        <StatusPill status={node.status} />
      </div>
    )
  }
  return (
    <div className="node-shape relative box-border flex h-full w-full flex-col items-center rounded-shape px-3 pb-2.5 pt-3">
      {node.status && node.status !== 'planned' ? (
        <span className="absolute right-2 top-2">
          <StatusPill status={node.status} />
        </span>
      ) : null}
      <NodeArt shape={kind.shape} color={kind.color} />
      <div className="mt-1.5 w-full text-center">
        <div className="truncate text-[13px] font-semibold leading-5 tracking-[-0.01em]">{node.title}</div>
        {node.subtitle ? <div className="truncate text-[11px] text-muted">{node.subtitle}</div> : null}
      </div>
      <span className="mt-1 flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted">
        <KindGlyph kind={kind.id} size={11} />
        {kind.name}
      </span>
    </div>
  )
}

function NoteCard({ node }: { node: SceneNode }) {
  return (
    <div
      className="box-border h-full w-full rounded-node px-3 py-2.5 text-[#2b2110]"
      style={{ background: NOTE_FILL, boxShadow: `0 10px 24px ${NOTE_FILL}55` }}
    >
      <div className="text-[11px] font-medium uppercase tracking-wide text-amber-900/70">Стикер</div>
      <div className="mt-1 text-[13px] font-semibold leading-5">{node.title}</div>
      {node.subtitle ? <div className="mt-1 text-[12px] leading-4 text-[#4a3b1f]">{node.subtitle}</div> : null}
    </div>
  )
}

function FrameBox({ node }: { node: SceneNode }) {
  return (
    <div
      className="box-border h-full w-full rounded-frame border px-2 pt-1"
      style={{ borderColor: `${FRAME_COLOR}66`, background: `${FRAME_COLOR}14` }}
    >
      <div className="px-2 py-1 text-[12px] font-medium tracking-[-0.01em] text-muted">{node.title}</div>
    </div>
  )
}

function CommentCard({ node }: { node: SceneNode }) {
  const accent = '#ff9f0a'
  return (
    <div
      className="box-border h-full w-full rounded-shape px-3 py-2.5 text-[#2c2416]"
      style={{ background: '#fff3d6', boxShadow: 'var(--shadow-soft)', borderLeft: `3px solid ${accent}` }}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-800/70">Комментарий</div>
      <div className="mt-0.5 text-[13px] font-medium leading-5">{node.title}</div>
      {node.subtitle ? <div className="mt-1 text-[12px] leading-4 text-[#5a4a2a]">{node.subtitle}</div> : null}
    </div>
  )
}

/** Card as drawn in the app's status board: accent bar, round badge, kind caption. */
export function BoardCard({ node }: { node: SceneNode }) {
  const kind = KINDS[node.kind ?? 'module']
  return (
    <div
      className="box-border flex h-full w-full items-start gap-2 rounded-shape border border-line bg-panel-solid p-3"
      style={{ boxShadow: `inset 3px 0 0 ${kind.color}` }}
    >
      <span
        className="grid h-6 w-6 shrink-0 place-items-center rounded-full"
        style={{ background: kind.color, color: contrastText(kind.color) }}
      >
        <KindGlyph kind={kind.id} size={15} />
      </span>
      <div className="min-w-0">
        <div className="truncate text-[13px] font-medium leading-5 tracking-[-0.01em]">{node.title}</div>
        <div className="truncate text-[11px] text-muted">{kind.name}</div>
      </div>
    </div>
  )
}
