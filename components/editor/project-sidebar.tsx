"use client"

import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

type ProjectSidebarProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

function ProjectSidebar({ isOpen, onOpenChange }: ProjectSidebarProps) {
  return (
    <aside
      aria-hidden={!isOpen}
      aria-label="Projects"
      className={cn(
        "fixed top-12 bottom-0 left-0 z-40 flex w-80 flex-col border-r border-border bg-card shadow-2xl transition-transform duration-200 ease-out",
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
          <EmptyProjectsState description="You have no projects yet." />
        </TabsContent>
        <TabsContent value="shared">
          <EmptyProjectsState description="No projects have been shared with you yet." />
        </TabsContent>
      </Tabs>

      <div className="border-t border-border p-4">
        <Button className="w-full" type="button">
          <Plus />
          New Project
        </Button>
      </div>
    </aside>
  )
}

function EmptyProjectsState({ description }: { description: string }) {
  return (
    <div className="grid min-h-32 place-items-center rounded-lg border border-dashed border-border bg-background/50 p-6 text-center text-sm text-muted-foreground">
      <p>{description}</p>
    </div>
  )
}

export { ProjectSidebar }
export type { ProjectSidebarProps }
