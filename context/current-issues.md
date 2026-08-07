# Current Issues

## Issues

### 2. Delete Nodes and Edges

Add a keydown event listener to the canvas wrapper that:

- listens for Delete and Backspace keys
- does not fire when the event target is an input, textarea, or contenteditable element
- gets currently selected nodes using useNodes() filtered by selected state
- gets currently selected edges using useEdges() filtered by selected state
- removes them using the existing Liveblocks collaborative mutation helpers

Do not use React Flow's built-in deleteKeyCode or any React Flow keyboard deletion behavior. All deletions must go through the existing Liveblocks collaborative state so they sync across all connected clients in real time.

Do not change anything else.

### 3. Drag and Drop Position Offset
Read Liveblocks agent skills before implementing this.
When dropping a shape from the shape panel onto the canvas, the node places below where the cursor actually is.
Check the drop handler in the canvas wrapper. The position calculation must account for:
- the drag offset from where the user grabbed the shape inside the drag element, not just the element's top-left corner
- the canvas container's bounding rect
- the current React Flow pan offset and zoom scale via screenToFlowPosition or project
The node should appear with its center at the exact cursor position on drop.
### 4. Collaborator Avatar Image Error

Check Clerk agent skills before implementing this.

Add img.clerk.com to the allowed image hostnames in next.config.js using the correct remotePatterns configuration.

### 5. Remove UserButton from Workspace Navbar

Check Clerk agent skills before implementing this.

Remove the UserButton from the workspace navbar only. The navbar is shared so make sure the UserButton remains on the editor home navbar. Conditionally render it based on whether the component is being used in the workspace context or editor home context.

## Scope

- Fix only what is listed above
- Do not change canvas node or edge rendering behavior
- Do not modify the editor home navbar layout
- Do not break existing autosave, presence, or collaboration logic
- npm run build passes

## Resolved — React SSR Hydration Mismatch in Chat Message List

### Reported behavior

- React hydration warning/error in `ProjectEditorPage` (`app/editor/[roomId]/page.tsx`): `Hydration failed because the server rendered HTML didn't match the client.`
- Mismatch occurred in `ChatMessageList` (`components/editor/ai-sidebar.tsx`) where the server rendered the empty state (`flex min-h-full flex-col items-center justify-center...`) while the client hydrated with stored chat messages (`flex min-h-full flex-col gap-4...`).

### Root cause

- `ChatMessageList` initialized `localMessages` state using `useState(() => getLocalChatMessages(roomId))`.
- `getLocalChatMessages` checked `typeof window === "undefined"`. On the server (SSR), it evaluated to `[]` (empty array). On the client during hydration, `window` was defined and read messages synchronously from `localStorage`.
- Because initial render output differed between SSR and client hydration, React threw a hydration mismatch error.

### Resolution

- Initialized `localMessages` state to `[]` during `useState` definition so initial SSR and client hydration renders produce identical HTML.
- Updated `localMessages` from `localStorage` inside `useEffect` (which runs strictly after client hydration completes).

### Regression checks

- Never invoke `localStorage` or `window`-dependent logic directly inside `useState` initializers in SSR / Client components.
- Always initialize browser-dependent local state to a deterministic default (`[]`, `null`, `false`), then update via `useEffect` after mount.

## Resolved — Canvas nodes can create visible connections

### Reported behavior

- The reference screenshot shows shapes acting as graph nodes with visible connection points and lines between them.
- The current canvas renders and edits shapes, but users cannot drag from one shape to another to create a visible line.

### Root cause

- `editor-canvas.tsx` already provides Liveblocks-synchronized edge state and passes its `onConnect` handler to React Flow.
- `canvas-node.tsx` does not render React Flow source or target handles, so there is no user-facing connection point from which an edge can begin or end.

### Resolution

- Each custom shape now exposes a source handle on its top, right, bottom, and left edges. Handles are clear when selected and reveal on hover for a connection target without changing a shape's silhouette.
- The canvas keeps `ConnectionMode.Loose`, allowing these source handles to accept an incoming connection as well as start one without duplicate overlapping handle controls.
- Created edges continue through the existing `useLiveblocksFlow` `onConnect` handler and render with the foreground-token line treatment.

### Regression checks

- Drag from a source handle on one shape to a target handle on another and confirm that a line is rendered between them.
- Confirm a second connected client receives the same edge and that resizing or editing either endpoint does not remove it.
- Verify each supported shape exposes usable handles without changing its silhouette or centered label behavior.

## Resolved — Faint canvas dots did not read as a starry night

### Reported behavior

- The `2nd issue.png` screenshot showed a canvas dot pattern that was too faint to read clearly.
- The dots became useful only after zooming in instead of resembling a clear starry-night sky at normal and zoomed-out views.

### Root cause

- The canvas used one dot pattern with the low-contrast `--border` token and React Flow's default dot size.
- React Flow scales dot size with canvas zoom, so the already faint single layer became even less visible while zooming out.

### Resolution

- The canvas now combines three uniquely identified dot layers with varied brightness, size, spacing, and offset.
- The base layer owns the theme background; the brighter layers are transparent overlays so all star sizes remain visible together.
- Star colors are derived from the application foreground token instead of hardcoded color values.

### Regression checks

- Check the star field at normal zoom and while zoomed both in and out.
- Confirm small, medium, and bright stars are visible simultaneously and that no overlay hides another layer.
- Keep every React Flow background ID unique and every star color theme-token-derived.

## Resolved — Canvas surface and dropped-shape rendering

### Reported behavior

- The React Flow canvas looked like a separate floating box instead of a continuous design workspace.
- Rectangle, diamond, circle, pill, cylinder, and hexagon drops all appeared as rectangles or squares.

### Root cause

- The custom node renderer stored `data.shape` but never used it. It always returned the same bordered rectangular `div`.
- The workspace used a separate `bg-black/30` treatment, while React Flow's minimap and surface were left to library defaults instead of the application theme.

### Resolution

- The custom node renderer now maps every supported shape discriminator to a distinct SVG silhouette and keeps label content centered above it.
- The canvas background, dot grid, and minimap now consume application theme tokens, and the workspace/canvas share one background treatment.

### Regression checks

- Verify all six toolbar items after drop; checking payload data alone is insufficient.
- A supported `CanvasShape` must never fall back silently to an unrelated rectangle; keep the renderer switch exhaustive so new shape values cause a type-check failure until their artwork is implemented.
- Do not mark shape creation complete unless the custom renderer visibly honors the stored shape discriminator.
