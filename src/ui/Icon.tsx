import type { SVGProps } from 'react'

const PATHS = {
  cursor: 'M5 3l14 7-6 2-2 6z',
  hand: 'M8 11V5.5a1.5 1.5 0 013 0V10m0-5.5V4a1.5 1.5 0 013 0v6m0-4.5a1.5 1.5 0 013 0V13a7 7 0 01-7 7h-.6a6 6 0 01-4.9-2.6L3.8 15a1.6 1.6 0 012.5-2L8 14.5V8a1.5 1.5 0 013 0',
  box: 'M4 6.5A2.5 2.5 0 016.5 4h11A2.5 2.5 0 0120 6.5v11a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 014 17.5z',
  sticky: 'M5 4h14v10l-6 6H5zM13 20v-6h6',
  text: 'M5 6V4h14v2M12 4v16M9 20h6',
  frame: 'M7 3v18M17 3v18M3 7h18M3 17h18',
  connect: 'M5 19L19 5M19 5h-6M19 5v6',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3',
  copy: 'M9 9h10v10H9zM5 15V5h10',
  undo: 'M9 14L4 9l5-5M4 9h11a5 5 0 010 10h-3',
  redo: 'M15 14l5-5-5-5M20 9H9a5 5 0 000 10h3',
  panelLeft: 'M4 5h16v14H4zM9 5v14',
  panelRight: 'M4 5h16v14H4zM15 5v14',
  chevronLeft: 'M15 6l-6 6 6 6',
  chevronRight: 'M9 6l6 6-6 6',
  chevronDown: 'M6 9l6 6 6-6',
  close: 'M6 6l12 12M18 6L6 18',
  plus: 'M12 5v14M5 12h14',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4',
  sun: 'M12 16a4 4 0 100-8 4 4 0 000 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z',
  layout: 'M4 4h6v6H4zM14 14h6v6h-6zM10 7h4v10',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  keyboard: 'M3 6h18v12H3zM7 10h.01M11 10h.01M15 10h.01M7 14h10',
  map: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
  columns: 'M4 4h4v16H4zM10 4h4v10h-4zM16 4h4v13h-4z',
  folder: 'M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  minimap: 'M3 5h18v14H3zM13 12h6v5h-6z',
  unlink: 'M9 15l-2 2a3 3 0 01-4-4l2-2M15 9l2-2a3 3 0 014 4l-2 2M8 8L4 4M20 20l-4-4',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
  help: 'M12 21a9 9 0 100-18 9 9 0 000 18zM9.5 9a2.5 2.5 0 015 .5c0 1.5-2.5 2-2.5 3.5M12 17h.01',
  fit: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  eye: 'M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6zM12 15a3 3 0 100-6 3 3 0 000 6z',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM5 20a7 7 0 0114 0',
  logout: 'M10 5H6a2 2 0 00-2 2v10a2 2 0 002 2h4M16 8l4 4-4 4M20 12H10',
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
