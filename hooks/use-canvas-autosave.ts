"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"

type SaveStatus = "idle" | "saving" | "saved" | "error"

type UseCanvasAutosaveOptions = {
  edges: CanvasEdge[]
  nodes: CanvasNode[]
  projectId: string
}

type UseCanvasAutosaveReturn = {
  saveStatus: SaveStatus
  triggerSave: () => Promise<boolean>
}

function computeStateHash(nodes: CanvasNode[], edges: CanvasEdge[]): string {
  return JSON.stringify({ edges, nodes })
}

function useCanvasAutosave({
  edges,
  nodes,
  projectId,
}: UseCanvasAutosaveOptions): UseCanvasAutosaveReturn {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const statusTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedHashRef = useRef<string | null>(null)
  const isInitialLoadRef = useRef(true)

  const performSave = useCallback(
    async (currentNodes: CanvasNode[], currentEdges: CanvasEdge[]) => {
      const currentHash = computeStateHash(currentNodes, currentEdges)

      if (lastSavedHashRef.current === currentHash) {
        return true
      }

      setSaveStatus("saving")

      try {
        const response = await fetch(`/api/projects/${projectId}/canvas`, {
          body: JSON.stringify({
            edges: currentEdges,
            nodes: currentNodes,
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "PUT",
        })

        if (!response.ok) {
          throw new Error(`Failed to save canvas (status ${response.status})`)
        }

        lastSavedHashRef.current = currentHash
        setSaveStatus("saved")

        if (statusTimerRef.current) {
          clearTimeout(statusTimerRef.current)
        }

        statusTimerRef.current = setTimeout(() => {
          setSaveStatus("idle")
        }, 2000)

        return true
      } catch (error) {
        console.error("Autosave failed:", error)
        setSaveStatus("error")

        if (statusTimerRef.current) {
          clearTimeout(statusTimerRef.current)
        }

        statusTimerRef.current = setTimeout(() => {
          setSaveStatus("idle")
        }, 3000)

        return false
      }
    },
    [projectId]
  )

  const triggerSave = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }

    return performSave(nodes, edges)
  }, [edges, nodes, performSave])

  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false
      lastSavedHashRef.current = computeStateHash(nodes, edges)
      return
    }

    const currentHash = computeStateHash(nodes, edges)

    if (lastSavedHashRef.current === currentHash) {
      return
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      void performSave(nodes, edges)
    }, 2000)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [edges, nodes, performSave])

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current)
      }
    }
  }, [])

  return {
    saveStatus,
    triggerSave,
  }
}

export { useCanvasAutosave }
export type { SaveStatus, UseCanvasAutosaveOptions, UseCanvasAutosaveReturn }
