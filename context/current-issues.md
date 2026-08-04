# Current Issues

No unresolved editor-canvas issues are documented at this time.

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
