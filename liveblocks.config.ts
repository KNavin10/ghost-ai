import type { FeedMessageData } from "@/types/tasks"

type CursorPosition = {
  x: number
  y: number
}

type DesignAgentStatusEvent = {
  type: "design-agent-status"
  runId: string
  stage: "start" | "processing" | "complete" | "error"
  message: string
  timestamp: string
}

declare global {
  interface Liveblocks {
    Presence: {
      cursor: CursorPosition | null
      thinking: boolean
    }

    Storage: Record<string, never>

    UserMeta: {
      id: string
      info: {
        avatar: string
        color: string
        name: string
      }
    }

    RoomEvent: DesignAgentStatusEvent

    FeedMetadata: Record<string, never>

    FeedMessageData: FeedMessageData

    ThreadMetadata: Record<string, never>

    RoomInfo: Record<string, never>
  }
}

export {}
