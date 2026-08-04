"use client"

import { useCallback } from "react"
import type { DragEvent } from "react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense"
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react"
import { ErrorBoundary } from "react-error-boundary"

import { CanvasNodeRenderer } from "@/components/editor/canvas-node"
import {
  readShapeDragPayload,
  ShapePanel,
} from "@/components/editor/shape-panel"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"

import "@xyflow/react/dist/style.css"

type EditorCanvasProps = {
  roomId: string
}

const DEFAULT_NODE_COLOR = "var(--card)"
const nodeTypes = { canvasNode: CanvasNodeRenderer }

let canvasNodeCounter = 0

function EditorCanvas({ roomId }: EditorCanvasProps) {
  return (
    <div className="h-full min-h-0 w-full">
      <ErrorBoundary fallback={<CanvasError />}>
        <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
          <RoomProvider
            id={roomId}
            initialPresence={{ cursor: null, isThinking: false }}
          >
            <ClientSideSuspense fallback={<CanvasLoading />}>
              <CollaborativeCanvas />
            </ClientSideSuspense>
          </RoomProvider>
        </LiveblocksProvider>
      </ErrorBoundary>
    </div>
  )
}

function CollaborativeCanvas() {
  return (
    <ReactFlowProvider>
      <CollaborativeCanvasContent />
    </ReactFlowProvider>
  )
}

function CollaborativeCanvasContent() {
  const { screenToFlowPosition } = useReactFlow<CanvasNode, CanvasEdge>()
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

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
  }, [])

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()

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
          color: DEFAULT_NODE_COLOR,
          shape: payload.shape,
        },
      }

      onNodesChange([{ type: "add", item: node }])
    },
    [onNodesChange, screenToFlowPosition]
  )

  return (
    <div
      className="relative h-full w-full"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ReactFlow<CanvasNode, CanvasEdge>
        className="bg-background"
        colorMode="dark"
        connectionMode={ConnectionMode.Loose}
        edges={edges}
        fitView
        nodes={nodes}
        nodeTypes={nodeTypes}
        onConnect={onConnect}
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
      <ShapePanel />
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
