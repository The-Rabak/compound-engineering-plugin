---
plan_ref: docs/plans/2026-07-09-feat-rich-html-artifacts-v2-plan.md
architecture_ref: docs/architecture/2026-07-09-rich-html-artifacts-architecture.md
brainstorm_ref: docs/brainstorms/2026-07-09-rich-html-artifacts-brainstorm.md
execution_shape: vertical-slices
ticket_set_status: in_progress
last_completed_batch: 1
total_batches: 6
---

# Ticket Set: Rich Interactive HTML Artifacts — v2 (update capability + full rollout)

- **Plan:** `docs/plans/2026-07-09-feat-rich-html-artifacts-v2-plan.md`
- **Architecture handoff:** `docs/architecture/2026-07-09-rich-html-artifacts-architecture.md`
- **Canonical WHY source:** `docs/brainstorms/2026-07-09-rich-html-artifacts-brainstorm.md`
- **Execution shape:** `vertical-slices` — each artifact conversion + its mutation wiring is a thin, demoable end-to-end behavior reusing the proven v1 substrate. **T01 is the shared enabling capability (update) that the vertical slices T02–T04 build on; T02 is the first true tracer bullet.**
- **Hard external prerequisite (already complete):** v1 pilot shipped at plugin `v4.21.0` — the island schema, serialization/extraction primitive, `render_meta` writer, composer skill + Invocation contract, extraction helper, and dual-read surface are all in the repo. This ticket set does **not** re-do v1.

## Dependency Graph

```
        v1 (external, complete: island primitive, composer, render_meta writer, dual-read)
                                   │ hard
                                   ▼
                       ┌──────────────────────┐
                       │ T01 html-artifact-    │  (update capability + count bump)
                       │      mutator skill    │  serves SC1
                       └──────────┬───────────┘
                    hard          │          hard          hard
             ┌────────────────────┼────────────────────────────┐
             ▼                    ▼                             ▼
   ┌──────────────────┐  ┌──────────────────┐        ┌──────────────────┐
   │ T02 deepen-plan  │  │ T03 brainstorm → │        │ T04 architecture │
   │  on plan.html    │  │  HTML + grill +  │        │  → HTML + mutate │
   │  + scalar writes │  │  plan-input read │        │  + downstream    │
   │  serves SC2      │  │  serves SC3      │        │  read; serves SC4│
   └────────┬─────────┘  └────────┬─────────┘        └────────┬─────────┘
            │ hard                │ hard                      │ hard
            └──────────────────────┴──────────────┬───────────┘
                                                   ▼
                                        ┌──────────────────────┐
                                        │ T05 discriminating    │  serves SC5
                                        │  .md-ref sweep        │
                                        └──────────┬───────────┘
                                                   │ hard
                                                   ▼
                                        ┌──────────────────────┐
                                        │ T06 release           │  cross-cutting
                                        │  reconciliation       │  (ships SC1–SC5)
                                        └──────────────────────┘
```

**Logical edges (from the plan):** T02, T03, T04 each depend only on **T01** (and on the completed v1 substrate). T05 depends on **T02 + T03 + T04**. T06 depends on **T05**.

> Note the split between *logical* and *sequencing* dependencies: T02/T03/T04 are logically independent siblings of one another, but they are **not** batched together — see Execution Batches for why.

## Execution Batches

All six batches are **singletons**. This is a deliberate, conservative partition, not an oversight. Two independent reasons force sequential execution:

1. **Shared regenerated tree (applies to every ticket).** Every ticket edits a `portable/` file and must run `bun run build:platforms`, which regenerates the *entire* `plugins/**` and `.github/**` generated tree and must leave `bun run verify:generated` clean. Two tickets running concurrently would both rewrite that shared output tree and race. This alone rules out parallel batches for this set.
2. **Direct file overlaps between the sibling slices** (below) independently block the only parallel grouping that dependencies would otherwise allow.

| Batch | Ticket | Depends on (satisfied by) | Why singleton / not grouped |
|---|---|---|---|
| 1 | T01 | — (T01 is the foundation; v1 external) | Foundation; everything else waits on it. |
| 2 | T02 | T01 (Batch 1) | Overlaps `commands/deepen-plan.md` with T04; shares regenerated tree with all. |
| 3 | T03 | T01 (Batch 1) | Overlaps `island-contract.md` + `gallery-manifest.md` with T04; shares regenerated tree. |
| 4 | T04 | T01 (Batch 1) | Overlaps `island-contract.md`/`gallery-manifest.md` (T03) **and** `deepen-plan.md` (T02) **and** `review.md` (T05); shares regenerated tree. |
| 5 | T05 | T02 + T03 + T04 (Batches 2–4) | Sweep needs all conversions landed first; overlaps `review.md` span with T04. |
| 6 | T06 | T05 (Batch 5) | Release reconciliation must be last, after all portable edits settle. |

### File-overlap safety notes

Because there are **no multi-ticket batches**, there is no intra-batch race to certify. For completeness, the cross-ticket overlaps that *would* matter if anyone tried to parallelize (and which reinforce the singleton decision) are:

- `references/html-artifacts/island-contract.md` — edited by **T01** (mutation contract + `render_meta` re-projection rules), **T03** (add `brainstorm` kind core), **T04** (add `architecture` kind core). Additive but same file → sequential only.
- `references/html-artifacts/gallery-manifest.md` — edited by **T03** and **T04** (each adds its archetype entries). Sequential only.
- `tests/html-artifact-island.test.ts` — edited by **T03** and **T04** (each adds its own new-`kind` L2 field-coverage assertion). Sequential only.
- `commands/deepen-plan.md` — **T02** main rewrite (plan dual-read `~:30`/`:96–117`); **T04** adds the architecture read (`:117`); **T05** adds the secondary brainstorm read (`:115`). Disjoint spans → sequential only.
- `commands/workflows/review.md` — **T04** wires the architecture *read* at `:128–139`; **T05** touches the discovery glob `:102`, the reference-docs listing `:212`, and the stale v1-only caveat `:116`. Disjoint spans → sequential only (T05 follows T04).
- `commands/workflows/work.md` — **T04** wires the architecture *read* at `:89` (span `:88–90`); **T05** touches the stale v1-only caveat `:61` and the secondary brainstorm read `:88`. Sequential only.
- `commands/workflows/to-issues.md` — **T05** exclusively (the structured architecture consumer `:79` + brainstorm read `:78` + stale caveat `:72`, added after the `ticket-flow-auditor` sweep). No overlap.

## Ticket Table

| Ticket | Title | Kind | Serves | Depends on | Type | Status |
|---|---|---|---|---|---|---|
| [T01](01-html-artifact-mutator-skill.md) | `html-artifact-mutator` skill (update capability) | infra-track | SC1 | — | none (v1 external) | completed |
| [T02](02-deepen-plan-html-mutation.md) | `deepen-plan` on `plan.html` + scalar back-writes | tracer-bullet | SC2 | T01 | hard | ready |
| [T03](03-brainstorm-html-grill-plan-input.md) | `brainstorm` → HTML + grill mutation + plan-input dual-read | expansion | SC3 | T01 | hard | ready |
| [T04](04-architecture-html-downstream-read.md) | `architecture` → HTML + mutation + downstream dual-read | expansion | SC4 | T01 | hard | ready |
| [T05](05-discriminating-md-ref-sweep.md) | Discriminating system-wide `.md`-ref sweep | hardening | SC5 | T02, T03, T04 | hard | ready |
| [T06](06-release-reconciliation.md) | Release reconciliation (version + CHANGELOG + `/release-docs`) | infra-track | ships SC1–SC5 | T05 | hard | ready |

## Blockers

No unresolved blockers. The single hard external prerequisite — the v1 substrate — is **already shipped** (`v4.21.0`), so Batch 1 is executable immediately.

Surfaced uncertainties carried from the plan (each ticket restates its own):
- **T01** must define the mutable-region policy explicitly (currently unstated in the shipped contract — flagged as an open contract edge in the architecture handoff).
- **T03 / T04** must pin each new `kind`'s field-coverage map *before* wiring the composer (schema-before-composer discipline) — otherwise guaranteed rework.
- The per-artifact **equivalence "real chains" (E2E scenarios 4–6) are a manual/agent-run procedure**, not a `bun test` harness — each chain re-authors v1's T05 gate protocol. Do not expect a reusable harness.

## Review Summary

Three passes ran over the settled set: `document-review` in **ticket-index mode**, `document-review` in **ticket mode** (all 6 tickets), and the **`ticket-flow-auditor`** ticket-set audit. **1 blocking gap** was found and **repaired**; the ticket set is now execution-ready.

### Blocking gaps

- **[RESOLVED — repaired in this ticket set]** *`to-issues.md` is a structured architecture consumer that no v2 ticket made `.html`-aware → SC5 was over-claimed.* `to-issues.md:79` does a **structured** read of feature-home / shared-global decisions from the architecture artifact (the exact fields T04 puts in the architecture island), and `:72` hardcodes "`architecture_ref` … always resolve to `.md`". After T04, `/workflows:to-issues` would scrape rendered HTML — the drift the architecture handoff forbids. The plan's Slice 5 enumeration missed it because the handoff's `handoff:` frontmatter declared only `deepen_plan`/`work`/`review` as consumers. **Repair applied:** `to-issues.md` added to **T05** `files:` + enumerated surface (structured architecture read `:79`, brainstorm read `:78`, stale caveat `:72`); the same stale v1-only caveats at `review.md:116` and `work.md:61` were added to T05; T05 acceptance criteria strengthened to grep-audit for stale caveats; index file-overlap notes reconciled. Verified against the live file before repairing (not taken on faith).

### Recommendations

- **[Folded into T05]** Secondary brainstorm WHY-context reads (`deepen-plan.md:115`, `work.md:88`, `review.md:123`) stay `.md`-only after T03 — now enumerated in T05 with an explicit "migrate or document as acceptable-degradation, never silently skip" rule so SC5 stays honest. *(Structured architecture reads in those files are already owned by T04.)*
- **[Folded into T04]** `work.md:90` citation was one line off — `:89` is the architecture *read*, `:90` is the no-artifact fallback. T04 retargeted to `:89` (span `:88–90`).
- **[Applied by ticket-mode review]** T03/T04 Coupling Notes + this index now record the `tests/html-artifact-island.test.ts` overlap (each adds its own new-`kind` L2 assertion); T06 gained a pointer to `docs/solutions/plugin-versioning-requirements.md` (MINOR bump for a new skill).
- **(Minor, not applied — optional)** A one-line "Next action" callout near the frontmatter would spare a cold-start agent from deriving the next batch off `last_completed_batch`. Not blocking — `/workflows:work` reads the counter directly per the ticket-execution-contract.

### Verified clean (recorded for traceability)

The auditor spot-checked essentially every load-bearing `file:line` citation against the live repo and found them accurate (notably `review.md:128–139` architecture read vs the generic `:121` list; `deepen-plan.md` having zero dual-read today; the JSON-unicode serialization escape vs the non-reversible `&lt;` sketch; the `28→29` skill count + `published-surface.test.ts` pin). Dependency graph, all-singleton batch partition, shared/global discipline (T01 as justified single-owner extraction; per-kind fields kept out of the shared fixed-core), file-overlap notes, manual-E2E honesty, and ticket-local compactness/section-order all confirmed honest.

> **Note on re-audit:** the single blocking gap was repaired by applying the auditor's own prescribed local remedy (expand T05's surface). A full re-audit was judged disproportionate to the change; the repair is documented above for the executing agent to confirm when T05 runs.
