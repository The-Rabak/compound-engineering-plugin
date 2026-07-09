---
ticket_id: T01
title: Island contract — serialization primitive, fixed-core schema, field-coverage map
kind: tracer-bullet
status: completed
plan_ref: docs/plans/2026-07-09-feat-rich-html-artifacts-v1-plan.md
tickets_ref: docs/tickets/2026-07-09-rich-html-artifacts-v1/index.md
architecture_ref: docs/architecture/2026-07-09-rich-html-artifacts-architecture.md
source_packet_ref: "## Execution Slices > Slice B"
feature_home: portable/compound-engineering/commands/workflows/references/html-artifacts
depends_on: []
dependency_type: none
serves:
  - SC3 (zero contract loss, defined by the field-coverage map)
  - Verification Gate L1 (deterministic round-trip + fail-loud negatives)
  - Verification Gate L2 (field-coverage / migration-equivalence)
files:
  - portable/compound-engineering/commands/workflows/references/html-artifacts/island-contract.md
  - tests/html-artifact-island.test.ts
test_command: bun test tests/html-artifact-island.test.ts
tdd_mode: inherit
---

# Island contract — serialization primitive, fixed-core schema, field-coverage map

## Serves

- **SC3** — zero contract loss, defined concretely by the field-coverage map (not asserted informally).
- **Gate L1** — the serializer/extractor round-trips byte-for-byte on hostile payloads, and malformed islands fail loud.
- **Gate L2** — the island schema has a slot for every enumerated legacy plan contract element.
- Every downstream reader (T03 composer writes it; T04 helper reads it) depends only on this contract.

## Scope

- Author `island-contract.md`: the fixed-core (Tier 1 envelope + Tier 2 `plan` contract core) island schema v1, the open-extension region (Tier 4 `ext{}`), the serialization primitive spec + its inverse, and the authored 4-tier **field-coverage map**.
- Pin the serialization primitive as **JSON-level unicode escaping**: `serialize(x)` = `JSON.stringify(x)` then, inside that JSON string, replace `<`→`<`, `>`→`>`, `/`→`/`, U+2028→` `, U+2029→` `; `extract(s)` = `JSON.parse(<script>.textContent)` with **no** intermediate HTML-entity unescape step. The load-bearing escape is `<`→`<`.
- Pin `render_meta` shape (writer-only): `{ archetypes: string[], design_seed: string }`, additive optional fields allowed, reader deferred to v2.
- Author `tests/html-artifact-island.test.ts` as the **canonical reference implementation** of serialize/extract plus the L1 round-trip test, the L1 malformed-island negatives, and the L2 field-coverage assertion.

## Scope Fence

- **Owns:** the island byte contract, the schema, the field-coverage map, and their deterministic tests.
- **Do not:** write the composer, any HTML rendering, or any downstream wiring (T03/T04).
- **Do not:** add any npm/runtime dependency. The reference impl is **spec-only** — it lives in the test suite (or a spec `src/` util) and is never imported by any shipped artifact.
- **Do not:** build a multi-`kind` registry — fully define only the envelope + the `plan` kind; reserve `kind`/`schema_version` for v2.
- Run `bun run build:platforms` **only** to sync the new reference file into the generated `plugins/` tree — this is **count-neutral** (no agent/command/skill added, so no description/count changes). Do **not** edit component counts, descriptions, or metadata by hand, and do **not** do the version bump / CHANGELOG / `/release-docs` (all T06).

## Acceptance Criteria

1. L1 round-trip passes byte-for-byte for all hostile payloads (`</script>`, `</SCRIPT >`, `<!--`, `&`, single/double quotes, U+2028, U+2029) using the unicode-escape primitive; `extract` is a plain `JSON.parse` with no unescape step.
2. L1 malformed-island negatives all **fail loud** (throw or a discriminated `{ ok: false, error: <code> }`, never `null`/`undefined`/silent-empty) for: (a) no `id="artifact-data"` script; (b) empty/whitespace-only island; (c) truncated/unparseable JSON; (d) valid JSON missing a required fixed-core key.
3. L2 asserts a home for **every** enumerated legacy plan contract element against the 4-tier field-coverage map (all frontmatter keys + the semantic sections downstream consumes + execution-packet fields + references).
4. The serialization spec text in `island-contract.md` matches the tested reference impl **exactly** (spec/impl drift is a contract lie).
5. `bun test tests/html-artifact-island.test.ts` green; full `bun test` green; **`bun run verify:generated` clean** — the new reference file's generated twin is synced, so CI's separate `verify:generated` gate (`.github/workflows/ci.yml`, run apart from `bun test`) stays green. That gate flags *any* generated-tree drift regardless of counts, so a new unbuilt portable file turns it red even though `bun test` passes.

## Shared / Global Notes

- The fixed-core island schema + serialization primitive is **shared/global** (the `html-artifacts` contract): three consumer classes (composer writer, downstream prose readers, inline runtime exporters) rely on identical behavior. This is the extraction rule's first trigger.
- **Per-command island fields must NOT migrate into the shared fixed-core.** The core is only what *all* readers require; `plan`-specific fields stay in the `plan` kind's Tier-2 core.

## Local Context

- **Canonical WHY source:** `docs/brainstorms/2026-07-09-rich-html-artifacts-brainstorm.md`.
- **This ticket serves:** authoring the one mandatory deterministic seam (the island contract) so the composer is built *to* it and downstream reads it losslessly.
- **Interfaces that matter now:** the JSON island (`<script type="application/json" id="artifact-data">`) and the `serialize`/`extract` primitive. Round-trip must be byte-exact regardless of JSON string context.
- **Why unicode-escape, not HTML-entity:** inside `<script type="application/json">` the content is HTML "raw text"; the parser does not decode entities, so `&lt;` read via `.textContent` stays literal and `JSON.parse` never sees `<`. The `<`→`&lt;` sketch is therefore **not reversible** and must not be used. This is the production-standard approach (`serialize-javascript` / Next.js `__NEXT_DATA__`).
- **4-tier map (author first, build the schema to it):** the full per-tier field lists are already enumerated in plan Slice B and architecture "Deepening Candidates" — author to those, do not re-derive them here. **v1-discipline deltas to hold inline:** fully define only the Tier-1 envelope + the Tier-2 `plan` contract core; required set = full envelope + the enumerated Tier-2 core; legitimate per-kind absence (`constitution.version: null`, `source_docs.figma: []`, `tickets_ref: null`) does not weaken the contract; reserve `kind`/`schema_version` for v2 and build **no** multi-kind registry now.
- **Unknowns to surface, not guess:** where the reference impl lives (test-suite module vs a spec-only `src/` util) — pick the option that keeps it un-shippable and note it; do not import it into any artifact.

## Parent Refs

- Plan: `docs/plans/2026-07-09-feat-rich-html-artifacts-v1-plan.md` → `## Execution Slices > Slice B`
- Canonical WHY: `docs/brainstorms/2026-07-09-rich-html-artifacts-brainstorm.md`
- Architecture: `docs/architecture/2026-07-09-rich-html-artifacts-architecture.md`

## Deeper-Dive Refs

- Architecture → "Module Blueprint" (Island contract row), "Interfaces as Test Surfaces" (island + serialization primitive), "Seams, Adapters, and Contracts" (island serialization seam).
- Domain language: `CONTEXT.md` (Artifact, JSON island, Primitive, Projection recipe / `render_meta`).
- Plan → "Suggested E2E Suite" L1/L2; "Dependencies & Risks" (island serialization correctness).
- Source references: WHATWG HTML `<script>` raw-text content model; `serialize-javascript` / Next.js `__NEXT_DATA__`; RFC 8259 (`\uXXXX` in JSON strings).

## Coupling Notes

- **Foundational for T03 and T04.** Both are built against this contract; do not start T03 (composer) until the schema + primitive here are locked. Spec/impl drift here silently breaks every consumer.
- **No file overlap with T02**, but this ticket and T02 both touch the generated-plugin surface indirectly (T02 runs `bun run build:platforms`, which would sweep this new reference file into the generated tree). They are kept in **separate sequential batches** to avoid racing on the shared generated tree.
