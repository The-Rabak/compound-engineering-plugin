# Island Contract (Schema v1)

The machine seam for the `html-artifacts` subsystem. An HTML artifact's `<script type="application/json" id="artifact-data">` block (the **JSON island**, per `CONTEXT.md`) is the artifact's single source of truth. The surrounding HTML is a **projection** of the island: presentation may vary without limit, but every decision-bearing fact in the HTML must trace to an island field, and facts flow island→HTML only.

This document is the **spec**. The canonical reference implementation — the exact `serialize`/`extract` functions, the schema types, and the field-coverage map this document describes — lives in `tests/html-artifact-island.test.ts`. Spec and implementation must describe the same behavior byte-for-byte; drift between them is a contract lie.

**Reference-impl placement (resolves the "where does it live" question):** the reference implementation is a set of plain functions declared directly inside `tests/html-artifact-island.test.ts` — not a `src/` module. This repository publishes `src/` as an npm package (`package.json` `bin` + `publishConfig`), so a `src/` util is technically importable by any future `src/` code even if nothing imports it today. A test file can never be imported by a shipped artifact — it is un-shippable by construction, not by discipline, which is the strongest and simplest guarantee available. No npm/runtime dependency was added to produce it.

## v1 discipline

- This schema fully defines only the **envelope** (Tier 1) and the **`plan` kind** (Tier 2 contract core). `kind` and `schema_version` exist and are read, but **no multi-kind registry is built in v1** — that is reserved for v2 (`brainstorm`, `architecture`, `deepen-plan` kinds).
- **Required set = the full envelope + the enumerated Tier-2 `plan` contract core.** Tier 3 (prose) and Tier 4 (open extension) are part of the schema but are not enforced as required by the extractor.
- Legitimate per-kind absence does not weaken the contract: `constitution.version: null` (no `docs/constitution.md`), `refs.source_docs.figma: []` (no Figma refs), `refs.tickets_ref: null` (before ticketization), `tdd.exceptions: []` (no exceptions apply) are all valid, complete data — not missing data.

## Tier 1 — Envelope

Shared across every kind, strict, versioned. The extraction helper reads this first to route any artifact regardless of kind.

| Field | Type | Notes |
|---|---|---|
| `schema_version` | `1` | Reserved for v2 bump when the schema shape changes. |
| `kind` | `"plan"` | Reserved for v2 kinds (`"brainstorm"`, `"architecture"`, `"deepen-plan"`); no registry built yet. |
| `title` | `string` | |
| `type` | `string` | e.g. `feat`, `fix`, `refactor`. |
| `date` | `string` | |
| `status` | `string` | |
| `refs.brainstorm_ref` | `string \| null` | |
| `refs.architecture_ref` | `string \| null` | |
| `refs.tickets_ref` | `string \| null` | Legitimately `null` before ticketization. |
| `refs.source_docs.tickets` | `string[]` | |
| `refs.source_docs.docs` | `string[]` | |
| `refs.source_docs.figma` | `string[]` | Legitimately `[]`. |
| `refs.source_docs.plans` | `string[]` | |
| `render_meta` | object | Writer-only. See below. |

### `render_meta` (writer: composer; reader: html-artifact-mutator)

The **projection recipe** (`CONTEXT.md`): how an artifact was rendered, so a future re-projection reuses the same design instead of re-classifying.

```
render_meta: {
  archetypes: string[]   // archetype id(s) used in the projection
  design_seed: string    // stable design/token seed
  // additive optional fields allowed, e.g. composer, composed_at
}
```

The composer (v1) writes this field; no v1 consumer read it — the shape was pinned then so v2 re-projection would have a stable target and no artifact migration would be needed later. The `html-artifact-mutator` skill (v2) is the first and only reader: a content-class mutation always re-projects, and re-projection dispatches a fresh subagent that reuses this exact recorded `{ archetypes, design_seed }` rather than re-classifying the artifact from scratch. This is the genuine new work v2 adds on top of v1's writer — see "Mutation contract" below for the full rules. Neither mutation class ever writes to `render_meta`: it is read-only from the mutator's perspective, forever.

## Tier 2 — Contract core (`kind: "plan"`)

Per-kind, strict — downstream **acts** on these fields (`work`, `to-issues`, `review`).

| Field | Type | Notes |
|---|---|---|
| `execution_shape.mode` | `string` | |
| `execution_shape.rationale` | `string` | |
| `tdd.precedence` | `string` | |
| `tdd.mode` | `string` | |
| `tdd.loop` | `string` | |
| `tdd.evidence.unit` | `string` | |
| `tdd.evidence.e2e` | `string` | |
| `tdd.exceptions` | `Array<{ scope, reason, replacement_evidence }>` | Legitimately `[]`. |
| `runtime_stack.local` | `string` | |
| `runtime_stack.qa` | `string` | |
| `runtime_stack.prod` | `string` | |
| `runtime_stack.e2e_surface` | `boolean` | |
| `constitution.version` | `string \| null` | Legitimately `null`. |
| `constitution.waivers` | `string[]` | |
| `handoff.problem_narrative` | `boolean` | Presence flag, distinct from the Tier-3 prose field of the same name. |
| `handoff.user_story` | `boolean` | |
| `handoff.architectural_context` | `boolean` | |
| `handoff.success_criteria` | `boolean` | |
| `slices` | `Array<ExecutionSlicePacket>` | See packet shape below. |
| `success_criteria` | `Array<{ id, statement, verification }>` | |
| `suggested_e2e_suite` | `Array<{ id } & Record<string, unknown>>` | Semi-structured, per-scenario — load-bearing for Gates L3/L4. |

`ExecutionSlicePacket` (each entry of `slices[]`):

```
{
  id: string
  feature_home: string
  scope: string
  scope_fence: string
  files: string[]
  depends_on: string[]
  dependency_type: string
  acceptance_criteria: string
  test_command: string
}
```

## Tier 3 — Content / prose

Rendered, never machine-parsed. Loose rich-text slots — breadth lives here because nothing downstream reads it structurally.

| Field | Type |
|---|---|
| `problem_narrative` | `string` |
| `user_story` | `string` |
| `architectural_context` | `string` |
| `specified_scope_contract` | `string` |
| `references` | `string` |

## Tier 4 — Open extension

```
ext: Record<string, unknown>
```

Whatever a bespoke layout needs to surface. Machines ignore it; it renders richly; it keeps island backing (per the composer's hard rule — every fact in the HTML traces to *some* island field, even a Tier-4 one).

## The `REQUIRED_FIXED_CORE_KEYS` set

The fail-loud extractor treats exactly these 16 top-level keys as required (Tier 1 + Tier 2; Tier 3/4 are excluded by design):

```
schema_version, kind, title, type, date, status, refs, render_meta,
execution_shape, tdd, runtime_stack, constitution, handoff, slices,
success_criteria, suggested_e2e_suite
```

## Serialization primitive

Inside `<script type="application/json">`, the content is HTML **"raw text"**: the parser does not decode entities. Reading `&lt;` back via `.textContent` yields the literal four characters `&lt;`, and `JSON.parse` never sees `<`. **The `<` → `&lt;` HTML-entity approach is therefore not reversible and must not be used.** This schema adopts the production-standard pattern (`serialize-javascript`; Next.js `__NEXT_DATA__`; Remix) instead: **JSON-level unicode escaping.**

### `serialize(value)`

```
serialize(value) = JSON.stringify(value), then inside that JSON string replace:
  <        -> \u003C
  >        -> \u003E
  /        -> \u002F
  U+2028   -> \u2028
  U+2029   -> \u2029
```

`&` is **deliberately not escaped**. `&` has no special meaning in the `<script>` raw-text content model (entities are never decoded there), so it round-trips as a literal character through `JSON.stringify`/`JSON.parse` alone.

The `<` escape is **load-bearing**: removing every literal `<` from the emitted text alone defuses `</script`, `</SCRIPT >`, and `<!--` regardless of where they occur in the payload. The other four escapes are defense-in-depth (line/paragraph separators some non-browser JS contexts mishandle; `/` in case a consumer's tag-matching is looser than the HTML spec's raw-text rule).

### `extract(scriptText)`

```
extract(scriptText) = JSON.parse(scriptText)
```

**No unescape step.** `JSON.parse` natively interprets the `\uXXXX` escapes `serialize()` wrote, back into their original characters — there is no separate unescape pass to write or to get wrong. This is the exact inverse of `serialize()`, and it is why the round-trip is byte-exact regardless of what the payload contains.

### Fail-loud extraction (`extractIslandData`)

The plain `extract()` primitive above is wrapped by a fail-loud reader every downstream consumer is built on. It locates the `#artifact-data` script, takes its raw inner text (the string-level equivalent of `.textContent`), and never scrapes rendered HTML. It never returns `null`, `undefined`, or a silently-accepted empty object on failure — it always throws or returns a discriminated result:

```
{ ok: true; data: Record<string, unknown> }
| { ok: false; error: "MISSING_ISLAND" | "EMPTY_ISLAND" | "INVALID_JSON" | "MISSING_REQUIRED_FIELD"; message: string }
```

Four failure modes, each with a named diagnostic:

| Case | Error code | How it's caught |
|---|---|---|
| No `id="artifact-data"` script tag | `MISSING_ISLAND` | Script-tag lookup returns nothing to parse. |
| Empty / whitespace-only island | `EMPTY_ISLAND` | Explicit pre-check before calling `extract()`. |
| Truncated / unparseable JSON | `INVALID_JSON` | `extract()`'s native `JSON.parse` throws `SyntaxError`; caught and reported. |
| Valid JSON missing a required fixed-core key | `MISSING_REQUIRED_FIELD` | Post-parse check against `REQUIRED_FIXED_CORE_KEYS`, naming the missing key. |

This fail-loud contract is proven deterministically here (Gate L1, unit tests) and is codified as the shared prose branch every real downstream consumer follows in `island-extraction-helper.md` (T04) — island-primary has no `.md` mirror to fall back to, so fail-loud is the only contract-consistent behavior on a malformed artifact.

## Field-coverage map (Gate L2)

Every legacy `plan.md` contract element — every frontmatter key, every semantic section downstream consumes, every execution-packet field, and references — has a named island home. This is the map authored **before** the schema was built, so the schema is built *to* it, not reverse-engineered from it. The authoritative, machine-checked version of this table is `FIELD_COVERAGE_MAP` in `tests/html-artifact-island.test.ts`; this table must match it exactly.

### Frontmatter keys

| Legacy element | Island home | Tier | Note |
|---|---|---|---|
| `frontmatter.title` | `title` | 1 | |
| `frontmatter.type` | `type` | 1 | |
| `frontmatter.status` | `status` | 1 | |
| `frontmatter.date` | `date` | 1 | |
| `frontmatter.constitution_version` | `constitution.version` | 2 | Legitimate absence: `null` when no `docs/constitution.md` exists. |
| `frontmatter.constitution_waivers` | `constitution.waivers` | 2 | |
| `frontmatter.brainstorm_ref` | `refs.brainstorm_ref` | 1 | |
| `frontmatter.architecture_ref` | `refs.architecture_ref` | 1 | |
| `frontmatter.tickets_ref` | `refs.tickets_ref` | 1 | Legitimate absence: `null` before ticketization. |
| `frontmatter.source_docs.tickets` | `refs.source_docs.tickets` | 1 | |
| `frontmatter.source_docs.docs` | `refs.source_docs.docs` | 1 | |
| `frontmatter.source_docs.figma` | `refs.source_docs.figma` | 1 | Legitimate absence: `[]` when no Figma refs apply. |
| `frontmatter.source_docs.plans` | `refs.source_docs.plans` | 1 | |
| `frontmatter.handoff.problem_narrative` | `handoff.problem_narrative` | 2 | |
| `frontmatter.handoff.user_story` | `handoff.user_story` | 2 | |
| `frontmatter.handoff.architectural_context` | `handoff.architectural_context` | 2 | |
| `frontmatter.handoff.success_criteria` | `handoff.success_criteria` | 2 | |
| `frontmatter.tdd.precedence` | `tdd.precedence` | 2 | |
| `frontmatter.tdd.mode` | `tdd.mode` | 2 | |
| `frontmatter.tdd.loop` | `tdd.loop` | 2 | |
| `frontmatter.tdd.evidence.unit` | `tdd.evidence.unit` | 2 | |
| `frontmatter.tdd.evidence.e2e` | `tdd.evidence.e2e` | 2 | |
| `frontmatter.tdd.exceptions` | `tdd.exceptions` | 2 | Legitimate absence: `[]` when no exceptions apply. |
| `frontmatter.execution_shape.mode` | `execution_shape.mode` | 2 | |
| `frontmatter.execution_shape.rationale` | `execution_shape.rationale` | 2 | |
| `frontmatter.runtime_stack.local` | `runtime_stack.local` | 2 | |
| `frontmatter.runtime_stack.qa` | `runtime_stack.qa` | 2 | |
| `frontmatter.runtime_stack.prod` | `runtime_stack.prod` | 2 | |
| `frontmatter.runtime_stack.e2e_surface` | `runtime_stack.e2e_surface` | 2 | |

### Semantic sections downstream consumes

| Legacy element | Island home | Tier | Note |
|---|---|---|---|
| `section.Problem Narrative` | `problem_narrative` | 3 | |
| `section.User Story` | `user_story` | 3 | |
| `section.Architectural Context` | `architectural_context` | 3 | |
| `section.Success Criteria` | `success_criteria[]` | 2 | Already structured in frontmatter's twin data; the body section is a human-readable restatement. |
| `section.Specified Scope Contract` | `specified_scope_contract` | 3 | |
| `section.TDD & Evidence Contract` | `tdd` | 2 | Restates `frontmatter.tdd.*` in prose; the island keeps one structured copy. |
| `section.Suggested E2E Suite` | `suggested_e2e_suite[]` | 2 | |
| `section.Execution Shape` | `execution_shape` | 2 | Restates `frontmatter.execution_shape.*` in prose; the island keeps one structured copy. |
| `section.Constitution Alignment` | `constitution` | 2 | Restates `frontmatter.constitution_version`/`constitution_waivers` in prose; the island keeps one structured copy. |
| `section.References` | `references` | 3 | |

Several legacy sections restate frontmatter scalars in prose for human readability (`TDD & Evidence Contract`, `Execution Shape`, `Constitution Alignment`). The island collapses that duplication: one structured field, with the HTML projection regenerating the readable prose *from* it at render time — this is a genuine simplification the island model earns, not a coverage gap.

### Execution-packet fields

| Legacy element | Island home | Tier |
|---|---|---|
| `packet.id` | `slices[].id` | 2 |
| `packet.feature_home` | `slices[].feature_home` | 2 |
| `packet.scope` | `slices[].scope` | 2 |
| `packet.scope_fence` | `slices[].scope_fence` | 2 |
| `packet.files` | `slices[].files` | 2 |
| `packet.depends_on` | `slices[].depends_on` | 2 |
| `packet.dependency_type` | `slices[].dependency_type` | 2 |
| `packet.acceptance_criteria` | `slices[].acceptance_criteria` | 2 |
| `packet.test_command` | `slices[].test_command` | 2 |

## Mutation contract (`html-artifact-mutator`, v2)

Shipped alongside the `html-artifact-mutator` skill — the shared, single-owner "update" capability every mutating consumer (deepen-plan back-writes, grill-with-docs enrichment, ref/status back-writes, etc.) goes through. See the skill's own `SKILL.md` for the full read → parse → mutate → re-serialize → re-project pipeline this section backs.

### Reference-impl placement

The mutator's reference implementation lives in `tests/html-artifact-mutation.test.ts`, built on top of the same `serialize`/`extract`/`extractIslandData` primitives this document already describes above. Those primitives were extracted out of `tests/html-artifact-island.test.ts` into `tests/support/island-spec.ts` (a non-test, spec-only helper module) specifically so both suites import the identical implementation instead of drifting copies — importing a `.test.ts` file would re-execute its `describe`/`test` blocks, so a shared module was required the moment a second suite needed the same primitives. `tests/support/island-spec.ts` is never imported by any shipped skill or artifact, for the exact same "un-shippable by construction" reason this document already gives for the original placement.

### Mutable-region policy

Two mutation classes, each scoped to a disjoint region of the schema:

| Class | May touch | May NOT touch | Re-projects? |
|---|---|---|---|
| **Scalar / contract-field** | Tier-1 envelope `status`, and every `refs.*` leaf | `title`, `type`, `date`, `kind`, `schema_version` (identity/classification, set once and never rewritten), `render_meta` | No — patches the island field in place. An *optional* single-element rendered update runs inline when safe (see below); otherwise a graceful "Related Artifacts" fallback section is appended and logged. |
| **Content** | Tier-2 contract-core fields, Tier-3 prose fields, Tier-4 `ext{}` | Every Tier-1 envelope key, including `render_meta` | Yes — always, via a fresh subagent dispatch that reuses the recorded `render_meta` (see below). |

`render_meta` is never mutated by either class — see "`render_meta` (writer: composer; reader: html-artifact-mutator)" above.

### Scalar-class rendered update: single-element-or-fallback

A scalar mutation never re-projects, but an in-place rendered update is light enough to run inline when it is unambiguous: if the field's *old* value is rendered verbatim as **exactly one** element following the composer's own conventions (e.g. a `<span class="badge">{value}</span>` for `type`/`status`/`date`), that element's text is replaced with the HTML-entity-escaped new value. Zero matches (nothing rendered) or more than one match (ambiguous) are both treated as **unsafe** — the mutator does not guess. Instead it appends a rendered "Related Artifacts" section near the end of `<body>` stating the new value (itself backed by the same island field — never an invented fact) and records a log entry naming the fallback. This is exactly the behavior `tests/html-artifact-mutation.test.ts` proves for both branches.

### Content-class re-projection

A content mutation always changes what the visible HTML should say, so it always re-projects — but re-drawing an existing composed layout well is a creative-composition task, not deterministic string surgery. The mutator dispatches a **fresh subagent** — the same delegation contract the composer's Invocation section uses — supplying only: the composer's `SKILL.md` (in re-projection mode), the already-mutated and re-serialized island, and the recorded `render_meta`. The subagent re-renders only the affected section(s) from the current island content, reusing the exact `archetypes`/`design_seed` already recorded rather than reclassifying. The mutation is not complete — and must not be reported as complete to the caller — until this re-projection has run; stopping after the island write alone would leave the machine contract correct but the human view stale, which is exactly the drift this contract exists to prevent.

Because a live subagent dispatch has no deterministic unit surface, `tests/html-artifact-mutation.test.ts` proves the mechanical part of this contract deterministically (round-trip validity, field-coverage-map compliance, and — the core re-projection-stability guarantee — that `render_meta` is reused byte-for-byte across a content mutation, never regenerated) and stops at a `needsReprojection: true` signal rather than hand-building a deterministic HTML re-renderer as a stand-in for the subagent. This mirrors the architecture handoff's explicit rejection of an "Approach-B deterministic renderer."

### Fail-loud mutation

Every mutation function is built on the exact same `extractIslandData` this document already specifies: a missing, empty, truncated, or fixed-core-incomplete island fails loud with the matching `MISSING_ISLAND` / `EMPTY_ISLAND` / `INVALID_JSON` / `MISSING_REQUIRED_FIELD` code before any write is attempted — never a silent or partial write. A field outside a mutation's class region fails loud with a dedicated `UNMUTABLE_FIELD` code instead.

## Verification

- **Gate L1 (unit):** `serialize`/`extract` round-trip byte-for-byte on hostile payloads (`</script>`, `</SCRIPT >`, `<!--`, `&`, single/double quotes, U+2028, U+2029) at every tier (Tier 1 top-level string, Tier 3 prose, nested Tier 2 packet field); the four malformed-island cases above all fail loud.
- **Gate L2 (unit):** every legacy element enumerated above has a coverage-map entry; no duplicate entries; every entry declares a valid tier.
- **Gate L3/L4 (e2e, later batches):** the pilot equivalence gate and the malformed-island real-agent drill, discharged once the composer (T03) exists to produce a real `plan.html`.
- **Gate M1 (unit, v2):** both mutation classes round-trip correctly against a real composed fixture (`tests/fixtures/html-artifacts/representative-plan.html`); a scalar patch preserves every other field byte-identically and safely updates or falls back on the rendered view; a content mutation preserves every other field byte-identically, still satisfies the field-coverage map, and preserves `render_meta` unchanged; every malformed-island case and every out-of-policy field fails loud.

Test commands: `bun test tests/html-artifact-island.test.ts`, `bun test tests/html-artifact-mutation.test.ts`.
