import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

type ProjectRouteContext = {
  params: Promise<{ projectId: string }>;
};

type RenameProjectBody = {
  name?: unknown;
};

async function getOwnedProject(projectId: string, ownerId: string) {
  const { prisma } = await import("@/lib/prisma");
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return { response: Response.json({ error: "Project not found" }, { status: 404 }) };
  }

  if (project.ownerId !== ownerId) {
    return { response: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { project };
}

export async function PATCH(request: Request, context: ProjectRouteContext) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RenameProjectBody;

  try {
    body = (await request.json()) as RenameProjectBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.name !== "string") {
    return Response.json({ error: "Project name must be a string" }, { status: 400 });
  }

  const { projectId } = await context.params;
  const ownedProject = await getOwnedProject(projectId, userId);

  if ("response" in ownedProject) {
    return ownedProject.response;
  }

  const { prisma } = await import("@/lib/prisma");
  const project = await prisma.project.update({
    where: { id: ownedProject.project.id },
    data: { name: body.name },
  });

  return Response.json(project);
}

export async function DELETE(_request: Request, context: ProjectRouteContext) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await context.params;
  const ownedProject = await getOwnedProject(projectId, userId);

  if ("response" in ownedProject) {
    return ownedProject.response;
  }

  const { prisma } = await import("@/lib/prisma");
  await prisma.project.delete({
    where: { id: ownedProject.project.id },
  });

  return new Response(null, { status: 204 });
}
