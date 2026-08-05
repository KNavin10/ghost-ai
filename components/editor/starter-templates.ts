import type {
  CanvasEdge,
  CanvasNode,
  CanvasNodeColorPair,
  CanvasShape,
} from "@/types/canvas"
import { NODE_COLOR_PALETTE } from "@/types/canvas"

type CanvasTemplate = {
  id: string
  name: string
  description: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

const [neutral, blue, cyan, green, amber, orange, violet] = NODE_COLOR_PALETTE

function templateNode(
  id: string,
  label: string,
  shape: CanvasShape,
  x: number,
  y: number,
  colorPair: CanvasNodeColorPair = neutral,
  width = 160,
  height = 80
): CanvasNode {
  return {
    id,
    type: "canvasNode",
    position: { x, y },
    width,
    height,
    data: {
      label,
      color: colorPair.backgroundColor,
      shape,
      textColor: colorPair.textColor,
    },
  }
}

function templateEdge(
  id: string,
  source: string,
  target: string,
  sourceHandle = "right",
  targetHandle = "left",
  label = ""
): CanvasEdge {
  return {
    id,
    type: "canvasEdge",
    source,
    target,
    sourceHandle,
    targetHandle,
    data: { label },
  }
}

const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices",
    name: "Microservices architecture",
    description:
      "A gateway routes traffic to independent services backed by their own data stores.",
    nodes: [
      templateNode("micro-client", "Web client", "rectangle", 0, 120, blue),
      templateNode("micro-gateway", "API gateway", "hexagon", 250, 120, violet),
      templateNode("micro-users", "User service", "rectangle", 520, 30, cyan),
      templateNode("micro-orders", "Order service", "rectangle", 520, 210, orange),
      templateNode("micro-users-db", "Users DB", "cylinder", 800, 30, green),
      templateNode("micro-orders-db", "Orders DB", "cylinder", 800, 210, amber),
    ],
    edges: [
      templateEdge("micro-client-gateway", "micro-client", "micro-gateway"),
      templateEdge("micro-gateway-users", "micro-gateway", "micro-users", "top", "left"),
      templateEdge(
        "micro-gateway-orders",
        "micro-gateway",
        "micro-orders",
        "bottom",
        "left"
      ),
      templateEdge("micro-users-db", "micro-users", "micro-users-db"),
      templateEdge("micro-orders-db", "micro-orders", "micro-orders-db"),
    ],
  },
  {
    id: "ci-cd-pipeline",
    name: "CI/CD pipeline",
    description:
      "A change moves through source control, automated checks, build, and deployment.",
    nodes: [
      templateNode("pipeline-developer", "Developer", "pill", 0, 120, blue),
      templateNode("pipeline-source", "Git repository", "rectangle", 230, 120, violet),
      templateNode("pipeline-build", "Build & test", "diamond", 480, 120, amber),
      templateNode("pipeline-staging", "Staging", "rectangle", 730, 30, cyan),
      templateNode("pipeline-production", "Production", "rectangle", 730, 210, green),
    ],
    edges: [
      templateEdge("pipeline-developer-source", "pipeline-developer", "pipeline-source"),
      templateEdge("pipeline-source-build", "pipeline-source", "pipeline-build"),
      templateEdge(
        "pipeline-build-staging",
        "pipeline-build",
        "pipeline-staging",
        "top",
        "left"
      ),
      templateEdge(
        "pipeline-build-production",
        "pipeline-build",
        "pipeline-production",
        "bottom",
        "left"
      ),
    ],
  },
  {
    id: "event-driven-system",
    name: "Event-driven system",
    description:
      "Producers publish events to a broker while multiple consumers react independently.",
    nodes: [
      templateNode("event-producer", "Producer", "rectangle", 0, 120, blue),
      templateNode("event-broker", "Event broker", "hexagon", 270, 120, violet),
      templateNode("event-notifications", "Notifications", "rectangle", 540, 30, cyan),
      templateNode("event-analytics", "Analytics", "rectangle", 540, 210, orange),
      templateNode("event-store", "Event store", "cylinder", 820, 120, green),
    ],
    edges: [
      templateEdge("event-producer-broker", "event-producer", "event-broker", "right", "left", "events"),
      templateEdge(
        "event-broker-notifications",
        "event-broker",
        "event-notifications",
        "top",
        "left"
      ),
      templateEdge(
        "event-broker-analytics",
        "event-broker",
        "event-analytics",
        "bottom",
        "left"
      ),
      templateEdge("event-broker-store", "event-broker", "event-store", "right", "left", "persist"),
    ],
  },
]

export { CANVAS_TEMPLATES }
export type { CanvasTemplate }
