# This is NOT the Next.js you know

training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code.
Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Application Building Context

Read the following files in order before implementing or making any architectural decision:

1. `context/project-overview.md` – product definition, goals, features, and scope
2. `context/architecture.md` – system structure, boundaries, storage model, and invariants
3. `context/ui-context.md` – theme, colors, typography, canvas design, and component conventions
4. `context/code-standards.md` – implementation rules and conventions
5. `context/ai-workflow-rules.md` – development workflow, scoping rules, and delivery approach
6. `context/progress-tracker.md` – current phase, completed work, open questions, and next steps

Update `context/progress-tracker.md` after each meaningful implementation change.

Before implementing anything that touches a third-party library, framework, or
SDK, query the Context7 MCP server for current docs
(`mcp_context7_resolve_library_id` → `mcp_context7_query_docs`). See the
"Feature Implementation" section in the root `AGENTS.md` for the full rule.

If implementation changes the architecture, scope, or standards documented in the context files, update the relevant file before continuing.
