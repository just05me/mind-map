import type { GlyphName } from '../../model/node-design'

/** Line glyphs for card nodes, drawn in the node's accent color. viewBox 0 0 24 24. */
const GLYPHS: Record<GlyphName, string> = {
  entry: 'M14 3h5a2 2 0 012 2v14a2 2 0 01-2 2h-5M10 8l4 4-4 4M14 12H3',
  module: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9',
  service: 'M4 5h16v5H4zM4 14h16v5H4zM7.5 7.5h.01M7.5 16.5h.01M17 7.5h-3M17 16.5h-3',
  store: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  api: 'M8 7l-4 5 4 5M16 7l4 5-4 5M13 5l-2 14',
  tool: 'M14.5 6.5a3.5 3.5 0 01-4.6 4.6L5 16l3 3 4.9-4.9a3.5 3.5 0 014.6-4.6l-2.5 2.5-2-2z',
  agent: 'M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8zM18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9z',
  model: 'M9 9h6v6H9zM4 9V7a3 3 0 013-3h2M15 4h2a3 3 0 013 3v2M20 15v2a3 3 0 01-3 3h-2M9 20H7a3 3 0 01-3-3v-2',
  external: 'M7 18a4 4 0 010-8 5 5 0 019.6-1.3A3.5 3.5 0 0117.5 18z',
  person: 'M12 12a4 4 0 100-8 4 4 0 000 8zM5 21a7 7 0 0114 0',
  queue: 'M4 6h16M4 12h16M4 18h16M8 6v12',
  event: 'M13 3L5 13h6l-1 8 8-10h-6z',
  file: 'M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8zM14 3v5h5M9 13h6M9 17h6',
  env: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 13a7.9 7.9 0 000-2l2-1.5-2-3.5-2.3 1a8 8 0 00-1.7-1l-.3-2.5h-4l-.3 2.5a8 8 0 00-1.7 1l-2.3-1-2 3.5L4.6 11a7.9 7.9 0 000 2l-2 1.5 2 3.5 2.3-1a8 8 0 001.7 1l.3 2.5h4l.3-2.5a8 8 0 001.7-1l2.3 1 2-3.5z',
  test: 'M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3M7.5 15h9',
  job: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
  webhook: 'M8.5 10a3.5 3.5 0 114.9 3.2L11 18M15 14a3.5 3.5 0 11-3.5 3.5H8M9 10.5L6.5 15A3.5 3.5 0 108 18',
  cache: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M13 11l-3 4h4l-3 4',
  auth: 'M6 11h12a1 1 0 011 1v7a1 1 0 01-1 1H6a1 1 0 01-1-1v-7a1 1 0 011-1zM8 11V8a4 4 0 018 0v3',
  dot: 'M12 5v14M5 12h14',
}

export function KindGlyph({ name, size = 18 }: { name: GlyphName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={GLYPHS[name]} />
    </svg>
  )
}
