import type { SVGProps } from 'react'

/** Line icons copied from the app's src/ui/Icon.tsx plus a few landing-only ones. */
const PATHS = {
  cursor: 'M5 3l14 7-6 2-2 6z',
  box: 'M4 6.5A2.5 2.5 0 016.5 4h11A2.5 2.5 0 0120 6.5v11a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 014 17.5z',
  sticky: 'M5 4h14v10l-6 6H5zM13 20v-6h6',
  frame: 'M7 3v18M17 3v18M3 7h18M3 17h18',
  connect: 'M5 19L19 5M19 5h-6M19 5v6',
  copy: 'M9 9h10v10H9zM5 15V5h10',
  check: 'M5 12l5 5L20 7',
  undo: 'M9 14L4 9l5-5M4 9h11a5 5 0 010 10h-3',
  redo: 'M15 14l5-5-5-5M20 9H9a5 5 0 000 10h3',
  panelLeft: 'M4 5h16v14H4zM9 5v14',
  panelRight: 'M4 5h16v14H4zM15 5v14',
  close: 'M6 6l12 12M18 6L6 18',
  plus: 'M12 5v14M5 12h14',
  sun: 'M12 16a4 4 0 100-8 4 4 0 000 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z',
  layout: 'M4 4h6v6H4zM14 14h6v6h-6zM10 7h4v10',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  upload: 'M12 15V4M7 9l5-5 5 5M5 20h14',
  keyboard: 'M3 6h18v12H3zM7 10h.01M11 10h.01M15 10h.01M7 14h10',
  map: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
  columns: 'M4 4h4v16H4zM10 4h4v10h-4zM16 4h4v13h-4z',
  folder: 'M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
  help: 'M12 21a9 9 0 100-18 9 9 0 000 18zM9.5 9a2.5 2.5 0 015 .5c0 1.5-2.5 2-2.5 3.5M12 17h.01',
  fit: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  eye: 'M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6zM12 15a3 3 0 100-6 3 3 0 000 6z',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM5 20a7 7 0 0114 0',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  github:
    'M12 2.5a9.5 9.5 0 00-3 18.5c.5.1.7-.2.7-.5v-1.8c-2.7.6-3.3-1.2-3.3-1.2-.4-1.1-1-1.4-1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1 2.8.8.1-.6.3-1 .6-1.3-2.1-.2-4.3-1-4.3-4.7 0-1 .4-1.9 1-2.5-.1-.3-.4-1.3.1-2.6 0 0 .8-.3 2.6 1a9 9 0 014.8 0c1.8-1.3 2.6-1 2.6-1 .5 1.3.2 2.3.1 2.6.6.6 1 1.5 1 2.5 0 3.7-2.2 4.5-4.3 4.7.3.3.7.9.7 1.8v2.7c0 .3.2.6.7.5A9.5 9.5 0 0012 2.5z',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  external: 'M14 5h5v5M19 5l-8 8M10 5H6a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1v-4',
  sparkle: 'M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8zM18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9z',
  database: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  lock: 'M6 11h12a1 1 0 011 1v7a1 1 0 01-1 1H6a1 1 0 01-1-1v-7a1 1 0 011-1zM8 11V8a4 4 0 018 0v3',
  terminal: 'M4 5h16v14H4zM8 9l3 3-3 3M13 15h4',
  code: 'M8 7l-4 5 4 5M16 7l4 5-4 5M13 5l-2 14',
  gift: 'M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-2-3-5-3-5-1s3 1 5 1zM12 7c2-3 5-3 5-1s-3 1-5 1z',
  menu: 'M4 7h16M4 12h16M4 17h16',
} as const

export type IconName = keyof typeof PATHS

export function Icon({
  name,
  size = 16,
  ...props
}: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
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
      {...props}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
