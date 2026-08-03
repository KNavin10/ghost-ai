"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import {
  Check,
  Link2,
  LoaderCircle,
  Mail,
  Trash2,
  UserRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type {
  ProjectAccessMemberView,
  ProjectCollaboratorsResponse,
} from "@/lib/collaborator-types"
import { cn } from "@/lib/utils"

type ShareProjectDialogProps = {
  isOwner: boolean
  onOpenChange: (open: boolean) => void
  open: boolean
  projectId: string
  projectName: string
}

type ErrorResponse = {
  error?: string
}

const COPIED_FEEDBACK_MS = 2_000

async function getResponseError(response: Response) {
  try {
    const body = (await response.json()) as ErrorResponse
    return body.error ?? "Something went wrong"
  } catch {
    return "Something went wrong"
  }
}

function ShareProjectDialog({
  isOwner,
  onOpenChange,
  open,
  projectId,
  projectName,
}: ShareProjectDialogProps) {
  const [collaborators, setCollaborators] = useState<
    ProjectAccessMemberView[]
  >([])
  const [owner, setOwner] = useState<ProjectAccessMemberView | null>(null)
  const [copied, setCopied] = useState(false)
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isInviting, setIsInviting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [resolvedIsOwner, setResolvedIsOwner] = useState(isOwner)
  const copiedTimerRef = useRef<number | null>(null)
  const peopleCount = collaborators.length + (owner ? 1 : 0)

  useEffect(() => {
    if (!open) {
      return
    }

    const controller = new AbortController()

    async function loadCollaborators() {
      setError(null)
      setIsLoading(true)

      try {
        const response = await fetch(
          `/api/projects/${encodeURIComponent(projectId)}/collaborators`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error(await getResponseError(response))
        }

        const data = (await response.json()) as ProjectCollaboratorsResponse
        setCollaborators(data.collaborators)
        setOwner(data.owner)
        setResolvedIsOwner(data.isOwner)
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load people with access"
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadCollaborators()

    return () => controller.abort()
  }, [open, projectId])

  useEffect(
    () => () => {
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current)
      }
    },
    []
  )

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isInviting) {
      return
    }

    const normalizedEmail = email.trim()

    if (!normalizedEmail) {
      setError("Enter a collaborator email")
      return
    }

    setError(null)
    setIsInviting(true)

    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/collaborators`,
        {
          body: JSON.stringify({ email: normalizedEmail }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }
      )

      if (!response.ok) {
        throw new Error(await getResponseError(response))
      }

      const collaborator = (await response.json()) as ProjectAccessMemberView
      setCollaborators((currentCollaborators) => [
        ...currentCollaborators,
        collaborator,
      ])
      setEmail("")
    } catch (inviteError) {
      setError(
        inviteError instanceof Error
          ? inviteError.message
          : "Unable to invite collaborator"
      )
    } finally {
      setIsInviting(false)
    }
  }

  async function handleRemove(collaborator: ProjectAccessMemberView) {
    if (removingId !== null) {
      return
    }

    setError(null)
    setRemovingId(collaborator.id)

    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/collaborators/${encodeURIComponent(collaborator.id)}`,
        { method: "DELETE" }
      )

      if (!response.ok) {
        throw new Error(await getResponseError(response))
      }

      setCollaborators((currentCollaborators) =>
        currentCollaborators.filter((item) => item.id !== collaborator.id)
      )
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Unable to remove collaborator"
      )
    } finally {
      setRemovingId(null)
    }
  }

  async function handleCopyLink() {
    setError(null)

    try {
      const projectUrl = new URL(
        `/editor/${encodeURIComponent(projectId)}`,
        window.location.origin
      ).toString()
      await navigator.clipboard.writeText(projectUrl)
      setCopied(true)

      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current)
      }

      copiedTimerRef.current = window.setTimeout(() => {
        setCopied(false)
        copiedTimerRef.current = null
      }, COPIED_FEEDBACK_MS)
    } catch {
      setError("Unable to copy the project link")
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border px-6 py-5 text-left">
          <DialogTitle className="text-xl">Share project</DialogTitle>
          <DialogDescription>
            {resolvedIsOwner
              ? "Invite collaborators, copy the workspace link, and manage access."
              : `View everyone who can access ${projectName}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-6 py-5">
          {resolvedIsOwner && (
            <section className="flex flex-col gap-4 rounded-2xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold">Workspace link</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Share a direct link after you grant someone access.
                </p>
              </div>
              <Button
                className="shrink-0"
                onClick={() => void handleCopyLink()}
                type="button"
                variant="outline"
              >
                {copied ? <Check /> : <Link2 />}
                {copied ? "Copied!" : "Copy link"}
              </Button>
            </section>
          )}

          {resolvedIsOwner && (
            <form
              className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/20 p-4 sm:flex-row"
              onSubmit={handleInvite}
            >
              <div className="relative min-w-0 flex-1">
                <label className="sr-only" htmlFor="collaborator-email">
                  Collaborator email
                </label>
                <Mail
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  autoComplete="email"
                  className="pl-9"
                  disabled={isInviting}
                  id="collaborator-email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="teammate@company.com"
                  type="email"
                  value={email}
                />
              </div>
              <Button className="shrink-0" disabled={isInviting} type="submit">
                {isInviting && <LoaderCircle className="animate-spin" />}
                Invite
              </Button>
            </form>
          )}

          <section className="space-y-3">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold">People with access</h3>
                {!resolvedIsOwner && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Only the project owner can manage access.
                  </p>
                )}
              </div>
              {!isLoading && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {peopleCount} {peopleCount === 1 ? "person" : "people"}
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-border p-8 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" />
                Loading people...
              </div>
            ) : peopleCount === 0 ? (
              <p className="rounded-2xl border border-border p-8 text-center text-sm text-muted-foreground">
                No access details are available.
              </p>
            ) : (
              <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {owner && <AccessMemberRow member={owner} />}
                {collaborators.map((collaborator) => (
                  <AccessMemberRow
                    isRemoving={removingId === collaborator.id}
                    key={collaborator.id}
                    member={collaborator}
                    onRemove={
                      resolvedIsOwner
                        ? () => void handleRemove(collaborator)
                        : undefined
                    }
                    removeDisabled={removingId !== null}
                  />
                ))}
              </ul>
            )}
          </section>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

type AccessMemberRowProps = {
  isRemoving?: boolean
  member: ProjectAccessMemberView
  onRemove?: () => void
  removeDisabled?: boolean
}

function AccessMemberRow({
  isRemoving = false,
  member,
  onRemove,
  removeDisabled = false,
}: AccessMemberRowProps) {
  return (
    <li className="flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-muted/20 p-4">
      <MemberAvatar member={member} />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold">{member.displayName}</p>
          <RoleTag role={member.role} />
        </div>
        {member.email && (
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {member.email}
          </p>
        )}
      </div>
      {onRemove && (
        <Button
          aria-label={`Remove ${member.email ?? member.displayName}`}
          className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={removeDisabled}
          onClick={onRemove}
          size="icon-sm"
          title={`Remove ${member.email ?? member.displayName}`}
          type="button"
          variant="ghost"
        >
          {isRemoving ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <Trash2 />
          )}
        </Button>
      )}
    </li>
  )
}

function RoleTag({ role }: { role: ProjectAccessMemberView["role"] }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
        role === "owner"
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-muted text-muted-foreground"
      )}
    >
      {role}
    </span>
  )
}

function MemberAvatar({ member }: { member: ProjectAccessMemberView }) {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-muted-foreground">
      {member.imageUrl ? (
        // Clerk controls this profile image URL, which can use instance-specific hosts.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          className="size-full object-cover"
          height={40}
          src={member.imageUrl}
          width={40}
        />
      ) : (
        <UserRound aria-hidden="true" className="size-4" />
      )}
    </div>
  )
}

export { ShareProjectDialog }
export type { ShareProjectDialogProps }
