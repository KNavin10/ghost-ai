import { auth } from "@clerk/nextjs/server"

export const dynamic = "force-dynamic"

type CollaboratorRouteContext = {
  params: Promise<{ collaboratorId: string; projectId: string }>
}

export async function DELETE(
  _request: Request,
  context: CollaboratorRouteContext
) {
  const { isAuthenticated, userId } = await auth()

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { collaboratorId, projectId } = await context.params
  const { prisma } = await import("@/lib/prisma")
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  })

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 })
  }

  if (project.ownerId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const result = await prisma.projectCollaborator.deleteMany({
    where: { id: collaboratorId, projectId },
  })

  if (result.count === 0) {
    return Response.json({ error: "Collaborator not found" }, { status: 404 })
  }

  return new Response(null, { status: 204 })
}
