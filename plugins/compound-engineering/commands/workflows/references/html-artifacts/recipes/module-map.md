# Recipe: `module-map`

- **Family:** code
- **Type:** reference
- **Tags:** architecture, dependencies, modules

**Intent:** Clickable module/dependency map with a detail panel per module.

## When to select this recipe

The artifact's content is a set of modules/packages and their dependency relationships (an architecture overview, a module inventory).

## Primitives composed

- Clickable inline SVG (nodes = modules, edges = dependencies) → detail-panel primitive.
- A detail `<div>` per module showing its responsibilities, dependencies, and dependents.
- TOC listing modules alphabetically as a fallback navigation path (not everyone can click SVG nodes precisely).
- Token layer, theme toggle, three exporters.

## Section skeleton

1. Inline SVG map (nodes clickable).
2. One detail panel per module (initially hidden, revealed on node click or TOC link).
3. A plain dependency table as the accessible/plaintext-recoverable fallback of the same facts.

## Island fields this recipe projects

Module/dependency facts have no dedicated fixed-core field; they live in `ext.modules[]` (`{ id, responsibilities, depends_on[], dependents[] }`), with the SVG and detail panels projecting only what's in `ext.modules[]`.

## Bespoke-drafting note

If the module count is large (>15), skip the SVG map and render the plain dependency table as the primary view — a cluttered force-directed-by-hand SVG is worse than a sortable table.
