import {
  getCurrentClerkIdentity,
  type CurrentClerkIdentity,
} from "@/lib/project-access"
import type { ProjectLists } from "@/lib/project-types"

async function getCurrentUserProjects(): Promise<ProjectLists> {
  const identity = await getCurrentClerkIdentity()

  if (!identity) {
    return { ownedProjects: [], sharedProjects: [] }
  }

  return getProjectsForIdentity(identity)
}

async function getProjectsForIdentity(
  identity: CurrentClerkIdentity
): Promise<ProjectLists> {
  const { primaryEmail, userId } = identity

  const { prisma } = await import("@/lib/prisma")
  const [ownedProjects, sharedProjects] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true },
    }),
    primaryEmail
      ? prisma.project.findMany({
          where: {
            ownerId: { not: userId },
            collaborators: {
              some: { email: { equals: primaryEmail, mode: "insensitive" } },
            },
          },
          orderBy: { updatedAt: "desc" },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ])

  return {
    ownedProjects: ownedProjects.map((project) => ({
      ...project,
      isOwned: true,
    })),
    sharedProjects: sharedProjects.map((project) => ({
      ...project,
      isOwned: false,
    })),
  }
}

export { getCurrentUserProjects, getProjectsForIdentity }
