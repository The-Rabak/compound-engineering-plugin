# Island Contract (Schema v1)

The machine seam for the `html-artifacts` subsystem. An HTML artifact's `<script type="application/json" id="artifact-data">` block (the **JSON island**, per `CONTEXT.md`) is the artifact's single source of truth. The surrounding HTML is a **projection** of the island: presentation may vary without limit, but every decision-bearing fact in the HTML must trace to an island field, and facts flow island→HTML only.

This document is the **spec**. The canonical reference implementation — the exact `serialize`/`extract` functions and the schema types this document describes — lives in `tests/support/island-spec.ts`; the field-coverage map itself stays local to `tests/html-artifact-island.test.ts`, the one suite that needs it as gate data. Spec and implementation must describe the same behavior byte-for-byte; drift between them is a contract lie.

**Reference-impl placement (resolves the "where does it live" question; corrected T04 — the primitives moved out of `tests/html-artifact-island.test.ts` at T02):** the reference implementation (`serialize`/`extract`/`extractIslandData`/the schema types/the fixture builders) is a set of plain functions and types declared in `tests/support/island-spec.ts` — not a `src/` module, and not inline in any one `.test.ts` file. It moved there at T02 (the `html-artifact-mutator` unit) so `tests/html-artifact-mutation.test.ts` could import the exact same primitives `tests/html-artifact-island.test.ts` already exercised, instead of a second hand-rolled copy — a `.test.ts` file re-executes its top-level `describe`/`test` blocks on import, so the primitives could not stay inside a test file once a second suite needed them. `tests/html-artifact-island.test.ts` imports from `tests/support/island-spec.ts` and additionally owns the `FIELD_COVERAGE_MAP*`/`LEGACY_*_CONTRACT_ELEMENTS` gate data, which stays local to that file since no other suite needs it. This repository publishes `src/` as an npm package (`package.json` `bin` + `publishConfig`), so a `src/` util is technically importable by any future `src/` code even if nothing imports it today. A file under `tests/` can never be imported by a shipped artifact — it is un-shippable by construction, not by discipline, which is the strongest and simplest guarantee available. No npm/runtime dependency was added to produce it.

## v1 discipline

- This schema fully defines only the **envelope** (Tier 1) and the **`plan` kind** (Tier 2 contract core). `kind` and `schema_version` exist and are read, but **no multi-kind registry is built in v1** — that is reserved for v2 (`brainstorm`, `architecture`, `deepen-plan` kinds).
- **Required set = the full envelope + the enumerated Tier-2 `plan` contract core.** Tier 3 (prose) and Tier 4 (open extension) are part of the schema but are not enforced as required by the extractor.
- Legitimate per-kind absence does not weaken the contract: `constitution.version: null` (no `docs/constitution.md`), `refs.source_docs.figma: []` (no Figma refs), `refs.tickets_ref: null` (before ticketization), `tdd.exceptions: []` (no exceptions apply) are all valid, complete data — not missing data.

### v2 update (T03): the `brainstorm` kind

The `brainstorm` kind is now fully defined alongside `plan` — its own Tier-2 contract core (below) and its own field-coverage map entries (Gate L2). The `architecture` kind is now also defined (T04, below); the `deepen-plan` kind remains reserved for a future ticket; slotting it in means adding one more Tier-2 section plus one more entry in the kind-aware required-key lookup below — **not** building a general multi-kind registry (the architecture handoff is explicit about this: "slot new kinds in without a registry").

The required-field check (`extractIslandData`) became **kind-aware** to support this: it looks up the required key set for the island's own `kind` instead of hard-coding the `plan` kind's 16 keys for every artifact (a `brainstorm` island legitimately has no `slices`/`tdd`/`execution_shape`; a kind-unaware check would wrongly fail it). See "The `REQUIRED_FIXED_CORE_KEYS` set" below for the exact mechanism and why `plan`-kind behavior is unchanged.

### v2 update (T04): the `architecture` kind

The `architecture` kind is now fully defined alongside `plan` and `brainstorm` — its own Tier-2 contract core, its own Tier-3 prose fields, and its own field-coverage map entries (Gate L2), added below following the exact recipe T03 established: one Tier-2 section, one Tier-3 section, one `REQUIRED_KEYS_BY_KIND` entry, one field-coverage-map addition. No registry framework was built for this either. The `deepen-plan` kind is the only kind still reserved for a future ticket.

## Tier 1 — Envelope

Shared across every kind, strict, versioned. The extraction helper reads this first to route any artifact regardless of kind.

| Field | Type | Notes |
|---|---|---|
| `schema_version` | `1` | Reserved for v2 bump when the schema shape changes. |
| `kind` | `"plan" \| "brainstorm" \| "architecture"` | Discriminates which kind's Tier-2 contract core applies; the required key set per kind is resolved via the kind-aware `REQUIRED_KEYS_BY_KIND` lookup below (a plain keyed lookup, not a registry framework). `"deepen-plan"` remains reserved for a future ticket. |
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

## Tier 2 — Contract core (`kind: "brainstorm"`, T03)

Per-kind, strict — downstream **acts** on these fields: `/workflows:plan`'s brainstorm-input dual-read (Path A/B) and `grill-with-docs`' content-class mutation (the canonical brainstorm mutator).

**Tiering is per-kind, not per-field-name.** `problem_narrative`, `user_story`, and `architectural_context` are Tier-3 *prose* for the `plan` kind (nothing downstream parses them structurally) but are Tier-2 *contract core* here — `/workflows:plan`'s dual-read fails loud if they are missing from a brainstorm island, so they are required, machine-read facts for this kind. A discriminated union is free to assign the same field name a different tier per kind; nothing forces the tiers to line up across kinds.

| Field | Type | Notes |
|---|---|---|
| `problem_narrative` | `string` | Required, expected non-empty (E2E floor). |
| `user_story` | `string` | Required, expected non-empty (E2E floor). |
| `architectural_context` | `string` | Required. |
| `success_criteria` | `string[]` | Required. Simpler shape than the `plan` kind's `{id, statement, verification}` — brainstorm.md's template is a plain bullet list, not a structured table. |
| `chosen_approach` | `string` | Required **key**, legitimately an **empty string** — see "Surfaced classification" below. |
| `key_decisions` | `Array<{ decision, rationale }>` | Required, expected non-empty (E2E floor). The field `grill-with-docs` content-mutates to rewrite a decision in place. |
| `resolved_questions` | `Array<{ question, answer }>` | Required, expected non-empty (E2E floor) — this is the post-brainstorm record of what was resolved, distinct from `open_questions` below. |
| `open_questions` | `string[]` | Required **key**, legitimately **`[]`** — `brainstorm.md`'s Phase 3 requires every open question to be resolved (and moved into `resolved_questions`) before the artifact is finalized, so a healthy, complete brainstorm island has an empty array here, not a populated one. Same "required key, legitimately empty value" discipline the `plan` kind already uses for `tdd.exceptions: []`. |
| `handoff.problem_narrative` | `boolean` | Presence flag, distinct from the Tier-3-for-plan/Tier-2-for-brainstorm prose field of the same name — same shape as the `plan` kind's `handoff`. |
| `handoff.user_story` | `boolean` | |
| `handoff.architectural_context` | `boolean` | |
| `handoff.success_criteria` | `boolean` | |

### Surfaced classification: `chosen_approach` and `open_questions`

Both fields are **consumed** by `/workflows:plan`'s brainstorm-input dual-read (Path B carries forward "Chosen Approach" and resolves/carries "Open Questions"), so they cannot be dropped to Tier 3 without losing a real downstream dependency — but neither is gated **non-empty** the way `problem_narrative`/`user_story`/`key_decisions`/`resolved_questions` are:

- `chosen_approach` may legitimately be an empty string in a `--lite` brainstorm where only one approach was ever discussed and no explicit "why this approach" prose was produced beyond the user story itself.
- `open_questions` is legitimately `[]` in the **healthy, expected** case (see above) — a non-empty `open_questions` on a *finalized* brainstorm island would itself be a process violation, not a schema violation.

Resolution: both are **required keys** (present on every brainstorm island, so downstream can read them unconditionally without defensive per-field existence checks) whose **value** may legitimately be empty — the same "required key, legitimately empty/null value" pattern the `plan` kind already establishes for `tdd.exceptions`/`refs.tickets_ref`. Neither is part of the four fields the T03 E2E floor gates non-empty (`problem_narrative`/`user_story`/`key_decisions`/`resolved_questions`); that floor is a content-health check on the authored artifact, separate from this schema-level required-key check.

## Tier 3 — Content / prose (`kind: "brainstorm"`, T03)

Rendered, never machine-parsed — the looser sections of `brainstorm.md`'s template that nothing downstream reads structurally.

| Field | Type | Note |
|---|---|---|
| `scope_boundary` | `string` | |
| `non_goals` | `string` | |
| `constitution_alignment` | `string` | Looser prose for this kind — unlike the `plan` kind's structured `constitution.version`/`constitution.waivers` Tier-2 object. A brainstorm may propose a constitution amendment in prose; it does not carry a structured waiver array. |
| `approaches_considered` | `string` | |
| `stakeholder_impact` | `string` | |

Tier 4 (`ext: Record<string, unknown>`) is the same open-extension mechanism described above — shared shape, no per-kind redefinition needed.

## Tier 2 — Contract core (`kind: "architecture"`, T04)

Per-kind, strict — downstream **acts** on these fields: `/deepen-plan`'s architecture-handoff read (`commands/deepen-plan.md`, `~:126`), `/workflows:review`'s architecture-handoff read (`commands/workflows/review.md`, `:128–139`), and `/workflows:work`'s architecture-handoff read (`commands/workflows/work.md`, `:89`). All three consumers extract the identical nine-field set below — not a coincidence: it is `/workflows:architecture`'s own "Required outputs" list (`commands/workflows/architecture.md`), restated once as a machine-consumed contract core instead of three consumers each parsing the same prose independently. `docs/architecture/2026-07-09-rich-html-artifacts-architecture.md` is the reference document this schema is grounded in.

| Field | Type | Notes |
|---|---|---|
| `plan_ref` | `string \| null` | The parent plan this architecture artifact was produced from. Not itself read by the three downstream consumers — they arrive at the architecture artifact via the *plan's* `architecture_ref`, not the reverse — kept for provenance and so `frontmatter.plan_ref` has a field-coverage-map home. Legitimately `null` only for a standalone run, which `/workflows:architecture` does not support today (`## Plan File` requires a valid plan path before proceeding). |
| `feature_homes` | `Array<{ feature_home, owns, notes }>` | Required, expected non-empty (E2E floor). Carries the "Feature Homes and Ownership" facts downstream *acts* on; the richer module/contains/rationale table lives in Tier-3 `module_blueprint` prose since no downstream consumer parses that detail structurally. |
| `shared_global_decisions` | `Array<{ candidate, decision, rationale }>` | Required, expected non-empty (E2E floor). `decision` is free text (e.g. `"shared/global"` / `"feature-local"`), not a closed enum. |
| `deepening_candidates` | `string[]` | Required, expected non-empty (E2E floor). Simpler shape than a structured table — mirrors the `brainstorm` kind's `success_criteria`: the legacy section is a plain annotated bullet list. |
| `context_tiers` | `{ global, on_demand, ticket_local }` | Required key. See "Surfaced classification" below — not gated non-empty by the T04 E2E floor, unlike the three fields above and the two below. |
| `deletion_test` | `Array<{ candidate, decision, rationale }>` | Required key. `decision` is free text (e.g. `"keep"` / `"delete"` / `"delay"`). See "Surfaced classification" below. |
| `interfaces_as_test_surfaces` | `Array<{ interface, callers_rely_on, must_not_leak, evidence_needed }>` | Required key. See "Surfaced classification" below. |
| `seams_adapters_contracts` | `Array<{ seam, adapter, contract, stability_class }>` | Required key. See "Surfaced classification" below. |
| `drift_checks` | `string[]` | Required, expected non-empty (E2E floor). |
| `recommendations` | `{ deepen_plan: string[], work: string[], review: string[] }` | Required, expected non-empty (E2E floor: at least one array non-empty). One structured field replaces the reference doc's three separate "Recommendations for `/x`" sections — each downstream consumer reads its own named key instead of parsing prose to find "its" section. |
| `handoff` | `{ deepen_plan: boolean, work: boolean, review: boolean }` | Presence/readiness flags — a **different shape** from the `plan`/`brainstorm` kinds' `handoff` (`problem_narrative`/`user_story`/`architectural_context`/`success_criteria`). A discriminated union is free to give the same field name a different shape per kind (`island-contract.md` already establishes per-kind tiering for shared field names; this extends the same principle to shape). The real architecture artifact's own frontmatter already uses this exact three-key shape, so the island matches the artifact instead of forcing a cross-kind shape match no consumer needs. |

### Surfaced classification: the T04 E2E-floor scope (`context_tiers`, `deletion_test`, `interfaces_as_test_surfaces`, `seams_adapters_contracts`)

The T04 acceptance floor gates exactly five fields non-empty: `feature_homes`, `shared_global_decisions`, `deepening_candidates`, `drift_checks`, `recommendations`. The other four Tier-2 fields (`context_tiers`, `deletion_test`, `interfaces_as_test_surfaces`, `seams_adapters_contracts`) are **required keys** — present on every architecture island, so downstream can read them unconditionally without a defensive per-field existence check — but are **not** part of that specific floor check.

This is a narrower E2E spot-check, not a schema claim that these four fields are legitimately empty the way the `brainstorm` kind's `open_questions: []` is legitimately empty by process design (a brainstorm that finalizes with pending open questions is a process violation, not healthy data). Nothing about `/workflows:architecture`'s own contract makes an empty `context_tiers`/`deletion_test`/`interfaces_as_test_surfaces`/`seams_adapters_contracts` legitimate — the command's "Required outputs" list requires context tiers, deletion-test decisions, and interface/seam/adapter/contract guidance regardless of review depth. A well-formed architecture artifact populates all nine Tier-2 fields non-trivially; the T04 floor simply spot-checks five of them rather than all nine, mirroring the ticket's literal acceptance-floor scope rather than over-claiming. Extending the E2E floor to cover the remaining four in a later ticket is a legitimate strengthening, not a contract change.

## Tier 3 — Content / prose (`kind: "architecture"`, T04)

Rendered, never machine-parsed — the looser sections of the architecture artifact's template that no downstream consumer reads structurally.

| Field | Type | Note |
|---|---|---|
| `purpose_linkage` | `string` | Restates the canonical WHY source, local intent, success-criteria focus, and architectural scope (the reference doc's "Purpose Linkage" section). |
| `module_blueprint` | `string` | The full module / feature-home / contains / rationale table in prose form. `feature_homes[]` (Tier 2) carries only the subset (`feature_home`, `owns`) downstream *acts* on; this field carries the richer human-readable table. |
| `design_it_twice` | `string` | The "Design-It-Twice" section when the run recorded a high-leverage option comparison; legitimately empty when none applied. |
| `review_depth` | `string` | The chosen depth (`lightweight`/`escalated`) and why, in prose — distinct from any Tier-2 field since no downstream consumer branches on it structurally. |
| `open_questions` | `string` | Any unresolved architecture-level questions the artifact records; legitimately empty when none remain. |

Tier 4 (`ext: Record<string, unknown>`) is the same open-extension mechanism described above — shared shape, no per-kind redefinition needed.

## The `REQUIRED_FIXED_CORE_KEYS` set

The fail-loud extractor treats exactly these 16 top-level keys as required for `kind: "plan"` (Tier 1 + Tier 2; Tier 3/4 are excluded by design):

```
schema_version, kind, title, type, date, status, refs, render_meta,
execution_shape, tdd, runtime_stack, constitution, handoff, slices,
success_criteria, suggested_e2e_suite
```

### Kind-aware required set (`REQUIRED_KEYS_BY_KIND`, T03)

Introducing a second kind (`brainstorm`) exposed a real bug: a required-field check hard-coded to the `plan` kind's 16 keys would wrongly throw `MISSING_REQUIRED_FIELD` on a legitimate `brainstorm` island, which has no `slices`/`tdd`/`execution_shape`/`runtime_stack`/`constitution`/`suggested_e2e_suite`. Feeding a valid brainstorm island to that check would break both downstream consumers that need it to succeed: `/workflows:plan`'s brainstorm-input dual-read, and `grill-with-docs`' content-class mutation.

The fix is a small, kind-keyed lookup — **not** a general multi-kind registry framework (the architecture handoff's explicit instruction: "slot new kinds in without building a registry"):

```
REQUIRED_KEYS_BY_KIND: Record<string, readonly string[]> = {
  plan: REQUIRED_FIXED_CORE_KEYS,        // the same 16 keys, unchanged
  brainstorm: [
    schema_version, kind, title, type, date, status, refs, render_meta,
    problem_narrative, user_story, architectural_context, success_criteria,
    chosen_approach, key_decisions, resolved_questions, open_questions, handoff,
  ],
  architecture: [
    schema_version, kind, title, type, date, status, refs, render_meta,
    plan_ref, feature_homes, shared_global_decisions, deepening_candidates,
    context_tiers, deletion_test, interfaces_as_test_surfaces,
    seams_adapters_contracts, drift_checks, recommendations, handoff,
  ],
}
```

Each entry is the **full** required set for that kind (Tier-1 envelope + that kind's Tier-2 core) — not a delta layered on a shared envelope list. `extractIslandData` reads the parsed island's own `kind` field and looks up the matching entry; a missing or unrecognized `kind` value falls back to `REQUIRED_FIXED_CORE_KEYS` (the `plan` set). This has two consequences, both intentional:

- **`plan`-kind behavior is byte-identical to before this ticket.** A `plan` island with `kind` missing, `kind: "plan"`, or any other value all resolve to the exact same 16-key check the extractor already ran.
- **An unrecognized future kind (e.g. `deepen-plan`, not yet registered) falls back to the `plan` required set**, which may spuriously demand plan-only fields from that kind's island. This is a documented, known limit, not a silent gap — T04 closed this exact gap for `architecture` by adding the entry above, exactly as `brainstorm` was added at T03; a future ticket closes it for `deepen-plan` the same way.

The exported reference-impl name is `REQUIRED_KEYS_BY_KIND` (`tests/support/island-spec.ts`); `REQUIRED_FIXED_CORE_KEYS` keeps its original name and its original 16-key value, referenced from `REQUIRED_KEYS_BY_KIND.plan`.

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

This fail-loud contract is proven deterministically here (Gate L1, unit tests) and is codified as the shared prose branch every real downstream consumer follows in `island-extraction-helper.md` (v1 T04 — disambiguated from this document's own v2 T04, the `architecture`-kind ticket; the two share a ticket number across separate ticket sets) — island-primary has no `.md` mirror to fall back to, so fail-loud is the only contract-consistent behavior on a malformed artifact.

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

### Frontmatter keys (`kind: "brainstorm"`, T03)

| Legacy element | Island home | Tier | Note |
|---|---|---|---|
| `frontmatter.date` | `date` | 1 | |
| `frontmatter.topic` | `title` | 1 | Folded into `title` — the same way `plan`'s filename slug (`<type>-<name>`) is derived, not a separate island field. |
| `frontmatter.status` | `status` | 1 | |
| `frontmatter.handoff.problem_narrative` | `handoff.problem_narrative` | 2 | |
| `frontmatter.handoff.user_story` | `handoff.user_story` | 2 | |
| `frontmatter.handoff.architectural_context` | `handoff.architectural_context` | 2 | |
| `frontmatter.handoff.success_criteria` | `handoff.success_criteria` | 2 | |

`brainstorm.md`'s legacy frontmatter has no `type:` key (a brainstorm document has no `feat`/`fix`/`refactor` classification of its own in the pre-migration template). Tier 1's `type` field is still required — shared envelope, strict for every kind — so the composer gathers/infers it the same way it already gathers `date`/`status`; this is a minor template-vs-envelope gap this ticket surfaces rather than papers over.

### Semantic sections downstream consumes (`kind: "brainstorm"`, T03)

| Legacy element | Island home | Tier | Note |
|---|---|---|---|
| `section.Problem Narrative` | `problem_narrative` | 2 | Tier 2 for this kind — see the brainstorm Tier-2 section above for why. |
| `section.User Story` | `user_story` | 2 | |
| `section.Success Criteria` | `success_criteria[]` | 2 | |
| `section.Architectural Context` | `architectural_context` | 2 | |
| `section.Chosen Approach` | `chosen_approach` | 2 | Required key, legitimately empty value. |
| `section.Key Decisions` | `key_decisions[]` | 2 | The field `grill-with-docs` content-mutates. |
| `section.Scope Boundary` | `scope_boundary` | 3 | |
| `section.Non-goals / Deferred Ideas` | `non_goals` | 3 | |
| `section.Constitution Alignment` | `constitution_alignment` | 3 | Looser prose for this kind — see the brainstorm Tier-3 section above. |
| `section.Approaches Considered` | `approaches_considered` | 3 | |
| `section.Stakeholder Impact` | `stakeholder_impact` | 3 | |
| `section.Open Questions` | `open_questions[]` | 2 | Required key, legitimately `[]`. |
| `section.Resolved Questions` | `resolved_questions[]` | 2 | |

### Frontmatter keys (`kind: "architecture"`, T04)

| Legacy element | Island home | Tier | Note |
|---|---|---|---|
| `frontmatter.date` | `date` | 1 | |
| `frontmatter.topic` | `title` | 1 | Folded into `title` — same fold the `brainstorm` kind's `frontmatter.topic` already uses. |
| `frontmatter.status` | `status` | 1 | |
| `frontmatter.plan_ref` | `plan_ref` | 2 | |
| `frontmatter.brainstorm_ref` | `refs.brainstorm_ref` | 1 | |
| `frontmatter.handoff.deepen_plan` | `handoff.deepen_plan` | 2 | |
| `frontmatter.handoff.work` | `handoff.work` | 2 | |
| `frontmatter.handoff.review` | `handoff.review` | 2 | |

Grounded in `docs/architecture/2026-07-09-rich-html-artifacts-architecture.md`'s actual frontmatter (`date`, `topic`, `status`, `plan_ref`, `brainstorm_ref`, `handoff.{deepen_plan,work,review}`). As with the `brainstorm` kind, the architecture artifact's legacy frontmatter has no `type:` key of its own; the shared Tier-1 envelope still requires `type`, gathered/inferred the same way `date`/`status` already are — the identical minor template-vs-envelope gap the brainstorm kind already surfaces, not a new one. `refs.architecture_ref` is always `null` on an architecture island (an architecture artifact does not reference itself, mirroring the `brainstorm` kind's always-`null` `refs.brainstorm_ref`); `refs.tickets_ref` is legitimately `null` before ticketization, same as every other kind.

### Semantic sections downstream consumes (`kind: "architecture"`, T04)

| Legacy element | Island home | Tier | Note |
|---|---|---|---|
| `section.Purpose Linkage` | `purpose_linkage` | 3 | |
| `section.Feature Homes and Ownership` | `feature_homes[]` | 2 | |
| `section.Module Blueprint for Implementation` | `module_blueprint` | 3 | |
| `section.Shared / Global Decisions` | `shared_global_decisions[]` | 2 | |
| `section.Deepening Candidates` | `deepening_candidates[]` | 2 | |
| `section.Deletion Test` | `deletion_test[]` | 2 | |
| `section.Interfaces as Test Surfaces` | `interfaces_as_test_surfaces[]` | 2 | |
| `section.Seams, Adapters, and Contracts` | `seams_adapters_contracts[]` | 2 | |
| `section.Design-It-Twice` | `design_it_twice` | 3 | |
| `section.Context Tiers` | `context_tiers` | 2 | |
| `section.Review Depth` | `review_depth` | 3 | |
| `section.Recommendations for /deepen-plan` | `recommendations.deepen_plan[]` | 2 | |
| `section.Recommendations for /workflows:work` | `recommendations.work[]` | 2 | |
| `section.Recommendations for /workflows:review` | `recommendations.review[]` | 2 | |
| `section.Drift Checks` | `drift_checks[]` | 2 | |
| `section.Open Questions` | `open_questions` | 3 | |

## Mutation contract (`html-artifact-mutator`, v2)

Shipped alongside the `html-artifact-mutator` skill — the shared, single-owner "update" capability every mutating consumer (deepen-plan back-writes, grill-with-docs enrichment, ref/status back-writes, etc.) goes through. See the skill's own `SKILL.md` for the full read → parse → mutate → re-serialize → re-project pipeline this section backs.

### Reference-impl placement

The mutator's reference implementation lives in `tests/html-artifact-mutation.test.ts`, built on top of the same `serialize`/`extract`/`extractIslandData` primitives this document already describes above. Those primitives were extracted out of `tests/html-artifact-island.test.ts` into `tests/support/island-spec.ts` (a non-test, spec-only helper module) specifically so both suites import the identical implementation instead of drifting copies — importing a `.test.ts` file would re-execute its `describe`/`test` blocks, so a shared module was required the moment a second suite needed the same primitives. `tests/support/island-spec.ts` is never imported by any shipped skill or artifact, for the exact same "un-shippable by construction" reason this document already gives for the original placement.

### Mutable-region policy

Two mutation classes, each scoped to a disjoint region of the schema:

| Class | May touch | May NOT touch | Re-projects? |
|---|---|---|---|
| **Scalar / contract-field** | Tier-1 envelope `status`, and every `refs.*` leaf | `title`, `type`, `date`, `kind`, `schema_version` (identity/classification, set once and never rewritten), `render_meta` | No — patches the island field in place. An *optional* single-element rendered update runs inline when safe (see below); otherwise a graceful "Related Artifacts" fallback section is appended and logged. |
| **Content** | Tier-2 contract-core fields **for the artifact's own `kind`** (e.g. `plan`: `execution_shape`, `tdd`, `runtime_stack`, `constitution`, `handoff`, `slices`, `success_criteria`, `suggested_e2e_suite`; `brainstorm`: `chosen_approach`, `key_decisions`, `resolved_questions`, `open_questions`, `handoff`; `architecture`: `plan_ref`, `feature_homes`, `shared_global_decisions`, `deepening_candidates`, `context_tiers`, `deletion_test`, `interfaces_as_test_surfaces`, `seams_adapters_contracts`, `drift_checks`, `recommendations`, `handoff`), Tier-3 prose fields, Tier-4 `ext{}` | Every Tier-1 envelope key, including `render_meta` | Yes — always, via a fresh subagent dispatch that reuses the recorded `render_meta` (see below). |

The content class's mutable region is the same rule for every kind — "Tier-2/3/4, never Tier-1" — the field-name lists above are illustrative per kind, not an exhaustive allowlist coupled to `plan` alone. `grill-with-docs`' brainstorm content mutations (e.g. rewriting a `key_decisions[]` entry, or moving a question from `open_questions[]` to `resolved_questions[]`) are exactly as in-policy as a plan's `slices[]` enrichment.

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
- **Gate L3/L4 (e2e, later batches):** the pilot equivalence gate and the malformed-island real-agent drill, discharged once the composer (v1 T03 — disambiguated from this document's own v2 T03, the `brainstorm`-kind ticket) exists to produce a real `plan.html`.
- **Gate M1 (unit, v2):** both mutation classes round-trip correctly against a real composed fixture (`tests/fixtures/html-artifacts/representative-plan.html`); a scalar patch preserves every other field byte-identically and safely updates or falls back on the rendered view; a content mutation preserves every other field byte-identically, still satisfies the field-coverage map, and preserves `render_meta` unchanged; every malformed-island case and every out-of-policy field fails loud.

Test commands: `bun test tests/html-artifact-island.test.ts`, `bun test tests/html-artifact-mutation.test.ts`.
