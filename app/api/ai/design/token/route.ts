import { getCurrentClerkIdentity } from "@/lib/project-access";

export const dynamic = "force-dynamic";

const MAX_RUN_ID_LENGTH = 128;

type DesignTokenRequestBody = {
  runId?: unknown;
};

export async function POST(request: Request) {
  const identity = await getCurrentClerkIdentity();

  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: DesignTokenRequestBody;

  try {
    body = (await request.json()) as DesignTokenRequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    typeof body.runId !== "string" ||
    body.runId.length === 0 ||
    body.runId.length > MAX_RUN_ID_LENGTH
  ) {
    return Response.json(
      { error: "Run ID must be a non-empty string" },
      { status: 400 },
    );
  }

  const { prisma } = await import("@/lib/prisma");
  const taskRun = await prisma.taskRun.findFirst({
    where: {
      runId: body.runId,
      userId: identity.userId,
    },
    select: { runId: true },
  });

  if (!taskRun) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { auth } = await import("@trigger.dev/sdk");
    const token = await auth.createPublicToken({
      expirationTime: "15m",
      scopes: {
        read: { runs: [taskRun.runId] },
      },
    });

    return Response.json({ token });
  } catch (error) {
    console.error("Failed to create a Trigger.dev run token", error);

    return Response.json(
      { error: "Failed to create run token" },
      { status: 500 },
    );
  }
}
