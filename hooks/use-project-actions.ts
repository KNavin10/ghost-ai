"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import type { ProjectListItem } from "@/lib/project-types"

type ProjectDialogType = "create" | "rename" | "delete"

type ActiveProjectDialog = {
  project?: ProjectListItem
  type: ProjectDialogType
}

type UseProjectActionsOptions = {
  activeProjectId?: string
}

function createProjectSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function createShortUniqueSuffix() {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 8)
}

function createProjectRoomId(name: string, suffix: string) {
  return `${createProjectSlug(name) || "untitled-project"}-${suffix}`
}

async function getResponseError(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as {
    error?: unknown
  } | null

  return typeof body?.error === "string" ? body.error : fallback
}

function useProjectActions({ activeProjectId }: UseProjectActionsOptions = {}) {
  const router = useRouter()
  const [activeDialog, setActiveDialog] = useState<ActiveProjectDialog | null>(
    null
  )
  const [projectName, setProjectName] = useState("")
  const [roomSuffix, setRoomSuffix] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openCreateDialog() {
    setProjectName("")
    setRoomSuffix(createShortUniqueSuffix())
    setError(null)
    setActiveDialog({ type: "create" })
  }

  function openRenameDialog(project: ProjectListItem) {
    setProjectName(project.name)
    setRoomSuffix("")
    setError(null)
    setActiveDialog({ project, type: "rename" })
  }

  function openDeleteDialog(project: ProjectListItem) {
    setProjectName("")
    setRoomSuffix("")
    setError(null)
    setActiveDialog({ project, type: "delete" })
  }

  function closeDialog() {
    if (isLoading) {
      return
    }

    setProjectName("")
    setRoomSuffix("")
    setError(null)
    setActiveDialog(null)
  }

  async function submitDialog() {
    if (!activeDialog) {
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      if (activeDialog.type === "create") {
        const projectId = createProjectRoomId(projectName, roomSuffix)
        const response = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: projectId, name: projectName.trim() }),
        })

        if (!response.ok) {
          throw new Error(await getResponseError(response, "Could not create project."))
        }

        const project = (await response.json()) as { id: string }
        setActiveDialog(null)
        router.push(`/editor/${encodeURIComponent(project.id)}`)
        return
      }

      const project = activeDialog.project

      if (!project) {
        return
      }

      if (activeDialog.type === "rename") {
        const response = await fetch(`/api/projects/${encodeURIComponent(project.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: projectName.trim() }),
        })

        if (!response.ok) {
          throw new Error(await getResponseError(response, "Could not rename project."))
        }

        setActiveDialog(null)
        router.refresh()
        return
      }

      const response = await fetch(`/api/projects/${encodeURIComponent(project.id)}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(await getResponseError(response, "Could not delete project."))
      }

      setActiveDialog(null)

      if (project.id === activeProjectId) {
        router.replace("/editor")
        return
      }

      router.refresh()
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Could not update project."
      )
    } finally {
      setIsLoading(false)
    }
  }

  return {
    activeDialog,
    closeDialog,
    error,
    isLoading,
    openCreateDialog,
    openDeleteDialog,
    openRenameDialog,
    projectName,
    projectRoomId: createProjectRoomId(projectName, roomSuffix),
    setProjectName,
    submitDialog,
  }
}

type ProjectActionController = ReturnType<typeof useProjectActions>

export {
  createProjectRoomId,
  createProjectSlug,
  createShortUniqueSuffix,
  useProjectActions,
}
export type { ProjectActionController }
