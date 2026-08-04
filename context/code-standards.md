# Code Standards

## General

- [Principle — e.g. Keep modules small and single-purpose]
- [Principle — e.g. Fix root causes, do not layer workarounds]
- [Principle — e.g. Do not mix unrelated concerns in one
  component or route]

## TypeScript

- [Rule — e.g. Strict mode is required throughout the project]
- [Rule — e.g. Avoid any — use explicit interfaces or narrowly
  scoped types]
- [Rule — e.g. Validate unknown external input at system
  boundaries before trusting it]

## [Framework — e.g. Next.js]

- [Convention — e.g. Default to server components]
- [Convention — e.g. Add use client only when browser
  interactivity requires it]
- [Convention — e.g. Keep route handlers focused on a
  single responsibility]

## Styling

- [Rule — e.g. Use CSS custom property tokens — no
  hardcoded hex values]
- [Rule — e.g. Follow the border radius scale defined
  in ui-context.md]

## API Routes

- [Rule — e.g. Validate and parse request input before
  any logic runs]
- [Rule — e.g. Enforce auth and ownership before any mutation]
- [Rule — e.g. Return consistent, predictable response shapes]

## Data and Storage

- [Rule — e.g. Metadata belongs in the database]
- [Rule — e.g. Large generated content belongs in file
  or blob storage]
- [Rule — e.g. Do not store large content directly in
  the database]

## File Organization

- `[folder]/` — [What belongs here]
- `[folder]/` — [What belongs here]
- `[folder]/` — [What belongs here]
- `[folder]/` — [What belongs here]s

## Canvas Rendering

- Treat `CanvasNodeData.shape` as a rendering contract. Every supported shape must map exhaustively to a visibly distinct silhouette; dimensions and payload values alone do not count as shape support.
- When adding or changing canvas shapes, verify the renderer and visually check rectangle, diamond, circle, pill, cylinder, and hexagon after drop.
- Keep the React Flow surface visually continuous with the editor workspace and use application theme tokens for the canvas, grid, nodes, and minimap.
- Never call drag-and-drop shape work complete when the stored discriminator is ignored by the custom node renderer.
- When a canvas background is intended to be starry, do not use one low-opacity grid token. Layer uniquely identified React Flow dot patterns with token-derived contrast and varied size, spacing, and offset, then verify visibility while zoomed in and out.
