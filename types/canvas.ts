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

type CanvasNodeColorPair = {
  backgroundColor: string
  label: string
  textColor: string
}

const NODE_COLOR_PALETTE = [
  {
    backgroundColor: "var(--card)",
    label: "Neutral",
    textColor: "var(--foreground)",
  },
  {
    backgroundColor: "var(--node-blue)",
    label: "Blue",
    textColor: "var(--node-blue-foreground)",
  },
  {
    backgroundColor: "var(--node-cyan)",
    label: "Cyan",
    textColor: "var(--node-cyan-foreground)",
  },
  {
    backgroundColor: "var(--node-teal)",
    label: "Teal",
    textColor: "var(--node-teal-foreground)",
  },
  {
    backgroundColor: "var(--node-green)",
    label: "Green",
    textColor: "var(--node-green-foreground)",
  },
  {
    backgroundColor: "var(--node-lime)",
    label: "Lime",
    textColor: "var(--node-lime-foreground)",
  },
  {
    backgroundColor: "var(--node-yellow)",
    label: "Yellow",
    textColor: "var(--node-yellow-foreground)",
  },
  {
    backgroundColor: "var(--node-amber)",
    label: "Amber",
    textColor: "var(--node-amber-foreground)",
  },
  {
    backgroundColor: "var(--node-orange)",
    label: "Orange",
    textColor: "var(--node-orange-foreground)",
  },
  {
    backgroundColor: "var(--node-red)",
    label: "Red",
    textColor: "var(--node-red-foreground)",
  },
  {
    backgroundColor: "var(--node-rose)",
    label: "Rose",
    textColor: "var(--node-rose-foreground)",
  },
  {
    backgroundColor: "var(--node-violet)",
    label: "Violet",
    textColor: "var(--node-violet-foreground)",
  },
] as const satisfies readonly CanvasNodeColorPair[]

type CanvasNodeData = {
  label: string
  color: string
  shape: CanvasShape
  textColor: string
}

type CanvasEdgeData = {
  label: string
}

type ShapeDragPayload = {
  shape: CanvasShape
  width: number
  height: number
}

type CanvasNode = Node<CanvasNodeData, "canvasNode">
type CanvasEdge = Edge<CanvasEdgeData, "canvasEdge">

export { CANVAS_SHAPES, NODE_COLOR_PALETTE }
export type {
  CanvasEdge,
  CanvasEdgeData,
  CanvasNode,
  CanvasNodeColorPair,
  CanvasNodeData,
  CanvasShape,
  ShapeDragPayload,
}
