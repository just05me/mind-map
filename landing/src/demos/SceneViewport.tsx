import { useEffect, useRef, useState, type ReactNode } from 'react'

const MIN_SCALE = 0.62

/**
 * Renders a fixed-size scene scaled to the container width. On narrow screens the
 * scale is clamped and the scene scrolls inside its own box, never the page.
 */
export function SceneViewport({
  width,
  height,
  maxScale = 1,
  paper = true,
  className = '',
  children,
}: {
  width: number
  height: number
  maxScale?: number
  /** Dotted canvas paper; off for the board view, which is plain in the app too. */
  paper?: boolean
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(width)

  useEffect(() => {
    const element = ref.current
    if (!element) return undefined
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setContainerWidth(entry.contentRect.width)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const scale = Math.min(maxScale, Math.max(MIN_SCALE, containerWidth / width))
  const scaledWidth = width * scale
  const scaledHeight = height * scale
  const overflows = scaledWidth > containerWidth + 1

  return (
    <div
      ref={ref}
      className={`relative w-full bg-bg ${paper ? 'paper' : ''} ${overflows ? 'overflow-x-auto' : 'overflow-hidden'} ${className}`}
    >
      <div style={{ width: scaledWidth, height: scaledHeight, margin: overflows ? undefined : '0 auto' }}>
        <div
          className="relative origin-top-left"
          style={{ width, height, transform: `scale(${scale})` }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
