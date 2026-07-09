---
ticket_id: T05
title: Pilot equivalence gate — L3 operational oracle + L4 malformed-island drill
kind: hardening
status: completed
plan_ref: docs/plans/2026-07-09-feat-rich-html-artifacts-v1-plan.md
tickets_ref: docs/tickets/2026-07-09-rich-html-artifacts-v1/index.md
architecture_ref: docs/architecture/2026-07-09-rich-html-artifacts-architecture.md
source_packet_ref: "## Execution Slices > Slice D (L3/L4 equivalence gate)"
feature_home: "html-artifacts pilot verification — the L3/L4 gate over tests/ + a frozen .md fixture + the running commands (no single code feature home)"
depends_on:
  - T03
  - T04
dependency_type: hard
serves:
  - SC3 (zero contract loss — proven end-to-end)
  - Verification Gate L3 (end-to-end pilot equivalence, go/no-go)
  - Verification Gate L4 (malformed-island real-agent fail-loud drill)
files:
  - tests/fixtures/html-artifacts/frozen-premigration-plan.md
test_command: bun test
tdd_mode: inherit
---

# Pilot equivalence gate — L3 operational oracle + L4 malformed-island drill

## Serves

- **SC3** proven end-to-end. This is the pilot's **go/no-go**: `/workflows:to-issues` → `/workflows:work` produce equivalent tickets/execution whether fed a `.html` plan or a `.md` plan, and a corrupted island fails loud.

## Scope

- **L3 — end-to-end pilot equivalence gate (real e2e).** Run `/workflows:to-issues` then the tracer-bullet `/workflows:work` batch against **both** a freshly-composed `.html` plan (from T03) and a **frozen committed pre-migration `.md` plan fixture** for the same feature. Drive the real commands over the real artifacts — no in-process seam, no mocked island, no softened assertion.
- **Apply the operational oracle** (below) so a degenerate/half-built run FAILS the floor check rather than passing by symmetry.
- **L4 — malformed-island real-agent drill (real e2e).** Take the T03 committed `plan.html` fixture, write one deliberately corrupted copy (island JSON truncated mid-object) to a scratch path, and run the real `/workflows:to-issues` against it. **PASS requires the command to stop immediately** with a diagnostic naming the artifact path and the exact failure — no proceeding on partial data, no scraping rendered HTML, no `.md` fallback.
- Commit the **frozen `.md` fixture** (a pre-migration `.md` plan) so the L3 comparison arm is reproducible after Slice C rewired `plan.md` to emit `.html` only.

## Scope Fence

- **Owns:** the frozen `.md` fixture, the L3 operational-oracle run, and the L4 malformed-island drill.
- **Do not:** change the dual-read wiring or the extraction helper (T04) — this ticket *exercises* them, it does not author them.
- **Do not:** do release reconciliation / version bump / `/release-docs` (T06). A failed gate must block release, not trigger it.
- **Do not** require byte-identical generated code across arms (legitimate LLM run-to-run variance) — equivalence is contract-surface + outcome.

## Acceptance Criteria

**L3 passes under the operational oracle:**

1. *Per-arm floor check (each arm ALONE, before any cross-arm diff):* ticket count ≥ the number of `## Execution Slices` in the source plan (4: A–D) unless `index.md` documents an explicit split/merge; every ticket's scope-fence and acceptance-criteria fields non-empty after whitespace normalization; the `/workflows:work` batch reaches non-zero `completed` units with Red/Green/Post-Refactor-Green evidence present. **Either arm failing its own floor check is an immediate FAIL** (this defeats two-empty-sets-are-equal false greens).
2. *Cross-arm equality (only after both arms pass their floor check):* the sole allowed diff is the trailing `.(md|html)` on `*_ref` values — normalize it away, then deep-equal the sorted ticket-id set and, per ticket, the `ticket-execution-contract.md` packet fields (`id`, `feature_home`, `files` (sorted), `depends_on` (sorted), `dependency_type`, `serves`, `test_command`, `tdd` mode, normalized scope-fence + acceptance-criteria text) and `index.md`'s dependency edges / batch partition. Any other diff is FAIL, reported per field/ticket-id.
3. *Execution equivalence* is read **live from work session state / per-unit session files** (never summary prose); byte-identical generated code is **not** required.

**L4 passes:** the corrupted-island artifact makes `to-issues` stop immediately with a path + exact-failure diagnostic.

- `bun test` green (the L1/L2 contract tests still pass alongside the e2e gate).

## Shared / Global Notes

- This is verification, not a new code home. The **downstream equivalence contract** (SC3's real product promise) is the interface under test: `to-issues` + `work` must produce equivalent output whether fed `.md` or `.html`, and the reader path must be invisible downstream of the helper.
- The frozen `.md` fixture is a committed test asset — pin it under a **non-gitignored** location (verified: `docs/plans/` is gitignored at `.gitignore:16`; use the repo's `tests/fixtures/html-artifacts/` convention).

## Local Context

- **Canonical WHY source:** `docs/brainstorms/2026-07-09-rich-html-artifacts-brainstorm.md`.
- **This ticket serves:** proving the pilot's central promise (zero contract loss end-to-end) with a false-green-proof oracle, and proving the fail-loud contract at a real command seam.
- **Interfaces that matter now:** the real command chain (`/workflows:to-issues` → `/workflows:work`); the dual-read path from **T04**; the composed `plan.html` from **T03**; the frozen `.md` fixture (this ticket authors it).
- **Why a frozen `.md` fixture:** Slice C makes `plan.md` emit `.html` only, so the `.md` arm cannot be regenerated post-migration — pin it as a checked-in pre-migration `.md` plan. Both arms still exercise the real dual-read path.
- **Unknowns to surface, not guess:** the exact live-session-state location `/workflows:work` writes per-unit evidence to (read outcome from there, never from summary prose); and the representative feature both arms describe — the frozen `.md` fixture and T03's `.html` fixture must encode the *same* feature (equivalence is only meaningful for matched inputs). Fixture location is resolved: `tests/fixtures/html-artifacts/` (non-gitignored).

## Parent Refs

- Plan: `docs/plans/2026-07-09-feat-rich-html-artifacts-v1-plan.md` → `## Suggested E2E Suite` (L3, L4) and `## Execution Slices > Slice D`
- Canonical WHY: `docs/brainstorms/2026-07-09-rich-html-artifacts-brainstorm.md`
- Architecture: `docs/architecture/2026-07-09-rich-html-artifacts-architecture.md` → Open Questions (L3 oracle; malformed-island)

## Deeper-Dive Refs

- Plan → "Suggested E2E Suite" L3 (operational oracle + frozen `.md` fixture) and L4 (malformed-island drill).
- Architecture → "Interfaces as Test Surfaces" (downstream equivalence contract).
- Contracts: `commands/workflows/references/ticket-execution-contract.md` (the packet fields the cross-arm diff compares); `tdd-evidence-contract.md`; `e2e-testing-contract.md`.
- Tickets **T03** (composed `.html`) and **T04** (dual-read + fail-loud branch).

## Coupling Notes

- **Hard dependencies:** T03 (real `.html` arm) and T04 (dual-read + fail-loud branch to exercise). T01 is transitive (the island contract both build on).
- **Blocks T06:** release reconciliation only happens after this go/no-go passes.
- Consumes T03's committed `tests/fixtures/html-artifacts/representative-plan.html` (the `.html` arm) and authors the frozen `.md` arm; it does **not** mutate T03's fixture (the L4 corrupted copy is written to a scratch path, never the committed fixture). Sequenced after T03/T04, so no race.
- **No fakes, no hardcoded passes:** a scenario that asserts nothing FAILS by construction; a suspiciously-all-green run over a half-built composer is itself a finding, caught by the per-arm floor check.
