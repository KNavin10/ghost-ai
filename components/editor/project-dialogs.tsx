"use client"

import type { FormEvent } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ProjectDialogController } from "@/components/editor/use-project-dialogs"

type ProjectDialogsProps = {
  dialogs: ProjectDialogController
}

function ProjectDialogs({ dialogs }: ProjectDialogsProps) {
  const activeProject = dialogs.activeDialog?.project
  const isCreateDialogOpen = dialogs.activeDialog?.type === "create"
  const isRenameDialogOpen = dialogs.activeDialog?.type === "rename"
  const isDeleteDialogOpen = dialogs.activeDialog?.type === "delete"
  const isNameSubmitDisabled = dialogs.isLoading || !dialogs.projectName.trim()

  function handleNameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isNameSubmitDisabled) {
      return
    }

    void dialogs.submitDialog()
  }

  function handleDeleteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void dialogs.submitDialog()
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      dialogs.closeDialog()
    }
  }

  return (
    <>
      <Dialog onOpenChange={handleOpenChange} open={isCreateDialogOpen}>
        <DialogContent showCloseButton={!dialogs.isLoading}>
          <form className="grid gap-4" onSubmit={handleNameSubmit}>
            <DialogHeader>
              <DialogTitle>Create project</DialogTitle>
              <DialogDescription>
                Give your architecture workspace a name.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="new-project-name">
                Project name
              </label>
              <Input
                autoFocus
                id="new-project-name"
                onChange={(event) => dialogs.setProjectName(event.target.value)}
                placeholder="Architecture workspace"
                value={dialogs.projectName}
              />
            </div>

            <SlugPreview slug={dialogs.projectSlug} />

            <DialogFooter>
              <Button
                disabled={dialogs.isLoading}
                onClick={dialogs.closeDialog}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={isNameSubmitDisabled} type="submit">
                {dialogs.isLoading ? "Creating..." : "Create project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={handleOpenChange} open={isRenameDialogOpen}>
        <DialogContent showCloseButton={!dialogs.isLoading}>
          <form className="grid gap-4" onSubmit={handleNameSubmit}>
            <DialogHeader>
              <DialogTitle>Rename project</DialogTitle>
              <DialogDescription>
                Rename “{activeProject?.name}”.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="rename-project-name">
                Project name
              </label>
              <Input
                autoFocus
                id="rename-project-name"
                onChange={(event) => dialogs.setProjectName(event.target.value)}
                value={dialogs.projectName}
              />
            </div>

            <SlugPreview slug={dialogs.projectSlug} />

            <DialogFooter>
              <Button
                disabled={dialogs.isLoading}
                onClick={dialogs.closeDialog}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={isNameSubmitDisabled} type="submit">
                {dialogs.isLoading ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={handleOpenChange} open={isDeleteDialogOpen}>
        <DialogContent showCloseButton={!dialogs.isLoading}>
          <form className="grid gap-4" onSubmit={handleDeleteSubmit}>
            <DialogHeader>
              <DialogTitle>Delete project?</DialogTitle>
              <DialogDescription>
                This will delete “{activeProject?.name}”. This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                disabled={dialogs.isLoading}
                onClick={dialogs.closeDialog}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={dialogs.isLoading} type="submit" variant="destructive">
                {dialogs.isLoading ? "Deleting..." : "Delete project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function SlugPreview({ slug }: { slug: string }) {
  return (
    <p aria-live="polite" className="text-sm text-muted-foreground">
      Slug preview: <span className="font-mono text-foreground">{slug || "your-project-slug"}</span>
    </p>
  )
}

export { ProjectDialogs }
export type { ProjectDialogsProps }
