---
name: html-artifact-mutator
description: >-
  Mutates a single field or content region of an existing self-contained HTML artifact in place
  (island-first, no-added-facts, injection-safe) without regenerating the document from scratch.
  Invoked by a workflow command whenever it needs to back-write into an artifact it already
  composed -- e.g. a ref/status update, or a content rewrite that must re-project the affected
  view -- never by the user directly.
user-invocable: false
---

# HTML Artifact Mutator

The **update** capability of the `html-artifacts` subsystem (`CONTEXT.md` → **Composer skill** is
**create**; this skill is **update**). A workflow command invokes this skill when it needs to
change a fact inside an artifact it (or another command) already wrote, without touching anything
else in the document. It never talks to the user directly and never asks for design input.

This is the single, shared owner of every in-place HTML-artifact edit. Every mutating consumer
(deepen-plan back-writes, grill-with-docs enrichment, architecture-handoff status flips,
ref/status updates from later workflow stages) goes through this one skill, so island-first +
no-added-facts + re-projection stay identical everywhere instead of drifting per caller.

## Required contract

Before mutating anything, load:

- `commands/workflows/references/html-artifacts/island-contract.md` — the fixed-core schema, the
  serialization primitive, the field-coverage map, and this skill's **Mutation contract** section
  (mutable-region policy, the two mutation classes, `render_meta` re-projection rules). The
  mutation this skill performs MUST conform to it exactly.
- `commands/workflows/references/html-artifacts/primitives-catalog.md` — needed only when a
  content mutation dispatches re-projection (see Workflow, step 4); the scalar path never needs
  it.

If the contract cannot be loaded, stop and report it as unavailable instead of guessing at the
schema or inventing a mutation shape.

## Input contract

The caller (a workflow command) supplies:

- `target_path` — the existing artifact file to mutate, e.g. `docs/plans/2026-07-09-feat-csv-export-plan.html`.
  The file MUST already exist and already contain a valid `#artifact-data` island; this skill
  never creates a new artifact (that is the composer's job).
- `mutation` — exactly one of:
  - `{ class: "scalar", field: string, value: unknown }` — `field` MUST be a dotted path inside
    the scalar mutable region (see Mutable-region policy below). Used for back-writes like a
    `status` flip or a `refs.tickets_ref` fill-in once ticketization exists.
  - `{ class: "content", patch: Record<string, unknown> }` — each key of `patch` is a top-level
    Tier-2/3/4 island field whose entire value is replaced (supply the complete new value, e.g.
    the full `slices[]` array with one entry changed — not a deep partial diff). `patch` MUST NOT
    contain any Tier-1 envelope key (including `render_meta`); such a mutation is rejected.

If `mutation` requests a field outside its class's mutable region, stop and report exactly which
field is out of policy rather than attempting an unsafe write.

## Mutable-region policy

Authored here (the shipped mutation contract) and mirrored in `island-contract.md`:

| Class | May touch | May NOT touch |
|---|---|---|
| **scalar** | Tier-1 envelope `status`, and every `refs.*` leaf (`refs.brainstorm_ref`, `refs.architecture_ref`, `refs.tickets_ref`, `refs.source_docs.*`) | `title`, `type`, `date`, `kind`, `schema_version` (identity/classification, set once at composition and never rewritten), `render_meta` (writer-only) |
| **content** | Tier-2 contract-core fields (`execution_shape`, `tdd`, `runtime_stack`, `constitution`, `handoff`, `slices`, `success_criteria`, `suggested_e2e_suite`), Tier-3 prose fields, Tier-4 `ext{}` | Every Tier-1 envelope key, including `render_meta` |

`render_meta` is never mutated by either class. Scalar mutations don't touch it because they
never re-project. Content mutations don't touch it because re-projection must *reuse* the
recorded `{ archetypes, design_seed }`, not regenerate it — that reuse is exactly what keeps the
design stable across edits (no classifier drift between one edit and the next).

## Workflow: read → parse → mutate → re-serialize → re-project

1. **Read** `target_path`'s raw file contents. Never scrape rendered HTML for facts — only the
   island is ever read for data.
2. **Parse** the island with the shared fail-loud extraction contract
   (`island-contract.md`'s `extractIslandData`). If extraction fails, stop and report the exact
   error code (`MISSING_ISLAND` / `EMPTY_ISLAND` / `INVALID_JSON` / `MISSING_REQUIRED_FIELD`) —
   never attempt a partial or best-effort write against a malformed island.
3. **Mutate** the parsed island object per the requested mutation class:
   - **Scalar class**: validate `field` is in the scalar mutable region (reject otherwise), then
     set that one field to `value`. Every other field on the island object is untouched.
   - **Content class**: validate no key of `patch` is a Tier-1 envelope key (reject otherwise),
     then shallow-merge `patch` onto the island object (each key's value fully replaces the
     existing value at that key). `render_meta` is carried forward unchanged.
4. **Re-serialize** the mutated island with the exact T01 primitive (`island-contract.md` →
   "Serialization primitive"): `JSON.stringify`, then `<`→`<`, `>`→`>`, `/`→`/`,
   U+2028→` `, U+2029→` `. Replace the `#artifact-data` script tag's inner text with
   this string — the opening/closing tags and every other byte of the document stay untouched.
   **Never re-implement or re-derive this escape** — do not use HTML-entity escaping (`&lt;`)
   for the island; it is not reversible inside `<script type="application/json">` (see
   `island-contract.md` for why).
5. **Re-project the affected view, only when required:**
   - **Scalar class — no re-projection.** Instead, attempt one light, inline, single-element
     rendered update: if the field's *old* value is rendered verbatim as exactly one element the
     composer's own conventions produce (e.g. a `<span class="badge">{value}</span>` for
     `type`/`status`/`date`), replace that element's text with the HTML-entity-escaped new value.
     If zero or more than one such element exists — **or the field's old value was `null`/absent
     and is being set for the first time** (e.g. a `refs.tickets_ref: null → "..."` back-write,
     where there is no existing rendered token to find at all) — the in-place rewrite is unsafe or
     impossible; instead, append a rendered "Related Artifacts" section near the end of `<body>`
     stating the new value (backed by the same island field, never inventing new facts), and log
     that the safer fallback ran instead of an ambiguous in-place rewrite or a silent no-op. This
     is light enough to run inline; it never dispatches a subagent.
   - **Content class — always re-project, via a fresh subagent.** A content mutation always
     changes what the visible HTML should say, and re-drawing an existing composed layout well
     is exactly the composer's kind of creative judgment — not a job for deterministic string
     surgery. Dispatch a **fresh subagent** (the same delegation contract the composer's
     Invocation section uses) with exactly: an instruction to load and follow the composer's
     `SKILL.md` in **re-projection mode**, the mutated island (already re-serialized and written
     to `target_path` by step 4), and the recorded `render_meta` from that island. The subagent's
     job is to re-render *only the affected section(s)* of the visible HTML from the current
     island content, reusing the exact `archetypes`/`design_seed` already recorded — never
     reclassifying, never touching unrelated sections, never inventing a fact the island doesn't
     carry. The subagent returns only the rewritten artifact path; this skill does not consider
     the mutation complete, and must not report success to its caller, until that re-projection
     has run — a content mutation that stops after step 4 has updated the machine contract but
     left the human view stale, which is exactly the drift this skill exists to prevent.

## Self-check before returning

1. Re-parse the written file's island. Confirm it is valid JSON via the T01 primitive, still
   contains every `REQUIRED_FIXED_CORE_KEYS` entry, and the mutated field(s) hold the requested
   new value(s) — every other field is untouched.
2. For a content mutation, confirm `render_meta` is byte-identical to what it was before the
   mutation (reused, not regenerated) and that re-projection actually ran (no stale rendered
   fact left contradicting the current island).
3. For a scalar mutation, confirm either the single rendered element was updated in place, or
   the fallback "Related Artifacts" section was appended and the fallback logged — never neither.
   This holds even when the field's old value was `null`/absent (newly set for the first time):
   there is no existing rendered token to patch, so that case routes to the fallback too, exactly
   like zero rendered matches — it must never be treated as a no-op.
4. Confirm no external dependency, script tag, or style block was added or removed by the edit;
   the file remains a single self-contained document.
5. Return the mutated artifact's path (and the fallback log, if any) to the caller. Do not print
   the full HTML into the conversation.

## Guardrails

- Never write to `target_path` if extraction fails for any reason — report the exact error code
  instead of a partial or silent write. A malformed or missing island is a hard stop, not a
  best-effort patch.
- Never touch a field outside the requested mutation's class region. A scalar mutation is Tier-1
  `status`/`refs.*` only; a content mutation is Tier-2/3/4 only and must never include
  `render_meta` or any other Tier-1 key.
- Never fold this skill's job into the composer, and never let the composer mutate an existing
  artifact in place — create and update are deliberately two separate skills with two separate
  responsibilities.
- Never build or invoke a runnable `serialize`/`extract`/mutate module. The only place a reusable
  JS implementation of these primitives is allowed to live is `tests/support/island-spec.ts`
  (imported only by `tests/html-artifact-island.test.ts` and `tests/html-artifact-mutation.test.ts`),
  which this skill never imports.
- Never write a fact into the rendered HTML that isn't already on the island after the mutation.
  Every decision-bearing fact the rendered view shows must trace to an island field, exactly like
  the composer's one hard rule — a mutation may restructure or enrich island data, but never adds
  a rendered fact the island doesn't carry.
