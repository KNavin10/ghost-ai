# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- Complete — project sharing

## Current Goal

- None.

## Completed

- Reviewed the project context files and design-system specification.
- Initialized shadcn/ui with the Base Nova style and Tailwind CSS variables.
- Added Button, Card, Dialog, Input, Tabs, Textarea, and Scrollarea primitives.
- Installed `lucide-react` and created the reusable `cn()` helper.
- Implemented the controlled editor navbar with the required sidebar state icons.
- Implemented the floating, animated project sidebar with tabbed empty states and a New Project action.
- Confirmed the existing generated dialog primitives provide token-based title, description, and footer-action support without adding a dialog.
- Verified the editor shell with `npm run lint` and `npm run build`.
- Installed `@clerk/nextjs` and `@clerk/ui`, then wrapped the root layout with Clerk's dark theme and the existing CSS variables.
- Added responsive sign-in and sign-up pages with a desktop-only product panel and centered Clerk forms.
- Added `proxy.ts` to protect all routes by default while allowing the configured sign-in and sign-up paths.
- Updated the root redirect and editor navbar to use Clerk's authenticated redirect flow and built-in user menu.
- Verified the authentication implementation with `npm run lint` and `npm run build`.
- Added Prisma v7 multi-file project and collaborator models with the required ownership, collaboration, status, timestamps, relations, and indexes.
- Added the cached Prisma client singleton with direct PostgreSQL and Prisma Accelerate connection branches.
- Created and applied the `init_project_models` migration to the primary Prisma Postgres database, then generated Prisma Client.
- Verified the Prisma implementation with schema validation, migration status, `npm run lint`, and `npm run build`.
- Added authenticated REST API routes to list and create the current user's projects, plus owner-checked rename and delete endpoints.
- Kept `/api/projects` in Clerk middleware while allowing its handlers to return the required `401` response instead of Clerk's API `404`; non-owner mutations return `403`.
- Added server-side owned and collaborator-shared project loading for the editor routes, with only serializable sidebar data passed to the interactive client shell.
- Replaced mock project data and timed dialog behavior with `hooks/use-project-actions`, which creates aligned project and room IDs, calls the project API, and refreshes or redirects after mutations.
- Added the dynamic project workspace route so newly created and existing sidebar projects can open at `/editor/[roomId]`.
- Added reusable server-only Clerk identity and project access helpers that authorize rooms by owner ID or collaborator email.
- Replaced the generic dynamic editor page with the server-checked `/editor/[roomId]` workspace route, including sign-in redirection and a shared denied state for missing or unauthorized projects.
- Built the full-viewport project workspace with the project name, share control, AI sidebar toggle, existing project sidebar, centered canvas placeholder, and future AI-chat placeholder.
- Added a visible active-room treatment in the project sidebar and defaulted shared rooms to the Shared tab.
- Added access-aware collaborator APIs for listing, inviting, and removing project collaborators, with owner-only mutation enforcement and normalized email storage.
- Enriched collaborator records through Clerk's Backend API with display names and avatar images while preserving email-only fallback behavior for unknown or unavailable Clerk users.
- Wired the workspace Share button to a project sharing dialog with collaborator loading, owner invite/remove controls, owner-only project-link copying, and temporary `Copied!` feedback.
- Kept collaborator sharing read-only by hiding invite, remove, and copy-link controls while still showing the current collaborator list.
- Refined the share dialog from the supplied visual reference with separate workspace-link and invite cards, an owner-first access list, people count, `OWNER` and `COLLABORATOR` role tags, and destructive-red remove actions.

## In Progress

- None.

## Next Up

- Define the next canvas, real-time collaboration, or AI-chat feature unit.

## Open Questions

- None.

## Architecture Decisions

- Use shadcn/ui Base Nova primitives with Tailwind CSS variables so shared components consume the project theme tokens.
- Keep the generated `components/ui/*` files unmodified after installation.
- Keep editor shell state controlled by the consuming screen so the sidebar can overlay any editor canvas without changing its layout.
- Use Clerk's built-in components and default profile flows, with the dark theme mapped to the application's existing CSS variables.
- Use the generated slug-plus-suffix project ID as the Liveblocks room ID so project persistence and real-time room addressing remain aligned.
- Keep Clerk identity lookup and owner-or-collaborator project authorization in `lib/project-access.ts` so workspace pages do not duplicate access rules.
- Store collaborator access by normalized email only, enrich display data from Clerk at read time, and keep ownership checks in every sharing mutation endpoint.
- Resolve the project owner from Clerk at share-list read time so the access list can show the owner profile and role without adding a local user record.

## Session Notes

- Design-system verification passed: `npm run lint`, `npm run build`, and a live HTTP check returned the dark root class and Ghost AI content.
- Editor shell verification passed: `npm run lint` and `npm run build`.
- Authentication verification passed: `npm run lint` and `npm run build`; the public sign-in and sign-up pages returned HTTP 200 with their expected layout text.
- Local live authentication was not exercised because this workspace has no Clerk keys or sign-in/sign-up route variables configured; no environment variables were added or renamed.
- Prisma verification passed: the initial migration is applied to the primary database, Prisma Client generated successfully, and lint/build pass.
- Project API verification passed: `npm run lint` and `npm run build` pass.
- Editor home wiring verification passed: `npm run lint` and `npm run build` pass. The editor routes are dynamic and defer Prisma initialization until request time, so production builds do not require a database connection.
- Editor workspace shell verification passed: `next typegen`, `npm run lint`, `tsc --noEmit`, `npm run build`, and `git diff --check`; the build reports `/editor/[roomId]` as a dynamic server route.
- Click-level authenticated and denied-state verification was unavailable because no in-app or extension browser was connected. A local non-browser request was stopped by Clerk's development-browser guard before the page ran, while `/sign-in` returned HTTP 200.
- Project sharing verification passed: `npm run lint`, `tsc --noEmit`, `npm run build`, and `git diff --check`; the build reports both collaborator API routes as dynamic, and live unauthenticated list/invite/remove requests each returned the required HTTP 401.
- Authenticated owner/collaborator click testing and live Clerk profile enrichment were unavailable because no browser connection was present; these paths still require a signed-in two-user smoke test against the configured Clerk instance and database.
- Share dialog reference-design verification passed: `npm run lint`, `tsc --noEmit`, `npm run build`, and `git diff --check`; owner and collaborator profile rows now share one tagged list layout, and only collaborator rows expose the red remove action to owners.
- Share dialog ownership gating now initializes from the server-rendered project prop and resolves to the collaborator API's live `isOwner` result before controlling invite, copy-link, remove, and read-only UI.
