---
ticket_id: T03
title: Composer skill generates the pilot plan.html (create capability)
kind: expansion
status: completed
plan_ref: docs/plans/2026-07-09-feat-rich-html-artifacts-v1-plan.md
tickets_ref: docs/tickets/2026-07-09-rich-html-artifacts-v1/index.md
architecture_ref: docs/architecture/2026-07-09-rich-html-artifacts-architecture.md
source_packet_ref: "## Execution Slices > Slice C"
feature_home: "portable/compound-engineering/skills/html-artifact-composer + portable/compound-engineering/commands/workflows/references/html-artifacts/ (design-DNA library)"
depends_on:
  - T01
dependency_type: hard
serves:
  - SC1 (navigable)
  - SC2 (single self-contained file)
  - SC4 (round-trip export)
  - SC5 (zero design effort)
  - SC6 (plaintext recoverability)
  - SC7 (any document intent)
files:
  - portable/compound-engineering/skills/html-artifact-composer/SKILL.md
  - portable/compound-engineering/commands/workflows/references/html-artifacts/primitives-catalog.md
  - portable/compound-engineering/commands/workflows/references/html-artifacts/gallery-manifest.md
  - portable/compound-engineering/commands/workflows/references/html-artifacts/archetypes/
  - portable/compound-engineering/commands/workflows/references/html-artifacts/recipes/
  - portable/compound-engineering/commands/workflows/plan.md
  - tests/published-surface.test.ts
  - tests/fixtures/html-artifacts/representative-plan.html
test_command: bun test
tdd_mode: inherit
---

# Composer skill generates the pilot plan.html (create capability)

## Serves

- **SC1/SC2/SC4/SC5/SC6/SC7** — the user-visible **create** capability: running `/workflows:plan` writes a self-contained interactive `plan.html` (island-first, projected HTML, token layer + theme toggle, TOC/side-nav, tabbed code viewer, single-open accordion, three exporters) instead of `.md`.

## Scope

- Author `skills/html-artifact-composer/SKILL.md`: classify (type + tags) → select/compose best-fit archetype(s) + primitives → draft a bespoke throwaway template when nothing fits → **project** the HTML from the island. Enforce **island-first generation order** and the one hard rule (every decision-bearing fact in the HTML traces to an island field; facts flow island→HTML only). Use **tag-driven selective retrieval** (read the manifest; load only matched exemplars/recipes). Enforce invariants (single self-contained file, token layer, JSON island via the T01 primitive, exporters, responsive, a11y, injection-safety). Populate `render_meta`.
- Author the design-DNA library: `primitives-catalog.md` (invariant token layer + light/dark toggle, TOC/side-nav, `[data-tabs]` viewer, single-open accordion, diff-rows, stat-cards, timeline, clickable-SVG→detail-panel, inline SVG figures + download, semantic-span highlighting, milestone/roadmap grid, risk/impact tables, injection-safe rendering, exporters, the island + inline exporter JS); `gallery-manifest.md` (one line per entry: `{ id, family, type, tags[], one-line-intent, path }` — the only file read on every generation); full HTML exemplars under `archetypes/` for the plan-composing archetypes (`implementation-plan`, `flowchart`, `milestone-grid`, `risk-table`); compact recipe sheets under `recipes/` across code / infra-ops / design / research-strategy families (also the bespoke-drafting blueprint format).
- Edit `commands/workflows/plan.md` artifact-write step (345–410): invoke the composer to emit `docs/plans/YYYY-MM-DD-<type>-<name>-plan.html`; plan continues to read its `.md` brainstorm input unchanged.
- Reconcile counts for the added skill (+1 → **28 skills**) via `bun run build:platforms` + update the skill count/description assertion in `tests/published-surface.test.ts`.
- Commit a representative generated `plan.html` fixture for the structural asserts.

## Scope Fence

- **Owns:** the composer skill, the design-DNA reference library, the manifest, plan-composing exemplars + the recipe gallery, and the `plan.md` write-step wiring.
- **Do not:** edit any downstream reader (T04); remove MDX (T02); build any mutation / re-projection (v2).
- **Full HTML exemplars only for the plan-composing archetypes;** the long tail ships as recipe sheets only.
- **No downstream file is edited here.** No new npm/runtime dependency; the exporter/serializer JS is inline, not an imported module.
- Do **not** do the version bump / consolidated CHANGELOG / `/release-docs` (T06); only reconcile the skill count/description this ticket touches.

## Acceptance Criteria

A generated `plan.html` — (a) embeds a valid `JSON.parse`-able island (unicode-escape primitive from T01) that satisfies the 4-tier field-coverage map; (b) is a single file with **no** external `http(s)` `src`/`href`/`@import`/`url()`; (c) presents TOC + tabs + single-open accordion + the three exporters (copy-as-JSON / prompt / markdown); (d) renders injection-safely; (e) is produced with **zero** user design input; (f) records `render_meta` as `{ archetypes: string[], design_seed: string }` (writer-only).

- Verify `.html` exemplars survive `sanitizeMarkdownTreeForTarget` untouched after `bun run build:platforms` — a one-line post-build diff on a fixture exemplar (the seam is already verified safe at `src/utils/target-content.ts:135`, which skips every non-`.md` file; this only guards against regression).
- `bun test` green (structural asserts over the committed `plan.html` fixture + the reconciled published-surface skill count/description).

## Shared / Global Notes

- The primitives catalog + token layer + gallery manifest are **shared/global** design DNA (reusable by any future doc-generating command). The composer is the **single writer** of artifacts; nothing depends on its internals, only on the island it produces.
- The **per-command island field set** (`plan`-specific fields) is **feature-local to the command**; it must not leak into the shared fixed-core (T01).

## Local Context

- **Canonical WHY source:** `docs/brainstorms/2026-07-09-rich-html-artifacts-brainstorm.md`.
- **This ticket serves:** delivering the create capability so a developer opens a generated `plan.html` and reads/navigates it in seconds instead of scrolling a Markdown wall.
- **Interfaces that matter now:** the island contract from **T01** (schema + `serialize`/`extract` primitive + field-coverage map) — the composer writes the island via this primitive; the `plan.md` write-step at `:345–410`; the build copy seam (`src/targets/claude.ts:132–138` `copyCommandReferenceDocs` recursively copies `references/` subtrees; `src/utils/target-content.ts:135` skips non-`.md`).
- **The one hard rule (preserve it in the skill):** every decision-bearing fact in the HTML traces to an island field; presentation may vary without limit, facts may not. Mold-breaking content goes in the Tier-4 open-extension region with island backing — never as HTML-only prose.
- **Breadth stays cheap:** the manifest is the only file read on every generation; tag-driven selective retrieval loads a handful of exemplars/recipes per generation. Do not load the gallery wholesale.
- **Unknowns to surface, not guess:** the committed representative `plan.html` fixture must live under a **non-gitignored** location — verified: `docs/plans/` is gitignored (`.gitignore:16`), so the fixture cannot live there; use the repo's `tests/fixtures/` convention (e.g. `tests/fixtures/html-artifacts/representative-plan.html`). Also confirm the precise structural-assert set the fixture must satisfy (island parses, field-coverage holds, single-file/no-external-deps, exporters present + inverse-of-serializer, injection-safe).

## Parent Refs

- Plan: `docs/plans/2026-07-09-feat-rich-html-artifacts-v1-plan.md` → `## Execution Slices > Slice C`
- Canonical WHY: `docs/brainstorms/2026-07-09-rich-html-artifacts-brainstorm.md`
- Architecture: `docs/architecture/2026-07-09-rich-html-artifacts-architecture.md`

## Deeper-Dive Refs

- Architecture → "Module Blueprint" (Design DNA library + Composer skill rows), "Seams, Adapters, and Contracts" (composer projection seam; build copy + sanitize seam), "Recommendations for /workflows:work".
- Domain language: `CONTEXT.md` (Composer skill, Archetype, Primitive, Projection, Projection recipe).
- Plan → SC1–SC7; "Suggested E2E Suite"; Slice C acceptance detail.
- Ticket **T01** (`island-contract.md`) — the contract this composer is built to.

## Coupling Notes

- **Hard dependency on T01** — build the composer against the locked island contract, never against an unpinned schema (guaranteed rework otherwise).
- **Not parallel-safe** with T02/T06: runs `bun run build:platforms` and edits `tests/published-surface.test.ts` (shared mutable surfaces). Separate sequential batch.
- **Blocks T04 (validation) and T05:** T04's dual-read is validated against a real `plan.html`, and T05's equivalence gate needs a freshly-composed `.html` arm. Generation quality is confirmed downstream by the L3 gate (T05), not by asserting exact HTML bytes here.
- **Largest ticket in the set — rides the "one focused run" ceiling, but the split is not mandatory.** This is ONE outcome (the create capability); the architecture deliberately co-homes the design-DNA library and the composer because they change for the same reason, and a design-DNA-only ticket would not be demoable. Do **not** trim the broad recipe gallery (justified as content-not-complexity). If execution proves it too big, the only honest internal seam is design-DNA-library (`references/html-artifacts/{primitives,manifest,archetypes,recipes}`) vs composer-skill + `plan.md` wiring + fixture — split there, never by trimming scope.
