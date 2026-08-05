import { Maximize2, Minus, Plus, Redo2, Undo2 } from "lucide-react"
import type { ReactFlowInstance } from "@xyflow/react"

import { Button } from "@/components/ui/button"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"

type CanvasControlsProps = {
  canRedo: boolean
  canUndo: boolean
  onRedo: () => void
  onUndo: () => void
  reactFlow: ReactFlowInstance<CanvasNode, CanvasEdge>
}

const ZOOM_ANIMATION_DURATION = 180

function CanvasControls({
  canRedo,
  canUndo,
  onRedo,
  onUndo,
  reactFlow,
}: CanvasControlsProps) {
  return (
    <div className="pointer-events-none absolute bottom-5 left-5 z-20">
      <div
        aria-label="Canvas controls"
        className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-card/95 p-1.5 shadow-2xl backdrop-blur"
        onPointerDown={(event) => event.stopPropagation()}
        role="toolbar"
      >
        <div aria-label="Zoom controls" className="flex items-center gap-1">
          <Button
            aria-label="Zoom out"
            onClick={() => void reactFlow.zoomOut({ duration: ZOOM_ANIMATION_DURATION })}
            size="icon-sm"
            title="Zoom out"
            type="button"
            variant="ghost"
          >
            <Minus />
          </Button>
          <Button
            aria-label="Fit view"
            onClick={() => void reactFlow.fitView({ duration: ZOOM_ANIMATION_DURATION })}
            size="icon-sm"
            title="Fit view"
            type="button"
            variant="ghost"
          >
            <Maximize2 />
          </Button>
          <Button
            aria-label="Zoom in"
            onClick={() => void reactFlow.zoomIn({ duration: ZOOM_ANIMATION_DURATION })}
            size="icon-sm"
            title="Zoom in"
            type="button"
            variant="ghost"
          >
            <Plus />
          </Button>
        </div>
        <div aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
        <div aria-label="History controls" className="flex items-center gap-1">
          <Button
            aria-label="Undo"
            disabled={!canUndo}
            onClick={onUndo}
            size="icon-sm"
            title="Undo"
            type="button"
            variant="ghost"
          >
            <Undo2 />
          </Button>
          <Button
            aria-label="Redo"
            disabled={!canRedo}
            onClick={onRedo}
            size="icon-sm"
            title="Redo"
            type="button"
            variant="ghost"
          >
            <Redo2 />
          </Button>
        </div>
      </div>
    </div>
  )
}

export { CanvasControls }
export type { CanvasControlsProps }
