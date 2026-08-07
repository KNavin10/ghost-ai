import { getAccessibleProject, getCurrentClerkIdentity } from "@/lib/project-access";
import type { generateSpecTask } from "@/src/trigger/generate-spec";

export const dynamic = "force-dynamic";

const MAX_RESOURCE_ID_LENGTH = 128;

type SpecRequestBody = {
  chatHistory?: unknown;
  edges?: unknown;
  nodes?: unknown;
  roomId?: unknown;
};

function isValidResourceId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_RESOURCE_ID_LENGTH
  );
}

export async function POST(request: Request) {
  const identity = await getCurrentClerkIdentity();

  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SpecRequestBody;

  try {
    body = (await request.json()) as SpecRequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isValidResourceId(body.roomId)) {
    return Response.json(
      { error: "Room ID must be a non-empty string" },
      { status: 400 },
    );
  }

  const project = await getAccessibleProject(body.roomId, identity);

  if (!project) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [{ tasks }, { prisma }] = await Promise.all([
      import("@trigger.dev/sdk"),
      import("@/lib/prisma"),
    ]);

    const handle = await tasks.trigger<typeof generateSpecTask>("generate-spec", {
      chatHistory: Array.isArray(body.chatHistory) ? body.chatHistory : [],
      edges: Array.isArray(body.edges) ? body.edges : [],
      nodes: Array.isArray(body.nodes) ? body.nodes : [],
      projectId: project.id,
      roomId: body.roomId,
    });

    await prisma.taskRun.create({
      data: {
        projectId: project.id,
        runId: handle.id,
        userId: identity.userId,
      },
    });

    return Response.json(
      { runId: handle.id },
      { status: 202 },
    );
  } catch (error) {
    console.error("Failed to trigger spec generation task", error);

    return Response.json(
      { error: "Failed to trigger spec generation" },
      { status: 500 },
    );
  }
}
