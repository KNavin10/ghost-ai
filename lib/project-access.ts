import "server-only"

import { auth, currentUser } from "@clerk/nextjs/server"

type CurrentClerkIdentity = {
  primaryEmail: string | null
  userId: string
}

type AccessibleProject = {
  id: string
  isOwner: boolean
  name: string
}

async function getCurrentClerkIdentity(): Promise<CurrentClerkIdentity | null> {
  const { isAuthenticated, userId } = await auth()

  if (!isAuthenticated || !userId) {
    return null
  }

  const user = await currentUser()

  return {
    primaryEmail:
      user?.primaryEmailAddress?.emailAddress.trim().toLowerCase() ?? null,
    userId,
  }
}

async function getAccessibleProject(
  roomId: string,
  identity: CurrentClerkIdentity
): Promise<AccessibleProject | null> {
  const { prisma } = await import("@/lib/prisma")
  const accessFilter = identity.primaryEmail
    ? {
        OR: [
          { ownerId: identity.userId },
          {
            collaborators: {
              some: {
                email: {
                  equals: identity.primaryEmail,
                  mode: "insensitive" as const,
                },
              },
            },
          },
        ],
      }
    : { ownerId: identity.userId }

  const project = await prisma.project.findFirst({
    where: {
      id: roomId,
      ...accessFilter,
    },
    select: {
      id: true,
      name: true,
      ownerId: true,
    },
  })

  if (!project) {
    return null
  }

  return {
    id: project.id,
    isOwner: project.ownerId === identity.userId,
    name: project.name,
  }
}

export { getAccessibleProject, getCurrentClerkIdentity }
export type { AccessibleProject, CurrentClerkIdentity }
