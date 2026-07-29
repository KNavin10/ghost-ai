type ProjectListItem = {
  id: string
  isOwned: boolean
  name: string
}

type ProjectLists = {
  ownedProjects: ProjectListItem[]
  sharedProjects: ProjectListItem[]
}

export type { ProjectListItem, ProjectLists }
