"use client"

import { useMemo } from "react"
import { Download } from "lucide-react"

import type { CanvasTemplate } from "@/components/editor/starter-templates"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { CanvasNode, CanvasShape } from "@/types/canvas"

type StarterTemplatesModalProps = {
  open: boolean
  onImport: (template: CanvasTemplate) => void
  onOpenChange: (open: boolean) => void
  templates: CanvasTemplate[]
}

const PREVIEW_WIDTH = 420
const PREVIEW_HEIGHT = 190
const PREVIEW_PADDING = 18

function StarterTemplatesModal({
  open,
  onImport,
  onOpenChange,
  templates,
}: StarterTemplatesModalProps) {
  const handleImport = (template: CanvasTemplate) => {
    onImport(template)
    onOpenChange(false)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="h-[calc(100dvh-2rem)] max-h-[42rem] gap-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-border px-6 py-5 text-left">
          <DialogTitle className="text-xl">Starter templates</DialogTitle>
          <DialogDescription>
            Choose a ready-made diagram to replace the current canvas.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="min-h-0 flex-1">
          <div className="grid gap-4 p-6 md:grid-cols-2">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                onImport={handleImport}
                template={template}
              />
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

type TemplateCardProps = {
  onImport: (template: CanvasTemplate) => void
  template: CanvasTemplate
}

function TemplateCard({ onImport, template }: TemplateCardProps) {
  return (
    <Card className="min-w-0 border border-border bg-card/80">
      <CardContent className="space-y-4 p-4">
        <TemplatePreview template={template} />
        <div className="space-y-1">
          <CardTitle>{template.name}</CardTitle>
          <CardDescription>{template.description}</CardDescription>
        </div>
      </CardContent>
      <CardFooter className="justify-end p-4">
        <Button onClick={() => onImport(template)} type="button">
          <Download />
          Import
        </Button>
      </CardFooter>
    </Card>
  )
}

function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const bounds = useMemo(() => getPreviewBounds(template.nodes), [template.nodes])
  const scale = Math.min(
    (PREVIEW_WIDTH - PREVIEW_PADDING * 2) / bounds.width,
    (PREVIEW_HEIGHT - PREVIEW_PADDING * 2) / bounds.height,
    1
  )
  const toPreviewX = (value: number) => PREVIEW_PADDING + (value - bounds.x) * scale
  const toPreviewY = (value: number) => PREVIEW_PADDING + (value - bounds.y) * scale
  const nodesById = new Map(template.nodes.map((node) => [node.id, node]))

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background/70">
      <svg
        aria-label={`${template.name} diagram preview`}
        className="block h-auto w-full"
        role="img"
        viewBox={`0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}`}
      >
        <rect fill="var(--background)" height={PREVIEW_HEIGHT} width={PREVIEW_WIDTH} />
        {template.edges.map((edge) => {
          const source = nodesById.get(edge.source)
          const target = nodesById.get(edge.target)

          if (!source || !target) {
            return null
          }

          const sourceCenter = getNodeCenter(source)
          const targetCenter = getNodeCenter(target)

          return (
            <line
              key={edge.id}
              opacity="0.65"
              stroke="var(--foreground)"
              strokeDasharray="4 4"
              strokeWidth="1.5"
              x1={toPreviewX(sourceCenter.x)}
              x2={toPreviewX(targetCenter.x)}
              y1={toPreviewY(sourceCenter.y)}
              y2={toPreviewY(targetCenter.y)}
            />
          )
        })}
        {template.nodes.map((node) => {
          const width = getNodeWidth(node) * scale
          const height = getNodeHeight(node) * scale
          const x = toPreviewX(node.position.x)
          const y = toPreviewY(node.position.y)

          return (
            <PreviewNode
              color={node.data.color}
              height={height}
              key={node.id}
              label={node.data.label}
              shape={node.data.shape}
              textColor={node.data.textColor}
              width={width}
              x={x}
              y={y}
            />
          )
        })}
      </svg>
    </div>
  )
}

function PreviewNode({
  color,
  height,
  label,
  shape,
  textColor,
  width,
  x,
  y,
}: {
  color: string
  height: number
  label: string
  shape: CanvasShape
  textColor: string
  width: number
  x: number
  y: number
}) {
  const shapeProps = {
    fill: color,
    stroke: "var(--border)",
    strokeWidth: 1,
    vectorEffect: "non-scaling-stroke" as const,
  }
  const shapeArtwork = (() => {
    switch (shape) {
      case "rectangle":
        return <rect height="98" rx="3" width="98" x="1" y="1" {...shapeProps} />
      case "pill":
        return <rect height="98" rx="49" width="98" x="1" y="1" {...shapeProps} />
      case "circle":
        return <ellipse cx="50" cy="50" rx="49" ry="49" {...shapeProps} />
      case "diamond":
        return <polygon points="50,1 99,50 50,99 1,50" {...shapeProps} />
      case "cylinder":
        return (
          <>
            <path
              d="M 1 15 C 1 7 23 1 50 1 C 77 1 99 7 99 15 L 99 85 C 99 93 77 99 50 99 C 23 99 1 93 1 85 Z"
              {...shapeProps}
            />
            <path
              d="M 1 15 C 1 23 23 29 50 29 C 77 29 99 23 99 15"
              fill="none"
              stroke="var(--border)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          </>
        )
      case "hexagon":
        return <polygon points="25,1 75,1 99,50 75,99 25,99 1,50" {...shapeProps} />
    }
  })()

  return (
    <g transform={`translate(${x} ${y}) scale(${width / 100} ${height / 100})`}>
      {shapeArtwork}
      {label ? (
        <text
          dominantBaseline="middle"
          fill={textColor}
          fontSize={Math.max(6, Math.min(11, width * 0.09)) / (width / 100)}
          fontWeight="600"
          textAnchor="middle"
          x="50"
          y="50"
        >
          {label}
        </text>
      ) : null}
    </g>
  )
}

function getNodeWidth(node: CanvasNode) {
  return node.width ?? 160
}

function getNodeHeight(node: CanvasNode) {
  return node.height ?? 80
}

function getNodeCenter(node: CanvasNode) {
  return {
    x: node.position.x + getNodeWidth(node) / 2,
    y: node.position.y + getNodeHeight(node) / 2,
  }
}

function getPreviewBounds(nodes: CanvasNode[]) {
  if (nodes.length === 0) {
    return { height: 1, width: 1, x: 0, y: 0 }
  }

  const x = Math.min(...nodes.map((node) => node.position.x))
  const y = Math.min(...nodes.map((node) => node.position.y))
  const maxX = Math.max(...nodes.map((node) => node.position.x + getNodeWidth(node)))
  const maxY = Math.max(...nodes.map((node) => node.position.y + getNodeHeight(node)))

  return {
    height: Math.max(maxY - y, 1),
    width: Math.max(maxX - x, 1),
    x,
    y,
  }
}

export { StarterTemplatesModal }
export type { StarterTemplatesModalProps }
