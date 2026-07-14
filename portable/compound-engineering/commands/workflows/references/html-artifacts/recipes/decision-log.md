# Recipe: `decision-log`

- **Family:** planning
- **Type:** brainstorm
- **Tags:** decisions, resolved-questions, narrative

**Intent:** Narrative WHY-context with a decision spine and a resolved-questions accordion.

## When to select this recipe

The artifact's core content is a chronological/logical sequence of resolved decisions and answered questions rather than an execution plan — a brainstorm, a `grill-with-docs` session recap, or a decision-heavy retro. Pairs with (and is the primary companion recipe for) the `brainstorm-narrative` archetype; reach for this recipe sheet alone when a bespoke document needs only the decision/Q&A portion, not the full narrative layout.

## Primitives composed

- A vertical "decision spine" (`ol.decision-spine`, a `primitives-catalog.md` timeline variant): one marker per `key_decisions[]` entry, decision as the heading, rationale as the supporting line — visually distinct from the `milestone-grid` archetype's dependency timeline (no `data-status`, no dependency text; a decision has no "pending/done" state).
- The catalog's single-open accordion (`<details name="...">`) for `resolved_questions[]`: one `<details>` per entry, the question as `<summary>`, the answer inside. Keep the **first** entry `open` by default (mirrors `implementation-plan`'s "first tab selected" convention) so the section never reads as empty on first paint.
- A pull-quote-style callout (`blockquote`, left border in `var(--accent)`) for `user_story` — gives the WHY anchor visual weight without a stat-card grid, which would over-imply the brainstorm is an execution artifact.

## Section skeleton

1. Why (`problem_narrative` prose + `user_story` pull-quote).
2. Chosen Approach (prose), optionally beside a compact "Also considered" aside sourced from `approaches_considered` when it names a specific rejected alternative.
3. Key Decisions (decision spine).
4. Resolved Questions (accordion).
5. Success Criteria (plain checklist, not stat-cards — a brainstorm's success criteria are outcomes to recognize, not metrics to track).

## Island fields this recipe projects

`problem_narrative`, `user_story`, `chosen_approach`, `key_decisions[]` (`{decision, rationale}`), `resolved_questions[]` (`{question, answer}`), `success_criteria[]` — all brainstorm-kind Tier-2 contract-core fields (`island-contract.md`). `approaches_considered` (Tier-3 prose) only when it names a concrete alternative worth an aside.

## Bespoke-drafting note

Never render a decision or a resolved question the island doesn't carry — an empty `key_decisions[]`/`resolved_questions[]` array means a quiet, honest empty state (or omitting the section entirely), never an invented placeholder decision. If `open_questions[]` is non-empty on the island being projected, that is itself a signal the brainstorm was finalized prematurely — render it plainly if present, but do not hide it or silently fold it into "Resolved Questions."
