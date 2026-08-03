type ProjectAccessMemberView = {
  displayName: string
  email: string | null
  id: string
  imageUrl: string | null
  role: "collaborator" | "owner"
}

type ProjectCollaboratorsResponse = {
  collaborators: ProjectAccessMemberView[]
  isOwner: boolean
  owner: ProjectAccessMemberView
}

export type { ProjectAccessMemberView, ProjectCollaboratorsResponse }
