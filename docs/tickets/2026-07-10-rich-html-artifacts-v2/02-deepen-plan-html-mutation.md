---
ticket_id: T02
title: deepen-plan on plan.html + scalar back-writes
kind: tracer-bullet
status: ready
plan_ref: docs/plans/2026-07-09-feat-rich-html-artifacts-v2-plan.md
tickets_ref: docs/tickets/2026-07-10-rich-html-artifacts-v2/index.md
architecture_ref: docs/architecture/2026-07-09-rich-html-artifacts-architecture.md
source_packet_ref: "## Execution Slices > Slice 2 — `deepen-plan` on `plan.html` + scalar back-writes"
feature_home: portable/compound-engineering/commands/deepen-plan.md
depends_on:
  - T01
dependency_type: hard
serves:
  - "SC2 — /deepen-plan enriches a plan.html in place (content mutation → re-projection) and scalar back-writes (status, tickets_ref) work, design held stable via render_meta."
files:
  - portable/compound-engineering/commands/deepen-plan.md
test_command: "bun test  +  real /workflows:plan → /deepen-plan equivalence chain (manual)"
tdd_mode: inherit
---

# deepen-plan on plan.html + scalar back-writes

## Serves

SC2 — the first true vertical tracer bullet: `/deepen-plan` enriches an existing `plan.html` in place (content enrichment → re-projection via the mutator) and lands `status` / `tickets_ref` back-writes, with the design held stable via the recorded `render_meta`.

## Scope

**Owns:**
- Making `deepen-plan.md`'s **plan discovery** (the `ls -la docs/plans/` glob, ~`:30`) and its **"1. Load The Current Plan Contract" step** (~`:96–117`) **dual-read / `.html`-aware** — via the `island-extraction-helper.md` contract (locate `#artifact-data`, `JSON.parse`, read fixed-core only, never scrape HTML).
- Routing enrichment and back-writes through the T01 skill:
  - **content enrichment** → mutator **content class** (fresh-subagent re-projection via the recorded `render_meta`).
  - **`status` / `tickets_ref` back-writes** → mutator **scalar class** (inline is fine per the dispatch carve-out for scalar-only patches).
- Adding `.html` plan dual-read to any status/ref back-writer inside `deepen-plan.md`.

**Non-goals:** any change to the mutation skill itself (T01 owns it); brainstorm/architecture conversion (T03/T04). Only the *plan* read+mutate path of `deepen-plan.md` changes here.

## Scope Fence

- brainstorm and architecture stay `.md` until their slices (T03/T04).
- Do not touch `plan.md`'s own HTML **output** path (shipped in v1) — this ticket is about `deepen-plan` *consuming and mutating* a `plan.html`, not about how the plan is first emitted.
- Keep the dual-read branch **feature-local and deletable** — it is a temporary compatibility seam per the architecture handoff. Mirror the shipped idiom; do not invent a new detection style.
- No new npm dependency; do not re-implement extraction (use the shared helper).

## Acceptance Criteria

- **deepen-plan real chain (manual)** passes: generate `plan.html` (v1 composer) → `/deepen-plan` → re-extract.
  - **Floor:** the enriched island still carries the full `plan`-kind required set **and** the enrichment is actually present (non-empty new content in the targeted slice/section).
  - **Assert:** content mutation re-projected via the recorded `render_meta` (design stable); scalar `status`/`tickets_ref` back-writes land in the island (graceful "Related Artifacts" fallback exercised if the in-place patch is unsafe).
  - **Oracle:** normalize away the trailing `.(md|html)` on `*_ref` values, then deep-equal the sorted machine-consumed field set; any other diff = FAIL; a suspiciously all-green run is itself a finding.
- `bun test` green; `bun run build:platforms` run and `bun run verify:generated` clean.

## Shared / Global Notes

Consumes the shared `html-artifact-mutator` skill (T01) read-only — routes through it, does not modify it. Uses the shared `island-extraction-helper.md` contract for dual-read. No business logic moves to shared dirs; the feature home is the `deepen-plan` command file.

## Local Context

- **Canonical WHY source:** `docs/brainstorms/2026-07-09-rich-html-artifacts-brainstorm.md`.
- **This ticket serves:** proving the update capability end-to-end on the one artifact that is already HTML (`plan`), so the whole enrich-in-place loop the feature exists to strengthen actually works.
- **Concrete files/interfaces that matter now:**
  - `commands/deepen-plan.md` — **greenfield wiring**: it has **zero** dual-read today (no `.html`/`island`/`artifact-data` reference anywhere). Consequence: it currently **cannot even read a v1-shipped `plan.html`**. The cited `:25–117` is *where to add* discovery + contract-load dual-read, not a claim that any dual-read already lives there.
  - Idiom to mirror (do not invent): the shipped dual-read prose in `commands/workflows/to-issues.md:67–72`, `commands/workflows/work.md:58–74`, `commands/workflows/review.md:111–116`.
  - Helper contract: `references/html-artifacts/island-extraction-helper.md`.
- **Architectural boundary notes:** content enrichment must re-project (fresh subagent, recorded `render_meta`); scalar patches may run inline. Never let the re-projection fabricate a fact absent from the island.
- **Explicit unknowns to surface:** the plan's back-writer locations inside `deepen-plan.md` — confirm every status/ref write path is made `.html`-aware, not just the primary one.

## Parent Refs

- Plan → `## Execution Slices > Slice 2` + its `#### Deepening (grounded against shipped v1)`.
- Architecture handoff: `docs/architecture/2026-07-09-rich-html-artifacts-architecture.md`.
- Ticket set: `docs/tickets/2026-07-10-rich-html-artifacts-v2/index.md`.

## Deeper-Dive Refs

- Plan `## Suggested E2E Suite` scenario 4 (deepen-plan real chain — the floor + oracle procedure, re-authored from v1's T05 gate).
- v1 equivalence-gate protocol: `docs/tickets/2026-07-09-rich-html-artifacts-v1/05-pilot-equivalence-gate-l3-l4.md` (the manual chain this re-authors).
- T01 (`01-html-artifact-mutator-skill.md`) for the two mutation classes and the fresh-subagent dispatch carve-out.

## Coupling Notes

- **Hard dependency:** T01 (the mutation skill must exist before its consumer can route through it).
- **File overlap with T04:** T04 later adds the `.html` *architecture* dual-read into this same `deepen-plan.md`. That is why T02 and T04 stay in separate sequential batches — never parallel.
- **Shared-tree coupling:** runs `bun run build:platforms`.
