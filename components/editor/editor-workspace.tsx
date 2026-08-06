"use client"

import { useCallback, useRef, useState } from "react"
import {
  AlertCircle,
  Check,
  LayoutTemplate,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Save,
  Share2,
} from "lucide-react"

import { EditorCanvas } from "@/components/editor/editor-canvas"
import { AiSidebar } from "@/components/editor/ai-sidebar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { ShareProjectDialog } from "@/components/editor/share-project-dialog"
import { Button } from "@/components/ui/button"
import { useProjectActions } from "@/hooks/use-project-actions"
import type { SaveStatus } from "@/hooks/use-canvas-autosave"
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
  const [isStarterTemplatesOpen, setIsStarterTemplatesOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const saveHandlerRef = useRef<(() => Promise<boolean>) | null>(null)

  const projectActions = useProjectActions({ activeProjectId: project.id })

  const handleSave = useCallback(() => {
    if (saveHandlerRef.current) {
      void saveHandlerRef.current()
    }
  }, [])

  const handleSaveHandlerReady = useCallback(
    (handler: () => Promise<boolean>) => {
      saveHandlerRef.current = handler
    },
    []
  )

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <WorkspaceNavbar
        isAiSidebarOpen={isAiSidebarOpen}
        isProjectSidebarOpen={isProjectSidebarOpen}
        onAiSidebarToggle={() => setIsAiSidebarOpen((isOpen) => !isOpen)}
        onProjectSidebarToggle={() =>
          setIsProjectSidebarOpen((isOpen) => !isOpen)
        }
        onSave={handleSave}
        onShare={() => setIsShareDialogOpen(true)}
        onStarterTemplates={() => setIsStarterTemplatesOpen(true)}
        projectName={project.name}
        saveStatus={saveStatus}
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
          <EditorCanvas
            isStarterTemplatesOpen={isStarterTemplatesOpen}
            onSaveHandlerReady={handleSaveHandlerReady}
            onSaveStatusChange={setSaveStatus}
            onStarterTemplatesOpenChange={setIsStarterTemplatesOpen}
            roomId={project.id}
          />
        </main>

        <AiSidebar
          isOpen={isAiSidebarOpen}
          onOpenChange={setIsAiSidebarOpen}
        />
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
  onSave: () => void
  onShare: () => void
  onStarterTemplates: () => void
  projectName: string
  saveStatus: SaveStatus
}

function WorkspaceNavbar({
  isAiSidebarOpen,
  isProjectSidebarOpen,
  onAiSidebarToggle,
  onProjectSidebarToggle,
  onSave,
  onShare,
  onStarterTemplates,
  projectName,
  saveStatus,
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

  const renderSaveContent = () => {
    switch (saveStatus) {
      case "saving":
        return (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="hidden sm:inline">Saving...</span>
          </>
        )
      case "saved":
        return (
          <>
            <Check className="h-4 w-4 text-emerald-500" />
            <span className="hidden text-emerald-500 sm:inline">Saved</span>
          </>
        )
      case "error":
        return (
          <>
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="hidden text-destructive sm:inline">Error</span>
          </>
        )
      case "idle":
      default:
        return (
          <>
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Save</span>
          </>
        )
    }
  }

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
          aria-label="Save canvas"
          disabled={saveStatus === "saving"}
          onClick={onSave}
          type="button"
          variant={saveStatus === "error" ? "destructive" : "outline"}
        >
          {renderSaveContent()}
        </Button>
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
          aria-label="Open starter templates"
          onClick={onStarterTemplates}
          type="button"
          variant="outline"
        >
          <LayoutTemplate />
          <span className="hidden sm:inline">Templates</span>
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
      </div>
    </header>
  )
}

export { EditorWorkspace }
export type { EditorWorkspaceProps }
