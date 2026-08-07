import { z } from "zod"

const AI_CHAT_FEED_ID = "ai-chat"
const AI_STATUS_FEED_ID = "ai-status-feed"
const AI_CHAT_SENDER_ID = "ghost-ai-design-agent"
const AI_CHAT_SENDER_NAME = "Ghost AI"

const chatMessageRoleSchema = z.enum(["assistant", "user"])

const chatMessageSchema = z.object({
  sender: z.object({
    id: z.string().trim().min(1).max(128),
    name: z.string().trim().min(1).max(100),
  }),
  role: chatMessageRoleSchema,
  content: z.string().trim().min(1).max(2_000),
  timestamp: z.iso.datetime(),
})

const taskStatusStageSchema = z.enum([
  "start",
  "processing",
  "complete",
  "error",
])

const taskStatusMessageSchema = z.object({
  runId: z.string().trim().min(1).max(128),
  stage: taskStatusStageSchema,
  text: z.string().trim().min(1).max(500).optional(),
})

const designStartResponseSchema = z.object({
  publicToken: z.string().trim().min(1),
  runId: z.string().trim().min(1),
})

const designStartErrorSchema = z.object({
  error: z.string().optional(),
})

const runPollResponseSchema = z.object({
  id: z.string().trim().min(1),
  status: z.string().trim().min(1),
  finishedAt: z.string().nullable().optional(),
  output: z.object({ summary: z.string().optional() }).nullable().optional(),
  error: z.object({ message: z.string().optional() }).nullable().optional(),
})

type ChatMessage = z.infer<typeof chatMessageSchema>
type ChatMessageRole = z.infer<typeof chatMessageRoleSchema>
type TaskStatusMessage = z.infer<typeof taskStatusMessageSchema>
type TaskStatusStage = z.infer<typeof taskStatusStageSchema>
type DesignStartResponse = z.infer<typeof designStartResponseSchema>
type RunPollResponse = z.infer<typeof runPollResponseSchema>
type FeedMessageData = ChatMessage | TaskStatusMessage

function isTaskStatusActive(stage: TaskStatusStage) {
  return stage === "start" || stage === "processing"
}

export {
  AI_CHAT_FEED_ID,
  AI_CHAT_SENDER_ID,
  AI_CHAT_SENDER_NAME,
  AI_STATUS_FEED_ID,
  chatMessageRoleSchema,
  chatMessageSchema,
  designStartErrorSchema,
  designStartResponseSchema,
  isTaskStatusActive,
  runPollResponseSchema,
  taskStatusMessageSchema,
  taskStatusStageSchema,
}
export type {
  ChatMessage,
  ChatMessageRole,
  DesignStartResponse,
  FeedMessageData,
  RunPollResponse,
  TaskStatusMessage,
  TaskStatusStage,
}
