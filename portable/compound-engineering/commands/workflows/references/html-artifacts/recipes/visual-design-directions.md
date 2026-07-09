# Recipe: `visual-design-directions`

- **Family:** design
- **Type:** moodboard
- **Tags:** palette, typography, direction

**Intent:** Side-by-side visual-direction comparison with token swatches.

## When to select this recipe

The artifact presents 2-4 candidate visual directions (palette + type + tone) for a stakeholder to choose between.

## Primitives composed

- A tabbed viewer, one tab per direction, each panel using a **locally scoped** token override (a direction-specific `data-direction="a"` block, not the artifact's own light/dark token layer) so directions can be compared without fighting the artifact's own theme.
- Swatch + type-sample primitives (reused from `design-system`).
- Comparison-matrix-style verdict row underneath.

## Section skeleton

1. Tabs: one per candidate direction, each showing swatches + type samples + a short rationale.
2. Comparison table: direction vs. criteria (accessibility contrast, brand fit, etc.).

## Island fields this recipe projects

Direction data lives in `ext.directions[]` (`{ name, palette[], type_samples[], rationale }`) — bespoke, island-backed.

## Bespoke-drafting note

Keep the artifact's own token layer (light/dark toggle) independent of the *candidate* direction tokens being compared — don't let the toggle accidentally recolor the comparison content itself.
