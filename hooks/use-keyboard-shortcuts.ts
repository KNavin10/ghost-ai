"use client"

import { useEffect } from "react"
import type { Edge, Node, ReactFlowInstance } from "@xyflow/react"

type UseKeyboardShortcutsOptions<
  NodeType extends Node = Node,
  EdgeType extends Edge = Edge,
> = {
  onRedo: () => void
  onUndo: () => void
  reactFlow: ReactFlowInstance<NodeType, EdgeType>
}

function useKeyboardShortcuts<
  NodeType extends Node = Node,
  EdgeType extends Edge = Edge,
>({ onRedo, onUndo, reactFlow }: UseKeyboardShortcutsOptions<
  NodeType,
  EdgeType
>) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault()
        void reactFlow.zoomIn({ duration: 180 })
        return
      }

      if (event.key === "-") {
        event.preventDefault()
        void reactFlow.zoomOut({ duration: 180 })
        return
      }

      if (!event.metaKey && !event.ctrlKey) {
        return
      }

      if (event.key.toLowerCase() === "z") {
        event.preventDefault()

        if (event.shiftKey) {
          onRedo()
        } else {
          onUndo()
        }

        return
      }

      if (event.key.toLowerCase() === "y") {
        event.preventDefault()
        onRedo()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onRedo, onUndo, reactFlow])
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable ||
    target.closest("[contenteditable=\"true\"]") !== null
  )
}

export { useKeyboardShortcuts }
export type { UseKeyboardShortcutsOptions }
