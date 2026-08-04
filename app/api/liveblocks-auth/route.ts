import {
  getAccessibleProject,
  getCurrentClerkIdentity,
} from "@/lib/project-access"

export const dynamic = "force-dynamic"

type LiveblocksAuthBody = {
  room?: unknown
}

export async function POST(request: Request) {
  const identity = await getCurrentClerkIdentity()

  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: LiveblocksAuthBody

  try {
    body = (await request.json()) as LiveblocksAuthBody
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (
    typeof body.room !== "string" ||
    body.room.length === 0 ||
    body.room.length > 128
  ) {
    return Response.json(
      { error: "Room ID must be a non-empty string" },
      { status: 400 }
    )
  }

  const project = await getAccessibleProject(body.room, identity)

  if (!project) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { getCursorColor, getLiveblocksClient } = await import(
      "@/lib/liveblocks"
    )
    const liveblocks = getLiveblocksClient()

    await liveblocks.getOrCreateRoom(project.id, {
      defaultAccesses: [],
    })

    const session = liveblocks.prepareSession(identity.userId, {
      userInfo: {
        avatar: identity.avatarUrl,
        color: getCursorColor(identity.userId),
        name: identity.displayName,
      },
    })
    session.allow(project.id, ["*:write"])

    const { body: tokenBody, status } = await session.authorize()

    return new Response(tokenBody, {
      headers: { "Content-Type": "application/json" },
      status,
    })
  } catch (error) {
    console.error("Liveblocks authentication failed", error)

    return Response.json(
      { error: "Liveblocks authentication failed" },
      { status: 500 }
    )
  }
}
