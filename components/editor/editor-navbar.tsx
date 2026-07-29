"use client"

import { UserButton } from "@clerk/nextjs"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"

import { Button } from "@/components/ui/button"

type EditorNavbarProps = {
  isSidebarOpen: boolean
  onSidebarToggle: () => void
}

function EditorNavbar({
  isSidebarOpen,
  onSidebarToggle,
}: EditorNavbarProps) {
  const ToggleIcon = isSidebarOpen ? PanelLeftClose : PanelLeftOpen
  const toggleLabel = isSidebarOpen ? "Close projects sidebar" : "Open projects sidebar"

  return (
    <header className="z-50 flex h-12 shrink-0 items-center border-b border-border bg-card">
      <div className="flex flex-1 items-center px-3">
        <Button
          aria-label={toggleLabel}
          aria-pressed={isSidebarOpen}
          onClick={onSidebarToggle}
          size="icon"
          type="button"
          variant="ghost"
        >
          <ToggleIcon />
          <span className="sr-only">{toggleLabel}</span>
        </Button>
      </div>

      <div className="flex flex-1 items-center justify-center" />

      <div className="flex flex-1 items-center justify-end px-3">
        <UserButton />
      </div>
    </header>
  )
}

export { EditorNavbar }
export type { EditorNavbarProps }
