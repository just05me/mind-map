import {
  addEdge as connectEdges,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type Viewport,
} from '@xyflow/react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import { mergeBuiltinKinds, removeKind, upsertKind } from '../model/kinds'
import { createId } from '../lib/id'
import type {
  AppEdge,
  AppNode,
  CanvasTool,
  EdgeData,
  KindDef,
  KindId,
  LayoutCommand,
  NodeData,
  Project,
  ThemeMode,
  ViewMode,
} from '../model/types'
import {
  extractSubgraph,
  instantiateSubgraph,
  orderParentsFirst,
  removeElements,
  reparentNode,
  type Graph,
} from './graph'
import { createEmptyProject, duplicateProject } from './project-factory'
import { loadStore, saveStore } from './storage'
import { loadUiPrefs, saveUiPrefs } from './ui-prefs'

const HISTORY_LIMIT = 100
const COALESCE_MS = 900

export type PanelId = 'left' | 'right' | 'minimap'

type AppState = {
  projects: Project[]
  currentId: string
  view: ViewMode
  theme: ThemeMode
  /** Set only when exactly one node (or edge) is selected; multi-selection lives on node.selected. */
  selectedNodeId: string | null
  selectedEdgeId: string | null
  pendingKind: KindId | null
  canvasTool: CanvasTool
  editingNodeId: string | null
  editingField: 'title' | 'description'
  connectSourceId: string | null
  layoutCommand: LayoutCommand | null
  past: Graph[]
  future: Graph[]
  historyKey: string | null
  historyAt: number
  clipboard: Graph | null
  leftPanelOpen: boolean
  rightPanelOpen: boolean
  minimapOpen: boolean
  shortcutsOpen: boolean
}

type AddNodeOptions = {
  edit?: boolean
  keepPending?: boolean
  /** Connects this source to the new node in the same undo step. */
  fromNodeId?: string
}

type Point = { x: number; y: number }

type Action =
  | { type: 'setView'; view: ViewMode }
  | { type: 'setTheme'; theme: ThemeMode }
  | { type: 'selectNode'; id: string | null }
  | { type: 'selectEdge'; id: string | null }
  | { type: 'selectAll' }
  | { type: 'setPendingKind'; kind: KindId | null }
  | { type: 'setCanvasTool'; tool: CanvasTool }
  | { type: 'setEditingNode'; id: string | null; field?: 'title' | 'description' }
  | { type: 'setConnectSource'; id: string | null }
  | { type: 'createProject' }
  | { type: 'duplicateProject' }
  | { type: 'deleteProject'; id: string }
  | { type: 'switchProject'; id: string }
  | { type: 'renameProject'; title: string; description?: string }
  | { type: 'setViewport'; viewport: Viewport }
  | { type: 'setCanvasColor'; color: string | undefined }
  | { type: 'setGraph'; nodes: AppNode[]; edges: AppEdge[] }
  | { type: 'nodesChange'; changes: NodeChange<AppNode>[] }
  | { type: 'edgesChange'; changes: EdgeChange<AppEdge>[] }
  | { type: 'connect'; connection: Connection }
  | { type: 'updateNodeData'; id: string; data: Partial<NodeData> }
  | { type: 'updateEdgeData'; id: string; data: Partial<EdgeData> }
  | { type: 'addNode'; node: AppNode; options: AddNodeOptions }
  | { type: 'addEdge'; edge: AppEdge }
  | { type: 'deleteElements'; nodeIds: string[]; edgeIds: string[] }
  | { type: 'duplicateNodes'; ids: string[] }
  | { type: 'copyNodes'; ids: string[] }
  | { type: 'paste'; at?: Point }
  | { type: 'reparent'; id: string; parentId: string | null }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'addCustomKind'; kind: KindDef }
  | { type: 'updateKind'; kind: KindDef }
  | { type: 'removeKind'; id: KindId }
  | { type: 'importProject'; project: Project }
  | { type: 'requestLayout'; layout: LayoutCommand | null }
  | { type: 'togglePanel'; panel: PanelId; open?: boolean }
  | { type: 'toggleAllPanels' }
  | { type: 'setShortcutsOpen'; open: boolean }

type AppContextValue = {
  state: AppState
  project: Project
  dispatch: (action: Action) => void
  setView: (view: ViewMode) => void
  setTheme: (theme: ThemeMode) => void
  selectNode: (id: string | null) => void
  selectEdge: (id: string | null) => void
  selectAll: () => void
  setPendingKind: (kind: KindId | null) => void
  setCanvasTool: (tool: CanvasTool) => void
  setEditingNode: (id: string | null, field?: 'title' | 'description') => void
  setConnectSource: (id: string | null) => void
  createProject: () => void
  duplicateCurrent: () => void
  deleteProject: (id: string) => void
  switchProject: (id: string) => void
  renameProject: (title: string, description?: string) => void
  setViewport: (viewport: Viewport) => void
  setCanvasColor: (color: string | undefined) => void
  setGraph: (nodes: AppNode[], edges: AppEdge[]) => void
  onNodesChange: (changes: NodeChange<AppNode>[]) => void
  onEdgesChange: (changes: EdgeChange<AppEdge>[]) => void
  connect: (connection: Connection) => void
  updateNodeData: (id: string, data: Partial<NodeData>) => void
  updateEdgeData: (id: string, data: Partial<EdgeData>) => void
  addNode: (node: AppNode, options?: AddNodeOptions) => void
  addEdge: (edge: AppEdge) => void
  deleteElements: (nodeIds: string[], edgeIds?: string[]) => void
  deleteSelection: () => void
  duplicateNodes: (ids: string[]) => void
  copyNodes: (ids: string[]) => void
  paste: (at?: Point) => void
  reparent: (id: string, parentId: string | null) => void
  detachFromGroup: (id: string) => void
  undo: () => void
  redo: () => void
  addCustomKind: (kind: KindDef) => void
  updateKind: (kind: KindDef) => void
  removeCustomKind: (id: KindId) => void
  importProject: (project: Project) => void
  requestLayout: (layout: LayoutCommand) => void
  clearLayout: () => void
  togglePanel: (panel: PanelId, open?: boolean) => void
  toggleAllPanels: () => void
  setShortcutsOpen: (open: boolean) => void
}

const AppContext = createContext<AppContextValue | null>(null)

function currentProject(state: AppState): Project {
  return state.projects.find((item) => item.id === state.currentId) ?? state.projects[0]
}

function graphOf(state: AppState): Graph {
  const project = currentProject(state)
  return { nodes: project.nodes, edges: project.edges }
}

function mapCurrent(
  state: AppState,
  updater: (project: Project) => Project,
  touch = true,
): AppState {
  return {
    ...state,
    projects: state.projects.map((project) => {
      if (project.id !== state.currentId) return project
      const next = updater(project)
      return touch ? { ...next, updatedAt: new Date().toISOString() } : next
    }),
  }
}

/** Re-derives the single-selection ids from node/edge `selected` flags. */
function syncSelection(state: AppState): AppState {
  const project = currentProject(state)
  const nodes = project.nodes.filter((node) => node.selected)
  const edges = project.edges.filter((edge) => edge.selected)
  const selectedNodeId = nodes.length === 1 && edges.length === 0 ? nodes[0].id : null
  const selectedEdgeId = edges.length === 1 && nodes.length === 0 ? edges[0].id : null
  if (selectedNodeId === state.selectedNodeId && selectedEdgeId === state.selectedEdgeId) return state
  return { ...state, selectedNodeId, selectedEdgeId }
}

/**
 * Records the graph before a change. Changes that share a key within a short window
 * (dragging, resizing, typing) collapse into one undo step.
 */
function record(state: AppState, key: string | null): AppState {
  const now = Date.now()
  if (key && key === state.historyKey && now - state.historyAt < COALESCE_MS) {
    return { ...state, historyAt: now }
  }
  return {
    ...state,
    past: [...state.past, graphOf(state)].slice(-HISTORY_LIMIT),
    future: [],
    historyKey: key,
    historyAt: now,
  }
}

function setCurrentGraph(state: AppState, graph: Graph, touch = true): AppState {
  return syncSelection(
    mapCurrent(state, (project) => ({ ...project, nodes: graph.nodes, edges: graph.edges }), touch),
  )
}

function resetTransient(state: AppState): AppState {
  return {
    ...state,
    selectedNodeId: null,
    selectedEdgeId: null,
    pendingKind: null,
    editingNodeId: null,
    connectSourceId: null,
    canvasTool: 'select',
    past: [],
    future: [],
    historyKey: null,
  }
}

function nodesChangeHistoryKey(changes: NodeChange<AppNode>[]): string | null | 'skip' {
  if (changes.some((change) => change.type === 'remove' || change.type === 'add' || change.type === 'replace')) {
    return null
  }
  const moving = changes.flatMap((change) =>
    change.type === 'position' && change.dragging ? [change.id] : [],
  )
  if (moving.length > 0) return `move:${moving.join(',')}`
  const resizing = changes.flatMap((change) =>
    change.type === 'dimensions' && change.resizing ? [change.id] : [],
  )
  if (resizing.length > 0) return `resize:${resizing.join(',')}`
  return 'skip'
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'setView':
      return {
        ...state,
        view: action.view,
        editingNodeId: null,
        connectSourceId: null,
        canvasTool: 'select',
      }
    case 'setTheme':
      return { ...state, theme: action.theme }
    case 'selectNode': {
      const graph = graphOf(state)
      const next = setCurrentGraph(
        state,
        {
          nodes: graph.nodes.map((node) => {
            const selected = node.id === action.id
            return node.selected === selected ? node : { ...node, selected }
          }),
          edges: graph.edges.map((edge) => (edge.selected ? { ...edge, selected: false } : edge)),
        },
        false,
      )
      return { ...next, selectedNodeId: action.id, selectedEdgeId: null }
    }
    case 'selectEdge': {
      const graph = graphOf(state)
      const next = setCurrentGraph(
        state,
        {
          nodes: graph.nodes.map((node) => (node.selected ? { ...node, selected: false } : node)),
          edges: graph.edges.map((edge) => {
            const selected = edge.id === action.id
            return edge.selected === selected ? edge : { ...edge, selected }
          }),
        },
        false,
      )
      return { ...next, selectedEdgeId: action.id, selectedNodeId: null }
    }
    case 'selectAll': {
      const graph = graphOf(state)
      return setCurrentGraph(
        state,
        {
          nodes: graph.nodes.map((node) => ({ ...node, selected: !node.parentId })),
          edges: graph.edges.map((edge) => ({ ...edge, selected: false })),
        },
        false,
      )
    }
    case 'setPendingKind':
      return {
        ...state,
        pendingKind: action.kind,
        canvasTool: action.kind ? 'add' : state.canvasTool === 'add' ? 'select' : state.canvasTool,
      }
    case 'setCanvasTool':
      return {
        ...state,
        canvasTool: action.tool,
        pendingKind: action.tool === 'add' ? state.pendingKind : null,
        connectSourceId: action.tool === 'connect' ? state.connectSourceId : null,
        editingNodeId: action.tool === 'text' ? state.editingNodeId : null,
      }
    case 'setEditingNode':
      return {
        ...state,
        editingNodeId: action.id,
        editingField: action.field ?? 'title',
      }
    case 'setConnectSource':
      return { ...state, connectSourceId: action.id }
    case 'createProject': {
      const project = createEmptyProject()
      return resetTransient({ ...state, projects: [...state.projects, project], currentId: project.id })
    }
    case 'duplicateProject': {
      const current = state.projects.find((item) => item.id === state.currentId)
      if (!current) return state
      const copy = duplicateProject(current)
      return resetTransient({ ...state, projects: [...state.projects, copy], currentId: copy.id })
    }
    case 'deleteProject': {
      const remaining = state.projects.filter((item) => item.id !== action.id)
      if (remaining.length === 0) {
        const project = createEmptyProject()
        return resetTransient({ ...state, projects: [project], currentId: project.id })
      }
      const currentId = state.currentId === action.id ? remaining[0].id : state.currentId
      return resetTransient({ ...state, projects: remaining, currentId })
    }
    case 'switchProject':
      if (action.id === state.currentId) return state
      return resetTransient({ ...state, currentId: action.id })
    case 'renameProject':
      return mapCurrent(state, (project) => ({
        ...project,
        title: action.title,
        description: action.description,
      }))
    case 'setViewport':
      return mapCurrent(state, (project) => ({ ...project, viewport: action.viewport }), false)
    case 'setCanvasColor':
      return mapCurrent(state, (project) => ({ ...project, canvasColor: action.color }))
    case 'setGraph':
      return setCurrentGraph(record(state, null), {
        nodes: orderParentsFirst(action.nodes),
        edges: action.edges,
      })
    case 'nodesChange': {
      const key = nodesChangeHistoryKey(action.changes)
      const base = key === 'skip' ? state : record(state, key)
      const graph = graphOf(base)
      const nodes = applyNodeChanges(action.changes, graph.nodes)
      const removed = new Set(
        action.changes.flatMap((change) => (change.type === 'remove' ? [change.id] : [])),
      )
      const edges =
        removed.size > 0
          ? graph.edges.filter((edge) => !removed.has(edge.source) && !removed.has(edge.target))
          : graph.edges
      return setCurrentGraph(base, { nodes, edges }, key !== 'skip')
    }
    case 'edgesChange': {
      const mutates = action.changes.some((change) => change.type !== 'select')
      const base = mutates ? record(state, null) : state
      const graph = graphOf(base)
      return setCurrentGraph(
        base,
        { nodes: graph.nodes, edges: applyEdgeChanges(action.changes, graph.edges) },
        mutates,
      )
    }
    case 'connect': {
      const { source, target } = action.connection
      if (!source || !target || source === target) return state
      const base = record(state, null)
      const graph = graphOf(base)
      return setCurrentGraph(base, {
        nodes: graph.nodes,
        edges: connectEdges({ ...action.connection, id: createId('e') }, graph.edges),
      })
    }
    case 'updateNodeData': {
      const base = record(state, `data:${action.id}:${Object.keys(action.data).join(',')}`)
      return mapCurrent(base, (project) => ({
        ...project,
        nodes: project.nodes.map((node) =>
          node.id === action.id ? { ...node, data: { ...node.data, ...action.data } } : node,
        ),
      }))
    }
    case 'updateEdgeData': {
      const base = record(state, `edge:${action.id}:${Object.keys(action.data).join(',')}`)
      return mapCurrent(base, (project) => ({
        ...project,
        edges: project.edges.map((edge) =>
          edge.id === action.id ? { ...edge, data: { ...edge.data, ...action.data } } : edge,
        ),
      }))
    }
    case 'addNode': {
      const base = record(state, null)
      const graph = graphOf(base)
      const { options } = action
      const nodes = orderParentsFirst([
        ...graph.nodes.map((node) => (node.selected ? { ...node, selected: false } : node)),
        { ...action.node, selected: true },
      ])
      const edges = options.fromNodeId
        ? [
            ...graph.edges,
            { id: createId('e'), source: options.fromNodeId, target: action.node.id },
          ]
        : graph.edges
      const next = setCurrentGraph(base, { nodes, edges })
      return {
        ...next,
        pendingKind: options.keepPending ? state.pendingKind : null,
        editingNodeId: options.edit ? action.node.id : null,
        canvasTool: options.keepPending && !options.edit ? state.canvasTool : 'select',
      }
    }
    case 'addEdge': {
      const base = record(state, null)
      const graph = graphOf(base)
      const exists = graph.edges.some(
        (edge) => edge.source === action.edge.source && edge.target === action.edge.target,
      )
      if (exists) return state
      return setCurrentGraph(base, { nodes: graph.nodes, edges: [...graph.edges, action.edge] })
    }
    case 'deleteElements': {
      if (action.nodeIds.length === 0 && action.edgeIds.length === 0) return state
      const base = record(state, null)
      const next = setCurrentGraph(base, removeElements(graphOf(base), action.nodeIds, action.edgeIds))
      return { ...next, editingNodeId: null, connectSourceId: null }
    }
    case 'duplicateNodes': {
      if (action.ids.length === 0) return state
      const base = record(state, null)
      const graph = graphOf(base)
      const copy = instantiateSubgraph(extractSubgraph(graph, action.ids), {
        offset: { x: 32, y: 32 },
      })
      return setCurrentGraph(base, {
        nodes: [...graph.nodes.map((node) => ({ ...node, selected: false })), ...copy.nodes],
        edges: [...graph.edges.map((edge) => ({ ...edge, selected: false })), ...copy.edges],
      })
    }
    case 'copyNodes':
      if (action.ids.length === 0) return state
      return { ...state, clipboard: extractSubgraph(graphOf(state), action.ids) }
    case 'paste': {
      if (!state.clipboard || state.clipboard.nodes.length === 0) return state
      const base = record(state, null)
      const graph = graphOf(base)
      const copy = instantiateSubgraph(
        state.clipboard,
        action.at ? { at: action.at } : { offset: { x: 32, y: 32 } },
      )
      // Next plain paste lands a step further instead of stacking on top.
      const clipboard = action.at ? state.clipboard : extractSubgraph(copy, copy.nodes.map((n) => n.id))
      return {
        ...setCurrentGraph(base, {
          nodes: [...graph.nodes.map((node) => ({ ...node, selected: false })), ...copy.nodes],
          edges: [...graph.edges.map((edge) => ({ ...edge, selected: false })), ...copy.edges],
        }),
        clipboard,
      }
    }
    case 'reparent': {
      const graph = graphOf(state)
      const nodes = reparentNode(graph.nodes, action.id, action.parentId)
      if (nodes === graph.nodes) return state
      const base = record(state, null)
      return setCurrentGraph(base, { nodes, edges: graph.edges })
    }
    case 'undo': {
      const previous = state.past.at(-1)
      if (!previous) return state
      const next = setCurrentGraph(state, previous)
      return {
        ...next,
        past: state.past.slice(0, -1),
        future: [graphOf(state), ...state.future].slice(0, HISTORY_LIMIT),
        historyKey: null,
        editingNodeId: null,
      }
    }
    case 'redo': {
      const [upcoming, ...rest] = state.future
      if (!upcoming) return state
      const next = setCurrentGraph(state, upcoming)
      return {
        ...next,
        past: [...state.past, graphOf(state)].slice(-HISTORY_LIMIT),
        future: rest,
        historyKey: null,
        editingNodeId: null,
      }
    }
    case 'addCustomKind':
      return mapCurrent(state, (project) => ({
        ...project,
        kinds: upsertKind(project.kinds, action.kind),
      }))
    case 'updateKind':
      return mapCurrent(state, (project) => ({
        ...project,
        kinds: upsertKind(project.kinds, action.kind),
      }))
    case 'removeKind':
      return mapCurrent(state, (project) => ({
        ...project,
        kinds: removeKind(project.kinds, action.id),
        nodes: project.nodes.map((node) =>
          node.data.kind === action.id
            ? { ...node, data: { ...node.data, kind: 'module' }, type: 'kind' }
            : node,
        ),
      }))
    case 'importProject':
      return resetTransient({
        ...state,
        projects: [
          ...state.projects,
          { ...action.project, kinds: mergeBuiltinKinds(action.project.kinds) },
        ],
        currentId: action.project.id,
      })
    case 'requestLayout':
      return { ...state, layoutCommand: action.layout }
    case 'togglePanel': {
      const field =
        action.panel === 'left' ? 'leftPanelOpen' : action.panel === 'right' ? 'rightPanelOpen' : 'minimapOpen'
      return { ...state, [field]: action.open ?? !state[field] }
    }
    case 'toggleAllPanels': {
      const open = !(state.leftPanelOpen || state.rightPanelOpen)
      return { ...state, leftPanelOpen: open, rightPanelOpen: open }
    }
    case 'setShortcutsOpen':
      return { ...state, shortcutsOpen: action.open }
    default: {
      const _never: never = action
      return _never
    }
  }
}

function createInitialState(): AppState {
  const initial = loadStore()
  const prefs = loadUiPrefs()
  return {
    projects: initial.projects,
    currentId: initial.currentId,
    view: 'map',
    theme: initial.theme,
    selectedNodeId: null,
    selectedEdgeId: null,
    pendingKind: null,
    canvasTool: 'select',
    editingNodeId: null,
    editingField: 'title',
    connectSourceId: null,
    layoutCommand: null,
    past: [],
    future: [],
    historyKey: null,
    historyAt: 0,
    clipboard: null,
    ...prefs,
    shortcutsOpen: false,
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark')
  }, [state.theme])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveStore({
        projects: state.projects,
        currentId: state.currentId,
        theme: state.theme,
      })
    }, 350)
    return () => window.clearTimeout(timer)
  }, [state.projects, state.currentId, state.theme])

  useEffect(() => {
    saveUiPrefs({
      leftPanelOpen: state.leftPanelOpen,
      rightPanelOpen: state.rightPanelOpen,
      minimapOpen: state.minimapOpen,
    })
  }, [state.leftPanelOpen, state.rightPanelOpen, state.minimapOpen])

  const project = useMemo(() => currentProject(state), [state])

  const setView = useCallback((view: ViewMode) => dispatch({ type: 'setView', view }), [])
  const setTheme = useCallback((theme: ThemeMode) => dispatch({ type: 'setTheme', theme }), [])
  const selectNode = useCallback((id: string | null) => dispatch({ type: 'selectNode', id }), [])
  const selectEdge = useCallback((id: string | null) => dispatch({ type: 'selectEdge', id }), [])
  const selectAll = useCallback(() => dispatch({ type: 'selectAll' }), [])
  const setPendingKind = useCallback(
    (kind: KindId | null) => dispatch({ type: 'setPendingKind', kind }),
    [],
  )
  const setCanvasTool = useCallback(
    (tool: CanvasTool) => dispatch({ type: 'setCanvasTool', tool }),
    [],
  )
  const setEditingNode = useCallback(
    (id: string | null, field: 'title' | 'description' = 'title') =>
      dispatch({ type: 'setEditingNode', id, field }),
    [],
  )
  const setConnectSource = useCallback(
    (id: string | null) => dispatch({ type: 'setConnectSource', id }),
    [],
  )
  const createProject = useCallback(() => dispatch({ type: 'createProject' }), [])
  const duplicateCurrent = useCallback(() => dispatch({ type: 'duplicateProject' }), [])
  const deleteProject = useCallback((id: string) => dispatch({ type: 'deleteProject', id }), [])
  const switchProject = useCallback((id: string) => dispatch({ type: 'switchProject', id }), [])
  const renameProject = useCallback(
    (title: string, description?: string) =>
      dispatch({ type: 'renameProject', title, description }),
    [],
  )
  const setViewport = useCallback(
    (viewport: Viewport) => dispatch({ type: 'setViewport', viewport }),
    [],
  )
  const setCanvasColor = useCallback(
    (color: string | undefined) => dispatch({ type: 'setCanvasColor', color }),
    [],
  )
  const setGraph = useCallback(
    (nodes: AppNode[], edges: AppEdge[]) => dispatch({ type: 'setGraph', nodes, edges }),
    [],
  )
  const onNodesChange = useCallback(
    (changes: NodeChange<AppNode>[]) => dispatch({ type: 'nodesChange', changes }),
    [],
  )
  const onEdgesChange = useCallback(
    (changes: EdgeChange<AppEdge>[]) => dispatch({ type: 'edgesChange', changes }),
    [],
  )
  const connect = useCallback(
    (connection: Connection) => dispatch({ type: 'connect', connection }),
    [],
  )
  const updateNodeData = useCallback(
    (id: string, data: Partial<NodeData>) => dispatch({ type: 'updateNodeData', id, data }),
    [],
  )
  const updateEdgeData = useCallback(
    (id: string, data: Partial<EdgeData>) => dispatch({ type: 'updateEdgeData', id, data }),
    [],
  )
  const addNode = useCallback(
    (node: AppNode, options: AddNodeOptions = {}) => dispatch({ type: 'addNode', node, options }),
    [],
  )
  const addEdge = useCallback((edge: AppEdge) => dispatch({ type: 'addEdge', edge }), [])
  const deleteElements = useCallback(
    (nodeIds: string[], edgeIds: string[] = []) =>
      dispatch({ type: 'deleteElements', nodeIds, edgeIds }),
    [],
  )
  const deleteSelection = useCallback(() => {
    dispatch({
      type: 'deleteElements',
      nodeIds: project.nodes.filter((node) => node.selected).map((node) => node.id),
      edgeIds: project.edges.filter((edge) => edge.selected).map((edge) => edge.id),
    })
  }, [project.edges, project.nodes])
  const duplicateNodes = useCallback(
    (ids: string[]) => dispatch({ type: 'duplicateNodes', ids }),
    [],
  )
  const copyNodes = useCallback((ids: string[]) => dispatch({ type: 'copyNodes', ids }), [])
  const paste = useCallback((at?: Point) => dispatch({ type: 'paste', at }), [])
  const reparent = useCallback(
    (id: string, parentId: string | null) => dispatch({ type: 'reparent', id, parentId }),
    [],
  )
  const detachFromGroup = useCallback(
    (id: string) => dispatch({ type: 'reparent', id, parentId: null }),
    [],
  )
  const undo = useCallback(() => dispatch({ type: 'undo' }), [])
  const redo = useCallback(() => dispatch({ type: 'redo' }), [])
  const addCustomKind = useCallback(
    (kind: KindDef) => dispatch({ type: 'addCustomKind', kind }),
    [],
  )
  const updateKind = useCallback((kind: KindDef) => dispatch({ type: 'updateKind', kind }), [])
  const removeCustomKind = useCallback(
    (id: KindId) => dispatch({ type: 'removeKind', id }),
    [],
  )
  const importProject = useCallback(
    (next: Project) => dispatch({ type: 'importProject', project: next }),
    [],
  )
  const requestLayout = useCallback(
    (layout: LayoutCommand) => dispatch({ type: 'requestLayout', layout }),
    [],
  )
  const clearLayout = useCallback(() => dispatch({ type: 'requestLayout', layout: null }), [])
  const togglePanel = useCallback(
    (panel: PanelId, open?: boolean) => dispatch({ type: 'togglePanel', panel, open }),
    [],
  )
  const toggleAllPanels = useCallback(() => dispatch({ type: 'toggleAllPanels' }), [])
  const setShortcutsOpen = useCallback(
    (open: boolean) => dispatch({ type: 'setShortcutsOpen', open }),
    [],
  )

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      project,
      dispatch,
      setView,
      setTheme,
      selectNode,
      selectEdge,
      selectAll,
      setPendingKind,
      setCanvasTool,
      setEditingNode,
      setConnectSource,
      createProject,
      duplicateCurrent,
      deleteProject,
      switchProject,
      renameProject,
      setViewport,
      setCanvasColor,
      setGraph,
      onNodesChange,
      onEdgesChange,
      connect,
      updateNodeData,
      updateEdgeData,
      addNode,
      addEdge,
      deleteElements,
      deleteSelection,
      duplicateNodes,
      copyNodes,
      paste,
      reparent,
      detachFromGroup,
      undo,
      redo,
      addCustomKind,
      updateKind,
      removeCustomKind,
      importProject,
      requestLayout,
      clearLayout,
      togglePanel,
      toggleAllPanels,
      setShortcutsOpen,
    }),
    [
      state,
      project,
      setView,
      setTheme,
      selectNode,
      selectEdge,
      selectAll,
      setPendingKind,
      setCanvasTool,
      setEditingNode,
      setConnectSource,
      createProject,
      duplicateCurrent,
      deleteProject,
      switchProject,
      renameProject,
      setViewport,
      setCanvasColor,
      setGraph,
      onNodesChange,
      onEdgesChange,
      connect,
      updateNodeData,
      updateEdgeData,
      addNode,
      addEdge,
      deleteElements,
      deleteSelection,
      duplicateNodes,
      copyNodes,
      paste,
      reparent,
      detachFromGroup,
      undo,
      redo,
      addCustomKind,
      updateKind,
      removeCustomKind,
      importProject,
      requestLayout,
      clearLayout,
      togglePanel,
      toggleAllPanels,
      setShortcutsOpen,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useApp должен вызываться внутри AppProvider')
  }
  return ctx
}
