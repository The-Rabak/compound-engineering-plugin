---
ticket_id: T04
title: Downstream dual-read + island-extraction helper (read capability)
kind: expansion
status: completed
plan_ref: docs/plans/2026-07-09-feat-rich-html-artifacts-v1-plan.md
tickets_ref: docs/tickets/2026-07-09-rich-html-artifacts-v1/index.md
architecture_ref: docs/architecture/2026-07-09-rich-html-artifacts-architecture.md
source_packet_ref: "## Execution Slices > Slice D (dual-read + extraction helper)"
feature_home: portable/compound-engineering/commands/workflows/references/html-artifacts
depends_on:
  - T01
  - T03
dependency_type: hard
serves:
  - SC3 (zero contract loss — the downstream read path)
files:
  - portable/compound-engineering/commands/workflows/references/html-artifacts/island-extraction-helper.md
  - portable/compound-engineering/commands/workflows/to-issues.md
  - portable/compound-engineering/commands/workflows/work.md
  - portable/compound-engineering/commands/workflows/review.md
  - portable/compound-engineering/skills/workflow-next-step/SKILL.md
  - tests/workflow-next-step-skill.test.ts
test_command: bun test tests/workflow-next-step-skill.test.ts
tdd_mode: inherit
---

# Downstream dual-read + island-extraction helper (read capability)

## Serves

- **SC3** — downstream (`work`, `to-issues`, `review`) parses the embedded JSON island with zero contract loss versus legacy `.md`, via one shared reader. This is the **read** half of the pilot's create→read→prove arc.

## Scope

- Author `references/html-artifacts/island-extraction-helper.md` — the shared prose contract every downstream consumer includes: locate the `artifact-data` script, take its `textContent` as the JSON contract, `JSON.parse` (no HTML-entity unescape — the T01 primitive uses unicode escaping), read the fixed-core fields, **never scrape rendered HTML**.
- **Codify the fail-loud branch here** as the single source all four consumers inherit: on a missing / empty / truncated / non-`JSON.parse`-able island, or a valid island missing a required fixed-core key, the consumer **stops immediately with a diagnostic naming the artifact path and the exact failure** — it must not proceed on partial data, scrape rendered HTML, or fall back to `.md` (an `.html` artifact has no `.md` mirror; the sidecar model was rejected). Reuse the existing "stop and report the missing template instead of improvising" pattern.
- Insert dual-read (detect `.md` vs `.html` by extension; on `.html` parse the island via the helper; on `.md` parse frontmatter + sections as today; refs resolve per-file extension) into: `to-issues.md` (discovery `:22`, parse `:67–85`), `work.md` (`:58–90`), `review.md` (discovery `:99`, parse `:111–130`).
- Edit `skills/workflow-next-step/SKILL.md` artifact-check globs (`~:75–78`) to detect `.html` plan artifacts (dual-read aware); update `tests/workflow-next-step-skill.test.ts` accordingly.
- Run `bun run build:platforms` to sync the new `island-extraction-helper.md` reference plus the edited command/skill prose into the generated `plugins/` tree — **count-neutral** (no component added/removed).

## Scope Fence

- **Owns:** the extraction-helper reference + the fail-loud branch, and the dual-read insertion in the three consumer commands + `workflow-next-step`.
- **Do not:** run the equivalence gate (L3/L4) — that is T05.
- **Do not:** do release reconciliation / version bump / `/release-docs` — that is T06.
- **Do not:** `deepen-plan` read/mutation, brainstorm/architecture conversion, or the full system-wide ref sweep (all v2).
- **Only plan-pointing `.md`-refs migrate now;** `deepen-plan.md`, brainstorm/architecture discovery, and tickets/todos/sessions/solutions/config stay `.md`.
- Keep the dual-read branch **feature-local** in each consumer — do **not** extract it into a shared runnable module (it is a compatibility shim designed to be deleted at v2 cutover).

## Acceptance Criteria

1. `island-extraction-helper.md` states: parse via `#artifact-data` `textContent` → plain `JSON.parse` (no unescape) → read fixed-core fields → never scrape rendered HTML; and the fail-loud branch (stop with a path + exact-failure diagnostic; no partial-data proceed, no HTML scrape, no `.md` fallback).
2. `to-issues`, `work`, and `review` each branch on extension and read `.html` via the helper and `.md` via the legacy parser; refs resolve per extension.
3. `workflow-next-step` discovers `.html` plan artifacts (dual-read aware); `tests/workflow-next-step-skill.test.ts` updated and green.
4. **No downstream consumer scrapes rendered HTML** — every read goes through the helper against `#artifact-data`.
5. `bun test` green; **`bun run verify:generated` clean** (the new reference + edited command/skill prose are synced into the generated tree — the same count-agnostic CI gate as T01).

## Shared / Global Notes

- The island-extraction-helper prose is **shared/global** — one reference, included by all readers, single reason to change (how the contract is read). Duplicating it per consumer would drift the four readers apart.
- The dual-read extension branch is **feature-local and temporary** (a compatibility shim with a sunset), not cross-feature infrastructure — a little local duplication across the consumers is cheaper than a shared abstraction that must be un-abstracted at cutover.

## Local Context

- **Canonical WHY source:** `docs/brainstorms/2026-07-09-rich-html-artifacts-brainstorm.md`.
- **This ticket serves:** giving downstream commands one authorized, fail-loud reader of the island so a `.html` plan is consumed with zero contract loss and the read path is invisible downstream of the helper.
- **Interfaces that matter now:** the island contract from **T01** (envelope + `plan` contract core the helper reads); a real `plan.html` from **T03** to exercise dual-read; the concrete consumer seams — `to-issues.md:22,67–85`, `work.md:58–90`, `review.md:99,111–130`, `workflow-next-step SKILL.md:~75–78`.
- **Why fail-loud (not fallback):** island-is-truth + sidecar-rejected leaves fail-loud as the only contract-consistent behavior; there is no `.md` mirror for an `.html` artifact. This branch is proven by T05's L4 drill and the L1 negatives (T01).
- **Unknowns to surface, not guess:** confirm the exact current line ranges in each consumer before editing (line numbers cited from the plan may have shifted); confirm which `workflow-next-step` test assertions pin the plan-artifact glob so the update is complete, not partial.

## Parent Refs

- Plan: `docs/plans/2026-07-09-feat-rich-html-artifacts-v1-plan.md` → `## Execution Slices > Slice D`
- Canonical WHY: `docs/brainstorms/2026-07-09-rich-html-artifacts-brainstorm.md`
- Architecture: `docs/architecture/2026-07-09-rich-html-artifacts-architecture.md`

## Deeper-Dive Refs

- Architecture → "Module Blueprint" (Island-extraction helper + Dual-read wiring rows), "Seams, Adapters, and Contracts" (dual-read seam — stability class temporary), "Drift Checks" (no HTML scraping; dual-read stays feature-local).
- Domain language: `CONTEXT.md` (Island-extraction helper).
- Ticket **T01** (`island-contract.md`) — fixed-core fields + primitive; ticket **T03** — the composed `plan.html` to read.

## Coupling Notes

- **Dependencies:** T01 is the **hard** edge — the helper + dual-read branches are authored against the island contract. T03 is effectively a **soft / validation** edge: the read path is fully exercised against a live `plan.html` only in T05's gate, not in this ticket's own acceptance (`bun test tests/workflow-next-step-skill.test.ts` parses no live island). Sequencing T04 after T03 is conservative and harmless; the frontmatter `dependency_type: hard` reflects the governing T01 edge.
- **Blocks T05:** the equivalence gate runs the real command chain over the dual-read path wired here.
- **File overlap:** touches `skills/workflow-next-step/SKILL.md` (also edited by T02) and `tests/workflow-next-step-skill.test.ts` (also edited by T02). T02 removes the visual-plan gate; T04 adds `.html` glob awareness. Because they share these files, T02 and T04 are in **separate sequential batches** (T02 in Batch 2, T04 in Batch 4) — no parallel execution.
