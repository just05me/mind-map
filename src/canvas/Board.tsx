import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge as connectEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type OnConnectEnd,
  type OnConnectStart,
  type OnNodeDrag,
} from '@xyflow/react'
import { useCallback, useEffect, useMemo, useRef, type DragEvent, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent } from 'react'
import { requireKind } from '../kinds/catalog'
import { createId } from '../lib/id'
import { isContainerType, nodeTypeForKind, supportsInlineTitle } from '../lib/node-type'
import { canvasDotColor, resolveCanvasColor } from '../lib/paper'
import { useApp } from '../store/AppContext'
import type { AppEdge, AppNode, CanvasTool, KindId } from '../types'
import { createNodeAt } from './create-node'
import { layoutGraph } from './layout'
import { CommentNode } from './nodes/CommentNode'
import { DecisionNode } from './nodes/DecisionNode'
import { DividerNode } from './nodes/DividerNode'
import { FrameNode } from './nodes/FrameNode'
import { GroupNode } from './nodes/GroupNode'
import { KindNode } from './nodes/KindNode'
import { NoteNode } from './nodes/NoteNode'
import { TextNode } from './nodes/TextNode'

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

function isPaneTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('.react-flow__pane'))
}

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
  )
}

export function Board() {
  const {
    project,
    state,
    setGraph,
    addNode,
    addEdge,
    selectNode,
    selectEdge,
    setViewport,
    clearLayout,
    setCanvasTool,
    setEditingNode,
    setConnectSource,
    setPendingKind,
  } = useApp()
  const { screenToFlowPosition, fitView, getIntersectingNodes } = useReactFlow<AppNode, AppEdge>()
  const connectingNodeId = useRef<string | null>(null)
  const canvasColor = resolveCanvasColor(project.canvasColor, state.theme)

  const styledEdges = useMemo<AppEdge[]>(() => {
    return project.edges.map((edge) => {
      const source = project.nodes.find((node) => node.id === edge.source)
      const color =
        edge.data?.color ??
        (source ? requireKind(project.kinds, source.data.kind).color : '#8e8e93')
      const selected = edge.id === state.selectedEdgeId || edge.selected
      return {
        ...edge,
        style: {
          ...edge.style,
          stroke: color,
          strokeWidth: selected ? 2.2 : 1.5,
        },
      }
    })
  }, [project.edges, project.nodes, project.kinds, state.selectedEdgeId])

  const onNodesChange = useCallback(
    (changes: NodeChange<AppNode>[]) => {
      setGraph(applyNodeChanges(changes, project.nodes), project.edges)
    },
    [project.edges, project.nodes, setGraph],
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange<AppEdge>[]) => {
      setGraph(project.nodes, applyEdgeChanges(changes, project.edges))
    },
    [project.edges, project.nodes, setGraph],
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      connectingNodeId.current = null
      setGraph(project.nodes, connectEdge({ ...connection, id: createId('e') }, project.edges))
    },
    [project.edges, project.nodes, setGraph],
  )

  const onConnectStart: OnConnectStart = useCallback((_event, params) => {
    connectingNodeId.current = params.nodeId ?? null
  }, [])

  const placeNode = useCallback(
    (
      kind: KindId,
      client: { x: number; y: number },
      options?: { edit?: boolean; keepPending?: boolean },
    ) => {
      const position = screenToFlowPosition(client)
      const selected = project.nodes.find((node) => node.id === state.selectedNodeId)
      const parentId = selected && isContainerType(selected.type) ? selected.id : undefined
      const local =
        parentId && selected
          ? { x: position.x - selected.position.x, y: position.y - selected.position.y }
          : position
      addNode(createNodeAt(project, kind, local, parentId), options)
    },
    [addNode, project, screenToFlowPosition, state.selectedNodeId],
  )

  const onConnectEnd: OnConnectEnd = useCallback(
    (event) => {
      const sourceId = connectingNodeId.current
      connectingNodeId.current = null
      if (!sourceId) return
      const point =
        'clientX' in event
          ? { x: event.clientX, y: event.clientY }
          : event.changedTouches[0]
            ? { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY }
            : null
      if (!point || !isPaneTarget(event.target)) return
      const source = project.nodes.find((node) => node.id === sourceId)
      const kind = state.pendingKind ?? source?.data.kind ?? 'module'
      const position = screenToFlowPosition(point)
      const node = createNodeAt(project, kind, position, source?.parentId)
      addNode(node)
      addEdge({ id: createId('e'), source: sourceId, target: node.id })
    },
    [addEdge, addNode, project, screenToFlowPosition, state.pendingKind],
  )

  const onPaneClick = useCallback(
    (event: MouseEvent) => {
      const point = { x: event.clientX, y: event.clientY }
      const tool = state.canvasTool

      if (tool === 'text') {
        placeNode('text', point, { edit: true })
        return
      }

      switch (tool) {
        case 'frame':
          placeNode('frame', point)
          return
        case 'add':
          placeNode(state.pendingKind ?? 'module', point, { keepPending: true })
          return
        case 'connect':
        case 'pan':
          selectNode(null)
          selectEdge(null)
          return
        case 'select':
          if (state.pendingKind) {
            placeNode(state.pendingKind, point)
            return
          }
          selectNode(null)
          selectEdge(null)
          return
        default: {
          const _never: never = tool
          return _never
        }
      }
    },
    [placeNode, selectEdge, selectNode, state.canvasTool, state.pendingKind],
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
        return
      }
      selectNode(node.id)
      selectEdge(null)
    },
    [
      addEdge,
      selectEdge,
      selectNode,
      setConnectSource,
      setEditingNode,
      state.canvasTool,
      state.connectSourceId,
    ],
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
    (_event, node) => {
      if (isContainerType(node.type) || node.parentId) return
      const group = getIntersectingNodes(node).find((item) => isContainerType(item.type))
      if (!group) return
      const next = project.nodes.map((item) =>
        item.id === node.id
          ? {
              ...item,
              parentId: group.id,
              expandParent: true,
              position: {
                x: node.position.x - group.position.x,
                y: node.position.y - group.position.y,
              },
            }
          : item,
      )
      setGraph(next, project.edges)
    },
    [getIntersectingNodes, project.edges, project.nodes, setGraph],
  )

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault()
      const kind = event.dataTransfer.getData('application/mind-map-kind')
      if (!kind) return
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      const type = nodeTypeForKind(kind)
      addNode(createNodeAt(project, kind, position), { edit: type === 'text' })
    },
    [addNode, project, screenToFlowPosition],
  )

  useEffect(() => {
    const pane = document.querySelector('.react-flow__pane')
    if (!(pane instanceof HTMLElement)) return undefined
    const onDouble = (event: globalThis.MouseEvent) => {
      if (state.canvasTool !== 'select' && state.canvasTool !== 'text') return
      placeNode('text', { x: event.clientX, y: event.clientY }, { edit: true })
    }
    pane.addEventListener('dblclick', onDouble)
    return () => pane.removeEventListener('dblclick', onDouble)
  }, [placeNode, state.canvasTool])

  useEffect(() => {
    const command = state.layoutCommand
    if (!command) return
    switch (command) {
      case 'fit':
        void fitView({ padding: 0.18, duration: 300 })
        break
      case 'horizontal':
        setGraph(layoutGraph(project.nodes, project.edges, 'LR'), project.edges)
        window.setTimeout(() => {
          void fitView({ padding: 0.18, duration: 300 })
        }, 30)
        break
      case 'vertical':
        setGraph(layoutGraph(project.nodes, project.edges, 'TB'), project.edges)
        window.setTimeout(() => {
          void fitView({ padding: 0.18, duration: 300 })
        }, 30)
        break
      default: {
        const _never: never = command
        return _never
      }
    }
    clearLayout()
  }, [clearLayout, fitView, project.edges, project.nodes, setGraph, state.layoutCommand])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) {
        if (event.key === 'Escape') setEditingNode(null)
        return
      }
      switch (event.key) {
        case 'Escape':
          setEditingNode(null)
          setConnectSource(null)
          setPendingKind(null)
          setCanvasTool('select')
          break
        case 'v':
        case 'V':
          setCanvasTool('select')
          break
        case 'h':
        case 'H':
          setCanvasTool('pan')
          break
        case 't':
        case 'T':
          setCanvasTool('text')
          break
        case 'f':
        case 'F':
          setCanvasTool('frame')
          break
        case 'a':
        case 'A':
          setCanvasTool('add')
          if (!state.pendingKind) setPendingKind('module')
          break
        case 'l':
        case 'L':
          setCanvasTool('connect')
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setCanvasTool, setConnectSource, setEditingNode, setPendingKind, state.pendingKind])

  const tool = state.canvasTool
  const interaction = interactionForTool(tool)

  return (
    <div className="h-full w-full" style={{ background: canvasColor }}>
      <ReactFlow
        key={project.id}
        nodes={project.nodes}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onPaneClick={onPaneClick}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onEdgeClick={onEdgeClick}
        onNodeDragStop={onNodeDragStop}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onMoveEnd={(_event, viewport) => setViewport(viewport)}
        defaultViewport={project.viewport}
        fitView={project.nodes.length > 0 && !project.viewport}
        colorMode={state.theme}
        deleteKeyCode={['Backspace', 'Delete']}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: 'default' }}
        connectionLineStyle={{ stroke: '#8e8e93', strokeWidth: 1.4 }}
        panOnDrag={interaction.panOnDrag}
        selectionOnDrag={interaction.selectionOnDrag}
        nodesDraggable={interaction.nodesDraggable}
        nodesConnectable={interaction.nodesConnectable}
        elementsSelectable={interaction.elementsSelectable}
        panOnScroll
        className={`h-full w-full tool-${tool}`}
        onKeyDown={(_event: ReactKeyboardEvent) => undefined}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color={canvasDotColor(canvasColor, state.theme)}
        />
        <Controls position="bottom-right" showInteractive={false} />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          className="!mb-14"
          nodeColor={(node) => {
            const data = node.data
            if (data && typeof data === 'object' && 'accentColor' in data && typeof data.accentColor === 'string') {
              return data.accentColor
            }
            const kind =
              data && typeof data === 'object' && 'kind' in data && typeof data.kind === 'string'
                ? data.kind
                : 'module'
            return requireKind(project.kinds, kind).color
          }}
        />
      </ReactFlow>
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
        panOnDrag: [1, 2],
        selectionOnDrag: false,
        nodesDraggable: false,
        nodesConnectable: true,
        elementsSelectable: true,
      }
    case 'text':
    case 'frame':
    case 'add':
      return {
        panOnDrag: [1, 2],
        selectionOnDrag: false,
        nodesDraggable: true,
        nodesConnectable: false,
        elementsSelectable: true,
      }
    case 'select':
      return {
        panOnDrag: [1, 2],
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
