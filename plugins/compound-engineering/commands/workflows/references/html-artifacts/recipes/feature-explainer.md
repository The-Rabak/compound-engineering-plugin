# Recipe: `feature-explainer`

- **Family:** research-strategy
- **Type:** explainer
- **Tags:** feature, user-facing, walkthrough

**Intent:** User-facing walkthrough of a feature's behavior and value.

## When to select this recipe

The artifact explains a shipped or about-to-ship feature to an end user or stakeholder — behavior + value, not implementation.

## Primitives composed

- A short stat-card row for headline value props.
- Step-by-step walkthrough as an ordered list (reuses the timeline primitive's visual language without the dependency-chain semantics).
- Inline SVG or styled mock for any UI being described (never a screenshot — this stays dependency-free).

## Section skeleton

1. Value props (stat-cards).
2. Step-by-step walkthrough.
3. FAQ (accordion, single-open) if the source content has recurring questions.

## Island fields this recipe projects

`ext.feature.value_props[]`, `ext.feature.steps[]`, `ext.feature.faq[]` — bespoke, island-backed.

## Bespoke-drafting note

If no FAQ content exists, omit the accordion section entirely rather than rendering an empty one — never emit an empty primitive just because the archetype "usually" has it.
