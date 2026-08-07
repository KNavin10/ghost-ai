import { type Liveblocks } from "@liveblocks/node"

import { AI_CHAT_FEED_ID, AI_STATUS_FEED_ID } from "@/types/tasks"

function isStatusMatch(error: unknown, status: number): boolean {
  if (!error || typeof error !== "object") {
    return false
  }

  const candidate = error as {
    name?: unknown
    status?: unknown
    statusCode?: unknown
    response?: { status?: unknown }
  }

  const statusCode =
    typeof candidate.status === "number"
      ? candidate.status
      : typeof candidate.statusCode === "number"
        ? candidate.statusCode
        : typeof candidate.response?.status === "number"
          ? candidate.response.status
          : undefined

  return statusCode === status
}

async function ensureFeed(
  liveblocks: Liveblocks,
  roomId: string,
  feedId: string
) {
  try {
    await liveblocks.getFeed({ feedId, roomId })
  } catch (error) {
    if (!isStatusMatch(error, 404)) {
      throw error
    }

    try {
      await liveblocks.getOrCreateRoom(roomId, { defaultAccesses: [] })
      await liveblocks.createFeed({ feedId, roomId })
    } catch (createError) {
      if (!isStatusMatch(createError, 409)) {
        throw createError
      }
    }
  }
}

async function ensureAiStatusFeed(liveblocks: Liveblocks, roomId: string) {
  await ensureFeed(liveblocks, roomId, AI_STATUS_FEED_ID)
}

async function ensureAiChatFeed(liveblocks: Liveblocks, roomId: string) {
  await ensureFeed(liveblocks, roomId, AI_CHAT_FEED_ID)
}

async function ensureAiFeeds(liveblocks: Liveblocks, roomId: string) {
  await Promise.all([
    ensureAiStatusFeed(liveblocks, roomId),
    ensureAiChatFeed(liveblocks, roomId),
  ])
}

export { ensureAiChatFeed, ensureAiFeeds, ensureAiStatusFeed }
