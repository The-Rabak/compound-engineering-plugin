---
title: Add CSV Export to the Reporting Dashboard
type: feat
status: active
date: 2026-07-09
constitution_version: null
constitution_waivers: []
brainstorm_ref: docs/brainstorms/2026-07-09-feat-csv-export-brainstorm.md
architecture_ref: null
tickets_ref: null
source_docs:
  tickets: []
  docs:
    - docs/solutions/reporting-dashboard-notes.md
  figma: []
  plans: []
handoff:
  problem_narrative: true
  user_story: true
  architectural_context: true
  success_criteria: true
tdd:
  precedence: plan_overrides_local
  mode: red-green-refactor
  loop: failing-tests-first
  evidence:
    unit: required
    e2e: required
  exceptions:
    - scope: "CSV byte-order-mark handling for Excel on Windows"
      reason: "No Windows Excel runtime is available in CI; behavior is verified manually once per release."
      replacement_evidence: "Manual verification checklist recorded in the release runbook."
execution_shape:
  mode: vertical-slices
  rationale: "Export is a self-contained vertical: serializer -> API route -> UI trigger, each independently demoable."
runtime_stack:
  local: "Node 20 dev server with a seeded Postgres instance."
  qa: "Staging environment mirroring production with anonymized data."
  prod: "Production Kubernetes cluster behind the reporting-dashboard service."
  e2e_surface: true
---

<!--
FROZEN PRE-MIGRATION FIXTURE (T05, html-artifacts v1 pilot).

This is a checked-in legacy `.md` plan captured BEFORE Slice C rewired
`/workflows:plan` to emit `.html` only. It is the `.md` comparison arm of the
Verification Gate L3 equivalence run. It encodes the SAME feature and the SAME
contract facts as `tests/fixtures/html-artifacts/representative-plan.html`
(the `.html` arm). Do not "modernize" it to `.html`; its whole job is to be the
legacy-format twin so the dual-read path can be proven equivalent. Any drift
between this file's contract facts and the `.html` island's fields makes the
equivalence gate meaningless — keep the two in lockstep.
-->

# Add CSV Export to the Reporting Dashboard

## Problem Narrative

Analysts currently screenshot report tables to share them, losing precision and making downstream re-analysis impossible. Hostile-input regression probe (kept verbatim to prove the artifact's island-escaping and HTML-escaping both hold): </script><img src=x onerror="alert(1)">

## User Story

As an analyst, I need to export any report I can view as a CSV file, so that I can re-analyze the underlying numbers in my own tools instead of retyping them from a screenshot.

## Architectural Context

Lives in the existing reporting module; the serializer is a pure function reused by both the new export route and, later, a scheduled-export job.

## Success Criteria

1. **SC1 — Any viewable report exports as CSV:** A user can export any report they can view as a CSV file. *Verification: E2E — open a report, click Export CSV, verify the downloaded file parses back to the same row count.*
2. **SC2 — Spreadsheet-clean output:** Exported CSV opens correctly in Excel and Google Sheets without column misalignment. *Verification: Manual spot-check plus the BOM exception recorded below.*

## Specified Scope Contract

Explicitly included: serializer, export route, UI button. Deferred: scheduled/recurring exports, XLSX format.

## TDD & Evidence Contract

- **Precedence:** `plan_overrides_local`
- **Mode:** `red-green-refactor`
- **Loop:** `failing-tests-first`
- **Evidence:** unit required, e2e required
- **Exceptions:** CSV byte-order-mark handling for Excel on Windows — no Windows Excel runtime is available in CI; behavior is verified manually once per release. Replacement evidence: manual verification checklist recorded in the release runbook.

## Suggested E2E Suite

- **E01** — Export button downloads a valid CSV for a populated report *(staging)*
- **E02** — Export endpoint rejects a report id the caller cannot read *(staging)*

## Execution Shape

- **Mode:** `vertical-slices`
- **Why:** Export is a self-contained vertical: serializer -> API route -> UI trigger, each independently demoable.

## Constitution Alignment

No constitution version is recorded for this repository; no waivers apply.

## Execution Slices

Slices are ordered by dependency. The first slice is the tracer bullet.

### Slice S01 — toCsv() serializer

- **Feature home:** `src/reporting/export/`
- **Scope:** Add a toCsv() serializer for the reporting query result shape.
- **Scope fence:** Do not touch the UI trigger or the API route in this slice.
- **Files:** `src/reporting/export/toCsv.ts`, `src/reporting/export/toCsv.test.ts`
- **Depends on:** none
- **Dependency type:** none
- **Acceptance criteria:** Given a query result with mixed types, toCsv() emits RFC 4180-compliant rows.
- **Test command:** `bun test src/reporting/export/toCsv.test.ts`

### Slice S02 — export route

- **Feature home:** `src/reporting/api/`
- **Scope:** Expose GET /api/reports/:id/export.csv streaming the serializer output.
- **Scope fence:** Do not add new auth scopes; reuse the existing report-read permission.
- **Files:** `src/reporting/api/exportRoute.ts`, `src/reporting/api/exportRoute.test.ts`
- **Depends on:** S01
- **Dependency type:** hard
- **Acceptance criteria:** Requesting the endpoint with a valid report id streams a CSV response with the correct Content-Type.
- **Test command:** `bun test src/reporting/api/exportRoute.test.ts`

### Slice S03 — Export CSV button

- **Feature home:** `src/reporting/ui/`
- **Scope:** Add an Export CSV button to the report toolbar that calls the new endpoint.
- **Scope fence:** Do not redesign the toolbar; add one button to the existing action group.
- **Files:** `src/reporting/ui/ReportToolbar.tsx`
- **Depends on:** S02
- **Dependency type:** hard
- **Acceptance criteria:** Clicking Export CSV downloads a file named <report-name>.csv.
- **Test command:** `bun test src/reporting/ui/ReportToolbar.test.tsx`

## References

Brainstorm: `docs/brainstorms/2026-07-09-feat-csv-export-brainstorm.md`
