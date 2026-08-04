Add a bottom shape panel so users can drag shapes onto the canvas and create new nodes.

## Implementation

1. Add a floating pill-shaped toolbar at the bottom-center of the canvas.

2. Add draggable icon buttons for these shapes:

   - rectangle
   - diamond
   - circle
   - pill
   - cylinder
   - hexagon

3. When dragging a shape, include the shape name and default size in the drag payload.

   Use sensible default sizes:

   - rectangles should be wider than tall
   - circles should be square
   - diamonds should be slightly larger so labels have room

4. Add `dragover` and `drop` handling to the canvas wrapper.

5. On drop:

   - read the dragged shape payload
   - convert the screen position to canvas coordinates using React Flow
   - create a new node at that position
   - use an empty label
   - use the default node color
   - use the dragged shape value

6. Generate each node ID using the shape name, timestamp, and a counter.

7. Add a renderer for the custom canvas node type so new nodes are visible.

   The renderer must use the node's `shape` discriminator and draw a visibly distinct silhouette for rectangle, diamond, circle, pill, cylinder, and hexagon. Default width and height values are not a substitute for shape-specific rendering.

8. Keep the React Flow surface visually continuous with the editor workspace. Use theme tokens for the canvas, grid, and minimap instead of presenting the canvas as a separate bordered card.

9. Render the canvas dots as a layered star field with varied brightness, size, spacing, and offset. The stars must remain clearly visible when the canvas is zoomed out.

## Check When Done

- Shape drag payload includes the correct shape and size data.
- Drop logic creates new canvas nodes with the expected shape data.
- New nodes use the custom canvas node type.
- All six shape values produce their matching visible silhouettes after drop.
- The canvas and minimap use the application's dark theme tokens.
- The canvas background reads as a clear starry night and remains visible across practical zoom levels.
- `npm run build` passes without type errors.
