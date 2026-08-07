import { getAccessibleProject, getCurrentClerkIdentity } from "@/lib/project-access";
import type { designAgentTask } from "@/src/trigger/design-agent";

export const dynamic = "force-dynamic";

const MAX_PROMPT_LENGTH = 10_000;
const MAX_RESOURCE_ID_LENGTH = 128;

type DesignRequestBody = {
  prompt?: unknown;
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

  let body: DesignRequestBody;

  try {
    body = (await request.json()) as DesignRequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.prompt !== "string") {
    return Response.json(
      { error: "Prompt must be a string" },
      { status: 400 },
    );
  }

  const prompt = body.prompt.trim();

  if (prompt.length === 0 || prompt.length > MAX_PROMPT_LENGTH) {
    return Response.json(
      { error: "Prompt must contain between 1 and 10000 characters" },
      { status: 400 },
    );
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
    const [{ auth, tasks }, { prisma }] = await Promise.all([
      import("@trigger.dev/sdk"),
      import("@/lib/prisma"),
    ]);
    const handle = await tasks.trigger<typeof designAgentTask>("design-agent", {
      prompt,
      roomId: body.roomId,
    });

    await prisma.taskRun.create({
      data: {
        projectId: project.id,
        runId: handle.id,
        userId: identity.userId,
      },
    });

    const publicToken = await auth.createPublicToken({
      expirationTime: "15m",
      scopes: {
        read: { runs: [handle.id] },
      },
    });

    return Response.json(
      { publicToken, runId: handle.id },
      { status: 202 },
    );
  } catch (error) {
    console.error("Failed to trigger the design agent", error);

    return Response.json(
      { error: "Failed to trigger design generation" },
      { status: 500 },
    );
  }
}
