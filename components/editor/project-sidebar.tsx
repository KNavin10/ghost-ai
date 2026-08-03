"use client"

import { Pencil, Plus, Trash2, X } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { ProjectListItem } from "@/lib/project-types"

type ProjectSidebarProps = {
  activeProjectId?: string
  isOpen: boolean
  onCreate: () => void
  onDelete: (project: ProjectListItem) => void
  onOpenChange: (isOpen: boolean) => void
  onRename: (project: ProjectListItem) => void
  ownedProjects: ProjectListItem[]
  sharedProjects: ProjectListItem[]
}

function ProjectSidebar({
  activeProjectId,
  isOpen,
  onCreate,
  onDelete,
  onOpenChange,
  onRename,
  ownedProjects,
  sharedProjects,
}: ProjectSidebarProps) {
  const defaultTab = sharedProjects.some(
    (project) => project.id === activeProjectId
  )
    ? "shared"
    : "my-projects"

  return (
    <>
      {isOpen && (
        <button
          aria-label="Close projects sidebar"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => onOpenChange(false)}
          type="button"
        />
      )}

      <aside
        aria-hidden={!isOpen}
        aria-label="Projects"
        className={cn(
          "fixed top-12 bottom-0 left-0 z-40 flex w-80 max-w-[calc(100%-2rem)] flex-col border-r border-border bg-card shadow-2xl transition-transform duration-200 ease-out",
          isOpen ? "translate-x-0" : "pointer-events-none -translate-x-full"
        )}
        data-state={isOpen ? "open" : "closed"}
        inert={!isOpen}
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
          <h2 className="font-heading text-sm font-medium">Projects</h2>
          <Button
            aria-label="Close projects sidebar"
            onClick={() => onOpenChange(false)}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <X />
            <span className="sr-only">Close projects sidebar</span>
          </Button>
        </div>

        <Tabs
          className="min-h-0 flex-1 gap-4 px-4 py-4"
          defaultValue={defaultTab}
          key={activeProjectId ?? "editor-home"}
        >
          <TabsList className="w-full">
            <TabsTrigger value="my-projects">My Projects</TabsTrigger>
            <TabsTrigger value="shared">Shared</TabsTrigger>
          </TabsList>

          <TabsContent value="my-projects">
            <ProjectList
              activeProjectId={activeProjectId}
              emptyMessage="No projects yet. Create one to get started."
              onDelete={onDelete}
              onRename={onRename}
              projects={ownedProjects}
            />
          </TabsContent>
          <TabsContent value="shared">
            <ProjectList
              activeProjectId={activeProjectId}
              emptyMessage="No shared projects yet."
              onDelete={onDelete}
              onRename={onRename}
              projects={sharedProjects}
            />
          </TabsContent>
        </Tabs>

        <div className="border-t border-border p-4">
          <Button className="w-full" onClick={onCreate} type="button">
            <Plus />
            New Project
          </Button>
        </div>
      </aside>
    </>
  )
}

type ProjectListProps = {
  activeProjectId?: string
  emptyMessage: string
  onDelete: (project: ProjectListItem) => void
  onRename: (project: ProjectListItem) => void
  projects: ProjectListItem[]
}

function ProjectList({
  activeProjectId,
  emptyMessage,
  onDelete,
  onRename,
  projects,
}: ProjectListProps) {
  if (projects.length === 0) {
    return <p className="px-2 py-3 text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <div className="grid gap-1">
      {projects.map((project) => {
        const isActive = project.id === activeProjectId

        return (
          <div
            className={cn(
              "flex min-h-10 items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted",
              isActive && "bg-muted"
            )}
            data-active={isActive || undefined}
            key={project.id}
          >
            <Link
              aria-current={isActive ? "page" : undefined}
              className="min-w-0 flex-1 truncate text-sm font-medium"
              href={`/editor/${encodeURIComponent(project.id)}`}
            >
              {project.name}
            </Link>

            {project.isOwned && (
              <div className="flex items-center gap-1">
                <Button
                  aria-label={`Rename ${project.name}`}
                  onClick={() => onRename(project)}
                  size="icon-xs"
                  type="button"
                  variant="ghost"
                >
                  <Pencil />
                  <span className="sr-only">Rename {project.name}</span>
                </Button>
                <Button
                  aria-label={`Delete ${project.name}`}
                  onClick={() => onDelete(project)}
                  size="icon-xs"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 />
                  <span className="sr-only">Delete {project.name}</span>
                </Button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export { ProjectSidebar }
export type { ProjectSidebarProps }
