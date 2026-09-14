import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  SelectionMode,
  useReactFlow,
  type OnConnectEnd,
  type OnConnectStart,
  type OnNodeDrag,
} from '@xyflow/react'
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type MouseEvent } from 'react'
import { requireKind } from '../model/kinds'
import { createId } from '../lib/id'
import { isContainerType, nodeTypeForKind, supportsInlineTitle } from '../model/node-type'
import { canvasDotColor, resolveCanvasColor } from '../model/paper'
import { useApp } from '../store/AppContext'
import type { AppEdge, AppNode, CanvasTool, KindId } from '../model/types'
import { ContextMenu, type ContextMenuState } from './ContextMenu'
import { createNodeAt } from './create-node'
import { LabeledEdge } from './edges/LabeledEdge'
import { layoutGraph } from './layout'
import { CommentNode } from './nodes/CommentNode'
import { DecisionNode } from './nodes/DecisionNode'
import { DividerNode } from './nodes/DividerNode'
import { FrameNode } from './nodes/FrameNode'
import { GroupNode } from './nodes/GroupNode'
import { KindNode } from './nodes/KindNode'
import { NoteNode } from './nodes/NoteNode'
import { TextNode } from './nodes/TextNode'
import { SelectionToolbar } from './SelectionToolbar'
import { isModifier, isTypingTarget } from './shortcuts'

import '@xyflow/react/dist/style.css'

const nodeTypes = {
  kind: KindNode,
  group: GroupNode,
  note: NoteNode,
  text: TextNode,
  frame: FrameNode,
  divider: DividerNode,
  decision: DecisionNode,
  comment: CommentNode,
}

const edgeTypes = {
  default: LabeledEdge,
}

/** True only for empty canvas: nodes and edges are rendered inside the pane element too. */
function isPaneTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    Boolean(target.closest('.react-flow__pane')) &&
    !target.closest(
      '.react-flow__node, .react-flow__edge, .react-flow__edgelabel-renderer, .react-flow__nodesselection, .react-flow__node-toolbar',
    )
  )
}

export function Board() {
  const app = useApp()
  const {
    project,
    state,
    addNode,
    addEdge,
    selectNode,
    selectEdge,
    setViewport,
    clearLayout,
    setEditingNode,
    setConnectSource,
    setGraph,
    reparent,
  } = app
  const { screenToFlowPosition, fitView, getIntersectingNodes } = useReactFlow<AppNode, AppEdge>()
  const connectingNodeId = useRef<string | null>(null)
  const [menu, setMenu] = useState<ContextMenuState | null>(null)
  const [spacePan, setSpacePan] = useState(false)
  // Fit only when opening a project that has content but no saved camera.
  const [fitOnOpen] = useState(() => project.nodes.length > 0 && !project.viewport)
  const lastPointer = useRef<{ x: number; y: number } | null>(null)
  const canvasColor = resolveCanvasColor(project.canvasColor, state.theme)

  // Frames and groups sit under edges so lines crossing them stay visible.
  const layeredNodes = useMemo<AppNode[]>(
    () =>
      project.nodes.map((node) =>
        isContainerType(node.type) && node.zIndex == null ? { ...node, zIndex: -1 } : node,
      ),
    [project.nodes],
  )

  const styledEdges = useMemo<AppEdge[]>(() => {
    const byId = new Map(project.nodes.map((node) => [node.id, node]))
    return project.edges.map((edge) => {
      const source = byId.get(edge.source)
      const color =
        edge.data?.color ??
        source?.data.accentColor ??
        (source ? requireKind(project.kinds, source.data.kind).color : '#8e8e93')
      return {
        ...edge,
        style: {
          ...edge.style,
          stroke: color,
          strokeWidth: edge.selected ? 2.6 : 1.6,
        },
      }
    })
  }, [project.edges, project.nodes, project.kinds])

  const onConnectStart: OnConnectStart = useCallback((_event, params) => {
    connectingNodeId.current = params.nodeId ?? null
  }, [])

  const placeNode = useCallback(
    (
      kind: KindId,
      flow: { x: number; y: number },
      options?: { edit?: boolean; keepPending?: boolean },
    ) => {
      const type = nodeTypeForKind(kind)
      // New elements open straight into typing, like FigJam; frames just get placed.
      const edit = supportsInlineTitle(type) && !isContainerType(type)
      addNode(createNodeAt(project, kind, flow), { edit, ...options })
    },
    [addNode, project],
  )

  const placeAtClient = useCallback(
    (kind: KindId, client: { x: number; y: number }, options?: { edit?: boolean; keepPending?: boolean }) => {
      placeNode(kind, screenToFlowPosition(client), options)
    },
    [placeNode, screenToFlowPosition],
  )

  const onConnectEnd: OnConnectEnd = useCallback(
    (event, connectionState) => {
      const sourceId = connectingNodeId.current
      connectingNodeId.current = null
      if (!sourceId || connectionState.isValid) return
      const point =
        'clientX' in event
          ? { x: event.clientX, y: event.clientY }
          : event.changedTouches[0]
            ? { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY }
            : null
      if (!point || !isPaneTarget(event.target)) return
      // Dropping a connection on empty canvas creates a sibling node, like FigJam.
      const source = project.nodes.find((node) => node.id === sourceId)
      const kind = state.pendingKind ?? (source?.type === 'kind' ? source.data.kind : 'module')
      const node = createNodeAt(project, kind, screenToFlowPosition(point))
      addNode(node, { fromNodeId: sourceId, edit: true })
    },
    [addNode, project, screenToFlowPosition, state.pendingKind],
  )

  const onPaneClick = useCallback(
    (event: MouseEvent) => {
      const point = { x: event.clientX, y: event.clientY }
      const tool = state.canvasTool
      switch (tool) {
        case 'text':
          placeAtClient('text', point, { edit: true })
          return
        case 'frame':
          placeAtClient('frame', point)
          return
        case 'add':
          placeAtClient(state.pendingKind ?? 'module', point)
          return
        case 'connect':
          setConnectSource(null)
          selectNode(null)
          return
        case 'pan':
        case 'select':
          selectNode(null)
          return
        default: {
          const _never: never = tool
          return _never
        }
      }
    },
    [placeAtClient, selectNode, setConnectSource, state.canvasTool, state.pendingKind],
  )

  const onNodeClick = useCallback(
    (_event: MouseEvent, node: AppNode) => {
      if (state.canvasTool === 'connect') {
        if (!state.connectSourceId) {
          setConnectSource(node.id)
          selectNode(node.id)
          return
        }
        if (state.connectSourceId !== node.id) {
          addEdge({ id: createId('e'), source: state.connectSourceId, target: node.id })
        }
        setConnectSource(null)
        selectNode(node.id)
        return
      }
      if (state.canvasTool === 'text' && node.type === 'text') {
        selectNode(node.id)
        setEditingNode(node.id, 'title')
      }
    },
    [addEdge, selectNode, setConnectSource, setEditingNode, state.canvasTool, state.connectSourceId],
  )

  const onNodeDoubleClick = useCallback(
    (_event: MouseEvent, node: AppNode) => {
      if (supportsInlineTitle(node.type)) {
        selectNode(node.id)
        setEditingNode(node.id, 'title')
      }
    },
    [selectNode, setEditingNode],
  )

  const onEdgeClick = useCallback(
    (_event: MouseEvent, edge: AppEdge) => {
      selectEdge(edge.id)
    },
    [selectEdge],
  )

  const onNodeDragStop: OnNodeDrag<AppNode> = useCallback(
    (_event, node, nodes) => {
      if (nodes.length > 1 || isContainerType(node.type)) return
      const containers = getIntersectingNodes(node).filter(
        (item) => isContainerType(item.type) && item.id !== node.id,
      )
      if (node.parentId) {
        // Dragged fully out of its frame: take it out.
        if (!containers.some((item) => item.id === node.parentId)) reparent(node.id, null)
        return
      }
      const container = containers.at(-1)
      if (container) reparent(node.id, container.id)
    },
    [getIntersectingNodes, reparent],
  )

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }, [])

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault()
      const kind = event.dataTransfer.getData('application/mind-map-kind')
      if (!kind) return
      placeAtClient(kind, { x: event.clientX, y: event.clientY })
    },
    [placeAtClient],
  )

  const openMenu = useCallback(
    (event: MouseEvent | globalThis.MouseEvent, target: ContextMenuState['target']) => {
      event.preventDefault()
      const client = { x: event.clientX, y: event.clientY }
      setMenu({ client, flow: screenToFlowPosition(client), target })
    },
    [screenToFlowPosition],
  )

  useEffect(() => {
    const pane = document.querySelector('.react-flow__pane')
    if (!(pane instanceof HTMLElement)) return undefined
    const onDouble = (event: globalThis.MouseEvent) => {
      if (state.canvasTool !== 'select' && state.canvasTool !== 'text') return
      if (!isPaneTarget(event.target)) return
      placeAtClient('text', { x: event.clientX, y: event.clientY }, { edit: true })
    }
    pane.addEventListener('dblclick', onDouble)
    return () => pane.removeEventListener('dblclick', onDouble)
  }, [placeAtClient, state.canvasTool, project.id])

  useEffect(() => {
    const command = state.layoutCommand
    if (!command) return
    switch (command) {
      case 'fit':
        void fitView({ padding: 0.18, duration: 300, maxZoom: 1.2 })
        break
      case 'horizontal':
        setGraph(layoutGraph(project.nodes, project.edges, 'LR'), project.edges)
        window.setTimeout(() => void fitView({ padding: 0.18, duration: 300, maxZoom: 1.2 }), 30)
        break
      case 'vertical':
        setGraph(layoutGraph(project.nodes, project.edges, 'TB'), project.edges)
        window.setTimeout(() => void fitView({ padding: 0.18, duration: 300, maxZoom: 1.2 }), 30)
        break
      default: {
        const _never: never = command
        return _never
      }
    }
    clearLayout()
  }, [clearLayout, fitView, project.edges, project.nodes, setGraph, state.layoutCommand])

  // Keep a live reference so the single keydown listener never reads stale state.
  const live = useRef(app)
  live.current = app

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const current = live.current
      if (current.state.view !== 'map') return
      if (isTypingTarget(event.target)) {
        if (event.key === 'Escape') current.setEditingNode(null)
        return
      }
      const selectedIds = current.project.nodes.filter((node) => node.selected).map((node) => node.id)
      const mod = isModifier(event)

      if (mod) {
        switch (event.key.toLowerCase()) {
          case 'z':
            event.preventDefault()
            if (event.shiftKey) current.redo()
            else current.undo()
            return
          case 'y':
            event.preventDefault()
            current.redo()
            return
          case 'd':
            event.preventDefault()
            current.duplicateNodes(selectedIds)
            return
          case 'c':
            if (selectedIds.length > 0) current.copyNodes(selectedIds)
            return
          case 'x':
            if (selectedIds.length > 0) {
              current.copyNodes(selectedIds)
              current.deleteElements(selectedIds)
            }
            return
          case 'v': {
            event.preventDefault()
            const pointer = lastPointer.current
            current.paste(pointer ? screenToFlowPosition(pointer) : undefined)
            return
          }
          case 'a':
            event.preventDefault()
            current.selectAll()
            return
          case '\\':
            event.preventDefault()
            current.toggleAllPanels()
            return
          default:
            return
        }
      }

      if (event.altKey || event.ctrlKey || event.metaKey) return

      switch (event.key) {
        case 'Delete':
        case 'Backspace':
          event.preventDefault()
          current.deleteSelection()
          return
        case 'Escape':
          current.setEditingNode(null)
          current.setConnectSource(null)
          current.setPendingKind(null)
          current.setCanvasTool('select')
          current.selectNode(null)
          return
        case 'Enter':
          if (selectedIds.length === 1) {
            event.preventDefault()
            current.setEditingNode(selectedIds[0], 'title')
          }
          return
        case ' ':
          event.preventDefault()
          setSpacePan(true)
          return
        case '!':
          current.requestLayout('fit')
          return
        case '?':
          current.setShortcutsOpen(true)
          return
        case '[':
          current.togglePanel('left')
          return
        case ']':
          current.togglePanel('right')
          return
        default:
          break
      }

      switch (event.code) {
        case 'KeyV':
          current.setCanvasTool('select')
          return
        case 'KeyH':
          current.setCanvasTool('pan')
          return
        case 'KeyT':
          current.setCanvasTool('text')
          return
        case 'KeyF':
          current.setCanvasTool('frame')
          return
        case 'KeyN':
        case 'KeyA':
          current.setPendingKind(current.state.pendingKind ?? 'module')
          return
        case 'KeyS':
          current.setPendingKind('note')
          return
        case 'KeyL':
          current.setCanvasTool('connect')
          return
        case 'Digit1':
          if (event.shiftKey) current.requestLayout('fit')
          return
        default:
          return
      }
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === ' ') setSpacePan(false)
    }
    const onPointerMove = (event: PointerEvent) => {
      lastPointer.current = { x: event.clientX, y: event.clientY }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    const onBlur = () => setSpacePan(false)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('pointermove', onPointerMove)
    }
  }, [screenToFlowPosition])

  const tool: CanvasTool = spacePan ? 'pan' : state.canvasTool
  const interaction = interactionForTool(tool)

  return (
    <div className="h-full w-full" style={{ background: canvasColor }}>
      <ReactFlow
        key={project.id}
        nodes={layeredNodes}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={app.onNodesChange}
        onEdgesChange={app.onEdgesChange}
        onConnect={app.connect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onPaneClick={onPaneClick}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onEdgeClick={onEdgeClick}
        onNodeDragStop={onNodeDragStop}
        onNodeContextMenu={(event, node) => {
          if (!node.selected) selectNode(node.id)
          openMenu(event, { type: 'node', id: node.id })
        }}
        onEdgeContextMenu={(event, edge) => {
          selectEdge(edge.id)
          openMenu(event, { type: 'edge', id: edge.id })
        }}
        onPaneContextMenu={(event) => openMenu(event, { type: 'pane' })}
        onSelectionContextMenu={(event, nodes) => {
          const first = nodes[0]
          if (first) openMenu(event, { type: 'node', id: first.id })
        }}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onMoveEnd={(_event, viewport) => setViewport(viewport)}
        defaultViewport={project.viewport}
        fitView={fitOnOpen}
        fitViewOptions={{ maxZoom: 1, padding: 0.2 }}
        colorMode={state.theme}
        deleteKeyCode={null}
        selectionKeyCode="Shift"
        multiSelectionKeyCode={['Meta', 'Control', 'Shift']}
        selectionMode={SelectionMode.Partial}
        connectionMode={ConnectionMode.Loose}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: 'default' }}
        connectionLineStyle={{ stroke: 'var(--accent)', strokeWidth: 1.6 }}
        connectionRadius={28}
        panOnDrag={interaction.panOnDrag}
        selectionOnDrag={interaction.selectionOnDrag}
        nodesDraggable={interaction.nodesDraggable}
        nodesConnectable={interaction.nodesConnectable}
        elementsSelectable={interaction.elementsSelectable}
        panOnScroll
        zoomOnDoubleClick={false}
        minZoom={0.1}
        maxZoom={3}
        className={`h-full w-full tool-${tool}`}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color={canvasDotColor(canvasColor, state.theme)}
        />
        <SelectionToolbar />
        {state.minimapOpen ? (
          <MiniMap
            position="bottom-right"
            pannable
            zoomable
            className="!mb-16"
            nodeColor={(node: AppNode) =>
              node.data.accentColor ?? requireKind(project.kinds, node.data.kind).color
            }
          />
        ) : null}
      </ReactFlow>
      {menu ? (
        <ContextMenu
          menu={menu}
          onClose={() => setMenu(null)}
          onPlace={(kind, flow) => placeNode(kind, flow)}
        />
      ) : null}
    </div>
  )
}

function interactionForTool(tool: CanvasTool): {
  panOnDrag: boolean | number[]
  selectionOnDrag: boolean
  nodesDraggable: boolean
  nodesConnectable: boolean
  elementsSelectable: boolean
} {
  switch (tool) {
    case 'pan':
      return {
        panOnDrag: true,
        selectionOnDrag: false,
        nodesDraggable: false,
        nodesConnectable: false,
        elementsSelectable: false,
      }
    case 'connect':
      return {
        panOnDrag: [1],
        selectionOnDrag: false,
        nodesDraggable: false,
        nodesConnectable: true,
        elementsSelectable: true,
      }
    case 'text':
    case 'frame':
    case 'add':
      return {
        panOnDrag: [1],
        selectionOnDrag: false,
        nodesDraggable: true,
        nodesConnectable: true,
        elementsSelectable: true,
      }
    case 'select':
      return {
        panOnDrag: [1],
        selectionOnDrag: true,
        nodesDraggable: true,
        nodesConnectable: true,
        elementsSelectable: true,
      }
    default: {
      const _never: never = tool
      return _never
    }
  }
}
