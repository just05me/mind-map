import { Handle, Position } from '@xyflow/react'

/**
 * Connection points on all four sides, revealed on hover (see .app-handle in index.css).
 * Left/right keep their original id-less handles so saved edges still attach.
 */
export function NodeHandles() {
  return (
    <>
      <Handle type="target" position={Position.Left} className="app-handle" />
      <Handle type="source" position={Position.Right} className="app-handle" />
      <Handle type="source" id="t" position={Position.Top} className="app-handle" />
      <Handle type="source" id="b" position={Position.Bottom} className="app-handle" />
    </>
  )
}
