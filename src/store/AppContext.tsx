import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import type { Viewport } from '@xyflow/react'
import { mergeBuiltinKinds, removeKind, upsertKind } from '../kinds/catalog'
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
} from '../types'
import { createEmptyProject, duplicateProject } from './project-factory'
import { loadStore, saveStore } from './storage'

type AppState = {
  projects: Project[]
  currentId: string
  view: ViewMode
  theme: ThemeMode
  selectedNodeId: string | null
  selectedEdgeId: string | null
  pendingKind: KindId | null
  canvasTool: CanvasTool
  editingNodeId: string | null
  editingField: 'title' | 'description'
  connectSourceId: string | null
  layoutCommand: LayoutCommand | null
}

type AddNodeOptions = {
  edit?: boolean
  keepPending?: boolean
}

type Action =
  | { type: 'setView'; view: ViewMode }
  | { type: 'setTheme'; theme: ThemeMode }
  | { type: 'selectNode'; id: string | null }
  | { type: 'selectEdge'; id: string | null }
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
  | { type: 'updateNodeData'; id: string; data: Partial<NodeData> }
  | { type: 'updateEdgeData'; id: string; data: Partial<EdgeData> }
  | { type: 'addNode'; node: AppNode; edit?: boolean; keepPending?: boolean }
  | { type: 'addEdge'; edge: AppEdge }
  | { type: 'detachFromGroup'; id: string }
  | { type: 'addCustomKind'; kind: KindDef }
  | { type: 'updateKind'; kind: KindDef }
  | { type: 'removeKind'; id: KindId }
  | { type: 'importProject'; project: Project }
  | { type: 'requestLayout'; layout: LayoutCommand | null }

type AppContextValue = {
  state: AppState
  project: Project
  dispatch: (action: Action) => void
  setView: (view: ViewMode) => void
  setTheme: (theme: ThemeMode) => void
  selectNode: (id: string | null) => void
  selectEdge: (id: string | null) => void
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
  updateNodeData: (id: string, data: Partial<NodeData>) => void
  updateEdgeData: (id: string, data: Partial<EdgeData>) => void
  addNode: (node: AppNode, options?: AddNodeOptions) => void
  addEdge: (edge: AppEdge) => void
  detachFromGroup: (id: string) => void
  addCustomKind: (kind: KindDef) => void
  updateKind: (kind: KindDef) => void
  removeCustomKind: (id: KindId) => void
  importProject: (project: Project) => void
  requestLayout: (layout: LayoutCommand) => void
  clearLayout: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

function touch(project: Project): Project {
  return { ...project, updatedAt: new Date().toISOString() }
}

function mapCurrent(state: AppState, updater: (project: Project) => Project): AppState {
  return {
    ...state,
    projects: state.projects.map((project) =>
      project.id === state.currentId ? touch(updater(project)) : project,
    ),
  }
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'setView':
      return {
        ...state,
        view: action.view,
        selectedNodeId: null,
        selectedEdgeId: null,
        editingNodeId: null,
        connectSourceId: null,
        canvasTool: 'select',
      }
    case 'setTheme':
      return { ...state, theme: action.theme }
    case 'selectNode':
      return {
        ...state,
        selectedNodeId: action.id,
        selectedEdgeId: action.id ? null : state.selectedEdgeId,
      }
    case 'selectEdge':
      return {
        ...state,
        selectedEdgeId: action.id,
        selectedNodeId: action.id ? null : state.selectedNodeId,
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
      return {
        ...state,
        projects: [...state.projects, project],
        currentId: project.id,
        selectedNodeId: null,
        selectedEdgeId: null,
        pendingKind: null,
        editingNodeId: null,
        connectSourceId: null,
        canvasTool: 'select',
      }
    }
    case 'duplicateProject': {
      const current = state.projects.find((item) => item.id === state.currentId)
      if (!current) return state
      const copy = duplicateProject(current)
      return {
        ...state,
        projects: [...state.projects, copy],
        currentId: copy.id,
        selectedNodeId: null,
        selectedEdgeId: null,
        editingNodeId: null,
      }
    }
    case 'deleteProject': {
      const remaining = state.projects.filter((item) => item.id !== action.id)
      if (remaining.length === 0) {
        const project = createEmptyProject()
        return {
          ...state,
          projects: [project],
          currentId: project.id,
          selectedNodeId: null,
          selectedEdgeId: null,
          editingNodeId: null,
        }
      }
      const currentId =
        state.currentId === action.id ? remaining[0].id : state.currentId
      return {
        ...state,
        projects: remaining,
        currentId,
        selectedNodeId: null,
        selectedEdgeId: null,
        editingNodeId: null,
      }
    }
    case 'switchProject':
      return {
        ...state,
        currentId: action.id,
        selectedNodeId: null,
        selectedEdgeId: null,
        pendingKind: null,
        editingNodeId: null,
        connectSourceId: null,
        canvasTool: 'select',
      }
    case 'renameProject':
      return mapCurrent(state, (project) => ({
        ...project,
        title: action.title,
        description: action.description,
      }))
    case 'setViewport':
      return mapCurrent(state, (project) => ({ ...project, viewport: action.viewport }))
    case 'setCanvasColor':
      return mapCurrent(state, (project) => ({ ...project, canvasColor: action.color }))
    case 'setGraph':
      return mapCurrent(state, (project) => ({
        ...project,
        nodes: action.nodes,
        edges: action.edges,
      }))
    case 'updateNodeData':
      return mapCurrent(state, (project) => ({
        ...project,
        nodes: project.nodes.map((node) =>
          node.id === action.id
            ? { ...node, data: { ...node.data, ...action.data } }
            : node,
        ),
      }))
    case 'updateEdgeData':
      return mapCurrent(state, (project) => ({
        ...project,
        edges: project.edges.map((edge) =>
          edge.id === action.id
            ? { ...edge, data: { ...edge.data, ...action.data } }
            : edge,
        ),
      }))
    case 'addNode':
      return {
        ...mapCurrent(state, (project) => ({
          ...project,
          nodes: [...project.nodes, action.node],
        })),
        selectedNodeId: action.node.id,
        selectedEdgeId: null,
        pendingKind: action.keepPending ? state.pendingKind : null,
        editingNodeId: action.edit ? action.node.id : null,
        canvasTool: action.edit ? 'select' : action.keepPending ? state.canvasTool : 'select',
      }
    case 'addEdge':
      return mapCurrent(state, (project) => ({
        ...project,
        edges: [...project.edges, action.edge],
      }))
    case 'detachFromGroup':
      return mapCurrent(state, (project) => {
        const target = project.nodes.find((node) => node.id === action.id)
        if (!target?.parentId) return project
        const parent = project.nodes.find((node) => node.id === target.parentId)
        const abs = {
          x: target.position.x + (parent?.position.x ?? 0),
          y: target.position.y + (parent?.position.y ?? 0),
        }
        return {
          ...project,
          nodes: project.nodes.map((node) =>
            node.id === action.id
              ? { ...node, parentId: undefined, position: abs, expandParent: undefined }
              : node,
          ),
        }
      })
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
      return {
        ...state,
        projects: [
          ...state.projects,
          {
            ...action.project,
            kinds: mergeBuiltinKinds(action.project.kinds),
          },
        ],
        currentId: action.project.id,
        selectedNodeId: null,
        selectedEdgeId: null,
      }
    case 'requestLayout':
      return { ...state, layoutCommand: action.layout }
    default: {
      const _never: never = action
      return _never
    }
  }
}

const initial = loadStore()

const initialState: AppState = {
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
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

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

  const project = useMemo(() => {
    return state.projects.find((item) => item.id === state.currentId) ?? state.projects[0]
  }, [state.projects, state.currentId])

  const setView = useCallback((view: ViewMode) => dispatch({ type: 'setView', view }), [])
  const setTheme = useCallback((theme: ThemeMode) => dispatch({ type: 'setTheme', theme }), [])
  const selectNode = useCallback((id: string | null) => dispatch({ type: 'selectNode', id }), [])
  const selectEdge = useCallback((id: string | null) => dispatch({ type: 'selectEdge', id }), [])
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
  const updateNodeData = useCallback(
    (id: string, data: Partial<NodeData>) => dispatch({ type: 'updateNodeData', id, data }),
    [],
  )
  const updateEdgeData = useCallback(
    (id: string, data: Partial<EdgeData>) => dispatch({ type: 'updateEdgeData', id, data }),
    [],
  )
  const addNode = useCallback(
    (node: AppNode, options?: AddNodeOptions) =>
      dispatch({
        type: 'addNode',
        node,
        edit: options?.edit,
        keepPending: options?.keepPending,
      }),
    [],
  )
  const addEdge = useCallback((edge: AppEdge) => dispatch({ type: 'addEdge', edge }), [])
  const detachFromGroup = useCallback(
    (id: string) => dispatch({ type: 'detachFromGroup', id }),
    [],
  )
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

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      project,
      dispatch,
      setView,
      setTheme,
      selectNode,
      selectEdge,
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
      updateNodeData,
      updateEdgeData,
      addNode,
      addEdge,
      detachFromGroup,
      addCustomKind,
      updateKind,
      removeCustomKind,
      importProject,
      requestLayout,
      clearLayout,
    }),
    [
      state,
      project,
      setView,
      setTheme,
      selectNode,
      selectEdge,
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
      updateNodeData,
      updateEdgeData,
      addNode,
      addEdge,
      detachFromGroup,
      addCustomKind,
      updateKind,
      removeCustomKind,
      importProject,
      requestLayout,
      clearLayout,
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
