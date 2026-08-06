"use client"

import { useAuth, UserButton } from "@clerk/nextjs"
import {
  shallow,
  useOther,
  useOthersConnectionIds,
  useOthersMapped,
} from "@liveblocks/react/suspense"
import { MousePointer2 } from "lucide-react"
import type { MouseEvent as ReactMouseEvent } from "react"

const AVATAR_SIZE_CLASS = "size-8"

type ParticipantInfo = {
  avatar: string
  color: string
  name: string
  userId: string
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")

  return initials.toUpperCase() || "?"
}

function PresenceAvatars() {
  const { userId } = useAuth()
  const collaboratorEntries = useOthersMapped(
    (other) => ({
      avatar: other.info.avatar,
      color: other.info.color,
      name: other.info.name,
      userId: other.id,
    }),
    shallow
  ).filter(([, participant]) => participant.userId !== userId)
  const visibleCollaborators = collaboratorEntries.slice(0, 5)
  const overflowCount = Math.max(collaboratorEntries.length - 5, 0)

  return (
    <div
      aria-label="People in this canvas"
      className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-full border border-border/80 bg-card/90 p-1.5 shadow-lg backdrop-blur"
      data-testid="canvas-presence"
    >
      {collaboratorEntries.length > 0 ? (
        <>
          <div className="flex items-center -space-x-2">
            {visibleCollaborators.map(([connectionId, participant]) => (
              <CollaboratorAvatar
                key={connectionId}
                participant={participant}
              />
            ))}
            {overflowCount > 0 ? (
              <div
                aria-label={`${overflowCount} more collaborators`}
                className={`${AVATAR_SIZE_CLASS} relative flex shrink-0 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-semibold text-muted-foreground ring-1 ring-border/70`}
                title={`${overflowCount} more collaborators`}
              >
                +{overflowCount}
              </div>
            ) : null}
          </div>
          <div aria-hidden="true" className="h-6 w-px bg-border" />
        </>
      ) : null}
      <div
        aria-label="Your profile"
        className={`${AVATAR_SIZE_CLASS} shrink-0 rounded-full ring-2 ring-background`}
      >
        <UserButton
          appearance={{
            elements: { avatarBox: AVATAR_SIZE_CLASS },
          }}
        />
      </div>
    </div>
  )
}

function CollaboratorAvatar({
  participant,
}: {
  participant: ParticipantInfo
}) {
  return (
    <div
      aria-label={participant.name}
      className={`${AVATAR_SIZE_CLASS} relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-background bg-muted text-xs font-semibold text-muted-foreground ring-1 ring-border/70`}
      style={{ borderColor: participant.color }}
      title={participant.name}
    >
      {participant.avatar ? (
        // Liveblocks user metadata contains the Clerk-controlled image URL.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          className="size-full object-cover"
          height={32}
          src={participant.avatar}
          width={32}
        />
      ) : (
        getInitials(participant.name)
      )}
    </div>
  )
}

function LiveCursors() {
  const connectionIds = useOthersConnectionIds()

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {connectionIds.map((connectionId) => (
        <CollaboratorCursor key={connectionId} connectionId={connectionId} />
      ))}
    </div>
  )
}

function CollaboratorCursor({ connectionId }: { connectionId: number }) {
  const { userId: currentUserId } = useAuth()
  const participant = useOther(
    connectionId,
    (other) => ({
      color: other.info.color,
      cursor: other.presence.cursor,
      name: other.info.name,
      userId: other.id,
    }),
    shallow
  )

  if (participant.userId === currentUserId || participant.cursor === null) {
    return null
  }

  const cursorStyle = {
    transform: `translate3d(${participant.cursor.x}px, ${participant.cursor.y}px, 0)`,
  }
  const badgeStyle = {
    backgroundColor: participant.color,
    color: "#111111",
  }

  return (
    <div
      aria-label={`${participant.name}'s cursor`}
      className="absolute left-0 top-0 will-change-transform"
      style={cursorStyle}
    >
      <MousePointer2
        aria-hidden="true"
        className="size-4 -rotate-12 drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]"
        style={{ fill: participant.color, color: participant.color }}
      />
      <span
        className="absolute left-3 top-3 max-w-36 truncate rounded-full px-2 py-0.5 text-[10px] font-semibold leading-4 shadow-md"
        style={badgeStyle}
      >
        {participant.name}
      </span>
    </div>
  )
}

function CanvasPresence() {
  return (
    <>
      <PresenceAvatars />
      <LiveCursors />
    </>
  )
}

function getCursorPosition(
  event: ReactMouseEvent<HTMLDivElement>
): { x: number; y: number } {
  const bounds = event.currentTarget.getBoundingClientRect()

  return {
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top,
  }
}

export { CanvasPresence, getCursorPosition }
