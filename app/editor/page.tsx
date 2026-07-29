import { EditorHome } from "@/components/editor/editor-home"
import { getCurrentUserProjects } from "@/lib/projects"

export const dynamic = "force-dynamic"

export default async function Editor() {
  const projectLists = await getCurrentUserProjects()

  return <EditorHome {...projectLists} />
}
