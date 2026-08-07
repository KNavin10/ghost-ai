"use client"

import {
  useCreateFeedMessage,
  useFeedMessages,
  useOthersMapped,
  useSelf,
} from "@liveblocks/react"
import { useRealtimeRun } from "@trigger.dev/react-hooks"
import {
  AlertTriangle,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  FileText,
  Loader2,
  Send,
  Sparkles,
  X,
  XCircle,
} from "lucide-react"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react"
import type { designAgentTask } from "@/src/trigger/design-agent"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  AI_CHAT_FEED_ID,
  AI_CHAT_SENDER_ID,
  AI_CHAT_SENDER_NAME,
  AI_STATUS_FEED_ID,
  chatMessageSchema,
  designStartErrorSchema,
  designStartResponseSchema,
  isTaskStatusActive,
  runPollResponseSchema,
  taskStatusMessageSchema,
} from "@/types/tasks"
import type {
  ChatMessage,
  RunPollResponse,
  TaskStatusMessage,
} from "@/types/tasks"

type AiSidebarProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  roomId: string
}

const starterPrompts = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
]

const FAILED_RUN_STATUSES = new Set<string>([
  "CANCELED",
  "CRASHED",
  "EXPIRED",
  "FAILED",
  "SYSTEM_FAILURE",
  "TIMED_OUT",
])

const STATUS_FEED_STALE_MS = 5 * 60 * 1000

const RUN_POLL_INTERVAL_MS = 4_000
const RUN_POLL_MAX_ATTEMPTS = 75
const RUN_POLL_MAX_FAILURES = 4

type ActiveRunState = {
  publicToken: string
  runId: string
}

function AiSidebar({ isOpen, onOpenChange, roomId }: AiSidebarProps) {
  const { isActive, isStatusFresh, status } = useSharedAiStatus()
  const statusActive =
    status !== null && isTaskStatusActive(status.stage) && isStatusFresh

  return (
    <aside
      aria-hidden={!isOpen}
      aria-label="AI sidebar"
      className={cn(
        "absolute inset-y-0 right-0 z-40 flex w-96 max-w-full shrink-0 flex-col border-l border-border bg-background/95 shadow-2xl backdrop-blur-sm transition-transform duration-200 ease-out",
        isOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
      )}
      data-state={isOpen ? "open" : "closed"}
      inert={!isOpen}
    >
      <div className="flex shrink-0 items-start justify-between border-b border-border px-5 py-5">
        <div className="flex min-w-0 items-center gap-3">
          <Bot aria-hidden="true" className="mt-0.5 size-4 text-accent-foreground" />
          <div className="min-w-0">
            <h2 className="font-heading text-sm font-medium text-foreground">
              AI Workspace
            </h2>
            <p className="text-xs text-muted-foreground">
              Chat with room collaborators
            </p>
          </div>
        </div>
        <Button
          aria-label="Close AI sidebar"
          onClick={() => onOpenChange(false)}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <X />
          <span className="sr-only">Close AI sidebar</span>
        </Button>
      </div>

      <Tabs className="min-h-0 flex-1 gap-0" defaultValue="architect">
        <div className="shrink-0 border-b border-border px-5 py-4">
          <TabsList className="m-0 w-full bg-muted/60">
            <TabsTrigger
              className="text-muted-foreground data-active:bg-accent data-active:text-accent-foreground"
              value="architect"
            >
              AI Architect
            </TabsTrigger>
            <TabsTrigger
              className="text-muted-foreground data-active:bg-accent data-active:text-accent-foreground"
              value="specs"
            >
              Specs
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent className="flex min-h-0 flex-1" value="architect">
          <AiArchitectTab
            isAiActive={isActive}
            roomId={roomId}
            status={status}
            statusActive={statusActive}
          />
        </TabsContent>
        <TabsContent className="flex min-h-0 flex-1" value="specs">
          <SpecsTab projectId={roomId} />
        </TabsContent>
      </Tabs>
    </aside>
  )
}

function AiArchitectTab({
  isAiActive,
  roomId,
  status,
  statusActive,
}: {
  isAiActive: boolean
  roomId: string
  status: TaskStatusMessage | null
  statusActive: boolean
}) {
  const [draft, setDraft] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isTriggering, setIsTriggering] = useState(false)
  const [runState, setRunState] = useState<ActiveRunState | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const resolvedRunIdRef = useRef<string | null>(null)
  const createFeedMessage = useCreateFeedMessage()
  const senderId = useSelf((user) => user.id)
  const senderName = useSelf((user) => user.info.name)
  const { run, error: runError } = useRealtimeRun<typeof designAgentTask>(
    runState?.runId,
    {
      accessToken: runState?.publicToken,
      enabled: runState !== null,
      id: runState?.runId,
    }
  )

  const [polledRun, setPolledRun] = useState<RunPollResponse | null>(null)
  const [pollFailed, setPollFailed] = useState(false)

  useEffect(() => {
    if (runState === null) {
      return
    }

    const { publicToken, runId } = runState
    let cancelled = false
    let attempts = 0
    let consecutiveFailures = 0

    const tick = async () => {
      if (cancelled) return
      attempts += 1
      if (attempts > RUN_POLL_MAX_ATTEMPTS) {
        setPollFailed(true)
        return
      }

      try {
        const response = await fetch(
          `https://api.trigger.dev/api/v3/runs/${runId}`,
          { headers: { Authorization: `Bearer ${publicToken}` } }
        )
        if (!response.ok) {
          throw new Error(`Run status request failed (${response.status})`)
        }
        const payload = (await response.json()) as unknown
        const parsed = runPollResponseSchema.safeParse(payload)
        if (!parsed.success) {
          throw new Error("Run status response could not be parsed")
        }
        consecutiveFailures = 0
        setPolledRun(parsed.data)

        if (
          (parsed.data.finishedAt !== undefined &&
            parsed.data.finishedAt !== null) ||
          FAILED_RUN_STATUSES.has(parsed.data.status)
        ) {
          return
        }
      } catch {
        consecutiveFailures += 1
        if (consecutiveFailures >= RUN_POLL_MAX_FAILURES) {
          setPollFailed(true)
          return
        }
      }

      window.setTimeout(tick, RUN_POLL_INTERVAL_MS)
    }

    void tick()
    return () => {
      cancelled = true
    }
  }, [runState])

  const effectiveRun =
    run?.id === runState?.runId
      ? run
      : polledRun !== null && polledRun.id === runState?.runId
        ? polledRun
        : undefined
  const effectiveRunFinished =
    effectiveRun !== undefined &&
    ((effectiveRun.finishedAt !== undefined &&
      effectiveRun.finishedAt !== null) ||
      effectiveRun.status === "COMPLETED" ||
      FAILED_RUN_STATUSES.has(effectiveRun.status))
  const isRunActive =
    runState !== null &&
    runError === undefined &&
    !pollFailed &&
    !effectiveRunFinished
  const isGenerationActive =
    isSending || isTriggering || isRunActive || (isAiActive && !effectiveRunFinished)
  const isStatusStripVisible = (isRunActive || statusActive) && !effectiveRunFinished

  const runErrorMessage = runError?.message
  const runStatus = effectiveRun?.status
  const runOutputSummary = effectiveRun?.output?.summary
  const runErrorMessageFromOutput = effectiveRun?.error?.message

  useEffect(() => {
    if (runState === null || resolvedRunIdRef.current === runState.runId) {
      return
    }

    if (runError !== undefined || pollFailed) {
      resolvedRunIdRef.current = runState.runId
      void saveAiChatMessage(
        roomId,
        runErrorMessage ??
          "Ghost AI could not finish the design. The design run stopped unexpectedly.",
        createFeedMessage
      )
      queueMicrotask(() => setRunState(null))
      return
    }

    if (!effectiveRunFinished) {
      return
    }

    resolvedRunIdRef.current = runState.runId

    const failureMessage =
      runStatus && FAILED_RUN_STATUSES.has(runStatus)
        ? `Ghost AI could not finish the design. ${
            runErrorMessageFromOutput ?? "The design run stopped unexpectedly."
          }`
        : null

    void saveAiChatMessage(
      roomId,
      failureMessage ??
        `Design complete: ${
          runOutputSummary ?? "The canvas was updated."
        }`,
      createFeedMessage
    )
    queueMicrotask(() => setRunState(null))
  }, [
    createFeedMessage,
    effectiveRunFinished,
    pollFailed,
    roomId,
    runError,
    runErrorMessage,
    runErrorMessageFromOutput,
    runOutputSummary,
    runState,
    runStatus,
  ])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = draft.trim()

    if (!content || isGenerationActive || !senderId || !senderName) {
      return
    }

    setSendError(null)
    setIsSending(true)

    try {
      const message = chatMessageSchema.parse({
        content,
        role: "user",
        sender: { id: senderId, name: senderName },
        timestamp: new Date().toISOString(),
      })

      const userMsgItem: ChatFeedMessage = {
        createdAt: Date.now(),
        data: message,
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      }
      saveLocalChatMessage(roomId, userMsgItem)

      await createFeedMessage(AI_CHAT_FEED_ID, message)
      setDraft("")
    } catch (error) {
      setSendError(
        error instanceof Error ? error.message : "Message could not be sent."
      )
      setIsSending(false)
      return
    } finally {
      setIsSending(false)
    }

    setIsTriggering(true)

    try {
      const response = await fetch("/api/ai/design", {
        body: JSON.stringify({ prompt: content, roomId }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const payload = (await response.json()) as unknown
      const start = designStartResponseSchema.safeParse(payload)

      if (start.success) {
        setPolledRun(null)
        setPollFailed(false)
        setRunState(start.data)
        return
      }

      const failure = designStartErrorSchema.safeParse(payload)
      const errorMessage =
        failure.success && failure.data.error
          ? failure.data.error
          : "Ghost AI could not start the design. Try again."

      await saveAiChatMessage(roomId, errorMessage, createFeedMessage)
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? `Ghost AI could not start the design. ${error.message}`
          : "Ghost AI could not start the design. Try again."

      await saveAiChatMessage(roomId, errorMessage, createFeedMessage)
    } finally {
      setIsTriggering(false)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col w-full min-w-0">
      <ScrollArea className="min-h-0 flex-1 w-full min-w-0">
        <div className="p-4 w-full min-w-0">
          <ChatMessageList
            isGenerationActive={isGenerationActive}
            onStarterPrompt={setDraft}
            roomId={roomId}
            senderId={senderId}
          />
        </div>
      </ScrollArea>

      {isStatusStripVisible ? (
        <div
          aria-live="polite"
          className="flex shrink-0 items-center gap-2 border-t border-border bg-card/70 px-5 py-2 text-xs"
          role="status"
        >
          <span aria-hidden="true" className="relative flex size-2 shrink-0">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#62C073] opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-[#62C073]" />
          </span>
          <span className="min-w-0 flex-1 break-words text-muted-foreground">
            {status?.text ?? "Ghost AI is working on the canvas..."}
          </span>
        </div>
      ) : null}

      <form
        className="flex min-h-[152px] shrink-0 flex-col justify-end border-t border-border p-4"
        onSubmit={handleSubmit}
      >
        <div className="relative">
          <Textarea
            aria-label="Message room collaborators"
            className="field-sizing-content min-h-[84px] max-h-40 resize-none overflow-y-auto pr-12"
            disabled={isGenerationActive || !senderId}
            maxLength={2_000}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message room collaborators..."
            value={draft}
          />
          <Button
            aria-label="Send message"
            className="absolute right-2 bottom-2 bg-[#62C073] text-background hover:bg-[#62C073]/80"
            disabled={
              !draft.trim() || isGenerationActive || !senderId || !senderName
            }
            size="icon-sm"
            type="submit"
          >
            {isGenerationActive ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Send />
            )}
          </Button>
        </div>
        {sendError ? (
          <p aria-live="polite" className="mt-2 px-1 text-[0.7rem] text-destructive">
            {sendError}
          </p>
        ) : (
          <p className="mt-2 px-1 text-[0.7rem] text-muted-foreground">
            Enter to send · Shift+Enter for a new line
          </p>
        )}
      </form>
    </div>
  )
}

function getLocalChatMessages(roomId: string): ChatFeedMessage[] {
  if (typeof window === "undefined" || !roomId) return []
  try {
    const raw = localStorage.getItem(`ghost-ai-chat:${roomId}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalChatMessage(roomId: string, message: ChatFeedMessage) {
  if (typeof window === "undefined" || !roomId) return
  try {
    const current = getLocalChatMessages(roomId)
    const updated = [...current, message]
    localStorage.setItem(`ghost-ai-chat:${roomId}`, JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent(`ghost-ai-chat-update:${roomId}`))
  } catch (error) {
    console.error("Failed to save local chat message", error)
  }
}

function ChatMessageList({
  isGenerationActive,
  onStarterPrompt,
  roomId,
  senderId,
}: {
  isGenerationActive: boolean
  onStarterPrompt: (prompt: string) => void
  roomId: string
  senderId: string | null | undefined
}) {
  const [localMessages, setLocalMessages] = useState<ChatFeedMessage[]>([])

  useEffect(() => {
    queueMicrotask(() => setLocalMessages(getLocalChatMessages(roomId)))
    const handleUpdate = () => {
      setLocalMessages(getLocalChatMessages(roomId))
    }
    window.addEventListener(`ghost-ai-chat-update:${roomId}`, handleUpdate)
    return () => {
      window.removeEventListener(`ghost-ai-chat-update:${roomId}`, handleUpdate)
    }
  }, [roomId])

  const chatFeed = useFeedMessages(AI_CHAT_FEED_ID, { limit: 50 })
  const feedMessagesList: ChatFeedMessage[] =
    "messages" in chatFeed && Array.isArray(chatFeed.messages)
      ? chatFeed.messages.flatMap((message): ChatFeedMessage[] => {
          const parsed = chatMessageSchema.safeParse(message.data)
          return parsed.success
            ? [{ createdAt: message.createdAt, data: parsed.data, id: message.id }]
            : []
        })
      : []

  const messageMap = new Map<string, ChatFeedMessage>()
  for (const msg of localMessages) {
    const key = `${msg.data.role}:${msg.data.content}:${msg.data.timestamp.slice(0, 19)}`
    messageMap.set(key, msg)
  }
  for (const msg of feedMessagesList) {
    const key = `${msg.data.role}:${msg.data.content}:${msg.data.timestamp.slice(0, 19)}`
    messageMap.set(key, msg)
  }

  const messages = Array.from(messageMap.values()).sort(
    (left, right) => left.createdAt - right.createdAt
  )

  if (messages.length === 0) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 py-8 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-muted text-accent-foreground">
          <Bot aria-hidden="true" className="size-5" />
        </div>
        <div className="grid gap-1">
          <p className="text-sm font-medium text-foreground">
            Start the room conversation
          </p>
          <p className="mx-auto max-w-56 text-xs leading-5 text-muted-foreground">
            Share architecture ideas and context with everyone collaborating in
            this room.
          </p>
        </div>
        <div className="flex max-w-64 flex-wrap justify-center gap-2">
          {starterPrompts.map((prompt) => (
            <Button
              className="h-auto rounded-full bg-muted px-3 py-2 text-xs text-accent-foreground hover:bg-muted/80 cursor-pointer"
              disabled={isGenerationActive || !senderId}
              key={prompt}
              onClick={() => onStarterPrompt(prompt)}
              type="button"
              variant="ghost"
            >
              {prompt}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col gap-4 w-full min-w-0">
      {messages.map((message) => {
        const isOwnMessage = message.data.sender.id === senderId
        const isUserMessage = message.data.role === "user"

        return (
          <div
            className={cn(
              "w-fit max-w-[85%] rounded-xl border px-3 py-2 break-words [word-break:break-word]",
              isOwnMessage ? "ml-auto" : "mr-auto",
              isUserMessage
                ? "border-transparent bg-[#62C073] text-background"
                : "border-border bg-card text-accent-foreground"
            )}
            key={message.id}
          >
            <div
              className={cn(
                "mb-1 flex items-center gap-2 text-[0.65rem]",
                isUserMessage ? "text-background/70" : "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "font-medium truncate max-w-36",
                  isUserMessage ? "text-background" : "text-foreground"
                )}
              >
                {message.data.sender.name}
              </span>
              <time dateTime={message.data.timestamp} className="shrink-0">
                {formatChatTimestamp(message.data.timestamp)}
              </time>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-5 break-words [word-break:break-word]">
              {message.data.content}
            </p>
          </div>
        )
      })}
    </div>
  )
}

async function saveAiChatMessage(
  roomId: string,
  content: string,
  createFeedMessage: ReturnType<typeof useCreateFeedMessage>
) {
  const data = chatMessageSchema.parse({
    content: content.slice(0, 2_000),
    role: "assistant",
    sender: { id: AI_CHAT_SENDER_ID, name: AI_CHAT_SENDER_NAME },
    timestamp: new Date().toISOString(),
  })

  const messageItem: ChatFeedMessage = {
    createdAt: Date.now(),
    data,
    id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  }

  saveLocalChatMessage(roomId, messageItem)

  try {
    await createFeedMessage(AI_CHAT_FEED_ID, data)
  } catch (error) {
    console.error("Failed to save an AI chat message to Liveblocks feed", error)
  }
}

type ChatFeedMessage = {
  createdAt: number
  data: ChatMessage
  id: string
}

function formatChatTimestamp(timestamp: string) {
  return `${timestamp.slice(11, 16)} UTC`
}

function useSharedAiStatus() {
  const feed = useFeedMessages(AI_STATUS_FEED_ID, { limit: 1 })
  const thinkingParticipants = useOthersMapped(
    (participant) =>
      participant.id !== AI_CHAT_SENDER_ID &&
      participant.info?.name !== AI_CHAT_SENDER_NAME &&
      participant.presence.thinking === true
  )
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const latestMessage =
    "messages" in feed ? feed.messages?.[0] : undefined
  const parsedStatus = taskStatusMessageSchema.safeParse(latestMessage?.data)
  const status = parsedStatus.success ? parsedStatus.data : null
  const isStatusFresh =
    latestMessage !== undefined && now - latestMessage.createdAt < STATUS_FEED_STALE_MS
  const hasThinkingParticipant = thinkingParticipants.some(
    ([, thinking]) => thinking
  )

  return {
    isActive:
      hasThinkingParticipant ||
      (status !== null &&
        isTaskStatusActive(status.stage) &&
        isStatusFresh),
    isStatusFresh,
    status,
  }
}

type ProjectSpecItem = {
  createdAt: string
  filename: string
  id: string
  projectId: string
}

type SpecLogStep = {
  detail?: string
  id: string
  timestamp: string
  title: string
  type: "info" | "active" | "success" | "warning" | "error"
}

function formatLogTime(date: Date = new Date()) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    second: "2-digit",
  })
}

function extractTriggerErrorMessage(payload: unknown): string {
  if (!payload) return "Task execution failed"
  if (typeof payload === "string" && payload.trim()) return payload.trim()

  if (typeof payload === "object") {
    const p = payload as Record<string, unknown>
    if (typeof p.error === "string" && p.error.trim()) {
      return p.error.trim()
    }
    if (p.error && typeof p.error === "object") {
      const errObj = p.error as Record<string, unknown>
      if (typeof errObj.message === "string" && errObj.message.trim()) {
        return errObj.message.trim()
      }
      if (typeof errObj.error === "string" && errObj.error.trim()) {
        return errObj.error.trim()
      }
    }
    if (p.metadata && typeof p.metadata === "object") {
      const meta = p.metadata as Record<string, unknown>
      if (typeof meta.error === "string" && meta.error.trim()) {
        return meta.error.trim()
      }
    }
    if (typeof p.message === "string" && p.message.trim()) {
      return p.message.trim()
    }
  }
  return "Task execution failed"
}

function SpecThinkingLogs({
  isGenerating,
  isOpen,
  logs,
  onToggleOpen,
}: {
  isGenerating: boolean
  isOpen: boolean
  logs: SpecLogStep[]
  onToggleOpen: () => void
}) {
  if (logs.length === 0) return null

  const activeLog = [...logs].reverse().find((l) => l.type === "active" || l.type === "info" || l.type === "error")
  const hasError = logs.some((l) => l.type === "error")
  const hasSuccess = logs.some((l) => l.type === "success")

  return (
    <div className="rounded-xl border border-border bg-card/60 overflow-hidden text-xs transition-all my-2">
      <button
        className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 cursor-pointer text-left transition-colors"
        onClick={onToggleOpen}
        type="button"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {isGenerating ? (
            <Loader2 className="animate-spin size-4 shrink-0 text-accent-foreground" />
          ) : hasError ? (
            <XCircle className="size-4 shrink-0 text-destructive" />
          ) : hasSuccess ? (
            <CheckCircle2 className="size-4 shrink-0 text-[#62C073]" />
          ) : (
            <BrainCircuit className="size-4 shrink-0 text-muted-foreground" />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground text-xs">
                {isGenerating ? "Thinking Process" : hasError ? "Execution Failed" : "Execution Logs"}
              </span>
              <span className="text-[0.65rem] px-1.5 py-0.5 rounded-full font-mono bg-muted text-muted-foreground">
                {logs.length} {logs.length === 1 ? "step" : "steps"}
              </span>
            </div>
            <p className="text-[0.7rem] text-muted-foreground truncate mt-0.5">
              {activeLog ? activeLog.title : "Log history"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 ml-2">
          {isOpen ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-border/60 bg-background/50">
          <ScrollArea className="max-h-48 p-3">
            <div className="space-y-2.5">
              {logs.map((log) => (
                <div className="flex items-start gap-2 text-[0.725rem] leading-tight" key={log.id}>
                  <span className="mt-0.5 shrink-0">
                    {log.type === "active" ? (
                      <Loader2 className="animate-spin size-3 text-accent-foreground" />
                    ) : log.type === "success" ? (
                      <CheckCircle2 className="size-3 text-[#62C073]" />
                    ) : log.type === "warning" ? (
                      <AlertTriangle className="size-3 text-amber-500" />
                    ) : log.type === "error" ? (
                      <XCircle className="size-3 text-destructive" />
                    ) : (
                      <Sparkles className="size-3 text-muted-foreground" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "font-medium",
                          log.type === "error"
                            ? "text-destructive"
                            : log.type === "warning"
                              ? "text-amber-500"
                              : log.type === "success"
                                ? "text-[#62C073]"
                                : "text-foreground"
                        )}
                      >
                        {log.title}
                      </span>
                      <span className="text-[0.65rem] text-muted-foreground font-mono shrink-0">
                        {log.timestamp}
                      </span>
                    </div>
                    {log.detail && log.type !== "error" && (
                      <p className="text-[0.68rem] text-muted-foreground mt-0.5 break-words">
                        {log.detail}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

function SpecsTab({ projectId }: { projectId: string }) {
  const [specs, setSpecs] = useState<ProjectSpecItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [logs, setLogs] = useState<SpecLogStep[]>([])
  const [isLogsOpen, setIsLogsOpen] = useState(true)

  const [selectedSpec, setSelectedSpec] = useState<ProjectSpecItem | null>(null)
  const [specContent, setSpecContent] = useState<string | null>(null)
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const [contentError, setContentError] = useState<string | null>(null)

  const fetchSpecs = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/specs`)
      if (!res.ok) {
        throw new Error("Failed to fetch specs")
      }
      const data = (await res.json()) as ProjectSpecItem[]
      setSpecs(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load specs")
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (!selectedSpec) {
      return
    }

    let cancelled = false

    const loadContent = async () => {
      try {
        const res = await fetch(
          `/api/projects/${projectId}/specs/${selectedSpec.id}/download`
        )
        if (!res.ok) {
          throw new Error("Failed to fetch spec content")
        }
        const text = await res.text()
        if (!cancelled) {
          setSpecContent(text)
          setContentError(null)
          setIsLoadingContent(false)
        }
      } catch (err) {
        if (!cancelled) {
          setContentError(
            err instanceof Error ? err.message : "Failed to load spec content"
          )
          setIsLoadingContent(false)
        }
      }
    }

    void loadContent()
    return () => {
      cancelled = true
    }
  }, [projectId, selectedSpec])

  const handleSelectSpec = (spec: ProjectSpecItem) => {
    setSpecContent(null)
    setContentError(null)
    setIsLoadingContent(true)
    setSelectedSpec(spec)
  }

  const handleCloseModal = () => {
    setSelectedSpec(null)
    setSpecContent(null)
    setContentError(null)
    setIsLoadingContent(false)
  }

  const handleGenerateSpec = async () => {
    if (isGenerating) return
    setIsGenerating(true)
    setGenerateError(null)
    setSuccessMessage(null)
    setIsLogsOpen(true)

    setLogs([
      {
        detail: "Initializing technical specification generation request",
        id: "start",
        timestamp: formatLogTime(),
        title: "Starting Spec Generation",
        type: "active",
      },
    ])

    try {
      const res = await fetch("/api/ai/spec", {
        body: JSON.stringify({ roomId: projectId }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        const errMsg = data.error ?? "Failed to trigger spec generation"
        setLogs((prev) => [
          ...prev.map((l) => (l.type === "active" ? { ...l, type: "error" as const } : l)),
          {
            id: "err-trigger",
            timestamp: formatLogTime(),
            title: "Generation Request Failed",
            type: "error",
          },
        ])
        setGenerateError(errMsg)
        throw new Error(errMsg)
      }

      const { runId } = (await res.json()) as { runId: string }
      setLogs((prev) => [
        ...prev.map((l) => (l.type === "active" ? { ...l, type: "info" as const } : l)),
        {
          detail: `Run ID: ${runId}`,
          id: "task-triggered",
          timestamp: formatLogTime(),
          title: "Trigger.dev Task Dispatched",
          type: "info",
        },
        {
          detail: "Analyzing canvas elements and generating Markdown specification",
          id: "generating",
          timestamp: formatLogTime(),
          title: "Generating Technical Spec with Gemini AI",
          type: "active",
        },
      ])

      let token: string | null = null
      try {
        const tokenRes = await fetch("/api/ai/spec/token", {
          body: JSON.stringify({ runId }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        })
        if (tokenRes.ok) {
          const tokenData = (await tokenRes.json()) as { token?: string }
          token = tokenData.token ?? null
        }
      } catch {
        // ignore token fetch error
      }

      let attempts = 0
      let lastAttemptLogged = 1
      let loggedUploading = false

      const pollInterval = window.setInterval(async () => {
        attempts++

        if (token) {
          try {
            const runRes = await fetch(`https://api.trigger.dev/api/v3/runs/${runId}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            if (runRes.ok) {
              const runData = (await runRes.json()) as unknown

              const p = runData as {
                attemptsCount?: number
                error?: unknown
                finishedAt?: string | null
                metadata?: { error?: string; progress?: number; status?: string; summary?: string }
                status?: string
              }

              if (typeof p.attemptsCount === "number" && p.attemptsCount > lastAttemptLogged) {
                const attemptNum = p.attemptsCount
                lastAttemptLogged = attemptNum
                const retryReason = extractTriggerErrorMessage(p)

                setLogs((prev) => [
                  ...prev.map((l) => (l.type === "active" ? { ...l, type: "warning" as const } : l)),
                  {
                    detail: retryReason,
                    id: `retry-${attemptNum}`,
                    timestamp: formatLogTime(),
                    title: `Retry Attempt #${attemptNum - 1} Failed`,
                    type: "warning",
                  },
                  {
                    detail: `Retrying technical spec generation (Attempt #${attemptNum})`,
                    id: `generating-retry-${attemptNum}`,
                    timestamp: formatLogTime(),
                    title: `Generating Technical Spec (Attempt ${attemptNum})`,
                    type: "active",
                  },
                ])
              }

              if (p.metadata?.status === "uploading" && !loggedUploading) {
                loggedUploading = true
                setLogs((prev) => [
                  ...prev.map((l) => (l.type === "active" ? { ...l, type: "info" as const } : l)),
                  {
                    detail: "Saving generated Markdown file to storage and updating database",
                    id: "uploading",
                    timestamp: formatLogTime(),
                    title: "Uploading Spec to Vercel Blob",
                    type: "active",
                  },
                ])
              }

              if (
                p.status === "COMPLETED" ||
                p.metadata?.status === "completed"
              ) {
                window.clearInterval(pollInterval)
                setLogs((prev) => [
                  ...prev.map((l) => (l.type === "active" ? { ...l, type: "success" as const } : l)),
                  {
                    id: "completed",
                    timestamp: formatLogTime(),
                    title: "Spec Generation Completed",
                    type: "success",
                  },
                ])
                setSuccessMessage(p.metadata?.summary ?? "Technical specification generated successfully.")
                await fetchSpecs()
                setIsGenerating(false)
                return
              }

              if (
                (p.status && FAILED_RUN_STATUSES.has(p.status)) ||
                p.metadata?.status === "error"
              ) {
                window.clearInterval(pollInterval)
                const errDetail = extractTriggerErrorMessage(p)
                setLogs((prev) => [
                  ...prev.map((l) => (l.type === "active" ? { ...l, type: "error" as const } : l)),
                  {
                    id: `failed-${Date.now()}`,
                    timestamp: formatLogTime(),
                    title: "Spec Generation Failed",
                    type: "error",
                  },
                ])
                setGenerateError(errDetail)
                setIsGenerating(false)
                return
              }
            }
          } catch {
            // ignore polling network error
          }
        }

        await fetchSpecs()

        if (attempts >= 75) {
          window.clearInterval(pollInterval)
          const timeoutMsg = "Spec generation task timed out after 5 minutes."
          setLogs((prev) => [
            ...prev.map((l) => (l.type === "active" ? { ...l, type: "error" as const } : l)),
            {
              id: `timeout-${Date.now()}`,
              timestamp: formatLogTime(),
              title: "Spec Generation Timed Out",
              type: "error",
            },
          ])
          setGenerateError(timeoutMsg)
          setIsGenerating(false)
        }
      }, 4000)
    } catch (err) {
      const errDetail = err instanceof Error ? err.message : "Failed to generate spec"
      setLogs((prev) => [
        ...prev.map((l) => (l.type === "active" ? { ...l, type: "error" as const } : l)),
        {
          id: `catch-err-${Date.now()}`,
          timestamp: formatLogTime(),
          title: "Spec Generation Failed",
          type: "error",
        },
      ])
      setGenerateError(errDetail)
      setIsGenerating(false)
    }
  }

  const handleDownload = (e: React.MouseEvent, spec: ProjectSpecItem) => {
    e.stopPropagation()
    const downloadUrl = `/api/projects/${projectId}/specs/${spec.id}/download`
    const link = document.createElement("a")
    link.href = downloadUrl
    link.download = spec.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
      <div>
        <Button
          className="w-full bg-accent text-white hover:bg-accent/80 cursor-pointer"
          disabled={isGenerating}
          onClick={handleGenerateSpec}
          type="button"
        >
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin" />
              Generating Spec...
            </>
          ) : (
            <>
              <FileText />
              Generate Spec
            </>
          )}
        </Button>
      </div>

      <SpecThinkingLogs
        isGenerating={isGenerating}
        isOpen={isLogsOpen}
        logs={logs}
        onToggleOpen={() => setIsLogsOpen((prev) => !prev)}
      />

      {generateError ? (
        <div className="flex items-start justify-between gap-2.5 p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <XCircle className="size-4 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1 whitespace-pre-wrap font-mono text-[0.7rem] leading-relaxed break-words">
              {generateError}
            </div>
          </div>
          <button
            aria-label="Dismiss error"
            className="shrink-0 p-1 rounded-md text-destructive/70 hover:text-destructive hover:bg-destructive/20 transition-colors cursor-pointer"
            onClick={() => setGenerateError(null)}
            type="button"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : successMessage ? (
        <div className="flex items-center justify-between gap-2.5 p-3.5 rounded-xl border border-[#62C073]/30 bg-[#62C073]/10 text-[#62C073] text-xs font-medium">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <CheckCircle2 className="size-4 shrink-0 text-[#62C073]" />
            <span className="min-w-0 flex-1">{successMessage}</span>
          </div>
          <button
            aria-label="Dismiss message"
            className="shrink-0 p-1 rounded-md text-[#62C073]/70 hover:text-[#62C073] hover:bg-[#62C073]/20 transition-colors cursor-pointer"
            onClick={() => setSuccessMessage(null)}
            type="button"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-8">
          <Loader2 className="animate-spin size-5 text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive">
          {error}
        </div>
      ) : specs.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-6 text-center">
          <FileText aria-hidden="true" className="size-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground">No specs generated yet</p>
          <p className="text-xs text-muted-foreground">
            Click &quot;Generate Spec&quot; to generate a technical specification from your canvas.
          </p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-3">
            {specs.map((spec) => (
              <article
                className="group relative rounded-xl border border-border bg-card p-4 transition-colors hover:border-accent/40"
                key={spec.id}
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-accent-foreground group-hover:bg-accent group-hover:text-accent-foreground">
                    <FileText aria-hidden="true" className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-foreground truncate">
                      {spec.filename}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatSpecDate(spec.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    className="flex-1 cursor-pointer"
                    onClick={() => handleSelectSpec(spec)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <Eye className="size-3.5 mr-1.5" />
                    Preview
                  </Button>
                  <Button
                    className="flex-1 cursor-pointer"
                    onClick={(e) => handleDownload(e, spec)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <Download className="size-3.5 mr-1.5" />
                    Download
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Preview Modal */}
      <Dialog
        open={selectedSpec !== null}
        onOpenChange={(open) => !open && handleCloseModal()}
      >
        <DialogContent className="max-w-2xl sm:max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <FileText className="size-5 text-accent-foreground" />
              {selectedSpec?.filename}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Generated on {selectedSpec && formatSpecDate(selectedSpec.createdAt)}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 p-6 max-h-[60vh]">
            {isLoadingContent ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="animate-spin size-6 text-muted-foreground" />
              </div>
            ) : contentError ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive">
                {contentError}
              </div>
            ) : specContent ? (
              <MarkdownViewer content={specContent} />
            ) : null}
          </ScrollArea>

          <DialogFooter className="p-4 border-t border-border flex sm:flex-row sm:justify-between items-center bg-muted/30">
            <Button onClick={handleCloseModal} variant="outline">
              Close
            </Button>
            {selectedSpec && (
              <Button
                className="bg-accent text-white hover:bg-accent/80 cursor-pointer"
                onClick={(e) => handleDownload(e, selectedSpec)}
              >
                <Download className="size-4 mr-2" />
                Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MarkdownViewer({ content }: { content: string }) {
  const lines = content.split("\n")
  const elements: React.ReactNode[] = []
  let inCodeBlock = false
  let codeBlockBuffer: string[] = []
  let listBuffer: string[] = []

  const flushList = (keyPrefix: string) => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul className="my-2 ml-6 list-disc space-y-1 text-sm text-foreground/90" key={`${keyPrefix}-list`}>
          {listBuffer.map((item, i) => (
            <li key={i}>{formatInlineMarkdown(item)}</li>
          ))}
        </ul>
      )
      listBuffer = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre
            className="my-3 overflow-x-auto rounded-lg bg-muted/80 p-3 text-xs font-mono text-foreground border border-border"
            key={`code-${i}`}
          >
            <code>{codeBlockBuffer.join("\n")}</code>
          </pre>
        )
        codeBlockBuffer = []
        inCodeBlock = false
      } else {
        flushList(`line-${i}`)
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeBlockBuffer.push(line)
      continue
    }

    if (line.startsWith("# ")) {
      flushList(`line-${i}`)
      elements.push(
        <h1 className="mt-4 mb-2 font-heading text-xl font-bold text-foreground" key={`h1-${i}`}>
          {formatInlineMarkdown(line.slice(2))}
        </h1>
      )
    } else if (line.startsWith("## ")) {
      flushList(`line-${i}`)
      elements.push(
        <h2 className="mt-4 mb-2 font-heading text-lg font-semibold text-foreground border-b border-border pb-1" key={`h2-${i}`}>
          {formatInlineMarkdown(line.slice(3))}
        </h2>
      )
    } else if (line.startsWith("### ")) {
      flushList(`line-${i}`)
      elements.push(
        <h3 className="mt-3 mb-1.5 font-heading text-base font-medium text-foreground" key={`h3-${i}`}>
          {formatInlineMarkdown(line.slice(4))}
        </h3>
      )
    } else if (line.startsWith("#### ")) {
      flushList(`line-${i}`)
      elements.push(
        <h4 className="mt-2 mb-1 font-heading text-sm font-medium text-foreground" key={`h4-${i}`}>
          {formatInlineMarkdown(line.slice(5))}
        </h4>
      )
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      listBuffer.push(line.slice(2))
    } else if (line.startsWith("> ")) {
      flushList(`line-${i}`)
      elements.push(
        <blockquote className="my-2 border-l-2 border-accent pl-3 text-xs italic text-muted-foreground" key={`quote-${i}`}>
          {formatInlineMarkdown(line.slice(2))}
        </blockquote>
      )
    } else if (line.trim() === "---" || line.trim() === "***") {
      flushList(`line-${i}`)
      elements.push(<hr className="my-4 border-border" key={`hr-${i}`} />)
    } else if (line.trim() === "") {
      flushList(`line-${i}`)
    } else {
      flushList(`line-${i}`)
      elements.push(
        <p className="my-1.5 text-sm leading-relaxed text-foreground/90" key={`p-${i}`}>
          {formatInlineMarkdown(line)}
        </p>
      )
    }
  }
  flushList("final")

  return <div className="space-y-1 text-foreground">{elements}</div>
}

function formatInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g)
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={index} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={index} className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-accent-foreground">
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}

function formatSpecDate(isoString: string) {
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return isoString
  }
}

export { AiSidebar }
export type { AiSidebarProps }
