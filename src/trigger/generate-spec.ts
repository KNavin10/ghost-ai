import { createGoogle } from "@ai-sdk/google";
import { logger, metadata, task } from "@trigger.dev/sdk";
import { put } from "@vercel/blob";
import { generateText } from "ai";
import { z } from "zod";

const DEFAULT_MODEL = "gemini-3.5-flash";

const generateSpecPayloadSchema = z.object({
  projectId: z.string().trim().min(1),
  roomId: z.string().trim().min(1),
  chatHistory: z.array(z.unknown()).optional().default([]),
  nodes: z.array(z.unknown()).optional().default([]),
  edges: z.array(z.unknown()).optional().default([]),
});

export type GenerateSpecPayload = z.infer<typeof generateSpecPayloadSchema>;

function getGoogleModel() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY is not configured.");
  }

  return createGoogle({ apiKey })(DEFAULT_MODEL);
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export const generateSpecTask = task({
  id: "generate-spec",
  retry: {
    maxAttempts: 3,
  },
  run: async (payload: GenerateSpecPayload) => {
    const validatedPayload = generateSpecPayloadSchema.parse(payload);
    const { projectId, roomId, chatHistory, nodes, edges } = validatedPayload;

    logger.info("Starting spec generation task", {
      projectId,
      roomId,
    });

    metadata.set("status", "generating");
    metadata.set("progress", 10);

    try {
      const prompt = `System & Component Context:
- Canvas Nodes: ${JSON.stringify(nodes, null, 2)}
- Canvas Edges: ${JSON.stringify(edges, null, 2)}
- Recent Chat History / Discussion: ${JSON.stringify(chatHistory, null, 2)}

Please generate a comprehensive, professional Technical Specification document in Markdown.
The document should include:
1. Executive Summary & Overview
2. System Architecture & Diagram Components
3. Data Flow, Interfaces & Connections
4. Key Functional & Non-Functional Requirements
5. Operational & Deployment Considerations`;

      metadata.set("progress", 40);

      const result = await generateText({
        model: getGoogleModel(),
        system:
          "You are an expert Principal System Architect. Produce a comprehensive, high quality, plain Markdown Technical Specification based on the provided architecture canvas elements and chat history context. Do not include any HTML tags or JSON wrappers outside of markdown codeblocks. Output clean Markdown only.",
        prompt,
        temperature: 0.2,
        maxOutputTokens: 8_192,
        maxRetries: 2,
      });

      const specContent = result.text.trim();

      metadata.set("progress", 80);
      metadata.set("status", "uploading");

      const specId = crypto.randomUUID();
      const blobPath = `specs/${projectId}/${specId}.md`;

      const blob = await put(blobPath, specContent, {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "text/markdown",
      });

      const { prisma } = await import("@/lib/prisma");
      const projectSpec = await prisma.projectSpec.create({
        data: {
          id: specId,
          projectId,
          filePath: blob.url,
        },
      });

      metadata.set("status", "completed");
      metadata.set("progress", 100);
      metadata.set("summary", "Technical specification generated successfully.");
      metadata.set("specId", projectSpec.id);
      metadata.set("filePath", projectSpec.filePath);

      logger.info("Spec generation task completed", {
        projectId,
        roomId,
        specId: projectSpec.id,
        filePath: projectSpec.filePath,
        contentLength: specContent.length,
      });

      return {
        spec: specContent,
        specId: projectSpec.id,
        filePath: projectSpec.filePath,
      };
    } catch (error) {
      const message = errorMessage(error);

      logger.error("Failed to generate technical specification", {
        error: message,
        projectId,
        roomId,
      });

      metadata.set("status", "error");
      metadata.set("error", message);

      throw error;
    }
  },
});
