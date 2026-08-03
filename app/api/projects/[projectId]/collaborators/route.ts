import type { ProjectCollaboratorsResponse } from "@/lib/collaborator-types"
import { getCurrentClerkIdentity } from "@/lib/project-access"
import {
  enrichCollaborators,
  getOwnerMember,
  isValidEmail,
  normalizeEmail,
} from "@/lib/project-collaborators"

export const dynamic = "force-dynamic"

type CollaboratorsRouteContext = {
  params: Promise<{ projectId: string }>
}

type InviteCollaboratorBody = {
  email?: unknown
}

async function getProjectWithCollaborators(projectId: string) {
  const { prisma } = await import("@/lib/prisma")

  return prisma.project.findUnique({
    where: { id: projectId },
    select: {
      collaborators: {
        orderBy: { createdAt: "asc" },
        select: { email: true, id: true },
      },
      ownerId: true,
    },
  })
}

export async function GET(
  _request: Request,
  context: CollaboratorsRouteContext
) {
  const identity = await getCurrentClerkIdentity()

  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await context.params
  const project = await getProjectWithCollaborators(projectId)

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 })
  }

  const isOwner = project.ownerId === identity.userId
  const hasCollaboratorAccess = Boolean(
    identity.primaryEmail &&
      project.collaborators.some(
        (collaborator) =>
          normalizeEmail(collaborator.email) === identity.primaryEmail
      )
  )

  if (!isOwner && !hasCollaboratorAccess) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const [owner, collaborators] = await Promise.all([
    getOwnerMember(project.ownerId),
    enrichCollaborators(project.collaborators),
  ])
  const response: ProjectCollaboratorsResponse = {
    collaborators,
    isOwner,
    owner,
  }

  return Response.json(response)
}

export async function POST(
  request: Request,
  context: CollaboratorsRouteContext
) {
  const identity = await getCurrentClerkIdentity()

  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: InviteCollaboratorBody

  try {
    body = (await request.json()) as InviteCollaboratorBody
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (typeof body.email !== "string") {
    return Response.json(
      { error: "Collaborator email must be a string" },
      { status: 400 }
    )
  }

  const email = normalizeEmail(body.email)

  if (!isValidEmail(email) || email.length > 254) {
    return Response.json(
      { error: "Enter a valid collaborator email" },
      { status: 400 }
    )
  }

  const { projectId } = await context.params
  const project = await getProjectWithCollaborators(projectId)

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 })
  }

  if (project.ownerId !== identity.userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  if (identity.primaryEmail && normalizeEmail(identity.primaryEmail) === email) {
    return Response.json(
      { error: "You already own this project" },
      { status: 400 }
    )
  }

  if (
    project.collaborators.some(
      (collaborator) => normalizeEmail(collaborator.email) === email
    )
  ) {
    return Response.json(
      { error: "This collaborator already has access" },
      { status: 409 }
    )
  }

  const { prisma } = await import("@/lib/prisma")
  let collaborator

  try {
    collaborator = await prisma.projectCollaborator.create({
      data: { email, projectId },
      select: { email: true, id: true },
    })
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return Response.json(
        { error: "This collaborator already has access" },
        { status: 409 }
      )
    }

    throw error
  }

  const [enrichedCollaborator] = await enrichCollaborators([collaborator])

  return Response.json(enrichedCollaborator, { status: 201 })
}
