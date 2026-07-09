---
plan_ref: docs/plans/2026-07-09-feat-rich-html-artifacts-v1-plan.md
architecture_ref: docs/architecture/2026-07-09-rich-html-artifacts-architecture.md
brainstorm_ref: docs/brainstorms/2026-07-09-rich-html-artifacts-brainstorm.md
execution_shape: vertical-slices
ticket_set_status: completed
last_completed_batch: 6
total_batches: 6
---

# Ticket Set: Rich Interactive HTML Artifacts — v1 Pilot

- **Plan:** `docs/plans/2026-07-09-feat-rich-html-artifacts-v1-plan.md`
- **Architecture:** `docs/architecture/2026-07-09-rich-html-artifacts-architecture.md`
- **Canonical WHY source:** `docs/brainstorms/2026-07-09-rich-html-artifacts-brainstorm.md`
- **Execution shape:** `vertical-slices` (create → read → proven-equivalent, plus one foundational removal)
- **Ticket order:** T01 → T02 → T03 → T04 → T05 → T06 (6 sequential singleton batches)

The pilot delivers the **create** and **read** capabilities of the `html-artifacts` subsystem on the `plan` command only. The **update** capability, `deepen-plan`-on-HTML, and other-artifact conversion are deferred to v2.

## Dependency Graph

```
T01  island contract (tracer bullet)        depends on: —
T02  scrap MDX visual-artifact system        depends on: —
T03  composer skill → plan.html (create)     depends on: T01 (hard)
T04  dual-read + extraction helper (read)    depends on: T01, T03 (hard)
T05  equivalence gate L3/L4 (go/no-go)       depends on: T03, T04 (hard; T01 transitive)
T06  release reconciliation                  depends on: T02, T05 (hard; T03 transitive)
```

Edges (hard):
- `T01 → T03` — the composer is built to the locked island contract.
- `T01 → T04`, `T03 → T04` — the helper reads the T01 contract; dual-read is validated against a real `plan.html` from T03.
- `T03 → T05`, `T04 → T05` — the gate runs the real chain over the composed `.html` and the wired dual-read path.
- `T02 → T06`, `T05 → T06` — MDX must be gone before final counts; release only after the gate passes.

Both roots (T01, T02) are independent. T01 is sequenced first because the vertical-slices contract requires the **tracer bullet first**, and T01 is the explicit contract tracer that T03/T04/T05 are all built to. T02 is independent cleanup whose only downstream blocker is the final reconciliation (T06), so it sits at Batch 2 without delaying the critical path.

## Execution Batches

| Batch | Ticket(s) | Status | Delivers | Deps satisfied by |
|-------|-----------|--------|----------|-------------------|
| 1 | T01 | completed | Island contract: serialization primitive + schema + field-coverage map | — |
| 2 | T02 | completed | MDX visual-artifact system removed; counts → 38 agents / 27 commands | — |
| 3 | T03 | completed | Composer skill generates the pilot `plan.html`; skills → 28 | Batch 1 |
| 4 | T04 | completed | Downstream dual-read + island-extraction helper (fail-loud) | Batches 1, 3 |
| 5 | T05 | completed | Pilot equivalence gate — L3 oracle + L4 malformed-island drill (go/no-go) — **PASS** | Batches 3, 4 |
| 6 | T06 | completed | Release reconciliation: v4.21.0 bump, counts 38/27/28, consolidated CHANGELOG, docs-site count reconciliation | Batches 2, 5 |

Batch-status legend: `pending → in_progress → completed` (or `blocked`). `/workflows:work` advances `last_completed_batch` to N only after every ticket in Batch N reaches `completed`; on a blocked ticket, mark the batch `blocked` and do not advance.

**Parallelization assessment — every batch is a singleton (default-to-sequential).** There are no multi-ticket batches, so there are no intra-batch file-overlap notes to record; instead, here is why parallelism was rejected between the tickets that *could* otherwise share a batch:

- **T01 ∥ T02 (both dep-free) — rejected.** Both write the generated `plugins/` tree: T01 runs a **count-neutral sync build** (to keep the `verify:generated` CI gate green after adding its new reference file), and T02 runs a full rebuild after removing components. Parallel execution is a genuine write-write race on the shared generated tree. → separate sequential batches.
- **T02, T03, T06 — rejected as co-batchable.** All three touch `tests/published-surface.test.ts` and the generated-plugin metadata surface via `bun run build:platforms` (shared mutable state + config churn). → separate sequential batches.
- **T02 ∥ T04 — rejected.** Both edit `skills/workflow-next-step/SKILL.md` and `tests/workflow-next-step-skill.test.ts` (T02 removes the visual-plan gate; T04 adds `.html` glob awareness). Direct file overlap. → separate sequential batches.
- **T05** consumes T03's committed `plan.html` fixture and drives the real command chain over the T04 dual-read path; it authors only the frozen `.md` fixture (`tests/fixtures/html-artifacts/`) and depends on T03+T04, so it cannot precede them.

Net: coupling, shared build/generated surfaces, and overlapping test files make honest parallelism unavailable, so the set is fully sequential.

## Ticket Table

| ID | File | Kind | Serves | Feature home |
|----|------|------|--------|--------------|
| T01 | `01-island-contract-serialization-and-schema.md` | tracer-bullet | SC3, Gate L1, Gate L2 | `references/html-artifacts/` |
| T02 | `02-scrap-mdx-visual-artifact-system.md` | infra-track | scrap decision; SC (indirect) | cross-cutting removal |
| T03 | `03-composer-skill-generates-plan-html.md` | expansion | SC1, SC2, SC4, SC5, SC6, SC7 | `skills/html-artifact-composer/` |
| T04 | `04-downstream-dual-read-island-helper.md` | expansion | SC3 (read path) | `references/html-artifacts/` |
| T05 | `05-pilot-equivalence-gate-l3-l4.md` | hardening | SC3, Gate L3, Gate L4 | html-artifacts pilot verification |
| T06 | `06-release-reconciliation.md` | infra-track | SC (indirect) — release integrity | cross-cutting release |

## Blockers

- **No blocking gaps** prevent starting. T01 (Batch 1) is execution-ready with no dependencies.
- **Sequential-only:** no batch may be parallelized (see the parallelization assessment). `/workflows:work` must execute one batch at a time and advance `last_completed_batch` only after that batch's ticket reaches `completed`.
- **Go/no-go gate:** T05 is the pilot's go/no-go. If T05's L3/L4 gate fails, **do not proceed to T06** (release) — send the failure back for repair. A failed gate blocks release by design.
  - **Gate result (2026-07-09): PASS.** Ran real `/workflows:to-issues` → tracer `/workflows:work` over both arms (`.html` = `tests/fixtures/html-artifacts/representative-plan.html`; `.md` = `tests/fixtures/html-artifacts/frozen-premigration-plan.md`, authored by T05). Per-arm floors both cleared (3 tickets each, all scope-fence + acceptance-criteria non-empty, tracer unit `completed` with real Red-FAIL→Green→Post-Refactor-Green evidence in live session state). Cross-arm deep-equal held on the sorted ticket-id set, every per-ticket packet field (id, feature_home, sorted files/depends_on, dependency_type, serves→{SC ids}, test_command, tdd mode, normalized scope-fence + acceptance-criteria), and the index edges/batches — only cosmetic markdown/YAML-comment formatting differed (normalized away). L4 (corrupted-island copy) made `to-issues` stop loud with the artifact path + `INVALID_JSON` + the `JSON.parse` message — no partial proceed, no HTML scrape, no `.md` fallback. `bun test` green (261 pass). **Batch 6 (T06 release) may proceed.**
  - **Non-blocking documentation finding (send to plan/T05 for a wording fix, not a gate fail):** the per-arm floor threshold in `plan.md:119` and T05 AC#1 reads "ticket count ≥ the number of `## Execution Slices` in **this plan** (4: A–D)". The "(4: A–D)" annotation is the *parent* rich-html-artifacts plan's own slice labels, not the 3-slice CSV-export fixture under conversion. The intent-correct floor is "≥ slices in the source plan being ticketized" (= 3 for both fixtures), which both arms satisfy with one ticket per slice. Reword to drop the "(4: A–D)" annotation (or scope it explicitly to the fixture) so a future reader cannot misapply "4" as a hard threshold — which would make this go/no-go gate permanently unpassable against the committed 3-slice fixtures.
- **Watch items carried into tickets (not blockers, but must be handled during execution):**
  - The MDX test-flip surface in `tests/published-surface.test.ts` is broader than the plan's "three tests" (~lines 150–475, incl. the `:150`/`:232` count pins and the `:472–475` presence loop), and the hyphenated grep AC cannot catch space-separated phrases (`"local-only visual artifacts"` :473; `"visual routing"` in `workflow-next-step/SKILL.md:52`). T02 must flip them all — `bun test` green is the completeness proof, not grep.
  - `tests/published-surface.test.ts:474` (`"39 specialized agents"`) lives *inside* the `:472–475` MDX presence loop that T02 rewrites — it is **not** a surviving standalone count pin. T06 reconciles the four description sites + the `:125–126` root-README pair (verified against `find`).
  - Any ticket that adds/edits a portable file copied into `plugins/` (T01, T04 as well as T02/T03/T06) must run a count-neutral `bun run build:platforms` and leave `verify:generated` clean — that CI gate is count-agnostic and flags any generated-tree drift.

## Review Summary

Two review passes ran: the `document-review` skill (ticket-index + ticket modes, headless) and the `ticket-flow-auditor` agent (code-verified against the CI gates, test pins, and build/sanitize seams). The auditor confirmed the set is schema-conformant, WHY-traced, correctly fenced on both shared/global boundaries (island fixed-core vs per-command fields; dual-read stays feature-local/temporary), feature-homes match the architecture, dependency edges are correct, and the fully-sequential batching is honest — not over-serialized. **All findings below are resolved; 0 blocking gaps remain.**

### Blocking gaps

- **B1 — RESOLVED.** T01's scope fence forbade `bun run build:platforms` on the false rationale "a reference `.md` is not a counted component." Verified: `verify-generated.ts` flags *any* generated-tree drift regardless of counts, and CI runs it as a gate separate from `bun test` — so a faithful T01 would pass `bun test`, be marked complete, and leave CI's `verify:generated` red until T02. **Fix:** T01 now runs a count-neutral sync build and its AC requires `verify:generated` clean. (Also propagated to T04 — see R3.)

### Recommendations (all addressed)

- **R1 — applied.** T02's MDX-flip enumeration expanded to the `:150`/`:232` count pins and the `:472–475` presence loop (incl. the space-separated `"local-only visual artifacts"` the grep can't catch); T06's stale `:474` claim corrected (that line is owned by T02).
- **R2 — applied.** T06's `:126` instruction corrected: it currently guards an *older* `34/28/26` string (not the pre-v1 `39/28/27`), so the wording is now "replace the historical guard string with the superseded pre-v1 string," not "flip."
- **R3 — applied.** T04 now runs the count-neutral sync build + requires `verify:generated` clean, matching T01/T03 (same gate mechanism as B1).
- **R4 — applied.** T02 now scrubs the `workflow-next-step/SKILL.md:52` and `:116` prose references the hyphenated grep misses; grep is flagged as necessary-but-not-sufficient (`bun test` green is the proof).
- **R5 — noted, no split.** T03 stays one ticket (the create vertical; design-DNA and composer are co-homed by architecture). Recorded the largest-ticket awareness and the sole honest internal seam if it ever proves too big; the broad gallery is not trimmed.
- **R6 — clarified.** T04's dependency on T03 relabeled a soft/validation edge in its coupling notes; `dependency_type: hard` reflects the governing T01 edge. No batch-order change.
- **R7 — applied.** T01's Local Context no longer re-enumerates the full 4-tier field map; it references plan Slice B / architecture and keeps only the v1-discipline deltas inline.

### document-review pass (headless)

- Critical fix: committed-fixture paths (`representative-plan.html`, the frozen `.md` fixture) had been placed under the **gitignored** `docs/plans/` tree (`.gitignore:16`) — relocated to the repo's tracked `tests/fixtures/html-artifacts/` convention. Added the batch-status view + advance rule to this index.
