"use client"

import { useState, type FormEvent, type KeyboardEvent } from "react"
import { Bot, Download, FileText, Send, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type AiSidebarProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

type ChatMessage = {
  content: string
  id: number
  role: "assistant" | "user"
}

const starterPrompts = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
]

function AiSidebar({ isOpen, onOpenChange }: AiSidebarProps) {
  return (
    <aside
      aria-hidden={!isOpen}
      aria-label="AI sidebar"
      className={cn(
        "absolute inset-y-0 right-0 z-40 flex w-80 max-w-full shrink-0 flex-col border-l border-border bg-background/95 shadow-2xl backdrop-blur-sm transition-transform duration-200 ease-out",
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
              Collaborate with Ghost AI
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
          <AiArchitectTab />
        </TabsContent>
        <TabsContent className="flex min-h-0 flex-1" value="specs">
          <SpecsTab />
        </TabsContent>
      </Tabs>
    </aside>
  )
}

function AiArchitectTab() {
  const [draft, setDraft] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = draft.trim()

    if (!content) {
      return
    }

    setMessages((current) => [
      ...current,
      { content, id: Date.now(), role: "user" },
      {
        content: "Ghost AI responses will connect here in the next step.",
        id: Date.now() + 1,
        role: "assistant",
      },
    ])
    setDraft("")
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1 px-5 pb-6 pt-6">
        {messages.length === 0 ? (
          <div className="flex min-h-full flex-col items-center justify-center gap-4 py-8 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-muted text-accent-foreground">
              <Bot aria-hidden="true" className="size-5" />
            </div>
            <div className="grid gap-1">
              <p className="text-sm font-medium text-foreground">
                Start with an idea
              </p>
              <p className="mx-auto max-w-56 text-xs leading-5 text-muted-foreground">
                Describe what you want to build and Ghost AI will help shape the
                architecture.
              </p>
            </div>
            <div className="flex max-w-64 flex-wrap justify-center gap-2">
              {starterPrompts.map((prompt) => (
                <Button
                  className="h-auto rounded-full bg-muted px-3 py-2 text-xs text-accent-foreground hover:bg-muted/80"
                  key={prompt}
                  onClick={() => setDraft(prompt)}
                  type="button"
                  variant="ghost"
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex min-h-full flex-col gap-4">
            {messages.map((message) => (
              <div
                className={cn(
                  "w-fit max-w-[88%] rounded-xl px-3 py-2 text-sm leading-5",
                  message.role === "user"
                    ? "ml-auto border-2 border-primary/50 bg-muted text-foreground"
                    : "mr-auto border border-border bg-card text-accent-foreground"
                )}
                key={message.id}
              >
                {message.content}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <form
        className="flex min-h-[152px] shrink-0 flex-col justify-end border-t border-border p-4"
        onSubmit={handleSubmit}
      >
        <div className="relative">
          <Textarea
            aria-label="Message Ghost AI"
            className="field-sizing-content min-h-[84px] max-h-40 resize-none overflow-y-auto pr-12"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Ghost AI to shape your workspace..."
            value={draft}
          />
          <Button
            aria-label="Send message"
            className="absolute right-2 bottom-2 bg-accent text-white hover:bg-accent/80"
            disabled={!draft.trim()}
            size="icon-sm"
            type="submit"
          >
            <Send />
          </Button>
        </div>
        <p className="mt-2 px-1 text-[0.7rem] text-muted-foreground">
          Enter to send · Shift+Enter for a new line
        </p>
      </form>
    </div>
  )
}

function SpecsTab() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
      <Button className="w-full bg-accent text-white hover:bg-accent/80" type="button">
        <FileText />
        Generate Spec
      </Button>

      <article className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-accent-foreground">
            <FileText aria-hidden="true" className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-foreground">
              Workspace Architecture Spec
            </h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              A clear starting point for turning your canvas ideas into an
              implementation-ready plan.
            </p>
          </div>
        </div>
        <Button
          className="mt-4 w-full"
          disabled
          type="button"
          variant="outline"
        >
          <Download />
          Download Spec
        </Button>
      </article>
    </div>
  )
}

export { AiSidebar }
export type { AiSidebarProps }
