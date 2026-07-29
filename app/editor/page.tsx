"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { useProjectDialogs } from "@/components/editor/use-project-dialogs"
import { Button } from "@/components/ui/button"

export default function Editor() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const dialogs = useProjectDialogs()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen((isOpen) => !isOpen)}
      />

      <div className="relative flex min-h-0 flex-1">
        <ProjectSidebar
          isOpen={isSidebarOpen}
          onCreate={dialogs.openCreateDialog}
          onDelete={dialogs.openDeleteDialog}
          onOpenChange={setIsSidebarOpen}
          onRename={dialogs.openRenameDialog}
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
            <Button className="mt-6" onClick={dialogs.openCreateDialog} type="button">
              <Plus />
              New Project
            </Button>
          </section>
        </main>
      </div>

      <ProjectDialogs dialogs={dialogs} />
    </div>
  )
}
