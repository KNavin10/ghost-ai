"use client"

import { useState } from "react"

import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectSidebar } from "@/components/editor/project-sidebar"

export default function Editor() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen((isOpen) => !isOpen)}
      />

      <div className="relative flex min-h-0 flex-1">
        <ProjectSidebar
          isOpen={isSidebarOpen}
          onOpenChange={setIsSidebarOpen}
        />

        <main className="flex min-w-0 flex-1 items-center justify-center p-8">
          <section className="w-full max-w-2xl rounded-xl border border-border bg-card p-8 shadow-sm">
            <p className="mb-2 text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
              Ghost AI Editor
            </p>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Start with a project
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Use the sidebar toggle to browse your projects. The canvas stays
              in place while the project panel opens above it.
            </p>
          </section>
        </main>
      </div>
    </div>
  )
}