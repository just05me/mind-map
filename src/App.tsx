import { ReactFlowProvider } from '@xyflow/react'
import { StatusBoard } from './board/StatusBoard'
import { Board } from './canvas/Board'
import { CanvasToolbar } from './canvas/CanvasToolbar'
import { EmptyHint } from './canvas/EmptyHint'
import { ToolHint } from './canvas/ToolHint'
import { ZoomControls } from './canvas/ZoomControls'
import { AppProvider, useApp } from './store/AppContext'
import { Palette } from './ui/Palette'
import { ShortcutsDialog } from './ui/ShortcutsDialog'
import { Sidebar } from './ui/Sidebar'
import { SidePanel } from './ui/SidePanel'
import { Toolbar } from './ui/Toolbar'

function Workspace() {
  const { state } = useApp()
  const mapVisible = state.view === 'map'

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--bg)] text-[var(--text)]">
      <Toolbar />
      <div className="relative min-h-0 flex-1 overflow-clip">
        <div
          className={`absolute inset-0 ${mapVisible ? '' : 'pointer-events-none invisible opacity-0'}`}
        >
          <Board />
          <EmptyHint />
          <ToolHint />
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center">
            <CanvasToolbar />
          </div>
          <div className="absolute bottom-3 right-3 z-20">
            <ZoomControls />
          </div>
          <SidePanel side="left" title="Элементы" icon="box">
            <Palette />
          </SidePanel>
          <SidePanel side="right" title="Свойства" icon="edit">
            <Sidebar />
          </SidePanel>
        </div>
        {state.view === 'board' ? (
          <div className="absolute inset-0 bg-[var(--bg)]">
            <StatusBoard />
            <SidePanel side="right" title="Свойства" icon="edit">
              <Sidebar />
            </SidePanel>
          </div>
        ) : null}
      </div>
      <ShortcutsDialog />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <ReactFlowProvider>
        <Workspace />
      </ReactFlowProvider>
    </AppProvider>
  )
}
