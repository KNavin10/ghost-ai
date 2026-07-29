# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- Complete — project API backend and editor home wiring

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
- Added the dynamic project workspace route so newly created and existing sidebar projects can open at `/editor/[projectId]`.

## In Progress

- None.

## Next Up

- Define the next project-workspace feature.

## Open Questions

- None.

## Architecture Decisions

- Use shadcn/ui Base Nova primitives with Tailwind CSS variables so shared components consume the project theme tokens.
- Keep the generated `components/ui/*` files unmodified after installation.
- Keep editor shell state controlled by the consuming screen so the sidebar can overlay any editor canvas without changing its layout.
- Use Clerk's built-in components and default profile flows, with the dark theme mapped to the application's existing CSS variables.
- Use the generated slug-plus-suffix project ID as the Liveblocks room ID so project persistence and real-time room addressing remain aligned.

## Session Notes

- Design-system verification passed: `npm run lint`, `npm run build`, and a live HTTP check returned the dark root class and Ghost AI content.
- Editor shell verification passed: `npm run lint` and `npm run build`.
- Authentication verification passed: `npm run lint` and `npm run build`; the public sign-in and sign-up pages returned HTTP 200 with their expected layout text.
- Local live authentication was not exercised because this workspace has no Clerk keys or sign-in/sign-up route variables configured; no environment variables were added or renamed.
- Prisma verification passed: the initial migration is applied to the primary database, Prisma Client generated successfully, and lint/build pass.
- Project API verification passed: `npm run lint` and `npm run build` pass.
- Editor home wiring verification passed: `npm run lint` and `npm run build` pass. The editor routes are dynamic and defer Prisma initialization until request time, so production builds do not require a database connection.
