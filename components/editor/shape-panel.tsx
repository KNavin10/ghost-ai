import type { ComponentType, DragEvent } from "react"
import {
  Circle,
  Cylinder,
  Diamond,
  Hexagon,
  Pill,
  RectangleHorizontal,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { CANVAS_SHAPES } from "@/types/canvas"
import type { ShapeDragPayload } from "@/types/canvas"

const SHAPE_DRAG_TYPE = "application/x-ghost-canvas-shape"

type ShapeOption = ShapeDragPayload & {
  icon: ComponentType<{ className?: string }>
  label: string
}

const SHAPE_OPTIONS: ShapeOption[] = [
  {
    shape: "rectangle",
    label: "Rectangle",
    width: 176,
    height: 96,
    icon: RectangleHorizontal,
  },
  {
    shape: "diamond",
    label: "Diamond",
    width: 144,
    height: 144,
    icon: Diamond,
  },
  {
    shape: "circle",
    label: "Circle",
    width: 112,
    height: 112,
    icon: Circle,
  },
  {
    shape: "pill",
    label: "Pill",
    width: 176,
    height: 72,
    icon: Pill,
  },
  {
    shape: "cylinder",
    label: "Cylinder",
    width: 152,
    height: 112,
    icon: Cylinder,
  },
  {
    shape: "hexagon",
    label: "Hexagon",
    width: 160,
    height: 112,
    icon: Hexagon,
  },
]

const canvasShapeSet = new Set<string>(CANVAS_SHAPES)

function ShapePanel() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-5 z-10 flex justify-center px-4">
      <div
        aria-label="Shape panel"
        className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-card/95 p-1.5 shadow-2xl backdrop-blur"
        role="toolbar"
      >
        {SHAPE_OPTIONS.map((option) => {
          const Icon = option.icon

          return (
            <Button
              aria-label={`Drag ${option.label} onto the canvas`}
              className="cursor-grab rounded-full active:cursor-grabbing"
              draggable
              key={option.shape}
              onDragStart={(event) => handleDragStart(event, option)}
              size="icon"
              title={option.label}
              type="button"
              variant="ghost"
            >
              <Icon />
              <span className="sr-only">{option.label}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}

function handleDragStart(
  event: DragEvent<HTMLElement>,
  { shape, width, height }: ShapeOption
) {
  const payload: ShapeDragPayload = { shape, width, height }

  event.dataTransfer.effectAllowed = "copy"
  event.dataTransfer.setData(SHAPE_DRAG_TYPE, JSON.stringify(payload))
}

function readShapeDragPayload(dataTransfer: DataTransfer) {
  const serializedPayload = dataTransfer.getData(SHAPE_DRAG_TYPE)

  if (!serializedPayload) {
    return null
  }

  try {
    const payload: unknown = JSON.parse(serializedPayload)

    if (!isShapeDragPayload(payload)) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

function isShapeDragPayload(payload: unknown): payload is ShapeDragPayload {
  if (!payload || typeof payload !== "object") {
    return false
  }

  const candidate = payload as Partial<ShapeDragPayload>

  return (
    typeof candidate.shape === "string" &&
    canvasShapeSet.has(candidate.shape) &&
    typeof candidate.width === "number" &&
    Number.isFinite(candidate.width) &&
    candidate.width > 0 &&
    typeof candidate.height === "number" &&
    Number.isFinite(candidate.height) &&
    candidate.height > 0
  )
}

export { readShapeDragPayload, SHAPE_DRAG_TYPE, ShapePanel }
