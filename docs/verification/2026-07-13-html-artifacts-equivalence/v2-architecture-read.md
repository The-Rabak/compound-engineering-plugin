# v2 Architecture Dual-Read Cross-Arm Equivalence (T04, todo 021)

**Verdict: PASS**

Both arms clear the per-arm floor and the machine-consumed fixed-core fields
are deep-equal across arms (modulo the documented, non-blocking `.md`/`.html`
extension normalization on `*_ref` values and the expected lenient variance in
Tier-3 prose formatting). `work`, `/deepen-plan`, and `/workflows:review`
receive equivalent architecture facts regardless of which arm they read.

## Inputs

- `.html` arm: `tests/fixtures/html-artifacts/representative-architecture.html` (`kind: "architecture"`)
- `.md` arm: `tests/fixtures/html-artifacts/frozen-premigration-architecture.md`
- Contract: `portable/compound-engineering/commands/workflows/references/html-artifacts/island-extraction-helper.md` + `island-contract.md`'s architecture Tier-2/Tier-3 sections and field-coverage map
- Downstream `.html` branch confirmed at `portable/compound-engineering/commands/workflows/work.md:89` (T04): "`.html` (T04) -- load `commands/workflows/references/html-artifacts/island-extraction-helper.md` ... read the architecture artifact's `#artifact-data` JSON island ... sourced from the island's `architecture`-kind Tier-2 core."
- Sanctioned reader used verbatim: `extractIslandData` from `tests/support/island-spec.ts`, invoked via `bun run` against the real fixture (no hand parsing of the `.html` arm, no rendered-HTML scraping).

## Step 1 -- Real-reader extraction

### `.html` arm -- `extractIslandData(html)` result

Ran (scratch script, not committed):

```ts
import { readFileSync } from "node:fs"
import { extractIslandData } from "tests/support/island-spec.ts"
const html = readFileSync("tests/fixtures/html-artifacts/representative-architecture.html", "utf8")
console.log(JSON.stringify(extractIslandData(html), null, 2))
```

Result: `{ ok: true, data: {...} }` -- the extractor's kind-aware required-key
check (`REQUIRED_KEYS_BY_KIND.architecture`, 19 keys: `schema_version, kind,
title, type, date, status, refs, render_meta, plan_ref, feature_homes,
shared_global_decisions, deepening_candidates, context_tiers, deletion_test,
interfaces_as_test_surfaces, seams_adapters_contracts, drift_checks,
recommendations, handoff`) passed against the real island with no synthetic
data. Full extracted fixed-core payload:

| Field | Value |
|---|---|
| `title` | `Add CSV Export to the Reporting Dashboard — Architecture` |
| `type` | `feat` |
| `date` | `2026-07-09` |
| `status` | `complete` |
| `refs.brainstorm_ref` | `docs/brainstorms/2026-07-09-rich-html-artifacts-brainstorm.md` |
| `refs.architecture_ref` | `null` |
| `refs.tickets_ref` | `null` |
| `refs.source_docs.plans` | `["docs/plans/2026-07-09-feat-csv-export-plan.md"]` (tickets/docs/figma all `[]`) |
| `plan_ref` | `docs/plans/2026-07-09-feat-csv-export-plan.md` |
| `feature_homes[]` | 2 entries: `src/reporting/export/` (owns toCsv()/export route/UI button); `src/reporting/ (existing)` (owns the report query result, read-only) |
| `shared_global_decisions[]` | 2 entries: toCsv() serializer -> feature-local; Report-read permission check -> reuse existing shared model |
| `deepening_candidates[]` | 2 entries: streaming-approach memory-limit confirmation; CSV BOM locale question |
| `context_tiers` | `{global: "Dependency-free single-file HTML...", on_demand: "This architecture artifact; the CSV-export brainstorm...", ticket_local: "The exporter's feature home..."}` |
| `deletion_test[]` | 2 entries: Scheduled/recurring export job -> delay; Streaming CSV serializer -> keep |
| `interfaces_as_test_surfaces[]` | 1 entry: toCsv() serializer, with callers_rely_on/must_not_leak/evidence_needed |
| `seams_adapters_contracts[]` | 1 entry: Export route to serializer, adapter/contract/stability_class: permanent |
| `drift_checks[]` | 2 entries: new export format bypassing permission check; serializer buffering instead of streaming |
| `recommendations` | `{deepen_plan: [1 item], work: [1 item], review: [1 item]}` -- all three arrays non-empty |
| `handoff` | `{deepen_plan: true, work: true, review: true}` -- **3-key shape confirmed**, not the 4-key plan/brainstorm shape |
| `purpose_linkage` (Tier 3) | full prose present |
| `module_blueprint` (Tier 3) | 1-row markdown table present |
| `design_it_twice` (Tier 3) | `""` (legitimately empty -- no high-leverage comparison was required) |
| `review_depth` (Tier 3) | `"lightweight — the change is a small, well-understood addition..."` |
| `open_questions` (Tier 3) | `""` (legitimately empty -- none remain) |

### `.md` arm -- frontmatter + sections (per the field-coverage map, `island-contract.md:394-428`)

Frontmatter:

```yaml
date: 2026-07-09
topic: csv-export-architecture
type: feat
status: complete
plan_ref: docs/plans/2026-07-09-feat-csv-export-plan.md
brainstorm_ref: docs/brainstorms/2026-07-09-rich-html-artifacts-brainstorm.md
handoff: {deepen_plan: true, work: true, review: true}
```

`title` note: the architecture kind's legacy frontmatter never had a `title:`
key (only `topic`, a filename-slug -- same fold the `brainstorm` kind's
`frontmatter.topic` already uses, confirmed against
`frozen-premigration-brainstorm.md`, whose H1 `# Add CSV Export to the
Reporting Dashboard` matches its `.html` twin's `title` field byte-for-byte
while its own `topic: feat-csv-export` frontmatter is a distinct slug). The
same pattern holds here: the document's H1 (`# Add CSV Export to the
Reporting Dashboard — Architecture`) is the real title fact and is
byte-identical to the `.html` island's `title`; `topic` is a slug with no
1:1 island counterpart and is out of scope for this comparison (the
architecture field-coverage map's frontmatter table, `island-contract.md`
lines 397-405, lists no `refs.source_docs.*` row for this kind either --
the legacy architecture template never captured that facet, only the
scalar `plan_ref`, so `refs.source_docs.plans` has no `.md`-side literal to
compare against; not a divergence, an out-of-scope legacy-template gap
already documented in the contract).

Sections, mapped via the coverage table:

| Section | Extracted value |
|---|---|
| Feature Homes and Ownership | 2 entries, same `feature_home`/`owns`/`notes` as `.html` |
| Shared / Global Decisions | 2-row table, same `candidate`/`decision`/`rationale` as `.html` |
| Deepening Candidates | 2 bullets, same text as `.html` |
| Deletion Test | 2-row table, same `candidate`/`decision`/`rationale` as `.html` |
| Interfaces as Test Surfaces | 1 entry, same 4 sub-fields as `.html` |
| Seams, Adapters, and Contracts | 1 entry, same 4 sub-fields as `.html` |
| Context Tiers | 3 bullets (global/on_demand/ticket_local), same text as `.html` |
| Recommendations for `/deepen-plan`, `/workflows:work`, `/workflows:review` | 1 bullet each, same text as `.html`'s `recommendations.{deepen_plan,work,review}` |
| Drift Checks | 2 bullets, same text as `.html` |
| Purpose Linkage | same prose as `.html`'s `purpose_linkage` |
| Module Blueprint for Implementation | same 1-row table content as `.html`'s `module_blueprint` (markdown backticks around the path vs. plain text -- formatting only) |
| Design-It-Twice | placeholder text `_(No high-leverage option comparison was required for this change.)_` -- same fact as `.html`'s empty `design_it_twice`, different placeholder convention |
| Review Depth | `**Depth used:** lightweight` / `**Why:** ...` split across two lines -- same fact as `.html`'s single-string `review_depth`, concatenated differently |
| Open Questions | placeholder text `_(none)_` -- same fact as `.html`'s empty `open_questions` |

## Step 2 -- Per-arm floor

| Arm | All required architecture fixed-core keys present? | Core non-empty (`feature_homes`, `shared_global_decisions`, `deepening_candidates`, `drift_checks`, `recommendations`)? | `handoff` shape |
|---|---|---|---|
| `.html` | **PASS** -- `extractIslandData` returned `ok: true` against the real fixture (all 19 `REQUIRED_ARCHITECTURE_FIXED_CORE_KEYS` present) | **PASS** -- all five non-empty (2/2/2/2/1-each-of-3) | 3-key `{deepen_plan, work, review}` -- correct shape |
| `.md` | **PASS** -- every fixed-core fact resolvable from frontmatter + sections per the field-coverage map (title via H1, `type`/`date`/`status`/`plan_ref`/`brainstorm_ref` via frontmatter, `handoff` via frontmatter, all 9 Tier-2 structured facts via their named sections, all 5 Tier-3 prose fields present) | **PASS** -- same five, same counts | 3-key `{deepen_plan: true, work: true, review: true}` -- correct shape, matches `.html` |

Both arms clear the floor. Neither arm fails.

## Step 3 -- Cross-arm equality (structured lists strict; prose lenient)

After normalizing the trailing `.md`/`.html` extension on `*_ref` values
(both `plan_ref` and `brainstorm_ref` already point to `.md` files on both
arms in this fixture pair, so normalization is a no-op here -- no ref in
either arm currently points to an `.html` sibling):

| Field | `.html` | `.md` | Equal? |
|---|---|---|---|
| `title` | "Add CSV Export to the Reporting Dashboard — Architecture" | H1: "Add CSV Export to the Reporting Dashboard — Architecture" | Yes |
| `type` | `feat` | `feat` | Yes |
| `date` | `2026-07-09` | `2026-07-09` | Yes |
| `status` | `complete` | `complete` | Yes |
| `refs.brainstorm_ref` | `docs/brainstorms/2026-07-09-rich-html-artifacts-brainstorm.md` | same | Yes |
| `refs.architecture_ref` | `null` | absent/implied `null` | Yes |
| `refs.tickets_ref` | `null` | absent/implied `null` | Yes |
| `plan_ref` | `docs/plans/2026-07-09-feat-csv-export-plan.md` | same | Yes |
| `feature_homes[]` | 2 entries (see above) | same 2 entries, same field values | Yes (strict) |
| `shared_global_decisions[]` | 2 entries | same 2 entries | Yes (strict) |
| `deepening_candidates[]` | 2 strings | same 2 strings | Yes (strict) |
| `context_tiers` | 3 keys, given text | same 3 keys, same text | Yes (strict) |
| `deletion_test[]` | 2 entries | same 2 entries | Yes (strict) |
| `interfaces_as_test_surfaces[]` | 1 entry, 4 sub-fields | same | Yes (strict) |
| `seams_adapters_contracts[]` | 1 entry, 4 sub-fields | same | Yes (strict) |
| `drift_checks[]` | 2 strings | same 2 strings | Yes (strict) |
| `recommendations.{deepen_plan,work,review}` | 1 item each | same 1 item each | Yes (strict) |
| `handoff.{deepen_plan,work,review}` | `{true, true, true}` | `{true, true, true}` | Yes (strict) |
| `purpose_linkage` (prose) | full string | same string | Yes |
| `module_blueprint` (prose) | 1-row table, plain-text path | 1-row table, backtick-wrapped path | **Non-blocking**: same content, markdown-formatting-only variance (backticks around `src/reporting/export/`) |
| `design_it_twice` (prose) | `""` | `_(No high-leverage option comparison was required for this change.)_` | **Non-blocking**: same fact ("not applicable"), different empty-vs-placeholder convention |
| `review_depth` (prose) | one concatenated string | two labeled lines (`**Depth used:**` / `**Why:**`) | **Non-blocking**: same fact, different layout |
| `open_questions` (prose) | `""` | `_(none)_` | **Non-blocking**: same fact ("no open questions"), different empty-vs-placeholder convention |

**No divergence on any structured (Tier-1/Tier-2) field.** All four
Tier-3 prose notes above are the expected, documented lenient variance
(legacy free-prose template style vs. the composer's structured island
strings) and do not affect any fact a downstream consumer acts on.

Out-of-scope, non-blocking observation (not a divergence): `refs.source_docs.plans`
on the `.html` arm carries `["docs/plans/2026-07-09-feat-csv-export-plan.md"]`
duplicating `plan_ref`; the `.md` arm's legacy architecture template has no
`source_docs.*` frontmatter facet at all (confirmed against
`island-contract.md`'s architecture frontmatter-keys coverage table, which
lists no such row for this kind), so there is no `.md`-side literal to
compare this against. This is a documented legacy-template gap, not a
missing fact -- `plan_ref` already carries the same provenance fact on both
arms.

## Step 4 -- Downstream consequence

`work.md:89`'s T04 `.html` branch reads exactly the architecture-kind Tier-2
core (`feature homes, shared/global decisions, context tiers, drift checks,
deletion tests, interfaces as test surfaces, seams, adapters, contracts,
deepening candidates, and downstream work/review guidance`) via
`extractIslandData` + the island-extraction-helper contract; its `.md`
branch reads the identical facts from frontmatter + the named legacy
sections. Since Step 3 found zero divergence on any of those Tier-2 fields
(or on the Tier-1 envelope facts `title`/`type`/`date`/`status`/`refs.*`, or
on the 3-key `handoff` shape), `/workflows:work`, `/deepen-plan`
(`commands/deepen-plan.md:~126`), and `/workflows:review`
(`commands/workflows/review.md:128-139`) each receive **equivalent**
architecture facts -- same feature homes, same boundaries/interfaces, same
deletion-test decisions, same seams/adapters/contracts, same drift checks,
same per-consumer recommendations, and the same three-way handoff readiness
signal -- whether the architecture artifact they load is the `.html` island
or the frozen `.md` legacy twin.

## Verdict

**PASS.** Both arms clear the per-arm floor (all required architecture
fixed-core keys present, core non-empty, correct 3-key `handoff` shape).
Cross-arm equality holds on every structured (Tier-1/Tier-2) fixed-core
field with zero divergence; the only differences are four cosmetic,
non-blocking Tier-3 prose formatting variances that carry the identical
fact in each case. `work`/`deepen-plan`/`review`'s architecture dual-read is
proven equivalent for this representative fixture pair.
