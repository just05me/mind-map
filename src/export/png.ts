import { getNodesBounds, getViewportForBounds } from '@xyflow/react'
import { downloadDataUrl, slugify } from './download'
import { resolveCanvasColor } from '../model/paper'
import type { Project, ThemeMode } from '../model/types'

const IMAGE_WIDTH = 1920
const IMAGE_HEIGHT = 1080

// html-to-image is only needed for PNG export, so it ships as its own chunk.
const loadPngRenderer = () => import('html-to-image')

/** Warms the PNG renderer chunk so the export itself does not wait on the network. */
export function preloadPngRenderer(): void {
  void loadPngRenderer().catch(() => {
    // Ignored here: exportMapPng surfaces the failure when the user actually exports.
  })
}

export async function exportMapPng(project: Project, theme: ThemeMode): Promise<void> {
  const viewportEl = document.querySelector('.react-flow__viewport')
  if (!(viewportEl instanceof HTMLElement)) {
    throw new Error('Холст ещё не готов')
  }
  if (project.nodes.length === 0) {
    throw new Error('На карте нет узлов')
  }

  const { toPng } = await loadPngRenderer().catch(() => {
    throw new Error('Не удалось загрузить модуль PNG')
  })
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
