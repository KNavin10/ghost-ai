import "server-only"

import { Liveblocks } from "@liveblocks/node"

const CURSOR_COLORS = [
  "#E57373",
  "#BA68C8",
  "#7986CB",
  "#4FC3F7",
  "#4DB6AC",
  "#81C784",
  "#FFB74D",
  "#FF8A65",
] as const

const globalForLiveblocks = globalThis as unknown as {
  liveblocks: Liveblocks | undefined
}

function createLiveblocksClient() {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY

  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY is not configured.")
  }

  return new Liveblocks({ secret })
}

function getLiveblocksClient() {
  if (!globalForLiveblocks.liveblocks) {
    globalForLiveblocks.liveblocks = createLiveblocksClient()
  }

  return globalForLiveblocks.liveblocks
}

function getCursorColor(userId: string) {
  let hash = 2_166_136_261

  for (let index = 0; index < userId.length; index += 1) {
    hash ^= userId.charCodeAt(index)
    hash = Math.imul(hash, 16_777_619)
  }

  return CURSOR_COLORS[(hash >>> 0) % CURSOR_COLORS.length]
}

export { getCursorColor, getLiveblocksClient }
