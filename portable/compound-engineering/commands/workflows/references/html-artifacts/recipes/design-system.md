# Recipe: `design-system`

- **Family:** code
- **Type:** reference
- **Tags:** tokens, components, guidelines

**Intent:** Token + component reference sheet for a design system.

## When to select this recipe

The artifact documents a design system's tokens (color/spacing/type scale) and component usage guidelines.

## Primitives composed

- Token layer swatches: render every `:root` custom property as a labeled swatch/sample (colors as chips, spacing as sized boxes, type scale as live text samples) — the one archetype where the token layer is *itself* the content, not just the styling mechanism.
- Accordion (single-open) grouping guidelines by component.
- TOC by token category / component name.

## Section skeleton

1. Token swatches grouped by category (color, spacing, radius, type).
2. Accordion: one item per component's usage guidelines.

## Island fields this recipe projects

Token values and component guidelines live in `ext.design_system.tokens[]` / `ext.design_system.components[]` — bespoke content, island-backed per the hard rule.

## Bespoke-drafting note

Keep the swatch grid honest to the *actual* token values used elsewhere in the artifact — a design-system artifact that displays tokens it doesn't itself use would be self-contradicting.
