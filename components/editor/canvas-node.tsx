import { memo } from "react"
import type { NodeProps } from "@xyflow/react"

import type { CanvasNode, CanvasShape } from "@/types/canvas"

const CanvasNodeRenderer = memo(function CanvasNodeRenderer({
  data,
  selected,
}: NodeProps<CanvasNode>) {
  return (
    <div
      aria-label={`${data.shape} node`}
      className="relative flex size-full items-center justify-center text-center text-sm text-foreground"
    >
      <ShapeArtwork
        color={data.color}
        selected={selected}
        shape={data.shape}
      />
      <span className="relative z-10 max-w-[70%] break-words px-2">
        {data.label}
      </span>
    </div>
  )
})

type ShapeArtworkProps = {
  color: string
  selected: boolean
  shape: CanvasShape
}

function ShapeArtwork({ color, selected, shape }: ShapeArtworkProps) {
  const shapeProps = {
    fill: color,
    stroke: selected ? "var(--ring)" : "var(--border)",
    strokeWidth: selected ? 2 : 1,
    vectorEffect: "non-scaling-stroke" as const,
  }
  let artwork

  switch (shape) {
    case "rectangle":
      artwork = (
        <rect
          height="98"
          rx="3"
          width="98"
          x="1"
          y="1"
          {...shapeProps}
        />
      )
      break
    case "diamond":
      artwork = (
        <polygon points="50,1 99,50 50,99 1,50" {...shapeProps} />
      )
      break
    case "circle":
      artwork = (
        <ellipse cx="50" cy="50" rx="49" ry="49" {...shapeProps} />
      )
      break
    case "pill":
      artwork = (
        <rect
          height="98"
          rx="49"
          ry="49"
          width="98"
          x="1"
          y="1"
          {...shapeProps}
        />
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

export { CanvasNodeRenderer }
