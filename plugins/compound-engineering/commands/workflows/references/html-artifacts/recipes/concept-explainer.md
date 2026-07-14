# Recipe: `concept-explainer`

- **Family:** research-strategy
- **Type:** explainer
- **Tags:** concept, non-code, onboarding

**Intent:** Plain-language explainer of one concept with a worked example.

## When to select this recipe

The artifact's job is to teach one concept clearly to a non-specialist reader — no execution plan, no code.

## Primitives composed

- Long-form prose sections with a TOC.
- A single worked example, set off visually (a `<aside class="worked-example">` using the surface token, not a new color).
- Semantic-span highlighting only for key terms being defined (sparingly — this is a prose-first archetype).

## Section skeleton

1. Plain-language definition.
2. Why it matters (motivation).
3. Worked example.
4. Common misconceptions (if the source content states any — never invent them).

## Island fields this recipe projects

Almost entirely Tier-3 prose fields (`problem_narrative`/equivalent, plus `ext.explainer.worked_example`, `ext.explainer.misconceptions[]` if present).

## Bespoke-drafting note

This is the lightest-weight archetype in the gallery — resist adding tabs/accordions/tables the content doesn't need. A concept explainer that over-decorates plain prose is working against its own readability goal.
