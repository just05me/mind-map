import type { Edge, Node, Viewport } from '@xyflow/react'

export type Status = 'planned' | 'doing' | 'done' | 'broken'

export type KindId = string

export type ViewMode = 'map' | 'board'

export type InteractionMode = 'edit' | 'view'

export type ThemeMode = 'light' | 'dark'

export type LayoutCommand = 'horizontal' | 'vertical' | 'fit'

export type CanvasTool = 'select' | 'pan' | 'add' | 'text' | 'frame' | 'connect'

export type AppNodeType =
  | 'kind'
  | 'group'
  | 'note'
  | 'text'
  | 'frame'
  | 'divider'
  | 'decision'
  | 'comment'

export type TextAlign = 'left' | 'center' | 'right'

export type TextWeight = 400 | 500 | 600 | 700

export type NodeData = {
  kind: KindId
  title: string
  subtitle?: string
  description?: string
  path?: string
  status: Status
  items?: string[]
  fillColor?: string
  accentColor?: string
  fontSize?: number
  fontWeight?: TextWeight
  textAlign?: TextAlign
  textColor?: string
}

export type KindDef = {
  id: KindId
  name: string
  letter: string
  color: string
  builtin: boolean
}

export type EdgeData = {
  color?: string
  label?: string
  width?: number
}

export type AppNode = Node<NodeData, AppNodeType>

export type AppEdge = Edge<EdgeData>

export type Project = {
  id: string
  title: string
  description?: string
  kinds: KindDef[]
  nodes: AppNode[]
  edges: AppEdge[]
  viewport?: Viewport
  canvasColor?: string
  updatedAt: string
}

export type PersistedStore = {
  version: 1
  currentId: string
  projects: Project[]
  theme: ThemeMode
}
