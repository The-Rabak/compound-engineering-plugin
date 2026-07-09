# Recipe: `comparison-matrix`

- **Family:** research-strategy
- **Type:** matrix
- **Tags:** comparison, tradeoffs, evaluation

**Intent:** Side-by-side option-comparison table with a verdict row.

## When to select this recipe

The artifact's core content is a structured comparison across several options and criteria, with no separate narrative recommendation needed (contrast with `decision-brief`, which leads with a stated recommendation).

## Primitives composed

- A `<table>` with options as columns, criteria as rows, and a final "Verdict" row styled distinctly (border-top via `var(--border)`, bold text — no new color).
- Semantic-span highlighting for pass/fail/partial cells (three span classes max, driven by token-layer colors).

## Section skeleton

1. Criteria/options table.
2. Verdict row.
3. Short caveats prose beneath the table.

## Island fields this recipe projects

`ext.comparison.options[]`, `ext.comparison.criteria[]`, `ext.comparison.cells[][]` — bespoke, island-backed.

## Bespoke-drafting note

If the matrix would exceed ~6 columns, consider transposing (criteria as columns, options as rows) so the table stays readable on a standard viewport without horizontal scroll dominating the reading experience.
