import {
  createGoogle,
  type GoogleLanguageModelOptions,
} from "@ai-sdk/google";
import { Liveblocks } from "@liveblocks/node";
import { mutateFlow } from "@liveblocks/react-flow/node";
import { logger, metadata, task } from "@trigger.dev/sdk";
import { Output, generateText } from "ai";
import { z } from "zod";

import { ensureAiFeeds } from "@/lib/ai-status-feed";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";
import { AI_CHAT_FEED_ID, AI_STATUS_FEED_ID } from "@/types/tasks";
import type { TaskStatusMessage, TaskStatusStage } from "@/types/tasks";

export type DesignAgentPayload = {
  prompt: string;
  roomId: string;
};

const AI_USER_ID = "ghost-ai-design-agent";
const AI_USER_INFO = {
  name: "Ghost AI",
  avatar: "",
  color: "#A78BFA",
} as const;
const AI_PRESENCE_TTL_SECONDS = 120;
const GRID_SIZE = 24;
const MIN_NODE_WIDTH = 96;
const MAX_NODE_WIDTH = 360;
const MIN_NODE_HEIGHT = 64;
const MAX_NODE_HEIGHT = 240;
const MAX_ACTIONS = 80;
const DEFAULT_MODEL = "gemini-3.5-flash";

const SHAPE_DIMENSIONS = {
  rectangle: { width: 176, height: 96 },
  diamond: { width: 144, height: 144 },
  circle: { width: 112, height: 112 },
  pill: { width: 176, height: 72 },
  cylinder: { width: 152, height: 112 },
  hexagon: { width: 160, height: 112 },
} as const;

const COLOR_PALETTE = {
  neutral: {
    color: "var(--card)",
    textColor: "var(--foreground)",
  },
  blue: {
    color: "var(--node-blue)",
    textColor: "var(--node-blue-foreground)",
  },
  cyan: {
    color: "var(--node-cyan)",
    textColor: "var(--node-cyan-foreground)",
  },
  teal: {
    color: "var(--node-teal)",
    textColor: "var(--node-teal-foreground)",
  },
  green: {
    color: "var(--node-green)",
    textColor: "var(--node-green-foreground)",
  },
  lime: {
    color: "var(--node-lime)",
    textColor: "var(--node-lime-foreground)",
  },
  yellow: {
    color: "var(--node-yellow)",
    textColor: "var(--node-yellow-foreground)",
  },
  amber: {
    color: "var(--node-amber)",
    textColor: "var(--node-amber-foreground)",
  },
  orange: {
    color: "var(--node-orange)",
    textColor: "var(--node-orange-foreground)",
  },
  red: {
    color: "var(--node-red)",
    textColor: "var(--node-red-foreground)",
  },
  rose: {
    color: "var(--node-rose)",
    textColor: "var(--node-rose-foreground)",
  },
  violet: {
    color: "var(--node-violet)",
    textColor: "var(--node-violet-foreground)",
  },
} as const;

const shapeSchema = z.enum([
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
]);
const colorSchema = z.enum([
  "neutral",
  "blue",
  "cyan",
  "teal",
  "green",
  "lime",
  "yellow",
  "amber",
  "orange",
  "red",
  "rose",
  "violet",
]);
const handleSchema = z.enum(["top", "right", "bottom", "left"]);

const addNodeActionSchema = z.object({
  type: z.literal("addNode"),
  nodeId: z.string().min(1).max(80),
  label: z.string().max(160),
  shape: shapeSchema,
  color: colorSchema,
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().finite().positive().optional(),
  height: z.number().finite().positive().optional(),
});

const moveNodeActionSchema = z.object({
  type: z.literal("moveNode"),
  nodeId: z.string().min(1).max(80),
  x: z.number().finite(),
  y: z.number().finite(),
});

const resizeNodeActionSchema = z.object({
  type: z.literal("resizeNode"),
  nodeId: z.string().min(1).max(80),
  width: z.number().finite().positive(),
  height: z.number().finite().positive(),
});

const updateNodeDataActionSchema = z.object({
  type: z.literal("updateNodeData"),
  nodeId: z.string().min(1).max(80),
  label: z.string().max(160).optional(),
  shape: shapeSchema.optional(),
  color: colorSchema.optional(),
});

const deleteNodeActionSchema = z.object({
  type: z.literal("deleteNode"),
  nodeId: z.string().min(1).max(80),
});

const addEdgeActionSchema = z.object({
  type: z.literal("addEdge"),
  edgeId: z.string().min(1).max(80),
  source: z.string().min(1).max(80),
  target: z.string().min(1).max(80),
  sourceHandle: handleSchema.optional(),
  targetHandle: handleSchema.optional(),
  label: z.string().max(160).optional(),
});

const deleteEdgeActionSchema = z.object({
  type: z.literal("deleteEdge"),
  edgeId: z.string().min(1).max(80),
});

const designActionSchema = z.discriminatedUnion("type", [
  addNodeActionSchema,
  moveNodeActionSchema,
  resizeNodeActionSchema,
  updateNodeDataActionSchema,
  deleteNodeActionSchema,
  addEdgeActionSchema,
  deleteEdgeActionSchema,
]);

const designPlanSchema = z.object({
  summary: z.string().min(1).max(240),
  actions: z.array(designActionSchema).max(MAX_ACTIONS),
});

// Gemini's responseSchema supports a smaller OpenAPI subset than the local
// action contract. Keep the provider schema flat and validate each action
// against the discriminated union after the model response is returned.
const modelDesignActionSchema = z.looseObject({
  type: z.string().optional(),
  action: z.string().optional(),
  nodeId: z.string().optional(),
  edgeId: z.string().optional(),
  label: z.string().optional(),
  shape: z.string().optional(),
  color: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  source: z.string().optional(),
  target: z.string().optional(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
});

const modelDesignPlanSchema = z.object({
  summary: z.string(),
  actions: z.array(modelDesignActionSchema).max(MAX_ACTIONS),
});

type DesignAction = z.infer<typeof designActionSchema>;
type DesignPlan = z.infer<typeof designPlanSchema>;
type CanvasSnapshot = {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
};
type DesignAgentRoomEvent = {
  type: "design-agent-status";
  runId: string;
  stage: TaskStatusStage;
  message: string;
  timestamp: string;
};

function getLiveblocksClient() {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;

  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY is not configured.");
  }

  return new Liveblocks({ secret });
}

function getGoogleModel() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY is not configured.");
  }

  return createGoogle({ apiKey })(DEFAULT_MODEL);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function snapToGrid(value: number) {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

function normalizeId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function uniqueId(requestedId: string, fallback: string, usedIds: Set<string>) {
  const baseId = normalizeId(requestedId) || fallback;
  let candidate = baseId;
  let suffix = 2;

  while (usedIds.has(candidate)) {
    candidate = `${baseId}-${suffix}`;
    suffix += 1;
  }

  usedIds.add(candidate);
  return candidate;
}

function toCanvasSnapshot(value: unknown): CanvasSnapshot {
  if (!value || typeof value !== "object") {
    return { nodes: [], edges: [] };
  }

  const flow = (value as { flow?: unknown }).flow;

  if (!flow || typeof flow !== "object") {
    return { nodes: [], edges: [] };
  }

  const candidate = flow as { nodes?: unknown; edges?: unknown };
  const nodes = candidate.nodes;
  const edges = candidate.edges;

  return {
    nodes:
      nodes && typeof nodes === "object"
        ? (Object.values(nodes) as CanvasNode[])
        : [],
    edges:
      edges && typeof edges === "object"
        ? (Object.values(edges) as CanvasEdge[])
        : [],
  };
}

function serializeSnapshot(snapshot: CanvasSnapshot) {
  return JSON.stringify(
    {
      nodes: snapshot.nodes.map((node) => ({
        id: node.id,
        label: node.data.label,
        shape: node.data.shape,
        color: node.data.color,
        position: node.position,
        width: node.width,
        height: node.height,
      })),
      edges: snapshot.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        label: edge.data?.label ?? "",
      })),
    },
    null,
    2,
  );
}

function buildInstructions(snapshot: CanvasSnapshot) {
  return `You are Ghost AI, a careful collaborative architecture-diagram designer.
Interpret the user's request as a sequence of canvas edits. Return only the structured design plan.

Canvas rules:
- Supported shapes: rectangle, diamond, circle, pill, cylinder, hexagon.
- Supported colors: neutral, blue, cyan, teal, green, lime, yellow, amber, orange, red, rose, violet.
- Use a 24px grid. Prefer left-to-right layouts with 72px or more between node bounds and 120-240px between logical columns.
- Keep labels concise. Use rectangle for services/components, diamond for decisions, pill for people/start/end, cylinder for data stores, and hexagon for gateways/brokers/infrastructure when appropriate.
- Add edges only when both endpoint IDs exist now or are added earlier in this plan.
- Use top/right/bottom/left handles. Prefer right-to-left for horizontal links and bottom-to-top for vertical links.
- Preserve useful existing work unless the user explicitly asks to replace or delete it.
- Existing node and edge IDs must be copied exactly when modifying or deleting them.
- New IDs must be short, semantic, unique, and contain only letters, numbers, hyphens, or underscores.
- When creating a fresh design, place it near x=0, y=0. When extending a design, avoid overlap with existing nodes.
- Keep the plan at or below ${MAX_ACTIONS} actions.

Current canvas:
${serializeSnapshot(snapshot)}`;
}

function normalizeGeneratedShape(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const normalizedValue = value.toLowerCase();

  if (normalizedValue === "ellipse" || normalizedValue === "oval") {
    return "circle";
  }

  if (
    normalizedValue === "database" ||
    normalizedValue === "datastore" ||
    normalizedValue === "db" ||
    normalizedValue === "storage"
  ) {
    return "cylinder";
  }

  const parsedShape = shapeSchema.safeParse(normalizedValue);
  return parsedShape.success ? parsedShape.data : "rectangle";
}

function normalizeGeneratedColor(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const paletteColor = colorSchema.safeParse(value.toLowerCase());

  if (paletteColor.success) {
    return paletteColor.data;
  }

  const normalizedHex = value.toLowerCase();
  const hexAliases: Record<string, z.infer<typeof colorSchema>> = {
    "#2196f3": "blue",
    "#00bcd4": "cyan",
    "#009688": "teal",
    "#4caf50": "green",
    "#8bc34a": "lime",
    "#ffeb3b": "yellow",
    "#ffc107": "amber",
    "#ff9800": "orange",
    "#f44336": "red",
    "#e91e63": "rose",
    "#9c27b0": "violet",
  };

  return hexAliases[normalizedHex] ?? "neutral";
}

function flattenGeneratedAction(
  candidate: Record<string, unknown>,
): Record<string, unknown> {
  const flat: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(candidate)) {
    if (key === "node" || key === "edge") {
      continue;
    }
    flat[key] = value;
  }

  const node = candidate.node;

  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      if (value === undefined) {
        continue;
      }

      if (key === "id") {
        if (flat.nodeId === undefined) {
          flat.nodeId = value;
        }
      } else if (key === "type") {
        // Inside a "node" object the model calls the shape "type".
        if (flat.shape === undefined) {
          flat.shape = value;
        }
      } else if (flat[key] === undefined) {
        flat[key] = value;
      }
    }
  }

  const edge = candidate.edge;

  if (edge && typeof edge === "object") {
    for (const [key, value] of Object.entries(edge)) {
      if (value === undefined) {
        continue;
      }

      if (key === "id") {
        if (flat.edgeId === undefined) {
          flat.edgeId = value;
        }
      } else if (flat[key] === undefined) {
        flat[key] = value;
      }
    }
  }

  return flat;
}

function parseGeneratedPlan(value: unknown): DesignPlan {
  const providerPlan = modelDesignPlanSchema.parse(value);
  const actions: DesignAction[] = [];

  for (const [index, candidate] of providerPlan.actions.entries()) {
    const flattened = flattenGeneratedAction(
      candidate as Record<string, unknown>,
    );
    const normalizedCandidate = {
      ...flattened,
      type: flattened.type ?? flattened.action,
      shape: normalizeGeneratedShape(flattened.shape as string | undefined),
      color: normalizeGeneratedColor(flattened.color as string | undefined),
      sourceHandle: handleSchema.safeParse(flattened.sourceHandle).success
        ? (flattened.sourceHandle as string)
        : undefined,
      targetHandle: handleSchema.safeParse(flattened.targetHandle).success
        ? (flattened.targetHandle as string)
        : undefined,
    };
    const parsedAction = designActionSchema.safeParse(normalizedCandidate);

    if (!parsedAction.success) {
      logger.warn("Skipping an invalid generated canvas action", {
        actionIndex: index,
        rawAction: flattened,
        issues: parsedAction.error.issues,
      });
      continue;
    }

    actions.push(parsedAction.data);
  }

  return designPlanSchema.parse({
    actions,
    summary: providerPlan.summary.trim() || "Applied the requested canvas changes.",
  });
}

async function generateDesignPlan(
  liveblocks: Liveblocks,
  roomId: string,
  runId: string,
  prompt: string,
  snapshot: CanvasSnapshot,
): Promise<DesignPlan> {
  const maxPlanAttempts = 3;
  let previousError = "";

  for (let attempt = 1; attempt <= maxPlanAttempts; attempt += 1) {
    const retryInstructions = previousError
      ? `\n\nThe previous response was rejected: ${previousError}\nReturn corrected JSON only. Do not use Markdown fences or explanatory text.`
      : "";

    try {
      const result = await generateText({
        model: getGoogleModel(),
        output: Output.object({
          schema: modelDesignPlanSchema,
          name: "canvas_design_plan",
          description:
            "A flat JSON plan containing canvas actions with exact action type names.",
        }),
        providerOptions: {
          google: {
            structuredOutputs: false,
          } satisfies GoogleLanguageModelOptions,
        },
        system: `${buildInstructions(snapshot)}\n\nOutput contract:\n- Return one JSON object only.\n- The object must contain a non-empty string summary and an actions array.\n- Each action must be a flat object with an exact type from: addNode, moveNode, resizeNode, updateNodeData, deleteNode, addEdge, deleteEdge.\n- Do NOT nest fields under a "node" or "edge" object. Put every field directly on the action object.\n- For addNode the action must have: nodeId, label, shape, color, x, y (width and height are optional).\n- For addEdge the action must have: edgeId, source, target (sourceHandle, targetHandle, and label are optional).\n- Example: {"type":"addNode","nodeId":"gateway","label":"API Gateway","shape":"hexagon","color":"cyan","x":0,"y":0,"width":160,"height":112}\n- Do not return null values, Markdown, or commentary.${retryInstructions}`,
        prompt,
        temperature: attempt === 1 ? 0.2 : 0,
        maxOutputTokens: 4_096,
        maxRetries: 2,
      });

      const generatedPlan = parseGeneratedPlan(result.output);
      const providerActionCount = result.output?.actions?.length ?? 0;

      if (providerActionCount > 0 && generatedPlan.actions.length === 0) {
        previousError =
          "The response contained actions, but none passed validation. Return flat action objects only, e.g. {\"type\":\"addNode\",\"nodeId\":\"gateway\",\"label\":\"API Gateway\",\"shape\":\"hexagon\",\"color\":\"cyan\",\"x\":0,\"y\":0,\"width\":160,\"height\":112}. Do not nest fields under a node or edge object.";

        logger.warn(
          "All generated canvas actions were invalid; retrying the plan",
          { attempt, providerActionCount },
        );

        if (attempt < maxPlanAttempts) {
          const retryMsg = `Attempt ${attempt}/${maxPlanAttempts} failed: Canvas actions were invalid. Retrying...`;
          try {
            await publishStatus(liveblocks, roomId, runId, "processing", retryMsg);
            await publishChatMessage(liveblocks, roomId, retryMsg);
          } catch (pubErr) {
            logger.error("Failed to publish retry status message", { error: errorMessage(pubErr) });
          }
          continue;
        }
      }

      return generatedPlan;
    } catch (error) {
      const rawMsg = error instanceof Error ? error.message : String(error);
      const isQuotaError = /quota|free tier|rate limit|429|resource_exhausted/i.test(rawMsg);
      const detail = isQuotaError
        ? "Gemini API quota/rate limit exceeded"
        : rawMsg.slice(0, 200);

      previousError = detail;

      logger.warn("Gemini returned an invalid design plan; retrying", {
        attempt,
        error: rawMsg,
      });

      if (attempt < maxPlanAttempts) {
        const retryMsg = `Attempt ${attempt}/${maxPlanAttempts} failed: ${detail}. Retrying...`;
        try {
          await publishStatus(liveblocks, roomId, runId, "processing", retryMsg);
          await publishChatMessage(liveblocks, roomId, retryMsg);
        } catch (pubErr) {
          logger.error("Failed to publish retry status message", { error: errorMessage(pubErr) });
        }
        continue;
      }

      const finalFailMsg = isQuotaError
        ? "Gemini API quota or free tier limit exceeded. Please wait a moment and try again."
        : `Gemini did not return a valid design plan after ${maxPlanAttempts} attempts: ${detail}`;

      throw new Error(finalFailMsg, { cause: error });
    }
  }

  throw new Error("Gemini did not return a valid design plan.");
}

function normalizePlan(plan: DesignPlan, snapshot: CanvasSnapshot): DesignPlan {
  const usedNodeIds = new Set(snapshot.nodes.map((node) => node.id));
  const availableNodeIds = new Set(usedNodeIds);
  const usedEdgeIds = new Set(snapshot.edges.map((edge) => edge.id));
  const nodeIdAliases = new Map<string, string>();
  const edgeIdAliases = new Map<string, string>();
  const actions: DesignAction[] = [];

  for (const action of plan.actions) {
    switch (action.type) {
      case "addNode": {
        const nodeId = uniqueId(
          action.nodeId,
          `ai-node-${usedNodeIds.size + 1}`,
          usedNodeIds,
        );
        nodeIdAliases.set(action.nodeId, nodeId);
        availableNodeIds.add(nodeId);
        actions.push({ ...action, nodeId });
        break;
      }
      case "moveNode":
      case "resizeNode":
      case "updateNodeData":
      case "deleteNode": {
        const nodeId = nodeIdAliases.get(action.nodeId) ?? action.nodeId;

        if (!availableNodeIds.has(nodeId)) {
          logger.warn("Skipping action for an unknown node", {
            actionType: action.type,
            nodeId,
          });
          break;
        }

        actions.push({ ...action, nodeId });

        if (action.type === "deleteNode") {
          availableNodeIds.delete(nodeId);
        }
        break;
      }
      case "addEdge": {
        const source = nodeIdAliases.get(action.source) ?? action.source;
        const target = nodeIdAliases.get(action.target) ?? action.target;

        if (!availableNodeIds.has(source) || !availableNodeIds.has(target)) {
          logger.warn("Skipping edge with an unknown endpoint", {
            edgeId: action.edgeId,
            source,
            target,
          });
          break;
        }

        const edgeId = uniqueId(
          action.edgeId,
          `ai-edge-${usedEdgeIds.size + 1}`,
          usedEdgeIds,
        );
        edgeIdAliases.set(action.edgeId, edgeId);
        actions.push({ ...action, edgeId, source, target });
        break;
      }
      case "deleteEdge": {
        const edgeId = edgeIdAliases.get(action.edgeId) ?? action.edgeId;

        if (!usedEdgeIds.has(edgeId)) {
          logger.warn("Skipping delete for an unknown edge", { edgeId });
          break;
        }

        actions.push({ ...action, edgeId });
        usedEdgeIds.delete(edgeId);
        break;
      }
    }
  }

  return { ...plan, actions };
}

function createCanvasNode(
  action: z.infer<typeof addNodeActionSchema>,
): CanvasNode {
  const defaults = SHAPE_DIMENSIONS[action.shape];
  const colorPair = COLOR_PALETTE[action.color];

  return {
    id: action.nodeId,
    type: "canvasNode",
    position: {
      x: snapToGrid(action.x),
      y: snapToGrid(action.y),
    },
    width: clamp(
      snapToGrid(action.width ?? defaults.width),
      MIN_NODE_WIDTH,
      MAX_NODE_WIDTH,
    ),
    height: clamp(
      snapToGrid(action.height ?? defaults.height),
      MIN_NODE_HEIGHT,
      MAX_NODE_HEIGHT,
    ),
    data: {
      label: action.label.trim(),
      color: colorPair.color,
      shape: action.shape,
      textColor: colorPair.textColor,
    },
  };
}

function createCanvasEdge(
  action: z.infer<typeof addEdgeActionSchema>,
): CanvasEdge {
  return {
    id: action.edgeId,
    type: "canvasEdge",
    source: action.source,
    target: action.target,
    sourceHandle: action.sourceHandle ?? "right",
    targetHandle: action.targetHandle ?? "left",
    data: { label: action.label?.trim() ?? "" },
  };
}

function applyAction(
  flow: Parameters<Parameters<typeof mutateFlow<CanvasNode, CanvasEdge>>[1]>[0],
  action: DesignAction,
) {
  switch (action.type) {
    case "addNode":
      flow.addNode(createCanvasNode(action));
      break;
    case "moveNode":
      flow.updateNode(action.nodeId, (node) => ({
        ...node,
        position: {
          x: snapToGrid(action.x),
          y: snapToGrid(action.y),
        },
      }));
      break;
    case "resizeNode":
      flow.updateNode(action.nodeId, (node) => ({
        ...node,
        width: clamp(
          snapToGrid(action.width),
          MIN_NODE_WIDTH,
          MAX_NODE_WIDTH,
        ),
        height: clamp(
          snapToGrid(action.height),
          MIN_NODE_HEIGHT,
          MAX_NODE_HEIGHT,
        ),
      }));
      break;
    case "updateNodeData":
      flow.updateNodeData(action.nodeId, (data) => {
        const colorPair = action.color
          ? COLOR_PALETTE[action.color]
          : undefined;

        return {
          ...data,
          ...(action.label === undefined
            ? {}
            : { label: action.label.trim() }),
          ...(action.shape === undefined ? {} : { shape: action.shape }),
          ...(colorPair
            ? { color: colorPair.color, textColor: colorPair.textColor }
            : {}),
        };
      });
      break;
    case "deleteNode": {
      const connectedEdgeIds = flow.edges
        .filter(
          (edge) =>
            edge.source === action.nodeId || edge.target === action.nodeId,
        )
        .map((edge) => edge.id);

      if (connectedEdgeIds.length > 0) {
        flow.removeEdges(connectedEdgeIds);
      }
      flow.removeNode(action.nodeId);
      break;
    }
    case "addEdge":
      flow.addEdge(createCanvasEdge(action));
      break;
    case "deleteEdge":
      flow.removeEdge(action.edgeId);
      break;
  }
}

function getActionMessage(action: DesignAction, index: number, total: number) {
  const prefix = `Applying change ${index + 1} of ${total}`;

  switch (action.type) {
    case "addNode":
      return `${prefix}: adding ${action.label || action.nodeId}.`;
    case "moveNode":
      return `${prefix}: moving ${action.nodeId}.`;
    case "resizeNode":
      return `${prefix}: resizing ${action.nodeId}.`;
    case "updateNodeData":
      return `${prefix}: updating ${action.nodeId}.`;
    case "deleteNode":
      return `${prefix}: deleting ${action.nodeId}.`;
    case "addEdge":
      return `${prefix}: connecting ${action.source} to ${action.target}.`;
    case "deleteEdge":
      return `${prefix}: deleting ${action.edgeId}.`;
  }
}

async function publishStatus(
  liveblocks: Liveblocks,
  roomId: string,
  runId: string,
  stage: TaskStatusStage,
  message: string,
) {
  const event: DesignAgentRoomEvent = {
    type: "design-agent-status",
    runId,
    stage,
    message,
    timestamp: new Date().toISOString(),
  };
  const feedMessage: TaskStatusMessage = {
    runId,
    stage,
    text: message,
  };

  metadata.set("stage", stage);
  metadata.set("statusMessage", message);
  await Promise.all([
    liveblocks.broadcastEvent(roomId, event),
    liveblocks.createFeedMessage({
      data: feedMessage,
      feedId: AI_STATUS_FEED_ID,
      roomId,
    }),
  ]);
}

async function publishChatMessage(
  liveblocks: Liveblocks,
  roomId: string,
  content: string,
) {
  try {
    await liveblocks.createFeedMessage({
      feedId: AI_CHAT_FEED_ID,
      roomId,
      data: {
        content: content.slice(0, 2_000),
        role: "assistant",
        sender: { id: AI_USER_ID, name: AI_USER_INFO.name },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Failed to publish AI chat message to Liveblocks feed", {
      error: errorMessage(error),
      roomId,
    });
  }
}

async function setAiPresence(
  liveblocks: Liveblocks,
  roomId: string,
  thinking: boolean,
  cursor: { x: number; y: number } | null,
  ttl = AI_PRESENCE_TTL_SECONDS,
) {
  await liveblocks.setPresence(roomId, {
    userId: AI_USER_ID,
    userInfo: AI_USER_INFO,
    data: { cursor, thinking },
    ttl,
  });
}

async function updatePresenceForAction(
  liveblocks: Liveblocks,
  roomId: string,
  action: DesignAction,
  snapshot: CanvasSnapshot,
) {
  let cursor: { x: number; y: number } | null = null;

  if (action.type === "addNode" || action.type === "moveNode") {
    cursor = { x: action.x, y: action.y };
  } else if ("nodeId" in action) {
    const node = snapshot.nodes.find((candidate) => candidate.id === action.nodeId);

    if (node) {
      cursor = {
        x: node.position.x + (node.width ?? 0) / 2,
        y: node.position.y + (node.height ?? 0) / 2,
      };
    }
  } else if (action.type === "addEdge") {
    const source = snapshot.nodes.find(
      (candidate) => candidate.id === action.source,
    );
    const target = snapshot.nodes.find(
      (candidate) => candidate.id === action.target,
    );

    if (source && target) {
      cursor = {
        x: (source.position.x + target.position.x) / 2,
        y: (source.position.y + target.position.y) / 2,
      };
    }
  }

  await setAiPresence(liveblocks, roomId, true, cursor);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown design agent error";
}

function inProgressSummary(summary: string): string {
  const trimmed = summary.trim();
  return trimmed.replace(/^(Designed|Designs|Design)\b/i, "Designing");
}

export const designAgentTask = task({
  id: "design-agent",
  maxDuration: 300,
  run: async (payload: DesignAgentPayload, { ctx }) => {
    const liveblocks = getLiveblocksClient();
    const runId = ctx.run.id;
    let failure: unknown;

    logger.info("Starting a design generation request", {
      prompt: payload.prompt,
      roomId: payload.roomId,
      runId,
    });

    try {
      metadata.set("progress", 0);
      await ensureAiFeeds(liveblocks, payload.roomId);
      await publishStatus(
        liveblocks,
        payload.roomId,
        runId,
        "start",
        "Ghost AI joined the canvas.",
      );
      await setAiPresence(liveblocks, payload.roomId, true, {
        x: 24,
        y: 24,
      });

      const storage = await liveblocks.getStorageDocument(
        payload.roomId,
        "json",
      );
      const snapshot = toCanvasSnapshot(storage);

      metadata.set("progress", 15);
      await publishStatus(
        liveblocks,
        payload.roomId,
        runId,
        "processing",
        "Understanding the request and planning canvas changes...",
      );

      const generatedPlan = await generateDesignPlan(
        liveblocks,
        payload.roomId,
        runId,
        payload.prompt,
        snapshot,
      );
      const plan = normalizePlan(generatedPlan, snapshot);

      logger.info("Generated a validated design plan", {
        actionCount: plan.actions.length,
        summary: plan.summary,
        roomId: payload.roomId,
        runId,
      });

      metadata.set("actionCount", plan.actions.length);
      metadata.set("summary", plan.summary);
      metadata.set("progress", 35);
      await publishStatus(
        liveblocks,
        payload.roomId,
        runId,
        "processing",
        plan.actions.length > 0
          ? `Plan ready: ${inProgressSummary(plan.summary)}`
          : `No canvas changes needed: ${plan.summary}`,
      );

      for (const [index, action] of plan.actions.entries()) {
        const actionMessage = getActionMessage(
          action,
          index,
          plan.actions.length,
        );

        await updatePresenceForAction(
          liveblocks,
          payload.roomId,
          action,
          snapshot,
        );
        await publishStatus(
          liveblocks,
          payload.roomId,
          runId,
          "processing",
          actionMessage,
        );
        await mutateFlow<CanvasNode, CanvasEdge>(
          { client: liveblocks, roomId: payload.roomId },
          (flow) => applyAction(flow, action),
        );

        metadata.set(
          "progress",
          Math.round(35 + ((index + 1) / plan.actions.length) * 60),
        );
      }

      metadata.set("progress", 100);
      const completionMessage = `Design complete: ${plan.summary}`;
      await publishStatus(
        liveblocks,
        payload.roomId,
        runId,
        "complete",
        completionMessage,
      );
      await publishChatMessage(liveblocks, payload.roomId, completionMessage);

      return {
        actionCount: plan.actions.length,
        roomId: payload.roomId,
        summary: plan.summary,
      };
    } catch (error) {
      failure = error;
      const message = errorMessage(error);

      logger.error("Design generation failed", {
        error: message,
        roomId: payload.roomId,
        runId,
      });
      metadata.set("error", message);

      const errorMessageText = "Ghost AI could not finish the design. The existing canvas is safe.";
      try {
        await publishStatus(
          liveblocks,
          payload.roomId,
          runId,
          "error",
          errorMessageText,
        );
        await publishChatMessage(liveblocks, payload.roomId, errorMessageText);
      } catch (statusError) {
        logger.error("Failed to publish the design error status", {
          error: errorMessage(statusError),
          roomId: payload.roomId,
          runId,
        });
      }

      throw error;
    } finally {
      try {
        await setAiPresence(liveblocks, payload.roomId, false, null, 2);
      } catch (presenceError) {
        logger.error("Failed to clear AI presence", {
          error: errorMessage(presenceError),
          originalError: failure ? errorMessage(failure) : undefined,
          roomId: payload.roomId,
          runId,
        });
      }
    }
  },
});

export { flattenGeneratedAction, parseGeneratedPlan };
