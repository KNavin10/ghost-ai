import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

const DEFAULT_PROJECT_NAME = "Untitled Project";

type CreateProjectBody = {
  id?: unknown;
  name?: unknown;
};

export async function GET() {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prisma } = await import("@/lib/prisma");
  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
  });

  return Response.json(projects);
}

export async function POST(request: Request) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CreateProjectBody;

  try {
    body = (await request.json()) as CreateProjectBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.name !== undefined && typeof body.name !== "string") {
    return Response.json({ error: "Project name must be a string" }, { status: 400 });
  }

  if (
    body.id !== undefined &&
    (typeof body.id !== "string" || body.id.length === 0 || body.id.length > 128)
  ) {
    return Response.json({ error: "Project ID must be a non-empty string" }, { status: 400 });
  }

  const { prisma } = await import("@/lib/prisma");
  const project = await prisma.project.create({
    data: {
      id: body.id,
      ownerId: userId,
      name: body.name ?? DEFAULT_PROJECT_NAME,
    },
  });

  return Response.json(project, { status: 201 });
}
