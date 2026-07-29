"use client"

import { useState } from "react"

type Project = {
  id: string
  isOwned: boolean
  name: string
}

type ProjectDialogType = "create" | "rename" | "delete"

type ActiveProjectDialog = {
  project?: Project
  type: ProjectDialogType
}

function createProjectSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function useProjectDialogs() {
  const [activeDialog, setActiveDialog] = useState<ActiveProjectDialog | null>(
    null
  )
  const [projectName, setProjectName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  function openCreateDialog() {
    setProjectName("")
    setActiveDialog({ type: "create" })
  }

  function openRenameDialog(project: Project) {
    setProjectName(project.name)
    setActiveDialog({ project, type: "rename" })
  }

  function openDeleteDialog(project: Project) {
    setProjectName("")
    setActiveDialog({ project, type: "delete" })
  }

  function closeDialog() {
    if (isLoading) {
      return
    }

    setProjectName("")
    setActiveDialog(null)
  }

  async function submitDialog() {
    setIsLoading(true)

    // The feature intentionally uses mock data only; this keeps loading-state
    // behavior testable without adding persistence or an API call.
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 250)
    })

    setIsLoading(false)
    setProjectName("")
    setActiveDialog(null)
  }

  return {
    activeDialog,
    closeDialog,
    isLoading,
    openCreateDialog,
    openDeleteDialog,
    openRenameDialog,
    projectName,
    projectSlug: createProjectSlug(projectName),
    setProjectName,
    submitDialog,
  }
}

type ProjectDialogController = ReturnType<typeof useProjectDialogs>

export { createProjectSlug, useProjectDialogs }
export type { Project, ProjectDialogController }
