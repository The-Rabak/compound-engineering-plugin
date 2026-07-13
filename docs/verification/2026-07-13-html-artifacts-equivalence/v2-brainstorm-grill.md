# v2 Brainstorm Dual-Read / `grill-with-docs` Cross-Arm Equivalence (T03, todo 021)

**Verdict: FAIL (single-field divergence) -- scoped to one Tier-2 field**

Both arms clear the per-arm floor. Cross-arm equality holds with zero
divergence on 16 of 17 compared fixed-core fields (every structured list,
every Tier-1 envelope fact, and every field the task's Tier-3-prose leniency
rule actually covers). **One Tier-2, strict-compare field --
`architectural_context` -- genuinely diverges**: the `.md` arm's
"Architectural Context" section carries substantive structural detail (six
labeled facts from `brainstorm.md`'s own "Architectural Context Map") that
has no representation anywhere in the `.html` island (not even `ext{}`,
which is empty). This is not a wording/formatting variance -- it is a
content-coverage gap. A `plan`/`grill-with-docs` consumer reading the `.html`
arm for this fact receives strictly less architectural detail than one
reading the `.md` arm.

## Inputs

- `.html` arm: `tests/fixtures/html-artifacts/representative-brainstorm.html` (`kind: "brainstorm"`)
- `.md` arm: `tests/fixtures/html-artifacts/frozen-premigration-brainstorm.md`
- Contract: `portable/compound-engineering/commands/workflows/references/html-artifacts/island-extraction-helper.md` (step 4's brainstorm-kind fixed-core field list) + `island-contract.md`'s brainstorm Tier-2/Tier-3 sections and field-coverage map (`island-contract.md:124-192`, `:362-392`)
- Downstream `.html` branch confirmed at `portable/compound-engineering/commands/workflows/plan.md:142-149` ("Brainstorm Input Dual-Read"): "`.html` -- load `commands/workflows/references/html-artifacts/island-extraction-helper.md` ... read the brainstorm's `#artifact-data` JSON island. Read the same lynchpin facts the legacy path reads from frontmatter/sections, sourced from the island instead: `problem_narrative`, `user_story`, `architectural_context`, `success_criteria[]`, `chosen_approach`, `key_decisions[]`, `resolved_questions[]`, `open_questions[]`, and `handoff.*`". `grill-with-docs`' content-class mutation is the second consumer named by `island-spec.ts`'s `BrainstormArtifactIsland` doc comment (`tests/support/island-spec.ts:124-133`) as acting on this same Tier-2 core.
- Sanctioned reader used verbatim: `extractIslandData` from `tests/support/island-spec.ts`, invoked via `bun` against the real `.html` fixture (no hand parsing of the `.html` arm, no rendered-HTML scraping).

## Step 1 -- Real-reader extraction

### `.html` arm -- `extractIslandData(html)` result

Ran (scratch script, not committed, `/private/tmp/.../scratchpad/extract-html.ts`):

```ts
import { readFileSync } from "fs"
import { extractIslandData } from "tests/support/island-spec.ts"
const html = readFileSync("tests/fixtures/html-artifacts/representative-brainstorm.html", "utf8")
console.log(JSON.stringify(extractIslandData(html), null, 2))
```

Result: `{ ok: true, data: {...} }` -- the extractor's kind-aware required-key
check (`REQUIRED_KEYS_BY_KIND.brainstorm`, 17 keys: `schema_version, kind,
title, type, date, status, refs, render_meta, problem_narrative, user_story,
architectural_context, success_criteria, chosen_approach, key_decisions,
resolved_questions, open_questions, handoff`) passed against the real island
with no synthetic data. Full extracted fixed-core payload:

| Field | Value |
|---|---|
| `title` | `Add CSV Export to the Reporting Dashboard` |
| `type` | `feat` |
| `date` | `2026-07-09` |
| `status` | `complete` |
| `refs.brainstorm_ref` | `null` |
| `refs.architecture_ref` | `null` |
| `refs.tickets_ref` | `null` |
| `refs.source_docs.{tickets,docs,figma,plans}` | all `[]` |
| `problem_narrative` | "Analysts currently screenshot report tables to share them, losing precision and making downstream re-analysis impossible." |
| `user_story` | "As an analyst, I need to export any report I can view as a CSV file, so that I can re-analyze the underlying numbers in my own tools instead of retyping them from a screenshot." |
| `architectural_context` | "Lives in the existing reporting module; the serializer is a pure function reused by both the new export route and, later, a scheduled-export job." |
| `success_criteria[]` | 2 strings: "A user can export any report they can view as a CSV file."; "Exported CSV opens correctly in Excel and Google Sheets without column misalignment." |
| `chosen_approach` | "Add a pure toCsv() serializer reused by a new export API route and a UI button, rather than a client-side-only export or a background export job, because it fully satisfies both success criteria with the least moving parts." |
| `key_decisions[]` | 2 entries: {Stream the export.../Some reports have 100k+ rows...}; {Reuse the existing report-read permission.../Export is the same data...} |
| `resolved_questions[]` | 1 entry: {"Should exports support XLSX as well as CSV?" / "No -- deferred; CSV alone satisfies both success criteria..."} |
| `open_questions[]` | `[]` |
| `handoff` | `{problem_narrative: true, user_story: true, architectural_context: true, success_criteria: true}` |
| `scope_boundary` (Tier 3) | "Explicitly included: serializer, export route, UI button. Deferred: scheduled/recurring exports, XLSX format." |
| `non_goals` (Tier 3) | "Scheduled/recurring exports. XLSX format." |
| `constitution_alignment` (Tier 3) | "No constitution version is recorded for this repository; no waivers apply." |
| `approaches_considered` (Tier 3) | "A client-side-only export was rejected because large reports would freeze the browser tab. A background export job was rejected as premature -- no user has asked for exports larger than an interactive request can serve." |
| `stakeholder_impact` (Tier 3) | "Analysts get a direct export path. Engineering gains a reusable serializer for a later scheduled-export feature. No operations or business impact beyond normal feature rollout." |

Note: the island's raw JSON text stores `/` as the `/` escape (e.g.
`scheduled/recurring`); `extractIslandData`'s `JSON.parse` resolves this
back to a literal `/` automatically, confirmed in the printed output above
(`scheduled/recurring`) -- no separate unescape step was needed or applied,
per the extraction helper's contract.

### `.md` arm -- frontmatter + sections (per the field-coverage map, `island-contract.md:362-392`)

Frontmatter:

```yaml
date: 2026-07-09
topic: feat-csv-export
type: feat
status: complete
handoff:
  problem_narrative: true
  user_story: true
  architectural_context: true
  success_criteria: true
```

`title` note: `brainstorm.md`'s legacy frontmatter never had a `title:` key
(only `topic`, a filename-slug -- `island-contract.md:367`: "Folded into
`title` -- the same way `plan`'s filename slug ... is derived, not a separate
island field"). The document's H1 (`# Add CSV Export to the Reporting
Dashboard`) is the real title fact and is byte-identical to the `.html`
island's `title`; `topic: feat-csv-export` is a slug with no 1:1 island
counterpart and is out of scope for this comparison.

`type` note: the fixture's own header comment (lines 28-33) documents that
`type: feat` was *added* to this frontmatter specifically to satisfy the
shared Tier-1 envelope's requirement, since the real legacy `brainstorm.md`
template never emitted a `type:` key at all. This is a disclosed,
intentional fixture-construction choice, not a hidden gap.

`refs.*` note: the brainstorm frontmatter-keys coverage table
(`island-contract.md:362-372`) lists no `refs.*` row for this kind at all --
the legacy template never captured `brainstorm_ref`/`architecture_ref`/
`tickets_ref`/`source_docs.*`, and the island's own reference fixture
(`buildValidBrainstormIslandFixture`, `tests/support/island-spec.ts:549-556`)
documents `source_docs: []` as "Legitimately empty: brainstorm.md's legacy
frontmatter template never captured `source_docs` at all." There is no
`.md`-side literal to compare `refs.*` against; this is an out-of-scope,
documented legacy-template gap, not a divergence.

Sections, mapped via the coverage table:

| Section | Extracted value |
|---|---|
| Problem Narrative | "Analysts currently screenshot report tables to share them, losing precision and making downstream re-analysis impossible." |
| User Story | "As an analyst, I need to export any report I can view as a CSV file, so that I can re-analyze the underlying numbers in my own tools instead of retyping them from a screenshot." |
| Success Criteria | 2 bullets, same text as `.html` |
| Architectural Context | **Full section body** (per the "read the section's text" convention every other section in this map uses): the lead sentence "Lives in the existing reporting module; the serializer is a pure function reused by both the new export route and, later, a scheduled-export job." **plus six labeled sub-bullets**: Lives in (the existing reporting module); Feature home (`src/reporting/`); Interacts with (the reporting API layer and the report-viewer UI); User entry point (an "Export CSV" button on the report toolbar); Data (reads the same report query result the viewer already renders; writes nothing); Dependencies (the existing report-read permission model); Shared / global notes (the serializer is a pure function, reusable by a later scheduled-export job -- keep it feature-local for now, promote only if a second consumer appears). |
| Chosen Approach | same text as `.html` |
| Key Decisions | 2 bullets (`decision: rationale` form), same 2 `{decision, rationale}` pairs as `.html` |
| Scope Boundary | same text as `.html` |
| Non-goals / Deferred Ideas | 2 bullets: "Scheduled/recurring exports"; "XLSX format" |
| Constitution Alignment | 2 labeled bullets: "Relevant project rules: none recorded"; "No amendment needed because: no `docs/constitution.md` exists for this repository" |
| Approaches Considered | same text as `.html` |
| Stakeholder Impact | 4 labeled bullets: End users / Developers / Operations / Business |
| Open Questions | placeholder text `_(none -- all resolved below)_` -- no items |
| Resolved Questions | 1 bullet, same `{question, answer}` pair as `.html` |

## Step 2 -- Per-arm floor

| Arm | All required brainstorm fixed-core keys present? | Core non-empty (`problem_narrative`, `user_story`, `key_decisions`, `resolved_questions` -- the T03 E2E floor's four gated fields)? |
|---|---|---|
| `.html` | **PASS** -- `extractIslandData` returned `ok: true` against the real fixture (all 17 `REQUIRED_BRAINSTORM_FIXED_CORE_KEYS` present) | **PASS** -- all four non-empty (1/1/2/1) |
| `.md` | **PASS** -- every fixed-core fact resolvable from frontmatter + sections per the field-coverage map (`title` via H1, `type`/`date`/`status` via frontmatter, `handoff` via frontmatter, all 8 Tier-2 structured facts via their named sections, all 5 Tier-3 prose fields present). `schema_version`/`kind`/`render_meta` have no legacy-frontmatter literal (documented, expected gap -- these Tier-1 concepts postdate the `.md` template entirely) | **PASS** -- same four, same counts |

Both arms clear the floor. Neither arm fails on presence/non-emptiness.

## Step 3 -- Cross-arm equality (structured lists strict; Tier-3 prose lenient)

No `*_ref` value on either arm is non-null, so the `.md`/`.html` extension
normalization step is a no-op here.

| Field | `.html` | `.md` | Equal? |
|---|---|---|---|
| `title` | "Add CSV Export to the Reporting Dashboard" | H1: "Add CSV Export to the Reporting Dashboard" | Yes |
| `type` | `feat` | `feat` | Yes |
| `date` | `2026-07-09` | `2026-07-09` | Yes |
| `status` | `complete` | `complete` | Yes |
| `refs.brainstorm_ref` | `null` | absent (no `.md`-side facet, documented) | Yes (equivalent absence) |
| `refs.architecture_ref` | `null` | absent (no `.md`-side facet, documented) | Yes (equivalent absence) |
| `refs.tickets_ref` | `null` | absent (no `.md`-side facet, documented) | Yes (equivalent absence) |
| `refs.source_docs.*` | all `[]` | absent (no `.md`-side facet, documented) | Yes (equivalent absence) |
| `problem_narrative` | full string | same string | Yes (strict) |
| `user_story` | full string | same string | Yes (strict) |
| `architectural_context` | lead sentence only | lead sentence **+ 6 labeled structural sub-facts** (feature home, interacts-with, user entry point, data, dependencies, shared/global notes) | **NO -- DIVERGENT.** See finding below. |
| `success_criteria[]` | 2 strings | same 2 strings | Yes (strict) |
| `chosen_approach` | full string | same string | Yes (strict) |
| `key_decisions[]` | 2 `{decision, rationale}` pairs | same 2 pairs, byte-identical | Yes (strict) |
| `resolved_questions[]` | 1 `{question, answer}` pair | same pair, byte-identical | Yes (strict) |
| `open_questions[]` | `[]` | `[]` (placeholder text means "no items", parses to empty) | Yes (strict) |
| `handoff.{problem_narrative,user_story,architectural_context,success_criteria}` | `{true, true, true, true}` | `{true, true, true, true}` | Yes (strict) |
| `scope_boundary` (Tier 3) | full string | same string | Yes |
| `non_goals` (Tier 3) | "Scheduled/recurring exports. XLSX format." (run-on sentence) | 2 bullets: "Scheduled/recurring exports"; "XLSX format" | **Non-blocking**: same 2 facts, list vs. sentence formatting only |
| `constitution_alignment` (Tier 3) | one synthesized sentence | 2 labeled bullets | **Non-blocking**: same fact ("nothing recorded, nothing to align"), different layout |
| `approaches_considered` (Tier 3) | full string | same string | Yes |
| `stakeholder_impact` (Tier 3) | one synthesized paragraph (end users / engineering / ops+business combined) | 4 labeled bullets (end users / developers / operations / business, ops and business split) | **Non-blocking**: same facts, ops+business combined vs. split, wording paraphrase only |

### Finding: `architectural_context` is a genuine content-coverage divergence, not a wording variance

`architectural_context` is **Tier 2** for the `brainstorm` kind (per
`island-contract.md:124-133` and this task's own field list, which places it
alongside `problem_narrative`/`user_story` -- not among the five fields it
explicitly designates Tier-3 prose). Per the task's own comparison rule,
Tier-2 fields are deep-equal / strict, and only the five named Tier-3 prose
fields (`scope_boundary`, `non_goals`, `constitution_alignment`,
`approaches_considered`, `stakeholder_impact`) get wording leniency. This
repo's own prior equivalence pass (`v2-architecture-read.md`) follows the
identical convention: it reserves "non-blocking" leniency exclusively for
that kind's four Tier-3 fields and requires exact match on every Tier-2
field, including scalar/prose-shaped ones like `context_tiers.*`.

The shared lead sentence is byte-identical on both arms -- there is no
contradiction at that level. But the `.md` arm's "Architectural Context"
section is the literal output of `brainstorm.md`'s own Phase 2.5
"Architectural Context Map" methodology (`brainstorm.md:156-165`: System
Placement, Boundary Interactions, User Touchpoints, Data Considerations,
Dependency Direction, Shared/Global Boundaries -- mapped 1:1 onto this
fixture's six bullets: Lives in / Feature home, Interacts with, User entry
point, Data, Dependencies, Shared/global notes). `brainstorm.md:169` states
this context map "flows into every execution agent's
`{{ARCHITECTURAL_CONTEXT}}` and every reviewer's evaluation frame" -- i.e.
it is substantive, load-bearing output, not decorative elaboration.

None of that six-bullet detail exists anywhere in the `.html` island: not in
`architectural_context` (lead sentence only), and not in `ext{}` (which is
`{}`, empty, in this fixture). A `/workflows:plan` or `grill-with-docs`
consumer reading the `.html` arm's `architectural_context` for this feature
receives strictly less structural detail (no feature home, no
interacts-with, no user entry point, no data flow, no dependency, no
shared/global classification) than the same consumer would receive reading
the `.md` arm's "Architectural Context" section. This directly touches the
`html-artifacts` project's own `SC3` success criterion ("Zero contract loss
versus legacy Markdown frontmatter + sections",
`tests/support/island-spec.ts:501-505`) -- for this one field, on this
representative fixture pair, contract loss did occur.

This is best read as a real (if by-design) compression introduced by the
new composer's brainstorm authoring instructions
(`brainstorm.md:148-165`, "Output format: ... 5-10 sentences max" for the
single `architectural_context` field) rather than a one-off fixture
authoring slip -- but the fixture pair's own header comment
(`frozen-premigration-brainstorm.md:20-26`) explicitly claims "the SAME
contract facts ... same ... architectural context" between the two arms.
That claim does not hold under strict field-level comparison.

## Step 4 -- Downstream consequence

`plan.md:147`'s `.html` branch reads exactly the brainstorm-kind Tier-2 core
(`problem_narrative`, `user_story`, `architectural_context`,
`success_criteria[]`, `chosen_approach`, `key_decisions[]`,
`resolved_questions[]`, `open_questions[]`, `handoff.*`) via
`extractIslandData` + the island-extraction-helper contract; its `.md`
branch reads the identical-named facts from frontmatter + the named legacy
sections. Step 3 found **zero divergence on 8 of those 9 Tier-2 fields**
(everything except `architectural_context`) and zero divergence on the
Tier-1 envelope facts (`title`/`type`/`date`/`status`/`refs.*`, modulo the
documented, expected `refs.*` legacy-template absence).

For `problem_narrative`, `user_story`, `success_criteria`,
`chosen_approach`, `key_decisions`, `resolved_questions`, `open_questions`,
and `handoff` -- a `plan`/`grill-with-docs` consumer receives **equivalent**
WHY facts whether the brainstorm they load is the `.html` island or the
frozen `.md` legacy twin.

For `architectural_context` specifically, the consumer does **not** receive
equivalent facts: reading the `.html` arm yields only the lead sentence;
reading the `.md` arm additionally yields the feature-home, boundary,
entry-point, data, dependency, and shared/global classifications that
`brainstorm.md`'s own Phase 2.5 methodology produces and that downstream
execution agents and reviewers are told to rely on
(`brainstorm.md:169`). A plan built from the `.html` arm's architectural
context alone is measurably less informed on this specific fact than one
built from the `.md` arm.

## Verdict

**FAIL, scoped to one field.** Both arms clear the per-arm floor (all
required brainstorm fixed-core keys present, core non-empty). Cross-arm
equality holds with zero divergence on every structured list
(`success_criteria[]`, `key_decisions[]`, `resolved_questions[]`,
`open_questions[]`), every Tier-1 envelope fact, `handoff`, and 8 of 9
Tier-2 core fields, plus the expected lenient (formatting-only) variance on
the five Tier-3 prose fields. The one exception --
**`architectural_context`, a Tier-2/strict-compare field -- genuinely
diverges**: the `.md` arm carries real structural facts (feature home,
boundary interactions, user entry point, data flow, dependencies,
shared/global classification) that the `.html` arm's field, and the
island's `ext{}` extension slot, do not carry at all. This is not
softened, hedged, or waived here: for this one fact, a `plan`/
`grill-with-docs` consumer does **not** get equivalent WHY facts between
the two arms, and the fixture pair's own header claim of "same
architectural context" does not hold under strict comparison. Every other
compared fact is equivalent between arms.
