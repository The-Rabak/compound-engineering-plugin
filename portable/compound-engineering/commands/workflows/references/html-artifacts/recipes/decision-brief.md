# Recipe: `decision-brief`

- **Family:** research-strategy
- **Type:** brief
- **Tags:** decision, tradeoffs, recommendation

**Intent:** Options-considered brief with a stated recommendation.

## When to select this recipe

The artifact presents a decision: the options considered, their tradeoffs, and a recommendation.

## Primitives composed

- A comparison-matrix table (options × criteria).
- A prominent "Recommendation" callout (styled with `var(--accent)`, not a new color).
- Risk/impact table for the recommendation's known risks.

## Section skeleton

1. Recommendation (stated up front, not buried at the end).
2. Options considered (comparison matrix).
3. Risks of the recommended option.
4. Rationale prose.

## Island fields this recipe projects

`ext.decision.options[]` (`{ name, pros[], cons[] }`), `ext.decision.recommendation`, `ext.decision.risks[]` — bespoke, island-backed. If the artifact already has a fixed-core `success_criteria[]`/`tdd.exceptions[]`-shaped array that legitimately covers the risks, reuse it instead of duplicating into `ext`.

## Bespoke-drafting note

Never let the visual prominence of the "Recommendation" callout outrun what the source content actually concludes — if the input is genuinely undecided between options, the brief should say so instead of manufacturing a confident-looking recommendation.
