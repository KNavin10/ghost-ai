import { auth, currentUser } from "@clerk/nextjs/server"

import type { ProjectLists } from "@/lib/project-types"

async function getCurrentUserProjects(): Promise<ProjectLists> {
  const { isAuthenticated, userId } = await auth()

  if (!isAuthenticated || !userId) {
    return { ownedProjects: [], sharedProjects: [] }
  }

  const { prisma } = await import("@/lib/prisma")
  const [ownedProjects, user] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true },
    }),
    currentUser(),
  ])
  const collaboratorEmail = user?.primaryEmailAddress?.emailAddress
  const sharedProjects = collaboratorEmail
    ? await prisma.project.findMany({
        where: {
          ownerId: { not: userId },
          collaborators: { some: { email: collaboratorEmail } },
        },
        orderBy: { updatedAt: "desc" },
        select: { id: true, name: true },
      })
    : []

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

export { getCurrentUserProjects }
