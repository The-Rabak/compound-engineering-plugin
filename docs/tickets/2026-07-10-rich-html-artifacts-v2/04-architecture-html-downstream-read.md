---
ticket_id: T04
title: Convert architecture to HTML + mutation + downstream dual-read
kind: expansion
status: ready
plan_ref: docs/plans/2026-07-09-feat-rich-html-artifacts-v2-plan.md
tickets_ref: docs/tickets/2026-07-10-rich-html-artifacts-v2/index.md
architecture_ref: docs/architecture/2026-07-09-rich-html-artifacts-architecture.md
source_packet_ref: "## Execution Slices > Slice 4 — Convert `architecture` -> HTML + mutation + downstream dual-read"
feature_home: portable/compound-engineering/commands/workflows/architecture.md
depends_on:
  - T01
dependency_type: hard
serves:
  - "SC4 — /workflows:architecture emits architecture.html, mutable in place; deepen-plan/review/work dual-read it equivalently to the .md path."
files:
  - portable/compound-engineering/commands/workflows/references/html-artifacts/island-contract.md
  - portable/compound-engineering/commands/workflows/references/html-artifacts/archetypes/
  - portable/compound-engineering/commands/workflows/references/html-artifacts/recipes/
  - portable/compound-engineering/commands/workflows/references/html-artifacts/gallery-manifest.md
  - portable/compound-engineering/commands/workflows/architecture.md
  - portable/compound-engineering/commands/deepen-plan.md
  - portable/compound-engineering/commands/workflows/review.md
  - portable/compound-engineering/commands/workflows/work.md
  - tests/fixtures/html-artifacts/
  - tests/html-artifact-island.test.ts
test_command: "bun test (architecture-kind field-coverage L2)  +  manual architecture chain"
tdd_mode: inherit
---

# Convert architecture to HTML + mutation + downstream dual-read

## Serves

SC4 — `/workflows:architecture` emits an `architecture.html`, mutable in place; `deepen-plan` / `review` / `work` dual-read it equivalently to the `.md` path.

## Scope

**Owns:**
- **Schema first (schema-before-composer discipline):** author the **`architecture`-kind field-coverage map + Tier-2 contract core** in `island-contract.md`, covering the fields `deepen-plan`/`review`/`work` actually consume: Feature Homes, Shared/Global Decisions, Deepening Candidates, Deletion Test, Interfaces, Seams/Adapters/Contracts, Drift Checks, Recommendations. Add an L2 completeness assertion for the `architecture` kind.
- Architecture **archetype exemplar(s)** + **recipe sheet(s)** + `gallery-manifest.md` entries.
- Rewrite `architecture.md`'s write-step (`:118–131`) to **dispatch the composer via the fresh-subagent pattern** (mirror `plan.md:339–359`).
- Architecture mutation via the T01 skill (content-class re-projection).
- Add `.html` architecture dual-read to: `deepen-plan.md`; `review.md` (**architecture discovery is `:128–139`**, not `:121–130`); `work.md` (**`:89` is the architecture *read* — "read that artifact and extract feature homes…"; `:90` is the no-artifact fallback**, so wire the read at `:89`, span `:88–90`).
- **Fold in the `architecture.md` plan-lookup fix while in the file:** its own plan discovery (`ls -t docs/plans/*-plan*.md`, `:24`) is still `.md`-only and cannot find a v1 `plan.html` — make it dual-read here (cheap, same file, prevents a silent miss).
- Add a frozen pre-migration `.md` architecture fixture + a representative `.html` architecture fixture under `tests/fixtures/html-artifacts/`.

**Non-goals:** brainstorm conversion (T03); the broader non-primary consumers (`constitution-guardian`, `document-review`, `session-history`) — swept in T05.

## Scope Fence

- Only architecture-pointing discovery/read paths change; the plan (v1) and brainstorm (T03) output paths are untouched.
- The `:128` architecture read span in `review.md` is owned here; T05 owns the *other* `review.md` spans (`:102` glob, `:212` reference-docs listing) — do not stray into them.
- No new npm dependency; reuse the v1 serialization primitive + the composer fresh-subagent contract.

## Acceptance Criteria

- **architecture real chain (manual)** passes: `/workflows:architecture` → `architecture.html` → `deepen`/`review`/`work` dual-read it.
  - **Floor:** the architecture island is non-vacuous — Feature Homes, Shared/Global Decisions, Deepening Candidates, Drift Checks, Recommendations present.
  - **Cross-arm:** each downstream consumer, fed the frozen `.md` architecture vs the `.html` architecture, extracts an equivalent architecture handoff under the oracle (normalize `.(md|html)` on `*_ref`, sorted deep-equal of machine-consumed fields; any other diff = FAIL; a suspiciously all-green run is itself a finding).
- `bun test` green including the new `architecture`-kind L2 field-coverage assertion; `bun run build:platforms` run and `bun run verify:generated` clean.

## Shared / Global Notes

The `architecture`-kind core joins the shared `island-contract.md` as a per-kind section (envelope stays shared, per-kind fields stay out of the fixed-core). Consumes the shared composer + T01 mutator read-only. The downstream reads in `deepen-plan`/`review`/`work` reuse the shared `island-extraction-helper.md` dual-read idiom — feature-local, deletable seams.

## Local Context

- **Canonical WHY source:** `docs/brainstorms/2026-07-09-rich-html-artifacts-brainstorm.md`.
- **This ticket serves:** closing the last conversion gap so the whole core-artifact chain is HTML-primary and every architecture consumer reads it losslessly.
- **Concrete files/interfaces that matter now:**
  - `architecture` is a **command file, not a skill** (`commands/workflows/architecture.md`, write-step `:118–131`), writing plain `.md` today with no composer — rewrite mirrors `plan.md:339–359` (same as T03).
  - **Corrected citation:** architecture discovery/read in `review.md` is **`:128–139`** ("If an architecture_ref or matching docs/architecture/*.md artifact exists, read it and extract:" … through the fallback), **not** `:121–130` (which is the generic fixed-core extraction bullet list). Use the corrected span.
  - `work.md:89` — the architecture *read* ("read that artifact and extract feature homes…"); make it `.html`-aware. `work.md:90` is the *no-architecture fallback* (build a handoff from the plan), **not** the read — do not mistake the fallback for the read path.
  - Helper contract + dual-read idiom: `references/html-artifacts/island-extraction-helper.md`; shipped idioms in `to-issues.md`/`work.md`/`review.md`.
- **Architectural boundary notes:** pin the `architecture`-kind schema before wiring the composer to it (same discipline as T03).
- **Explicit unknowns to surface:** confirm which of the architecture core sections are truly *machine-consumed* by `deepen-plan`/`review`/`work` vs prose-only, so the required field set (and the equivalence oracle) is honest — surface any ambiguous field rather than forcing it into the fixed-core.

## Parent Refs

- Plan → `## Execution Slices > Slice 4` + its `#### Deepening (grounded against shipped v1)`.
- Architecture handoff: `docs/architecture/2026-07-09-rich-html-artifacts-architecture.md`.
- Ticket set: `docs/tickets/2026-07-10-rich-html-artifacts-v2/index.md`.

## Deeper-Dive Refs

- Plan `## Suggested E2E Suite` scenario 6 (architecture real chain — floor + cross-arm oracle).
- Plan `## TDD & Evidence Contract` (new-kind field-coverage L2 requirement).
- v1 equivalence-gate protocol: `docs/tickets/2026-07-09-rich-html-artifacts-v1/05-pilot-equivalence-gate-l3-l4.md`.
- Composer skill: `skills/html-artifact-composer/SKILL.md`; island contract: `references/html-artifacts/island-contract.md`.

## Coupling Notes

- **Hard dependency:** T01 (mutation skill) and the v1 composer (external, complete). Logically independent of T02/T03, **but** file-sequenced after them.
- **File overlaps (why T04 is never batched with siblings):** `island-contract.md` + `gallery-manifest.md` + `tests/html-artifact-island.test.ts` with **T03** (each adds its own kind's field-coverage core / L2 assertion); `deepen-plan.md` with **T02**; `review.md` with **T05** (different span, but same file).
- **Shared-tree coupling:** runs `bun run build:platforms`.
