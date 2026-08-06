# Progress Tracker
# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- Complete — Canvas Autosave & Vercel Blob Integration

## Current Goal

- None.
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
- Added typed Liveblocks presence for cursor position and AI-thinking state, plus Clerk-backed user metadata for ID, display name, avatar, and deterministic cursor color.
- Added the cached Liveblocks Node client and a fixed-palette user-ID color helper without evaluating the secret-key requirement during production builds.
- Added `POST /api/liveblocks-auth` with Clerk authentication, existing project access checks, private room creation, and a room-scoped write token carrying the current user's metadata.
- Kept the Liveblocks auth endpoint under handler-level authentication so unauthenticated requests receive an explicit HTTP 401 response.
- Added a client-side canvas boundary with the Liveblocks auth endpoint, project-scoped room provider, initial cursor presence, Suspense loading state, and connection-error fallback.
- Replaced the workspace canvas placeholder with a React Flow canvas backed by `useLiveblocksFlow`, starting from empty synchronized nodes and edges with loose connections, fit-to-view, a minimap, and a dot background.
- Added shared React Flow canvas data, custom node, and custom edge types in `types/canvas.ts`.
- Added a floating bottom-center shape panel with draggable rectangle, diamond, circle, pill, cylinder, and hexagon controls and explicit default dimensions.
- Added validated shape drag payloads and canvas drop handling that converts screen coordinates through React Flow and inserts Liveblocks-synchronized `canvasNode` nodes with empty labels, the default color, dragged shape data, and shape-timestamp-counter IDs.
- Replaced the temporary rectangular `canvasNode` renderer with distinct SVG silhouettes for rectangle, diamond, circle, pill, cylinder, and hexagon while preserving centered labels and selected-state outlines.
- Unified the React Flow workspace and canvas background treatment, and mapped the dot grid and minimap to application theme tokens so the canvas reads as one continuous design surface.
- Documented the canvas rendering failure, root cause, resolution, and permanent regression checks in the issue record, shape-panel feature spec, and code standards.
- Replaced the faint single dot grid with three uniquely identified React Flow star layers that vary token-derived brightness, size, spacing, and offset while sharing the canvas background.
- Documented the faint-grid report, its zoom-scaled contrast cause, and permanent multi-zoom star-field checks in the issue record, shape-panel specification, and code standards.
- Added root `.coderabbit.yaml` path filters so CodeRabbit reviews TypeScript/TSX and configuration files while excluding Markdown, MDX, the entire `context/` tree, generated output, dependencies, and lockfiles.
- Replaced the canvas node placeholder with CSS rectangle, circle, and pill renderers plus scalable SVG diamond, cylinder, and hexagon renderers, including selected-state borders.
- Added a cursor-attached shape ghost preview that reuses each panel shape's default size and clears after drag completion, drop, or cancellation.
- Added selected-node resize handles with enforced minimum dimensions through the existing Liveblocks React Flow change flow.
- Added centered inline node-label editing with empty-label placeholders, blur/Escape closing, canvas-interaction guards, and native content-sized textarea behavior that remains vertically centered while typing.
- Added top, right, bottom, and left connection handles to every custom shape; users can create visible foreground-token lines through the existing Liveblocks edge flow.
- Added a selected-node color toolbar with predefined application-theme background/text pairs, active swatches, controlled text-color glows, and React Flow interaction guards.
- Expanded the selected-node color toolbar into a blue-to-red spectrum with cyan, green, amber, orange, rose, and violet options, each paired with high-contrast label text.
- Added subtle top, right, bottom, and left node handles that reveal on hover and use white dots with dark borders.
- Added the custom canvas edge renderer with smooth-step routing, rounded light strokes, dimmed rest state, active hover/selection emphasis, arrowheads, and a wider invisible interaction path.
- Added collaborative inline edge label editing with midpoint placement from `getSmoothStepPath`, growing inputs, blur/Enter/Escape commits, pill badges, and an active-edge empty-label hint.
- Added a bottom-left canvas control bar with animated zoom, fit-view, undo, and redo actions, including disabled Liveblocks history states.
- Added `hooks/use-keyboard-shortcuts` for zoom, undo, and redo shortcuts that ignore inputs, textareas, selects, and editable text fields.
- Added three typed starter canvas templates for microservices, CI/CD, and event-driven diagrams, including reusable node and edge helpers.
- Added a scrollable starter-template import dialog with lightweight SVG previews that calculate bounds, draw edges, and render each canvas node shape and color.
- Added a Templates navbar entry that replaces the collaborative canvas contents through the existing Liveblocks node and edge change flow, then fits the view.
- Added canvas-only Liveblocks presence avatars with Clerk's current-user `UserButton`, collaborator filtering, profile-photo/initial fallbacks, five-avatar overflow, and conditional dividers.
- Added Liveblocks cursor broadcasting from React Flow mouse events, cleared cursors on canvas leave, and rendered colored collaborator pointers and name badges without changing node or edge behavior.
- Separated the AI sidebar into a controlled floating component with preserved right-side slide animation and token-based surface styling.
- Added the AI Workspace header, AI Architect and Specs tabs, local demo chat interactions, starter prompts, composer keyboard behavior, generate-spec action, and static demo spec card.
- Adjusted the AI Architect spacing and arrangement to match the supplied reference while preserving the existing color and border-radius treatment.
- Reduced the AI Architect composer footprint so the scrollable chat history takes most of the sidebar, and placed the tabs in a distinct bordered section below the header.
- Made both tab panels explicit flex containers so the active AI Architect content fills all remaining vertical space above the composer.
- Installed `@vercel/blob` and integrated Vercel Blob storage for canvas state persistence.
- Implemented `PUT /api/projects/[projectId]/canvas` to upload canvas JSON to Vercel Blob and update `canvasJsonPath` on the Prisma project record.
- Implemented `GET /api/projects/[projectId]/canvas` to fetch canvas state from Vercel Blob when loading project editor sessions.
- Added `hooks/use-canvas-autosave.ts` with 2-second debounced autosave, manual save triggers, and transient state management.
- Loaded saved canvas state from Vercel Blob when initializing an empty Liveblocks room while skipping fetch if nodes or edges exist.
- Added manual Save button and visual status indicator (`Save`, `Saving...`, `Saved`, `Error`) to the editor top workspace navbar.

## In Progress

- None.

## Next Up

- Define the next feature spec after starter templates.

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
- Keep Liveblocks rooms private and authorize only the verified project ID in each short-lived access token instead of granting public or persistent collaborator permissions.
- Cache the Liveblocks Node client across requests and derive cursor colors deterministically from Clerk user IDs using a fixed palette.
- Keep the project workspace route server-rendered and isolate Liveblocks and React Flow browser state inside the client-side canvas boundary.
- Use a validated custom drag MIME payload for new shapes and route node additions through the Liveblocks-provided `onNodesChange` handler so dropped nodes join the synchronized flow state.
- Treat the stored canvas shape discriminator as a renderer contract: every supported value must produce its own visible silhouette and be checked in the rendered canvas, not only in drag payload data.
- Build decorative React Flow backgrounds from uniquely identified, transparent overlay layers so later patterns do not hide earlier ones and all colors remain derived from application theme tokens.
- Keep automated review scope explicit: review source and configuration extensions, and exclude documentation/context trees and generated dependency metadata.
- Use one source handle on each side of a canvas node with React Flow loose connection mode; the same handles create and accept synchronized edges without overlapping source/target controls.
- Keep node color choices as paired background/text theme values and update them through the existing Liveblocks React Flow replace-change flow.
- Keep edge labels in `CanvasEdge.data.label` and update them through the existing Liveblocks React Flow edge replace-change flow.
- Keep canvas viewport controls local to React Flow while routing history actions through Liveblocks hooks; keyboard shortcuts share those same handlers and skip editable targets.
- Keep predefined template imports inside the existing Liveblocks flow state: remove the current room nodes and edges, add the selected template, and fit the view without server persistence.
- Keep presence UI inside the editor canvas room view, filter participants by the Clerk user ID, and leave the shared/editor-home navbar unchanged.
- Keep the AI sidebar controlled by the workspace while keeping chat and spec content local until backend and AI generation work is specified.
- Store project canvas JSON in Vercel Blob via `@vercel/blob` `put()` with `addRandomSuffix: false`, and keep Prisma responsible for storing metadata and the blob URL in `canvasJsonPath`.

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
- Liveblocks setup verification passed: `npm run lint`, `tsc --noEmit`, `npm run build`, and `git diff --check`; the build reports `/api/liveblocks-auth` as a dynamic route, and a live unauthenticated token request returned HTTP 401.
- Live room creation and token issuance remain unverified because `LIVEBLOCKS_SECRET_KEY` is not configured locally; no credential value or placeholder was added to the repository.
- Base canvas verification passed: `npm run lint`, `tsc --noEmit`, and `npm run build`; the build keeps `/editor/[roomId]` as a dynamic server-rendered route.
- Shape panel verification passed: `npm run lint`, `tsc --noEmit`, `npm run build`, and `git diff --check`; interactive live-room drag/drop remains unavailable until `LIVEBLOCKS_SECRET_KEY` is configured.
- Canvas visual-fix verification passed: `npm run lint`, `tsc --noEmit`, and `npm run build`; the renderer exhaustively covers all six `CanvasShape` values, and the supplied broken-state screenshot was checked against the corrected token-based surface treatment. Interactive live-room drag/drop remains unavailable until `LIVEBLOCKS_SECRET_KEY` is configured.
- Starry canvas background verification passed: `npm run lint`, `tsc --noEmit`, `npm run build`, and `git diff --check`; installed React Flow source confirms dot size scales with zoom, and the canvas now uses three uniquely identified transparent overlay patterns with stronger token-derived contrast. Live zoom-level visual verification remains manual because no connected browser was available in this session.
- CodeRabbit configuration validation passed: `.coderabbit.yaml` parses successfully with the installed YAML parser, and `git diff --check` reports no whitespace errors.
- Node-shape verification passed: all six shape variants remain connected to the Liveblocks canvas state, and the shape drag preview is limited to drag/drop feedback without changing node creation behavior.
- Node-editing verification passed: `npm run lint`, `npm run build`, and `git diff --check` pass; resize dimensions and label replacements use the existing Liveblocks node-change flow. Interactive live-room verification remains unavailable until `LIVEBLOCKS_SECRET_KEY` is configured.
- Node-label editing uses native content sizing rather than JavaScript height resets, so the centered editing surface and its text do not jump between keystrokes.
- The reference screenshot exposed an incomplete part of node editing: the canvas had synchronized React Flow edge state, but custom nodes lacked source/target handles. Four side handles now create and accept visible Liveblocks-synchronized lines, and `npm run lint` plus `npm run build` pass.
- Node color toolbar verification passed: `npm run lint` and `npm run build` pass; swatches use `nodrag`, `nopan`, and `nowheel` guards, and update the selected node entirely through the collaborative canvas node-change flow with no server calls. Interactive live-room verification remains unavailable until `LIVEBLOCKS_SECRET_KEY` is configured.
- Node color contrast refinement verified: `npm run lint`, `npm run build`, and `git diff --check` pass; labels now use bright paired foregrounds, a medium weight, and a controlled dark text shadow so they remain legible across every saturated shape fill. Interactive live-room verification remains unavailable until `LIVEBLOCKS_SECRET_KEY` is configured.
- Edge behavior verification passed: `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `git diff --check`; new connections are registered as `canvasEdge` with arrow defaults, and edge labels use the collaborative edge replacement flow. Interactive live-room connection and label editing remain unavailable until `LIVEBLOCKS_SECRET_KEY` is configured.
- Canvas ergonomics verification passed: `npm run lint`, `npx tsc --noEmit`, and `git diff --check`; the control bar uses animated React Flow viewport actions, Liveblocks history availability state, and shared keyboard handlers. Interactive live-room history verification remains unavailable until `LIVEBLOCKS_SECRET_KEY` is configured.
- Starter-template verification passed: `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `git diff --check`; interactive import remains dependent on a configured Liveblocks room.
