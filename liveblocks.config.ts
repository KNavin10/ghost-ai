type CursorPosition = {
  x: number
  y: number
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

    RoomEvent: Record<string, never>

    ThreadMetadata: Record<string, never>

    RoomInfo: Record<string, never>
  }
}

export {}
