"use client"

import { useCallback, useState } from "react"
import type { DragEvent } from "react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import {
  useCanRedo,
  useCanUndo,
  useRedo,
  useUndo,
} from "@liveblocks/react/suspense"
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense"
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react"
import type { Connection } from "@xyflow/react"
import { ErrorBoundary } from "react-error-boundary"

import {
  CanvasNodeEditingProvider,
  CanvasNodeRenderer,
  ShapePreview,
} from "@/components/editor/canvas-node"
import {
  CanvasEdgeEditingProvider,
  CanvasEdgeRenderer,
} from "@/components/editor/canvas-edge"
import { CanvasControls } from "@/components/editor/canvas-controls"
import {
  CANVAS_TEMPLATES,
  type CanvasTemplate,
} from "@/components/editor/starter-templates"
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import {
  readShapeDragPayload,
  ShapePanel,
} from "@/components/editor/shape-panel"
import type {
  CanvasEdge,
  CanvasNode,
  CanvasNodeColorPair,
  ShapeDragPayload,
} from "@/types/canvas"
import { NODE_COLOR_PALETTE } from "@/types/canvas"

import "@xyflow/react/dist/style.css"

type EditorCanvasProps = {
  isStarterTemplatesOpen: boolean
  onStarterTemplatesOpenChange: (open: boolean) => void
  roomId: string
}

type ShapePreviewState = ShapeDragPayload & {
  x: number
  y: number
}

const DEFAULT_NODE_COLOR_PAIR = NODE_COLOR_PALETTE[0]
const nodeTypes = { canvasNode: CanvasNodeRenderer }
const edgeTypes = { canvasEdge: CanvasEdgeRenderer }

let canvasNodeCounter = 0

function EditorCanvas({
  isStarterTemplatesOpen,
  onStarterTemplatesOpenChange,
  roomId,
}: EditorCanvasProps) {
  return (
    <div className="h-full min-h-0 w-full">
      <ErrorBoundary fallback={<CanvasError />}>
        <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
          <RoomProvider
            id={roomId}
            initialPresence={{ cursor: null, isThinking: false }}
          >
            <ClientSideSuspense fallback={<CanvasLoading />}>
              <CollaborativeCanvas
                isStarterTemplatesOpen={isStarterTemplatesOpen}
                onStarterTemplatesOpenChange={onStarterTemplatesOpenChange}
              />
            </ClientSideSuspense>
          </RoomProvider>
        </LiveblocksProvider>
      </ErrorBoundary>
    </div>
  )
}

function CollaborativeCanvas({
  isStarterTemplatesOpen,
  onStarterTemplatesOpenChange,
}: Pick<EditorCanvasProps, "isStarterTemplatesOpen" | "onStarterTemplatesOpenChange">) {
  return (
    <ReactFlowProvider>
      <CollaborativeCanvasContent
        isStarterTemplatesOpen={isStarterTemplatesOpen}
        onStarterTemplatesOpenChange={onStarterTemplatesOpenChange}
      />
    </ReactFlowProvider>
  )
}

function CollaborativeCanvasContent({
  isStarterTemplatesOpen,
  onStarterTemplatesOpenChange,
}: Pick<EditorCanvasProps, "isStarterTemplatesOpen" | "onStarterTemplatesOpenChange">) {
  const [shapePreview, setShapePreview] = useState<ShapePreviewState | null>(
    null
  )
  const reactFlow = useReactFlow<CanvasNode, CanvasEdge>()
  const { screenToFlowPosition } = reactFlow
  const undo = useUndo()
  const redo = useRedo()
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()
  const {
    edges,
    nodes,
    onConnect,
    onDelete,
    onEdgesChange,
    onNodesChange,
  } = useLiveblocksFlow<CanvasNode, CanvasEdge>({
    suspense: true,
    nodes: { initial: [] },
    edges: { initial: [] },
  })

  useKeyboardShortcuts({
    onRedo: redo,
    onUndo: undo,
    reactFlow,
  })

  const handleConnect = useCallback(
    (connection: Connection) => {
      onConnect({
        ...connection,
        data: { label: "" },
        type: "canvasEdge",
      } as Connection)
    },
    [onConnect]
  )

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
  }, [])

  const handleShapeDragStart = useCallback(
    (event: DragEvent<HTMLElement>, payload: ShapeDragPayload) => {
      setShapePreview({
        ...payload,
        x: event.clientX,
        y: event.clientY,
      })
    },
    []
  )

  const handleShapeDrag = useCallback(
    (event: DragEvent<HTMLElement>, payload: ShapeDragPayload) => {
      setShapePreview({
        ...payload,
        x: event.clientX,
        y: event.clientY,
      })
    },
    []
  )

  const handleShapeDragEnd = useCallback(() => {
    setShapePreview(null)
  }, [])

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setShapePreview(null)

      const payload = readShapeDragPayload(event.dataTransfer)

      if (!payload) {
        return
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      canvasNodeCounter += 1

      const node: CanvasNode = {
        id: `${payload.shape}-${Date.now()}-${canvasNodeCounter}`,
        type: "canvasNode",
        position,
        width: payload.width,
        height: payload.height,
        data: {
          label: "",
          color: DEFAULT_NODE_COLOR_PAIR.backgroundColor,
          shape: payload.shape,
          textColor: DEFAULT_NODE_COLOR_PAIR.textColor,
        },
      }

      onNodesChange([{ type: "add", item: node }])
    },
    [onNodesChange, screenToFlowPosition]
  )

  const handleNodeLabelChange = useCallback(
    (nodeId: string, label: string) => {
      const node = nodes.find((candidate) => candidate.id === nodeId)

      if (!node || node.data.label === label) {
        return
      }

      onNodesChange([
        {
          id: nodeId,
          item: {
            ...node,
            data: { ...node.data, label },
          },
          type: "replace",
        },
      ])
    },
    [nodes, onNodesChange]
  )

  const handleNodeColorChange = useCallback(
    (nodeId: string, colorPair: CanvasNodeColorPair) => {
      const node = nodes.find((candidate) => candidate.id === nodeId)

      if (
        !node ||
        (node.data.color === colorPair.backgroundColor &&
          node.data.textColor === colorPair.textColor)
      ) {
        return
      }

      onNodesChange([
        {
          id: nodeId,
          item: {
            ...node,
            data: {
              ...node.data,
              color: colorPair.backgroundColor,
              textColor: colorPair.textColor,
            },
          },
          type: "replace",
        },
      ])
    },
    [nodes, onNodesChange]
  )

  const handleEdgeLabelChange = useCallback(
    (edgeId: string, label: string) => {
      const edge = edges.find((candidate) => candidate.id === edgeId)

      if (!edge || edge.data?.label === label) {
        return
      }

      onEdgesChange([
        {
          id: edgeId,
          item: {
            ...edge,
            data: { label },
          },
          type: "replace",
        },
      ])
    },
    [edges, onEdgesChange]
  )

  const handleTemplateImport = useCallback(
    (template: CanvasTemplate) => {
      onDelete({ nodes, edges })
      onNodesChange(
        template.nodes.map((node) => ({
          item: {
            ...node,
            data: { ...node.data },
            position: { ...node.position },
          },
          type: "add" as const,
        }))
      )
      onEdgesChange(
        template.edges.map((edge) => ({
          item: {
            ...edge,
            data: { label: edge.data?.label ?? "" },
          },
          type: "add" as const,
        }))
      )
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          void reactFlow.fitView({ duration: 500, padding: 0.2 })
        })
      })
    },
    [edges, nodes, onDelete, onEdgesChange, onNodesChange, reactFlow]
  )

  return (
    <div
      className="relative h-full w-full"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <CanvasNodeEditingProvider
        onColorChange={handleNodeColorChange}
        onLabelChange={handleNodeLabelChange}
      >
        <CanvasEdgeEditingProvider onLabelChange={handleEdgeLabelChange}>
          <ReactFlow<CanvasNode, CanvasEdge>
            className="bg-background"
            colorMode="dark"
            connectionMode={ConnectionMode.Loose}
            defaultEdgeOptions={{
              data: { label: "" },
              interactionWidth: 24,
              markerEnd: {
                color: "var(--foreground)",
                height: 16,
                type: MarkerType.ArrowClosed,
                width: 16,
              },
              style: {
                stroke: "var(--foreground)",
                strokeLinecap: "round",
                strokeWidth: 1.5,
              },
              type: "canvasEdge",
            }}
            edgeTypes={edgeTypes}
            edges={edges}
            fitView
            nodes={nodes}
            nodeTypes={nodeTypes}
            onConnect={handleConnect}
            onDelete={onDelete}
            onEdgesChange={onEdgesChange}
            onNodesChange={onNodesChange}
          >
            <MiniMap
              bgColor="var(--card)"
              className="overflow-hidden rounded-lg border border-border"
              maskColor="color-mix(in oklab, var(--background) 72%, transparent)"
              nodeColor="var(--muted)"
              nodeStrokeColor="var(--border)"
            />
            <Background
              bgColor="var(--background)"
              color="color-mix(in oklab, var(--foreground) 42%, transparent)"
              gap={24}
              id="stars-small"
              size={1.4}
              variant={BackgroundVariant.Dots}
            />
            <Background
              bgColor="transparent"
              color="color-mix(in oklab, var(--foreground) 64%, transparent)"
              gap={[96, 72]}
              id="stars-medium"
              offset={[32, 18]}
              size={1.8}
              variant={BackgroundVariant.Dots}
            />
            <Background
              bgColor="transparent"
              color="color-mix(in oklab, var(--foreground) 84%, transparent)"
              gap={[240, 180]}
              id="stars-bright"
              offset={[80, 52]}
              size={2.4}
              variant={BackgroundVariant.Dots}
            />
          </ReactFlow>
        </CanvasEdgeEditingProvider>
      </CanvasNodeEditingProvider>
      <ShapePanel
        onShapeDrag={handleShapeDrag}
        onShapeDragEnd={handleShapeDragEnd}
        onShapeDragStart={handleShapeDragStart}
      />
      <CanvasControls
        canRedo={canRedo}
        canUndo={canUndo}
        onRedo={redo}
        onUndo={undo}
        reactFlow={reactFlow}
      />
      <StarterTemplatesModal
        onImport={handleTemplateImport}
        onOpenChange={onStarterTemplatesOpenChange}
        open={isStarterTemplatesOpen}
        templates={CANVAS_TEMPLATES}
      />
      {shapePreview ? (
        <ShapePreview
          color={DEFAULT_NODE_COLOR_PAIR.backgroundColor}
          height={shapePreview.height}
          shape={shapePreview.shape}
          width={shapePreview.width}
          x={shapePreview.x}
          y={shapePreview.y}
        />
      ) : null}
    </div>
  )
}

function CanvasLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
      Loading canvas...
    </div>
  )
}

function CanvasError() {
  return (
    <div
      className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-destructive"
      role="alert"
    >
      The collaborative canvas could not connect. Refresh the page to try
      again.
    </div>
  )
}

export { EditorCanvas }
export type { EditorCanvasProps }
