import type { Edge, Node } from "@xyflow/react"

const CANVAS_SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const

type CanvasShape = (typeof CANVAS_SHAPES)[number]

type CanvasNodeData = {
  label: string
  color: string
  shape: CanvasShape
}

type ShapeDragPayload = {
  shape: CanvasShape
  width: number
  height: number
}

type CanvasNode = Node<CanvasNodeData, "canvasNode">
type CanvasEdge = Edge<Record<string, never>, "canvasEdge">

export { CANVAS_SHAPES }
export type {
  CanvasEdge,
  CanvasNode,
  CanvasNodeData,
  CanvasShape,
  ShapeDragPayload,
}
