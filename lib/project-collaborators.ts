import "server-only"

import { clerkClient } from "@clerk/nextjs/server"

import type { ProjectAccessMemberView } from "@/lib/collaborator-types"

type StoredCollaborator = {
  email: string
  id: string
}

const CLERK_USER_BATCH_SIZE = 100

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function enrichCollaborators(
  collaborators: StoredCollaborator[]
): Promise<ProjectAccessMemberView[]> {
  if (collaborators.length === 0) {
    return []
  }

  const emails = collaborators.map((collaborator) => collaborator.email)

  try {
    const client = await clerkClient()
    const batches = Array.from(
      { length: Math.ceil(emails.length / CLERK_USER_BATCH_SIZE) },
      (_, index) =>
        emails.slice(
          index * CLERK_USER_BATCH_SIZE,
          (index + 1) * CLERK_USER_BATCH_SIZE
        )
    )
    const responses = await Promise.all(
      batches.map((emailAddress) =>
        client.users.getUserList({
          emailAddress,
          limit: CLERK_USER_BATCH_SIZE,
        })
      )
    )
    const usersByEmail = new Map(
      responses.flatMap((response) =>
        response.data.flatMap((user) =>
          user.emailAddresses.map((emailAddress) => [
            normalizeEmail(emailAddress.emailAddress),
            user,
          ] as const)
        )
      )
    )

    return collaborators.map((collaborator) => {
      const user = usersByEmail.get(normalizeEmail(collaborator.email))

      return {
        displayName: user?.fullName ?? collaborator.email,
        email: collaborator.email,
        id: collaborator.id,
        imageUrl: user?.imageUrl ?? null,
        role: "collaborator" as const,
      }
    })
  } catch {
    return collaborators.map((collaborator) => ({
      displayName: collaborator.email,
      email: collaborator.email,
      id: collaborator.id,
      imageUrl: null,
      role: "collaborator" as const,
    }))
  }
}

async function getOwnerMember(
  ownerId: string
): Promise<ProjectAccessMemberView> {
  try {
    const client = await clerkClient()
    const owner = await client.users.getUser(ownerId)
    const email = owner.primaryEmailAddress?.emailAddress ?? null

    return {
      displayName: owner.fullName ?? email ?? "Project owner",
      email,
      id: owner.id,
      imageUrl: owner.imageUrl,
      role: "owner",
    }
  } catch {
    return {
      displayName: "Project owner",
      email: null,
      id: ownerId,
      imageUrl: null,
      role: "owner",
    }
  }
}

export {
  enrichCollaborators,
  getOwnerMember,
  isValidEmail,
  normalizeEmail,
}
