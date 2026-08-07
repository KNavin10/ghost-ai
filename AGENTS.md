<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Feature Implementation: use Context7 for library docs

Context7 (`@upstash/context7-mcp`) is installed as an MCP server. It serves
version-accurate, up-to-date documentation and code examples for libraries.
Your training data is stale; Context7 is not. Prefer it over recalling APIs
from memory.

Available tools:

| Tool | Purpose |
|------|---------|
| `mcp_context7_resolve_library_id` | Map a package/product name → Context7 library ID |
| `mcp_context7_query_docs` | Fetch docs/examples for a library ID, scoped to a topic |

### When to use it

Call Context7 **before writing code** whenever a task involves:

- A third-party library, framework, or SDK (Next.js, React, Tailwind, Prisma,
  Drizzle, Zod, Stripe, Supabase, shadcn/ui, etc.)
- An API surface you are not certain about, or one that may have changed
- A version-sensitive detail: config file shape, hook signature, import path,
  CLI flag, migration step
- A deprecation warning, breaking change, or a "this used to work" error

### Required workflow

1. `mcp_context7_resolve_library_id` with the library name to get its ID.
2. `mcp_context7_query_docs` with that ID and a **specific topic** (e.g.
   `"app router server actions"`, not `"nextjs"`).
3. Implement against what the docs actually say.
4. If the docs contradict your assumption, the docs win. Note the correction
   in your response rather than silently guessing.

Skip Context7 only for pure language/stdlib work or edits to first-party code
in this repo with no external API involved.

### Precedence

For Next.js specifically, the local vendored docs in
`node_modules/next/dist/docs/` are authoritative for the exact installed
version — read those first, then use Context7 for supporting detail and
examples. For every other library, Context7 is the primary source.

Do not invent an API when you can look it up. One Context7 call is cheaper
than a debugging cycle.

<!-- TRIGGER.DEV SKILLS START -->
## Trigger.dev agent skills

This project has Trigger.dev agent skills installed in `.agents/skills/`. Before writing or changing Trigger.dev code (background tasks, scheduled tasks, realtime, or chat.agent AI agents), load the most relevant skill: `trigger-authoring-chat-agent`, `trigger-authoring-tasks`, `trigger-chat-agent-advanced`, `trigger-cost-savings`, `trigger-getting-started`, `trigger-realtime-and-frontend`.
<!-- TRIGGER.DEV SKILLS END -->
