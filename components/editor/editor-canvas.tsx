"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { DragEvent, MouseEvent as ReactMouseEvent } from "react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import {
  useCanRedo,
  useCanUndo,
  useRedo,
  useUndo,
  useUpdateMyPresence,
} from "@liveblocks/react/suspense"
import { ClientSideSuspense } from "@liveblocks/react/suspense"
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdges,
  useNodes,
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
  CanvasPresence,
  getCursorPosition,
} from "@/components/editor/canvas-presence"
import {
  CANVAS_TEMPLATES,
  type CanvasTemplate,
} from "@/components/editor/starter-templates"
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useCanvasAutosave } from "@/hooks/use-canvas-autosave"
import type { SaveStatus } from "@/hooks/use-canvas-autosave"
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
  isAiSidebarOpen: boolean
  isStarterTemplatesOpen: boolean
  onSaveHandlerReady?: (handler: () => Promise<boolean>) => void
  onSaveStatusChange?: (status: SaveStatus) => void
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
  isAiSidebarOpen,
  isStarterTemplatesOpen,
  onSaveHandlerReady,
  onSaveStatusChange,
  onStarterTemplatesOpenChange,
  roomId,
}: EditorCanvasProps) {
  return (
    <div className="h-full min-h-0 w-full">
      <ErrorBoundary fallback={<CanvasError />}>
        <ClientSideSuspense fallback={<CanvasLoading />}>
          <CollaborativeCanvas
            isAiSidebarOpen={isAiSidebarOpen}
            isStarterTemplatesOpen={isStarterTemplatesOpen}
            onSaveHandlerReady={onSaveHandlerReady}
            onSaveStatusChange={onSaveStatusChange}
            onStarterTemplatesOpenChange={onStarterTemplatesOpenChange}
            roomId={roomId}
          />
        </ClientSideSuspense>
      </ErrorBoundary>
    </div>
  )
}

function CollaborativeCanvas({
  isAiSidebarOpen,
  isStarterTemplatesOpen,
  onSaveHandlerReady,
  onSaveStatusChange,
  onStarterTemplatesOpenChange,
  roomId,
}: EditorCanvasProps) {
  return (
    <ReactFlowProvider>
      <CollaborativeCanvasContent
        isAiSidebarOpen={isAiSidebarOpen}
        isStarterTemplatesOpen={isStarterTemplatesOpen}
        onSaveHandlerReady={onSaveHandlerReady}
        onSaveStatusChange={onSaveStatusChange}
        onStarterTemplatesOpenChange={onStarterTemplatesOpenChange}
        roomId={roomId}
      />
    </ReactFlowProvider>
  )
}

function CollaborativeCanvasContent({
  isAiSidebarOpen,
  isStarterTemplatesOpen,
  onSaveHandlerReady,
  onSaveStatusChange,
  onStarterTemplatesOpenChange,
  roomId,
}: EditorCanvasProps) {
  const [shapePreview, setShapePreview] = useState<ShapePreviewState | null>(
    null
  )
  const reactFlow = useReactFlow<CanvasNode, CanvasEdge>()
  const { screenToFlowPosition } = reactFlow
  const flowNodes = useNodes<CanvasNode>()
  const flowEdges = useEdges<CanvasEdge>()
  const canvasWrapperRef = useRef<HTMLDivElement>(null)
  const undo = useUndo()
  const redo = useRedo()
  const updateMyPresence = useUpdateMyPresence()
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

  useEffect(() => {
    const wrapper = canvasWrapperRef.current
    if (!wrapper) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Delete" && event.key !== "Backspace") {
        return
      }

      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.closest('[contenteditable="true"]'))
      ) {
        return
      }

      const selectedNodes = flowNodes.filter((node) => node.selected)
      const selectedEdges = flowEdges.filter((edge) => edge.selected)

      if (selectedNodes.length > 0 || selectedEdges.length > 0) {
        event.preventDefault()
        onDelete({ nodes: selectedNodes, edges: selectedEdges })
      }
    }

    wrapper.addEventListener("keydown", handleKeyDown)
    return () => {
      wrapper.removeEventListener("keydown", handleKeyDown)
    }
  }, [flowEdges, flowNodes, onDelete])

  const { saveStatus, triggerSave } = useCanvasAutosave({
    edges,
    nodes,
    projectId: roomId,
  })

  const hasLoadedSavedStateRef = useRef(false)

  useEffect(() => {
    if (onSaveStatusChange) {
      onSaveStatusChange(saveStatus)
    }
  }, [onSaveStatusChange, saveStatus])

  useEffect(() => {
    if (onSaveHandlerReady) {
      onSaveHandlerReady(triggerSave)
    }
  }, [onSaveHandlerReady, triggerSave])

  useEffect(() => {
    if (hasLoadedSavedStateRef.current) {
      return
    }

    if (nodes.length > 0 || edges.length > 0) {
      hasLoadedSavedStateRef.current = true
      return
    }

    async function loadSavedCanvas() {
      try {
        const response = await fetch(`/api/projects/${roomId}/canvas`)
        if (!response.ok) {
          hasLoadedSavedStateRef.current = true
          return
        }

        const data = (await response.json()) as {
          edges?: CanvasEdge[]
          nodes?: CanvasNode[]
        }

        const fetchedNodes = Array.isArray(data.nodes) ? data.nodes : []
        const fetchedEdges = Array.isArray(data.edges) ? data.edges : []

        if (fetchedNodes.length > 0 || fetchedEdges.length > 0) {
          if (nodes.length === 0 && edges.length === 0) {
            if (fetchedNodes.length > 0) {
              onNodesChange(
                fetchedNodes.map((node) => ({
                  item: node,
                  type: "add" as const,
                }))
              )
            }
            if (fetchedEdges.length > 0) {
              onEdgesChange(
                fetchedEdges.map((edge) => ({
                  item: edge,
                  type: "add" as const,
                }))
              )
            }
          }
        }
      } catch (error) {
        console.error("Failed to load saved canvas from Vercel Blob:", error)
      } finally {
        hasLoadedSavedStateRef.current = true
      }
    }

    void loadSavedCanvas()
  }, [edges.length, nodes.length, onEdgesChange, onNodesChange, roomId])

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

  const handleCanvasMouseMove = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      updateMyPresence({ cursor: getCursorPosition(event) })
    },
    [updateMyPresence]
  )

  const handleCanvasMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null })
  }, [updateMyPresence])

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

      const centerFlowPosition = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const position = {
        x: centerFlowPosition.x - payload.width / 2,
        y: centerFlowPosition.y - payload.height / 2,
      }

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
      className="relative h-full w-full outline-none"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      ref={canvasWrapperRef}
      tabIndex={0}
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
            deleteKeyCode={null}
            edgeTypes={edgeTypes}
            edges={edges}
            fitView
            nodes={nodes}
            nodeTypes={nodeTypes}
            onConnect={handleConnect}
            onDelete={onDelete}
            onEdgesChange={onEdgesChange}
            onMouseLeave={handleCanvasMouseLeave}
            onMouseMove={handleCanvasMouseMove}
            onNodesChange={onNodesChange}
          >
            <MiniMap
              bgColor="var(--card)"
              className="overflow-hidden rounded-lg border border-border"
              maskColor="color-mix(in oklab, var(--background) 72%, transparent)"
              nodeColor="var(--muted)"
              nodeStrokeColor="var(--border)"
              position="bottom-right"
              style={{ right: isAiSidebarOpen ? 332 : 12 }}
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
      <CanvasPresence />
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
