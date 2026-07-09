# Recipe: `roadmap-triage-board`

- **Family:** research-strategy
- **Type:** board
- **Tags:** triage, prioritization, backlog

**Intent:** Kanban-style triage board grouping items by disposition.

## When to select this recipe

The artifact groups a set of items (todos, findings, backlog entries) into disposition columns for triage — a natural fit for `/workflows:triage`-shaped content.

## Primitives composed

- A CSS-grid "board" of columns (one per disposition: e.g. "Fix now", "Defer", "Won't fix"), each column a scrollable list of card-style items (reuses the stat-card visual language).
- TOC entries jump to each column (helpful once a column grows long).

## Section skeleton

1. Board: one column per disposition, cards inside.
2. A short rationale line per card (why it landed in that column).

## Island fields this recipe projects

`ext.triage.items[]` (`{ id, summary, disposition, rationale }`) — bespoke, island-backed. `disposition` drives which column an item's card renders in; the composer must place every item in the column its own island field says, never re-sort items by its own judgment at render time.

## Bespoke-drafting note

On narrow viewports, stack columns vertically rather than forcing horizontal scroll — the responsive invariant applies to board layouts too.
