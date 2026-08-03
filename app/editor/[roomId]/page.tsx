import { redirect } from "next/navigation"

import { AccessDenied } from "@/components/editor/access-denied"
import { EditorWorkspace } from "@/components/editor/editor-workspace"
import {
  getAccessibleProject,
  getCurrentClerkIdentity,
} from "@/lib/project-access"
import { getProjectsForIdentity } from "@/lib/projects"

export const dynamic = "force-dynamic"

type ProjectEditorPageProps = {
  params: Promise<{ roomId: string }>
}

export default async function ProjectEditorPage({
  params,
}: ProjectEditorPageProps) {
  const { roomId } = await params
  const identity = await getCurrentClerkIdentity()

  if (!identity) {
    redirect("/sign-in")
  }

  const project = await getAccessibleProject(roomId, identity)

  if (!project) {
    return <AccessDenied />
  }

  const projectLists = await getProjectsForIdentity(identity)

  return <EditorWorkspace project={project} {...projectLists} />
}
