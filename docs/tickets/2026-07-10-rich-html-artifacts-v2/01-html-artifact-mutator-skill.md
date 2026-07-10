---
ticket_id: T01
title: html-artifact-mutator skill (the update capability)
kind: infra-track
status: completed
plan_ref: docs/plans/2026-07-09-feat-rich-html-artifacts-v2-plan.md
tickets_ref: docs/tickets/2026-07-10-rich-html-artifacts-v2/index.md
architecture_ref: docs/architecture/2026-07-09-rich-html-artifacts-architecture.md
source_packet_ref: "## Execution Slices > Slice 1 — Island-mutation skill (the update capability)"
feature_home: portable/compound-engineering/skills/html-artifact-mutator
depends_on: []
dependency_type: none
serves:
  - "SC1 — Safe update: extract after any mutation still satisfies the field-coverage map and no HTML fact lacks an island field."
files:
  - portable/compound-engineering/skills/html-artifact-mutator/SKILL.md
  - portable/compound-engineering/commands/workflows/references/html-artifacts/island-contract.md
  - tests/html-artifact-mutation.test.ts
  - tests/published-surface.test.ts
  - README.md
  - .claude-plugin/marketplace.json
  - plugins/compound-engineering/.claude-plugin/plugin.json
  - plugins/compound-engineering/README.md
test_command: bun test tests/html-artifact-mutation.test.ts
tdd_mode: inherit
---

# html-artifact-mutator skill (the update capability)

## Serves

SC1 — the shared, single-owner **update** path. Given a `plan.html`, a scalar patch (`status`) and a content mutation (rewrite a slice) both round-trip through the skill: island stays valid, the field-coverage map holds, and the design stays stable via the recorded `render_meta`. This is the enabling foundation every mutating consumer (T02–T04, ~7 total) wires through.

## Scope

**Owns:**
- The new mutation skill `portable/compound-engineering/skills/html-artifact-mutator/SKILL.md`: read → parse (via the shared `extractIslandData` contract) → mutate → re-serialize (via the **v1 escaping primitive**) → re-project when content changed.
- The **two mutation classes** and the **mutable-region policy** (define it explicitly — it is currently unstated):
  - **scalar / contract-field class** — touches only Tier-1 envelope refs/status; patch the island field in place, **no** re-projection. Optional single-element rendered update; graceful fallback appends a rendered "Related Artifacts" section + logs if the in-place patch is unsafe.
  - **content class** — touches Tier-2 contract-core content / Tier-3 prose / Tier-4 `ext{}`, then **re-projects the affected view from the island** using the recorded `render_meta` so the design stays stable.
- Extending `references/html-artifacts/island-contract.md` with the **mutation contract** + the `render_meta` re-projection rules (the genuine new work is the `render_meta` *reader* — reuse the recorded `{ archetypes, design_seed }` instead of re-classifying).
- `tests/html-artifact-mutation.test.ts` (Ralph red → green → refactor).
- The **count-changing bookkeeping**: this skill takes skills **28 → 29**. Update the descriptive count string in all four sites (root `README.md`, `plugins/compound-engineering/README.md`, `plugins/compound-engineering/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`) to `38 specialized agents, 27 commands, and 29 skills`, and flip **both** the positive `toContain` and the negative wrong-permutation `not.toContain` assertions in `tests/published-surface.test.ts`.

**Non-goals:** wiring any consumer (T02–T04 do that). Do not fold mutation into the composer — composition (create) and mutation (update) stay separate skills.

## Scope Fence

- **No new npm/runtime dependency** (hard invariant, same as v1).
- **Reuse the v1 serialization/extraction primitive — do NOT re-implement it.** The mutation test imports the canonical `serialize`/`extract`/`extractIslandData` reference impl from `tests/html-artifact-island.test.ts`; the skill *references* the prose spec in `island-contract.md`. Neither hand-rolls parsing, re-derives the escape, nor ships a runnable serialize/extract module inside any artifact.
- The escape is **JSON-level unicode** (`<`→`<`, `>`, `/`, U+2028/U+2029) with `extract` a bare `JSON.parse` and **no** unescape step. The `<`→`&lt;` sketch from earlier prose is **non-reversible inside `<script type="application/json">` and must not be used.**
- Do not migrate already-generated `plan.html` — `render_meta` shipped with a pinned shape in v1 precisely so no migration is needed.

## Acceptance Criteria

- Both mutation-class round-trips pass: scalar patch preserves all other fields byte-identically; content mutation + re-projection still satisfies the field-coverage map.
- Re-projection stability holds: the same `render_meta` (`{ archetypes, design_seed }`) yields a stable design (no classifier drift between edits).
- Malformed-island mutations **fail loud** — mutating a missing / empty / truncated-unparseable / missing-required-key island throws or returns `{ ok: false, error: <code> }` (never a silent-empty or partial write), reusing `extractIslandData`'s 4 error codes (`MISSING_ISLAND` / `EMPTY_ISLAND` / `INVALID_JSON` / `MISSING_REQUIRED_FIELD`).
- No HTML fact exists without a backing island field (island-first + **no-added-facts** invariant preserved on every edit).
- `bun test tests/html-artifact-mutation.test.ts` green; full `bun test` green; `bun run build:platforms` run and `bun run verify:generated` clean; the flipped `published-surface.test.ts` count assertions pass.

## Shared / Global Notes

The mutation skill is genuinely cross-feature infrastructure — one shared owner serving ~7 mutating consumers is the justified extraction (brainstorm Key Decision): the only way to keep island-first + no-added-facts + re-projection identical everywhere. It lives in `skills/` (shared), not inside any one command's feature home. The count-string sites (`README.md`, `plugin.json`, `marketplace.json`) and `published-surface.test.ts` are repo-global surfaces touched here **only** because this is the sole count-changing ticket in the set.

## Local Context

- **Canonical WHY source:** `docs/brainstorms/2026-07-09-rich-html-artifacts-brainstorm.md`.
- **This ticket serves:** giving the whole chain a safe, single-owner in-place edit path so mutations never corrupt the machine contract or leave the human view stale.
- **Concrete files/interfaces that matter now:**
  - Reference impl to import in the test: `tests/html-artifact-island.test.ts` (`serialize`/`extract` ~`:128–148`, the deliberately un-shippable spec).
  - Prose spec the skill references: `island-contract.md` (serialization `:124–149`; `extractIslandData` + 4 error codes `:151–169`; `render_meta` fixed-core key `:34,36–48`).
  - The boundary is already reserved: `skills/html-artifact-composer/SKILL.md:111` — the composer explicitly refuses to mutate ("that is the (v2, not yet built) island-mutation skill's job"). The mutator's content re-projection *dispatches* the composer-style projection in a fresh subagent (per the composer Invocation contract `SKILL.md:15–23`); it does not fold projection into itself.
- **Architectural boundary notes:** keep create vs update as two skills; content-class re-projection reuses the composer's fresh-subagent dispatch + the same `design_seed`/`render_meta` recipe.
- **Explicit unknowns to surface (do not guess):** the **mutable-region policy** is not yet written in the shipped contract (flagged as an open contract edge in the architecture handoff) — author it here as scalar→Tier-1 only, content→Tier-2/3/4 + re-project. If the in-place scalar patch turns out unsafe for a given field, exercise the graceful "Related Artifacts" fallback + log rather than a risky rewrite.

## Parent Refs

- Plan: `docs/plans/2026-07-09-feat-rich-html-artifacts-v2-plan.md` → `## Execution Slices > Slice 1` + its `#### Deepening (grounded against shipped v1)`.
- Architecture handoff: `docs/architecture/2026-07-09-rich-html-artifacts-architecture.md` (reserves the `render_meta` reader + the open mutable-region edge for v2).
- Ticket set: `docs/tickets/2026-07-10-rich-html-artifacts-v2/index.md`.

## Deeper-Dive Refs

- Plan `## Implementation > Component-count bookkeeping` — the exact four count sites + the `published-surface.test.ts` pin, and the `build:platforms` / `verify:generated` discipline.
- Plan `## TDD & Evidence Contract` + `## Suggested E2E Suite` scenarios 1–3 (mutation round-trip, re-projection stability, malformed-island + new-kind field-coverage — the automated `bun test` floor).
- v1 grounding ticket: `docs/tickets/2026-07-09-rich-html-artifacts-v1/01-island-contract-serialization-and-schema.md` (serialization primitive, `render_meta` shape, fail-loud negatives to mirror).

## Coupling Notes

- **Hard external prerequisite (already complete):** v1 Slices B + C — the island schema, serialization primitive, `render_meta` writer, `extractIslandData`, and composer. Nothing in v1 is re-done here.
- **Downstream:** T02, T03, T04 all consume this skill (read-only dependency — they route through it, they do not edit it). T05/T06 do not touch it.
- **Shared-tree coupling:** runs `bun run build:platforms`; this regenerates the whole generated tree, which is why every ticket in this set stays in its own sequential batch.
