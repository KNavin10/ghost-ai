import {
  getAccessibleProject,
  getCurrentClerkIdentity,
} from "@/lib/project-access";

export const dynamic = "force-dynamic";

type SpecDownloadRouteContext = {
  params: Promise<{
    projectId: string;
    specId: string;
  }>;
};

export async function GET(_request: Request, context: SpecDownloadRouteContext) {
  const identityPromise = getCurrentClerkIdentity();
  const paramsPromise = context.params;

  const [identity, { projectId, specId }] = await Promise.all([
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

  const { prisma } = await import("@/lib/prisma");

  const specRecord = await prisma.projectSpec.findUnique({
    where: { id: specId },
  });

  if (!specRecord || specRecord.projectId !== projectId) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }

  try {
    const res = await fetch(specRecord.filePath, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });

    if (!res.ok) {
      return Response.json({ error: "File not found" }, { status: 404 });
    }

    const content = await res.text();

    return new Response(content, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="spec-${specId}.md"`,
        "Content-Type": "text/markdown; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Failed to download spec content from Vercel Blob:", error);
    return Response.json(
      { error: "Failed to download spec file" },
      { status: 500 },
    );
  }
}
