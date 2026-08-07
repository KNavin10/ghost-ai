import {
  getAccessibleProject,
  getCurrentClerkIdentity,
} from "@/lib/project-access";

export const dynamic = "force-dynamic";

type SpecsRouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function GET(_request: Request, context: SpecsRouteContext) {
  const identityPromise = getCurrentClerkIdentity();
  const paramsPromise = context.params;

  const [identity, { projectId }] = await Promise.all([
    identityPromise,
    paramsPromise,
  ]);

  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await getAccessibleProject(projectId, identity);

  if (!project) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { prisma } = await import("@/lib/prisma");

    const specs = await prisma.projectSpec.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(
      specs.map((spec) => ({
        id: spec.id,
        projectId: spec.projectId,
        createdAt: spec.createdAt.toISOString(),
        filename: `spec-${spec.id.slice(0, 8)}.md`,
      }))
    );
  } catch (error) {
    console.error("Failed to query project specs:", error);
    return Response.json([]);
  }
}
