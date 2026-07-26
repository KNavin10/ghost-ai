Read `Agents.md` before starting.

We're adding the design system and UI primitive components.

Install and configure `shadcn/ui`.

Add these shadcn components:
-Button
-Card
-Dialog
-Input
-Tabs
-Textarea
-Scrollarea

Don't modify the generated `components/ui/*` files after installation.

Also install `lucide-react`.

Create `lib/utils.ts` with resuable `cn()` helper for merging Tailwind classes.

Ensure all the componets match the existing dark theme in `global.css`.

### Check when done:
- All components import without errors.
- `cn()` works perfectly.
- No default light styling appears.