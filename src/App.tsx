import { ReactFlowProvider } from '@xyflow/react'
import { StatusBoard } from './board/StatusBoard'
import { Board } from './canvas/Board'
import { CanvasToolbar } from './canvas/CanvasToolbar'
import { AppProvider, useApp } from './store/AppContext'
import { EmptyHint } from './ui/EmptyHint'
import { Legend } from './ui/Legend'
import { Palette } from './ui/Palette'
import { Sidebar } from './ui/Sidebar'
import { Toolbar } from './ui/Toolbar'

function Workspace() {
  const { state } = useApp()
  const mapVisible = state.view === 'map'

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--bg)] text-[var(--text)]">
      <Toolbar />
      <div className="relative min-h-0 flex-1">
        <div
          className={`absolute inset-0 ${
            mapVisible ? '' : 'pointer-events-none invisible opacity-0'
          }`}
        >
          <Board />
          <EmptyHint />
          <div className="absolute left-1/2 top-3 z-20 -translate-x-1/2">
            <CanvasToolbar />
          </div>
          <div className="absolute bottom-3 left-[232px] z-10 max-w-[min(360px,calc(100%-520px))]">
            <Legend />
          </div>
          <div className="absolute bottom-3 left-3 top-3 z-20">
            <Palette />
          </div>
          <div className="absolute bottom-3 right-3 top-3 z-20">
            <Sidebar />
          </div>
        </div>
        {state.view === 'board' ? (
          <div className="absolute inset-0 bg-[var(--bg)]">
            <StatusBoard />
            <div className="absolute bottom-3 right-3 top-3 z-20">
              <Sidebar />
            </div>
          </div>
        ) : null}
      </div>
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
