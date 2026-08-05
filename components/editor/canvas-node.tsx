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
  PropsWithChildren,
} from "react"
import { Check } from "lucide-react"
import { Handle, NodeResizer, NodeToolbar, Position } from "@xyflow/react"
import type { NodeProps } from "@xyflow/react"

import { NODE_COLOR_PALETTE } from "@/types/canvas"
import type {
  CanvasNode,
  CanvasNodeColorPair,
  CanvasShape,
} from "@/types/canvas"

type NodeLabelChangeHandler = (nodeId: string, label: string) => void
type NodeColorChangeHandler = (
  nodeId: string,
  colorPair: CanvasNodeColorPair
) => void
type CanvasNodeEditingContextValue = {
  onColorChange: NodeColorChangeHandler
  onLabelChange: NodeLabelChangeHandler
}

const DEFAULT_NODE_TEXT_COLOR = "var(--foreground)"
const CanvasNodeEditingContext =
  createContext<CanvasNodeEditingContextValue | null>(null)

const CONNECTION_HANDLES = [
  { id: "top", position: Position.Top },
  { id: "right", position: Position.Right },
  { id: "bottom", position: Position.Bottom },
  { id: "left", position: Position.Left },
] as const

function CanvasNodeEditingProvider({
  children,
  onColorChange,
  onLabelChange,
}: PropsWithChildren<{
  onColorChange: NodeColorChangeHandler
  onLabelChange: NodeLabelChangeHandler
}>) {
  return (
    <CanvasNodeEditingContext.Provider value={{ onColorChange, onLabelChange }}>
      {children}
    </CanvasNodeEditingContext.Provider>
  )
}

const CanvasNodeRenderer = memo(function CanvasNodeRenderer({
  data,
  id,
  selected,
}: NodeProps<CanvasNode>) {
  const [editingLabel, setEditingLabel] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const nodeEditing = useContext(CanvasNodeEditingContext)
  const isEditing = editingLabel !== null
  const textColor = data.textColor || DEFAULT_NODE_TEXT_COLOR
  const labelStyle = {
    color: textColor,
    textShadow:
      "0 1px 2px color-mix(in oklab, var(--background) 88%, transparent)",
  }
  const connectionHandleClassName = selected
    ? "!z-30 !size-3 !rounded-full !border-2 !border-background !bg-white"
    : "!z-30 !size-2 !rounded-full !border !border-background !bg-white opacity-0 transition-opacity duration-150 group-hover:opacity-100"

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus()
      textareaRef.current?.select()
    }
  }, [isEditing])

  const handleLabelChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const nextLabel = event.target.value

    setEditingLabel(nextLabel)
    nodeEditing?.onLabelChange(id, nextLabel)
  }

  const handleLabelKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.preventDefault()
      event.currentTarget.blur()
    }
  }

  return (
    <div
      aria-label={`${data.shape} node`}
      className="group relative flex size-full items-center justify-center text-center text-sm"
      style={{ color: textColor }}
    >
      <NodeToolbar
        className="nodrag nopan nowheel z-40"
        offset={18}
        onPointerDown={(event) => event.stopPropagation()}
        position={Position.Top}
      >
        <div
          aria-label="Node color themes"
          className="flex items-center gap-1 rounded-full border border-border bg-card/95 p-1.5 shadow-lg backdrop-blur"
          role="toolbar"
        >
          {NODE_COLOR_PALETTE.map((colorPair) => {
            const isActive =
              data.color === colorPair.backgroundColor &&
              textColor === colorPair.textColor
            const swatchStyle = {
              "--swatch-text-color": colorPair.textColor,
              backgroundColor: colorPair.backgroundColor,
              color: colorPair.textColor,
            } as CSSProperties

            return (
              <button
                aria-label={`Use ${colorPair.label} node colors`}
                aria-pressed={isActive}
                className={`nodrag nopan nowheel grid size-5 place-items-center rounded-full transition-[transform,box-shadow] hover:scale-110 hover:shadow-[0_0_7px_var(--swatch-text-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card ${
                  isActive
                    ? "ring-2 ring-foreground ring-offset-2 ring-offset-card"
                    : "border border-border"
                }`}
                key={colorPair.label}
                onClick={() => nodeEditing?.onColorChange(id, colorPair)}
                style={swatchStyle}
                title={colorPair.label}
                type="button"
              >
                {isActive ? <Check aria-hidden="true" className="size-3" /> : null}
              </button>
            )
          })}
        </div>
      </NodeToolbar>
      <NodeResizer
        handleClassName="!size-2 !rounded-sm !border !border-background !bg-ring"
        isVisible={selected}
        lineClassName="!border-ring/60"
        minHeight={48}
        minWidth={96}
      />
      {CONNECTION_HANDLES.map(({ id: handleId, position }) => (
        <Handle
          aria-label={`Connect from ${handleId}`}
          className={connectionHandleClassName}
          id={handleId}
          isConnectableEnd
          key={handleId}
          position={position}
          type="source"
        />
      ))}
      <ShapeArtwork
        color={data.color}
        selected={selected}
        shape={data.shape}
      />
      {isEditing ? (
        <textarea
          aria-label="Node label"
          className="nodrag nopan nowheel absolute top-1/2 z-20 field-sizing-content min-h-5 max-h-[70%] w-[70%] -translate-y-1/2 resize-none overflow-y-auto bg-transparent px-1 text-center text-sm font-semibold leading-5 outline-none placeholder:opacity-75"
          onBlur={() => setEditingLabel(null)}
          onChange={handleLabelChange}
          onKeyDown={handleLabelKeyDown}
          onPointerDown={(event) => event.stopPropagation()}
          placeholder="Add label"
          ref={textareaRef}
          style={labelStyle}
          value={editingLabel}
        />
      ) : (
        <span
          className={`nodrag nopan relative z-10 max-w-[70%] break-words px-2 font-semibold ${
            data.label ? "" : "opacity-75"
          }`}
          onDoubleClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            setEditingLabel(data.label)
          }}
          style={labelStyle}
        >
          {data.label || "Add label"}
        </span>
      )}
    </div>
  )
})

type ShapeArtworkProps = {
  color: string
  selected: boolean
  shape: CanvasShape
}

function ShapeArtwork({ color, selected, shape }: ShapeArtworkProps) {
  const borderColor = selected ? "var(--ring)" : "var(--border)"
  const borderWidth = selected ? 2 : 1
  const cssShapeClassName = "absolute inset-0 border transition-colors"
  const cssShapeStyle = {
    backgroundColor: color,
    borderColor,
    borderWidth,
  }

  switch (shape) {
    case "rectangle":
      return (
        <div
          aria-hidden="true"
          className={`${cssShapeClassName} rounded-[3px]`}
          style={cssShapeStyle}
        />
      )
    case "circle":
      return (
        <div
          aria-hidden="true"
          className={`${cssShapeClassName} rounded-full`}
          style={cssShapeStyle}
        />
      )
    case "pill":
      return (
        <div
          aria-hidden="true"
          className={`${cssShapeClassName} rounded-full`}
          style={cssShapeStyle}
        />
      )
  }

  const shapeProps = {
    fill: color,
    stroke: borderColor,
    strokeWidth: borderWidth,
    vectorEffect: "non-scaling-stroke" as const,
  }
  let artwork

  switch (shape) {
    case "diamond":
      artwork = (
        <polygon points="50,1 99,50 50,99 1,50" {...shapeProps} />
      )
      break
    case "cylinder":
      artwork = (
        <>
          <path
            d="M 1 15 C 1 7 23 1 50 1 C 77 1 99 7 99 15 L 99 85 C 99 93 77 99 50 99 C 23 99 1 93 1 85 Z"
            {...shapeProps}
          />
          <path
            d="M 1 15 C 1 23 23 29 50 29 C 77 29 99 23 99 15"
            fill="none"
            stroke={shapeProps.stroke}
            strokeWidth={shapeProps.strokeWidth}
            vectorEffect="non-scaling-stroke"
          />
        </>
      )
      break
    case "hexagon":
      artwork = (
        <polygon
          points="25,1 75,1 99,50 75,99 25,99 1,50"
          {...shapeProps}
        />
      )
      break
    default:
      return assertNever(shape)
  }

  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 size-full overflow-visible"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      {artwork}
    </svg>
  )
}

function assertNever(shape: never): never {
  throw new Error(`Unsupported canvas shape: ${shape}`)
}

type ShapePreviewProps = {
  color: string
  height: number
  shape: CanvasShape
  width: number
  x: number
  y: number
}

function ShapePreview({
  color,
  height,
  shape,
  width,
  x,
  y,
}: ShapePreviewProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed z-50 opacity-70"
      style={{
        height,
        left: x,
        top: y,
        transform: "translate(12px, 12px)",
        width,
      }}
    >
      <ShapeArtwork color={color} selected={false} shape={shape} />
    </div>
  )
}

export { CanvasNodeEditingProvider, CanvasNodeRenderer, ShapePreview }
