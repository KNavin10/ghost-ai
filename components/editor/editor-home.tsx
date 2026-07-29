"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { Button } from "@/components/ui/button"
import { useProjectActions } from "@/hooks/use-project-actions"
import type { ProjectLists } from "@/lib/project-types"

type EditorHomeProps = ProjectLists & {
  activeProjectId?: string
}

function EditorHome({
  activeProjectId,
  ownedProjects,
  sharedProjects,
}: EditorHomeProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const projectActions = useProjectActions({ activeProjectId })

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen((isOpen) => !isOpen)}
      />

      <div className="relative flex min-h-0 flex-1">
        <ProjectSidebar
          activeProjectId={activeProjectId}
          isOpen={isSidebarOpen}
          onCreate={projectActions.openCreateDialog}
          onDelete={projectActions.openDeleteDialog}
          onOpenChange={setIsSidebarOpen}
          onRename={projectActions.openRenameDialog}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
        />

        <main className="flex min-w-0 flex-1 items-center justify-center p-8">
          <section className="w-full max-w-xl">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Create a project or open an existing one
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Start a new architecture workspace, or choose a project from the
              sidebar.
            </p>
            <Button
              className="mt-6"
              onClick={projectActions.openCreateDialog}
              type="button"
            >
              <Plus />
              New Project
            </Button>
          </section>
        </main>
      </div>

      <ProjectDialogs dialogs={projectActions} />
    </div>
  )
}

export { EditorHome }
export type { EditorHomeProps }
