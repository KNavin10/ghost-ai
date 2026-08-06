import { put } from "@vercel/blob";
import {
  getAccessibleProject,
  getCurrentClerkIdentity,
} from "@/lib/project-access";

export const dynamic = "force-dynamic";

type CanvasRouteContext = {
  params: Promise<{ projectId: string }>;
};

type SaveCanvasBody = {
  edges?: unknown[];
  nodes?: unknown[];
};

export async function PUT(request: Request, context: CanvasRouteContext) {
  const identityPromise = getCurrentClerkIdentity();
  const bodyPromise = request.json().catch(() => null) as Promise<SaveCanvasBody | null>;
  const paramsPromise = context.params;

  const [identity, body, { projectId }] = await Promise.all([
    identityPromise,
    bodyPromise,
    paramsPromise,
  ]);

  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!body || !Array.isArray(body.nodes) || !Array.isArray(body.edges)) {
    return Response.json({ error: "Invalid canvas payload" }, { status: 400 });
  }

  const project = await getAccessibleProject(projectId, identity);

  if (!project) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const blobPath = `canvas/projects/${projectId}.json`;
    const canvasData = {
      edges: body.edges,
      nodes: body.nodes,
      updatedAt: new Date().toISOString(),
    };

    const blob = await put(blobPath, JSON.stringify(canvasData, null, 2), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });

    const { prisma } = await import("@/lib/prisma");
    await prisma.project.update({
      where: { id: projectId },
      data: { canvasJsonPath: blob.url },
    });

    return Response.json({ success: true, url: blob.url });
  } catch (error) {
    console.error("Failed to save canvas to Vercel Blob:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save canvas state",
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: Request, context: CanvasRouteContext) {
  const identityPromise = getCurrentClerkIdentity();
  const { projectId } = await context.params;
  const identity = await identityPromise;

  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await getAccessibleProject(projectId, identity);

  if (!project) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { prisma } = await import("@/lib/prisma");
  const projectRecord = await prisma.project.findUnique({
    where: { id: projectId },
    select: { canvasJsonPath: true },
  });

  if (!projectRecord?.canvasJsonPath) {
    return Response.json({ edges: [], nodes: [] });
  }

  try {
    const res = await fetch(projectRecord.canvasJsonPath, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });

    if (!res.ok) {
      return Response.json({ edges: [], nodes: [] });
    }

    const data = await res.json();
    return Response.json({
      edges: Array.isArray(data.edges) ? data.edges : [],
      nodes: Array.isArray(data.nodes) ? data.nodes : [],
    });
  } catch (error) {
    console.error("Failed to fetch canvas state from Vercel Blob:", error);
    return Response.json({ edges: [], nodes: [] });
  }
}
