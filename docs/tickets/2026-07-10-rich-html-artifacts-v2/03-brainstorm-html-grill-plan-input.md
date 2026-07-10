---
ticket_id: T03
title: Convert brainstorm to HTML + grill mutation + plan-input dual-read
kind: expansion
status: ready
plan_ref: docs/plans/2026-07-09-feat-rich-html-artifacts-v2-plan.md
tickets_ref: docs/tickets/2026-07-10-rich-html-artifacts-v2/index.md
architecture_ref: docs/architecture/2026-07-09-rich-html-artifacts-architecture.md
source_packet_ref: "## Execution Slices > Slice 3 — Convert `brainstorm` -> HTML + `grill-with-docs` mutation + plan input dual-read"
feature_home: portable/compound-engineering/commands/workflows/brainstorm.md
depends_on:
  - T01
dependency_type: hard
serves:
  - "SC3 — /workflows:brainstorm emits brainstorm.html; grill-with-docs mutates it in place; /workflows:plan reads a .html brainstorm on its input side (dual-read)."
files:
  - portable/compound-engineering/commands/workflows/references/html-artifacts/island-contract.md
  - portable/compound-engineering/commands/workflows/references/html-artifacts/archetypes/
  - portable/compound-engineering/commands/workflows/references/html-artifacts/recipes/
  - portable/compound-engineering/commands/workflows/references/html-artifacts/gallery-manifest.md
  - portable/compound-engineering/commands/workflows/brainstorm.md
  - portable/compound-engineering/skills/grill-me/SKILL.md
  - portable/compound-engineering/commands/workflows/plan.md
  - tests/fixtures/html-artifacts/
  - tests/html-artifact-island.test.ts
test_command: "bun test (brainstorm-kind field-coverage L2)  +  manual brainstorm → grill → plan chain"
tdd_mode: inherit
---

# Convert brainstorm to HTML + grill mutation + plan-input dual-read

## Serves

SC3 — `/workflows:brainstorm` emits a `brainstorm.html`; `grill-with-docs` rewrites a decision in place (content mutation → re-projection); `/workflows:plan` reads the `.html` brainstorm on its **input** side and produces an equivalent plan.

## Scope

**Owns:**
- **Schema first (schema-before-composer discipline):** author the **`brainstorm`-kind field-coverage map + Tier-2 contract core** in `island-contract.md`. The envelope stays shared; per-kind fields must **not** leak into the shared fixed-core. Add an L2 completeness assertion for the `brainstorm` kind.
- Brainstorm **archetype exemplar(s)** (depth) + **recipe sheet(s)** (breadth) under `references/html-artifacts/archetypes/` and `recipes/`, plus `gallery-manifest.md` entries.
- Rewrite `brainstorm.md`'s write-step (`:173`, replacing the hand-authored `.md` template at `:179–275`) to **dispatch the composer via the fresh-subagent pattern** (mirror `plan.md:339–359` exactly).
- Wire `grill-me` / `grill-with-docs` mutation through the T01 **content-class** path (re-project via `render_meta`) — not a bespoke edit.
- Add brainstorm-**input** dual-read to `plan.md`.
- Add a frozen pre-migration `.md` brainstorm fixture + a representative `.html` brainstorm fixture under `tests/fixtures/html-artifacts/` (mirrors v1's two-arm setup).

**Non-goals:** architecture conversion (T04); touching `plan.md`'s own HTML **output** path (v1). Only the brainstorm-input read path of `plan.md` changes.

## Scope Fence

- Architecture stays `.md` until Slice 4 (T04).
- Only the brainstorm-**input** read path of `plan.md` changes — do **not** touch `plan.md`'s HTML output path (shipped in v1).
- Variety, not convergence: brainstorm and plan artifacts must feel visibly different — the `design_seed` is the per-artifact aesthetic lever. Ground the composer with a *few* brainstorm exemplars + recipe sheets; **never load the whole gallery**.
- No new npm dependency; reuse the v1 serialization primitive and the composer's fresh-subagent Invocation contract — do not hand-write HTML or emit a `.md` output file.

## Acceptance Criteria

- **brainstorm + grill real chain (manual)** passes: `/workflows:brainstorm` → `brainstorm.html` → `grill-with-docs` mutation → `/workflows:plan` reads the `.html` brainstorm.
  - **Floor:** the brainstorm island is non-vacuous — Problem Narrative / User Story / Key Decisions / Resolved Questions fields present and non-empty; `handoff.*` all true.
  - **Cross-arm:** feed `/workflows:plan` the frozen pre-migration `.md` brainstorm vs the generated `.html` brainstorm; the WHY-context the plan extracts (and the plan it produces) is equivalent under the oracle (normalize `.(md|html)` on `*_ref`, sorted deep-equal of machine-consumed fields; any other diff = FAIL).
- `bun test` green including the new `brainstorm`-kind L2 field-coverage assertion; `bun run build:platforms` run and `bun run verify:generated` clean.

## Shared / Global Notes

The `brainstorm`-kind core is added to the shared `island-contract.md` but as a **per-kind** section — the shared fixed-core envelope must not absorb brainstorm-specific fields. Consumes the shared composer (create) and T01 mutator (update) read-only. `grill-with-docs` is routed through the shared content-class mutation path, not a per-command patch.

## Local Context

- **Canonical WHY source:** `docs/brainstorms/2026-07-09-rich-html-artifacts-brainstorm.md`.
- **This ticket serves:** extending the read-engagement contract from `plan` to `brainstorm` and proving in-place mutation on the artifact type that literally produced this feature's own brainstorm.
- **Concrete files/interfaces that matter now:**
  - `brainstorm.md` writes plain `.md` today with **no composer** (`:173` + hand-authored template `:179–275`) — the rewrite mirrors `plan.md:339–359`'s 3-part dispatch (load-and-follow the composer skill by reference / `target_path` / `payload`; on a missing-required-field report, fill from the payload and re-dispatch — never fabricate).
  - `grill-me` skill file: `skills/grill-me/SKILL.md` — `grill-with-docs` is the canonical brainstorm mutator; route it through the content-class re-project path.
  - Composer design-variety lever: `skills/html-artifact-composer/SKILL.md:77–86` (`design_seed`); Invocation contract `:15–23` (fresh subagent — brainstorm is already named as a future caller).
  - Fixtures pattern: `tests/fixtures/html-artifacts/representative-plan.html` + `frozen-premigration-plan.md`.
- **Architectural boundary notes:** pin the schema **before** building the composer wiring to it — skipping this order guarantees rework (v1's explicit warning for `plan`).
- **Explicit unknowns to surface:** the exact `brainstorm`-kind required field set — derive it from the fields `/workflows:plan` actually consumes on its brainstorm input (Problem Narrative, User Story, Key Decisions, Resolved Questions, `handoff.*`), and from the brainstorm workflow's own output contract; surface any field whose "machine-consumed vs prose-only" status is ambiguous rather than guessing it into the fixed-core.

## Parent Refs

- Plan → `## Execution Slices > Slice 3` + its `#### Deepening (grounded against shipped v1)`.
- Architecture handoff: `docs/architecture/2026-07-09-rich-html-artifacts-architecture.md` (`:68` — slot new kinds in without a multi-kind registry).
- Ticket set: `docs/tickets/2026-07-10-rich-html-artifacts-v2/index.md`.

## Deeper-Dive Refs

- Plan `## Suggested E2E Suite` scenario 5 (brainstorm + grill real chain — floor + cross-arm oracle).
- Plan `## TDD & Evidence Contract` (new-kind field-coverage L2 requirement).
- v1 equivalence-gate protocol: `docs/tickets/2026-07-09-rich-html-artifacts-v1/05-pilot-equivalence-gate-l3-l4.md`.
- Composer skill: `skills/html-artifact-composer/SKILL.md`; island contract: `references/html-artifacts/island-contract.md`.

## Coupling Notes

- **Hard dependency:** T01 (mutation skill) and the v1 composer (external, complete).
- **File overlap with T04:** both edit `island-contract.md` (T03 adds `brainstorm` kind, T04 adds `architecture` kind), `gallery-manifest.md` (each adds archetype entries), and `tests/html-artifact-island.test.ts` (each adds its kind's L2 field-coverage assertion). Sequential only — never batched together.
- **Hands to T05:** T05 later sweeps the remaining brainstorm-pointing refs in `workflow-next-step` / `document-review` / `session-history`; T03 changes only the brainstorm output + grill mutation + `plan.md` input read.
- **Shared-tree coupling:** runs `bun run build:platforms`.
