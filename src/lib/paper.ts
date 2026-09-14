import type { ThemeMode } from '../types'

export type PaperPresetId = 'auto' | 'warm' | 'cool' | 'paper' | 'ink'

export type PaperPreset = {
  id: PaperPresetId
  label: string
  light: string
  dark: string
}

export const PAPER_PRESETS: PaperPreset[] = [
  { id: 'auto', label: 'Как тема', light: '#f5f5f7', dark: '#0b0b0d' },
  { id: 'warm', label: 'Тёплая', light: '#f3ead8', dark: '#2c261c' },
  { id: 'cool', label: 'Холодная', light: '#e7eef6', dark: '#171c24' },
  { id: 'paper', label: 'Бумага', light: '#fbfaf6', dark: '#1c1c1a' },
  { id: 'ink', label: 'Чернила', light: '#e8e4dc', dark: '#0c0c0e' },
]

export function paperColor(preset: PaperPreset, theme: ThemeMode): string {
  return theme === 'dark' ? preset.dark : preset.light
}

export function resolveCanvasColor(
  canvasColor: string | undefined,
  theme: ThemeMode,
): string {
  if (canvasColor) return canvasColor
  return paperColor(PAPER_PRESETS[0], theme)
}

export function matchPaperPreset(canvasColor: string | undefined, theme: ThemeMode): PaperPresetId | 'custom' {
  if (!canvasColor) return 'auto'
  const match = PAPER_PRESETS.find((preset) => paperColor(preset, theme) === canvasColor)
  return match?.id ?? 'custom'
}

export function canvasDotColor(background: string, theme: ThemeMode): string {
  return theme === 'dark' ? 'rgba(255,255,255,0.14)' : hexToRgba(background, 0.22, '#1d1d1f')
}

function hexToRgba(hex: string, alpha: number, fallback: string): string {
  const normalized = hex.replace('#', '')
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : normalized
  if (full.length !== 6) return fallback
  const r = Number.parseInt(full.slice(0, 2), 16)
  const g = Number.parseInt(full.slice(2, 4), 16)
  const b = Number.parseInt(full.slice(4, 6), 16)
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return fallback
  const mix = themeMix(r, g, b)
  return `rgba(${mix.r}, ${mix.g}, ${mix.b}, ${alpha})`
}

function themeMix(r: number, g: number, b: number): { r: number; g: number; b: number } {
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b
  if (luminance > 140) {
    return { r: 40, g: 40, b: 44 }
  }
  return { r: 255, g: 255, b: 255 }
}
