# Gallery Manifest

**This is the only file the composer reads on every generation.** Classify the artifact's intent (type + tags), scan the table below, and load only the matched `path` file(s) — never the whole `archetypes/`/`recipes/` tree. This is what keeps a broad gallery cheap (`CONTEXT.md` → **Archetype**; the brainstorm's "tag-driven selective retrieval").

`type` is the document's primary shape; `tags[]` are additional matchable facets. An artifact commonly composes more than one row — a full-stack `plan` typically matches `implementation-plan` + `milestone-grid` + `risk-table`, and sometimes `flowchart`.

Full HTML exemplars exist **only** for the four plan-composing rows (`storage: exemplar`); every other row is a compact recipe sheet (`storage: recipe`) that also doubles as the bespoke-drafting blueprint when nothing in the gallery fits.

| id | family | type | tags[] | one-line-intent | storage | path |
|---|---|---|---|---|---|---|
| `implementation-plan` | planning | plan | vertical-slices, execution, tdd, evidence | Full execution plan: WHY anchor, execution slices as tabs, success criteria as stat-cards | exemplar | `archetypes/implementation-plan.html` |
| `flowchart` | infra-ops | diagram | pipeline, architecture, sequence | Clickable-SVG pipeline/architecture diagram with a detail panel per node | exemplar | `archetypes/flowchart.html` |
| `milestone-grid` | planning | roadmap | timeline, dependencies, sequencing | Ordered timeline of execution units showing dependency chains | exemplar | `archetypes/milestone-grid.html` |
| `risk-table` | planning | risk | exceptions, waivers, impact | Risk/impact table rendered from an island's exception/waiver arrays | exemplar | `archetypes/risk-table.html` |
| `code-review-pr-writeup` | code | review | diff, comments, pr | Diff-rows + comment-bubble writeup of a reviewed change set | recipe | `recipes/code-review-pr-writeup.md` |
| `module-map` | code | reference | architecture, dependencies, modules | Clickable module/dependency map with a detail panel per module | recipe | `recipes/module-map.md` |
| `component-variants` | code | reference | ui, design-system, variants | Grid of component variants with props/state called out per card | recipe | `recipes/component-variants.md` |
| `design-system` | code | reference | tokens, components, guidelines | Token + component reference sheet for a design system | recipe | `recipes/design-system.md` |
| `status-report` | infra-ops | report | metrics, health, weekly | Stat-card health/metrics snapshot for a recurring status update | recipe | `recipes/status-report.md` |
| `incident-postmortem` | infra-ops | postmortem | timeline, root-cause, action-items | Timeline of an incident plus root-cause and action-item table | recipe | `recipes/incident-postmortem.md` |
| `deployment-rollout-checklist` | infra-ops | checklist | rollout, go-no-go, verification | Accordion checklist of go/no-go gates for a deployment | recipe | `recipes/deployment-rollout-checklist.md` |
| `visual-design-directions` | design | moodboard | palette, typography, direction | Side-by-side visual-direction comparison with token swatches | recipe | `recipes/visual-design-directions.md` |
| `prototype-animation-interaction` | design | prototype | motion, interaction, states | Clickable interaction-state walkthrough for a motion/prototype spec | recipe | `recipes/prototype-animation-interaction.md` |
| `concept-explainer` | research-strategy | explainer | concept, non-code, onboarding | Plain-language explainer of one concept with a worked example | recipe | `recipes/concept-explainer.md` |
| `feature-explainer` | research-strategy | explainer | feature, user-facing, walkthrough | User-facing walkthrough of a feature's behavior and value | recipe | `recipes/feature-explainer.md` |
| `decision-brief` | research-strategy | brief | decision, tradeoffs, recommendation | Options-considered brief with a stated recommendation | recipe | `recipes/decision-brief.md` |
| `comparison-matrix` | research-strategy | matrix | comparison, tradeoffs, evaluation | Side-by-side option-comparison table with a verdict row | recipe | `recipes/comparison-matrix.md` |
| `roadmap-triage-board` | research-strategy | board | triage, prioritization, backlog | Kanban-style triage board grouping items by disposition | recipe | `recipes/roadmap-triage-board.md` |
| `slide-deck` | research-strategy | deck | narrative, presentation, sections | Full-bleed section-per-slide narrative deck with a progress rail | recipe | `recipes/slide-deck.md` |

## Retrieval rule

1. Classify the artifact: primary `type` + a handful of `tags`.
2. Scan this table only (never open `archetypes/`/`recipes/` files during classification).
3. Load the exemplar/recipe file(s) whose `type`/`tags[]` best match — typically 1-4 rows for a `plan`.
4. If no row's `type`/`tags[]` combination fits, draft a bespoke throwaway template directly from `primitives-catalog.md`, still island-first (see `html-artifact-composer/SKILL.md`).
5. This manifest is the natural registration point if the gallery ever grows with drafted bespoke templates in a future version — not built in v1.
