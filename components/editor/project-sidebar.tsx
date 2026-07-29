"use client"

import { Pencil, Plus, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { Project } from "@/components/editor/use-project-dialogs"

const myProjects: Project[] = [
  {
    id: "architecture-workspace",
    isOwned: true,
    name: "Architecture workspace",
  },
]

const sharedProjects: Project[] = [
  {
    id: "shared-design-system",
    isOwned: false,
    name: "Shared design system",
  },
]

type ProjectSidebarProps = {
  isOpen: boolean
  onCreate: () => void
  onDelete: (project: Project) => void
  onOpenChange: (isOpen: boolean) => void
  onRename: (project: Project) => void
}

function ProjectSidebar({
  isOpen,
  onCreate,
  onDelete,
  onOpenChange,
  onRename,
}: ProjectSidebarProps) {
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

        <Tabs className="min-h-0 flex-1 gap-4 px-4 py-4" defaultValue="my-projects">
          <TabsList className="w-full">
            <TabsTrigger value="my-projects">My Projects</TabsTrigger>
            <TabsTrigger value="shared">Shared</TabsTrigger>
          </TabsList>

          <TabsContent value="my-projects">
            <ProjectList
              onDelete={onDelete}
              onRename={onRename}
              projects={myProjects}
            />
          </TabsContent>
          <TabsContent value="shared">
            <ProjectList
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
  onDelete: (project: Project) => void
  onRename: (project: Project) => void
  projects: Project[]
}

function ProjectList({ onDelete, onRename, projects }: ProjectListProps) {
  return (
    <div className="grid gap-1">
      {projects.map((project) => (
        <div
          className="flex min-h-10 items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted"
          key={project.id}
        >
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {project.name}
          </span>

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
      ))}
    </div>
  )
}

export { ProjectSidebar }
export type { ProjectSidebarProps }
