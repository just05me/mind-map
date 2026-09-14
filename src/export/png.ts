import { getNodesBounds, getViewportForBounds } from '@xyflow/react'
import { toPng } from 'html-to-image'
import { downloadDataUrl, slugify } from '../lib/download'
import { resolveCanvasColor } from '../lib/paper'
import type { Project, ThemeMode } from '../types'

const IMAGE_WIDTH = 1920
const IMAGE_HEIGHT = 1080

export async function exportMapPng(project: Project, theme: ThemeMode): Promise<void> {
  const viewportEl = document.querySelector('.react-flow__viewport')
  if (!(viewportEl instanceof HTMLElement)) {
    throw new Error('Холст ещё не готов')
  }
  if (project.nodes.length === 0) {
    throw new Error('На карте нет узлов')
  }

  const bounds = getNodesBounds(project.nodes)
  const viewport = getViewportForBounds(bounds, IMAGE_WIDTH, IMAGE_HEIGHT, 0.4, 2, 0.16)
  const dataUrl = await toPng(viewportEl, {
    backgroundColor: resolveCanvasColor(project.canvasColor, theme),
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    style: {
      width: `${IMAGE_WIDTH}px`,
      height: `${IMAGE_HEIGHT}px`,
      transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
    },
  })
  downloadDataUrl(`${slugify(project.title)}.png`, dataUrl)
}
