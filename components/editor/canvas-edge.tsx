"use client"

import {
  createContext,
  memo,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import type {
  ChangeEvent,
  CSSProperties,
  KeyboardEvent,
  MouseEvent,
  PropsWithChildren,
} from "react"
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
} from "@xyflow/react"
import type { EdgeProps } from "@xyflow/react"

import type { CanvasEdge } from "@/types/canvas"

type EdgeLabelChangeHandler = (edgeId: string, label: string) => void
type CanvasEdgeEditingContextValue = {
  onLabelChange: EdgeLabelChangeHandler
}

const CanvasEdgeEditingContext =
  createContext<CanvasEdgeEditingContextValue | null>(null)

function CanvasEdgeEditingProvider({
  children,
  onLabelChange,
}: PropsWithChildren<{ onLabelChange: EdgeLabelChangeHandler }>) {
  return (
    <CanvasEdgeEditingContext.Provider value={{ onLabelChange }}>
      {children}
    </CanvasEdgeEditingContext.Provider>
  )
}

const CanvasEdgeRenderer = memo(function CanvasEdgeRenderer({
  data,
  id,
  interactionWidth,
  markerEnd,
  selected,
  sourcePosition,
  sourceX,
  sourceY,
  style,
  targetPosition,
  targetX,
  targetY,
}: EdgeProps<CanvasEdge>) {
  const [editingLabel, setEditingLabel] = useState<string | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const edgeEditing = useContext(CanvasEdgeEditingContext)
  const savedLabel = data?.label ?? ""
  const isEditing = editingLabel !== null
  const isActive = Boolean(selected || isHovered || isEditing)
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    borderRadius: 8,
    offset: 20,
    sourcePosition,
    sourceX,
    sourceY,
    targetPosition,
    targetX,
    targetY,
  })
  const edgeStyle: CSSProperties = {
    ...style,
    opacity: isActive ? 1 : 0.62,
    stroke: style?.stroke ?? "var(--foreground)",
    strokeLinecap: "round",
    strokeWidth: style?.strokeWidth ?? 1.5,
  }

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const startEditing = (event: MouseEvent<Element>) => {
    event.preventDefault()
    event.stopPropagation()
    setEditingLabel(savedLabel)
  }

  const commitLabel = () => {
    if (editingLabel === null) {
      return
    }

    if (editingLabel !== savedLabel) {
      edgeEditing?.onLabelChange(id, editingLabel)
    }

    setEditingLabel(null)
  }

  const handleLabelChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEditingLabel(event.target.value)
  }

  const handleLabelKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === "Escape") {
      event.preventDefault()
      event.currentTarget.blur()
    }
  }

  const stopCanvasInteraction = (event: MouseEvent<Element>) => {
    event.stopPropagation()
  }

  return (
    <>
      <g
        onDoubleClick={startEditing}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <BaseEdge
          id={id}
          interactionWidth={Math.max(interactionWidth ?? 20, 24)}
          markerEnd={markerEnd}
          path={edgePath}
          style={edgeStyle}
        />
      </g>
      <EdgeLabelRenderer>
        {savedLabel || isActive ? (
          <div
            className="nodrag nopan nowheel absolute"
            onDoubleClick={startEditing}
            onMouseDown={stopCanvasInteraction}
            onPointerDown={stopCanvasInteraction}
            style={{
              pointerEvents: "all",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
          >
            {isEditing ? (
              <input
                aria-label="Edge label"
                className="nodrag nopan nowheel field-sizing-content min-w-[2ch] max-w-[32ch] rounded-full border border-ring bg-card px-2 py-0.5 text-center text-xs text-foreground shadow-sm outline-none focus:ring-2 focus:ring-ring/60"
                onBlur={commitLabel}
                onChange={handleLabelChange}
                onKeyDown={handleLabelKeyDown}
                onMouseDown={stopCanvasInteraction}
                onPointerDown={stopCanvasInteraction}
                ref={inputRef}
                size={Math.max((editingLabel?.length ?? 0) + 1, 2)}
                value={editingLabel ?? ""}
              />
            ) : savedLabel ? (
              <div
                aria-label={`Edge label: ${savedLabel}`}
                className="rounded-full border border-border bg-card/95 px-2 py-0.5 text-xs text-foreground shadow-sm backdrop-blur"
              >
                {savedLabel}
              </div>
            ) : (
              <span className="rounded-full border border-border/60 bg-card/70 px-2 py-0.5 text-xs italic text-muted-foreground/65">
                Add label
              </span>
            )}
          </div>
        ) : null}
      </EdgeLabelRenderer>
    </>
  )
})

export { CanvasEdgeEditingProvider, CanvasEdgeRenderer }
