import { EditorHome } from "@/components/editor/editor-home"
import { getCurrentUserProjects } from "@/lib/projects"

export const dynamic = "force-dynamic"

type ProjectEditorPageProps = {
  params: Promise<{ projectId: string }>
}

export default async function ProjectEditorPage({
  params,
}: ProjectEditorPageProps) {
  const [{ projectId }, projectLists] = await Promise.all([
    params,
    getCurrentUserProjects(),
  ])

  return <EditorHome activeProjectId={projectId} {...projectLists} />
}
