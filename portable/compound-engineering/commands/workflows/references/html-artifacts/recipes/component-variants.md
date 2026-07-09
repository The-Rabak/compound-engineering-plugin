# Recipe: `component-variants`

- **Family:** code
- **Type:** reference
- **Tags:** ui, design-system, variants

**Intent:** Grid of component variants with props/state called out per card.

## When to select this recipe

The artifact catalogs a UI component's variants (states, sizes, themes) for design/engineering reference.

## Primitives composed

- A card grid (reuses the stat-card primitive's layout, swapping numeric stats for a rendered variant preview + prop list).
- Semantic-span highlighting for the prop/state labels.
- Token layer, theme toggle (variants should visibly demonstrate light/dark, since that's exactly what the toggle proves), three exporters.

## Section skeleton

1. One card per variant: name, prop/state list, a small inline-SVG or styled-`<div>` preview.
2. Grouped by component when multiple components are covered.

## Island fields this recipe projects

Variant facts live in `ext.components[].variants[]` (`{ name, props, state, notes }`) — no fixed-core home exists for UI variant catalogs.

## Bespoke-drafting note

If previews can't be safely rendered inline (e.g. they'd require real component JS), drop the live preview and keep the prop/state table — never fake a preview that doesn't reflect real behavior.
