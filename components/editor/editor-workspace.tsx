"use client"

import { useState } from "react"
import { UserButton } from "@clerk/nextjs"
import {
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Share2,
} from "lucide-react"

import { EditorCanvas } from "@/components/editor/editor-canvas"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { ShareProjectDialog } from "@/components/editor/share-project-dialog"
import { Button } from "@/components/ui/button"
import { useProjectActions } from "@/hooks/use-project-actions"
import type { AccessibleProject } from "@/lib/project-access"
import type { ProjectLists } from "@/lib/project-types"

type EditorWorkspaceProps = ProjectLists & {
  project: AccessibleProject
}

function EditorWorkspace({
  ownedProjects,
  project,
  sharedProjects,
}: EditorWorkspaceProps) {
  const [isProjectSidebarOpen, setIsProjectSidebarOpen] = useState(false)
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(true)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const projectActions = useProjectActions({ activeProjectId: project.id })

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <WorkspaceNavbar
        isAiSidebarOpen={isAiSidebarOpen}
        isProjectSidebarOpen={isProjectSidebarOpen}
        onAiSidebarToggle={() => setIsAiSidebarOpen((isOpen) => !isOpen)}
        onProjectSidebarToggle={() =>
          setIsProjectSidebarOpen((isOpen) => !isOpen)
        }
        onShare={() => setIsShareDialogOpen(true)}
        projectName={project.name}
      />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <ProjectSidebar
          activeProjectId={project.id}
          isOpen={isProjectSidebarOpen}
          onCreate={projectActions.openCreateDialog}
          onDelete={projectActions.openDeleteDialog}
          onOpenChange={setIsProjectSidebarOpen}
          onRename={projectActions.openRenameDialog}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
        />

        <main className="min-w-0 flex-1 bg-background">
          <EditorCanvas roomId={project.id} />
        </main>

        {isAiSidebarOpen && <AiSidebarPlaceholder />}
      </div>

      <ProjectDialogs dialogs={projectActions} />
      <ShareProjectDialog
        isOwner={project.isOwner}
        onOpenChange={setIsShareDialogOpen}
        open={isShareDialogOpen}
        projectId={project.id}
        projectName={project.name}
      />
    </div>
  )
}

type WorkspaceNavbarProps = {
  isAiSidebarOpen: boolean
  isProjectSidebarOpen: boolean
  onAiSidebarToggle: () => void
  onProjectSidebarToggle: () => void
  onShare: () => void
  projectName: string
}

function WorkspaceNavbar({
  isAiSidebarOpen,
  isProjectSidebarOpen,
  onAiSidebarToggle,
  onProjectSidebarToggle,
  onShare,
  projectName,
}: WorkspaceNavbarProps) {
  const ProjectSidebarIcon = isProjectSidebarOpen
    ? PanelLeftClose
    : PanelLeftOpen
  const projectSidebarLabel = isProjectSidebarOpen
    ? "Close projects sidebar"
    : "Open projects sidebar"
  const AiSidebarIcon = isAiSidebarOpen ? PanelRightClose : PanelRightOpen
  const aiSidebarLabel = isAiSidebarOpen
    ? "Close AI sidebar"
    : "Open AI sidebar"

  return (
    <header className="z-50 flex h-12 shrink-0 items-center border-b border-border bg-card px-3">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Button
          aria-label={projectSidebarLabel}
          aria-pressed={isProjectSidebarOpen}
          onClick={onProjectSidebarToggle}
          size="icon"
          type="button"
          variant="ghost"
        >
          <ProjectSidebarIcon />
          <span className="sr-only">{projectSidebarLabel}</span>
        </Button>
        <div aria-hidden="true" className="h-5 w-px bg-border" />
        <h1 className="truncate font-heading text-sm font-medium">
          {projectName}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          aria-label="Share project"
          onClick={onShare}
          type="button"
          variant="outline"
        >
          <Share2 />
          <span className="hidden sm:inline">Share</span>
        </Button>
        <Button
          aria-label={aiSidebarLabel}
          aria-pressed={isAiSidebarOpen}
          onClick={onAiSidebarToggle}
          size="icon"
          type="button"
          variant="ghost"
        >
          <AiSidebarIcon />
          <span className="sr-only">{aiSidebarLabel}</span>
        </Button>
        <UserButton />
      </div>
    </header>
  )
}

function AiSidebarPlaceholder() {
  return (
    <aside
      aria-label="AI sidebar"
      className="absolute inset-y-0 right-0 z-20 flex w-80 max-w-full shrink-0 flex-col border-l border-border bg-card shadow-2xl md:static md:shadow-none"
    >
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
        <Bot aria-hidden="true" className="size-4 text-muted-foreground" />
        <h2 className="font-heading text-sm font-medium">AI assistant</h2>
      </div>
      <div className="flex flex-1 items-center justify-center p-6 text-center">
        <p className="max-w-48 text-sm leading-6 text-muted-foreground">
          AI chat will appear here in a future step.
        </p>
      </div>
    </aside>
  )
}

export { EditorWorkspace }
export type { EditorWorkspaceProps }
