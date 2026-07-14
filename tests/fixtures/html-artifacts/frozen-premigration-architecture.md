---
date: 2026-07-09
topic: csv-export-architecture
type: feat
status: complete
plan_ref: docs/plans/2026-07-09-feat-csv-export-plan.md
brainstorm_ref: docs/brainstorms/2026-07-09-rich-html-artifacts-brainstorm.md
handoff:
  deepen_plan: true
  work: true
  review: true
---

<!--
FROZEN PRE-MIGRATION FIXTURE (T04, html-artifacts v2).

This is a checked-in legacy `.md` architecture artifact captured to
represent the hand-authored template `/workflows:architecture` used BEFORE
this ticket rewired it to emit `.html` via the composer. It is the `.md`
comparison arm of the T04 cross-arm oracle. It encodes the SAME feature and
the SAME contract facts as
`tests/fixtures/html-artifacts/representative-architecture.html` (the
`.html` arm) -- same feature homes, shared/global decisions, deepening
candidates, deletion test, interfaces as test surfaces, seams/adapters/
contracts, context tiers, drift checks, and recommendations. Do not
"modernize" it to `.html`; its whole job is to be the legacy-format twin so
`deepen-plan`/`review`/`work`'s architecture dual-read can be proven
equivalent across all three consumers. Any drift between this file's
contract facts and the `.html` island's fields makes the oracle
meaningless -- keep the two in lockstep (field values below are copied
verbatim from the island, not paraphrased, specifically so the cross-arm
oracle is a real check rather than a tautology dressed up as one).

Note: `frontmatter.type` above is not present in the real reference
document's actual legacy frontmatter (`docs/architecture/2026-07-09-rich-
html-artifacts-architecture.md`, which only ever had
`date`/`topic`/`status`/`plan_ref`/`brainstorm_ref`/`handoff`) -- it is
added here because the shared Tier-1 envelope requires `type` for every
kind. This is a surfaced, documented gap between the pre-migration template
and the schema's envelope, not a silent addition (see `island-contract.md`'s
architecture frontmatter-keys coverage table; the same gap is already
documented for the `brainstorm` kind).

The list/table formats below use plain, literal `field: value` bullets and
simple three-column tables (rather than the freer prose style
`docs/architecture/2026-07-09-rich-html-artifacts-architecture.md` itself
uses) specifically so a downstream reader -- and this ticket's cross-arm
oracle script -- can extract exact field values without guessing at prose
boundaries. This is a legitimate variation in *legacy template style*, not
a difference in *content*: every fact below is byte-identical to its island
counterpart.
-->

# Add CSV Export to the Reporting Dashboard — Architecture

## Purpose Linkage

Canonical WHY source: the CSV-export brainstorm. Local intent: keep the serializer feature-local and streaming-safe. Success-criteria focus: both brainstorm success criteria. Architectural scope: the reporting module's export surface only.

## Feature Homes and Ownership

- feature_home: `src/reporting/export/`
  - owns: The toCsv() serializer, the export API route, and the UI export button.
  - notes: New feature home; nothing else in the reporting module currently owns export formatting.
- feature_home: `src/reporting/ (existing)`
  - owns: The report query result the exporter reads; unchanged by this feature.
  - notes: Read-only dependency, not a new owner.

## Module Blueprint for Implementation

| Module | Feature home | Contains | Why this arrangement |
|--------|--------------|----------|----------------------|
| Export serializer | `src/reporting/export/` | toCsv(), the export route, the UI button | Groups the new export surface in one place, reusing the existing report-read permission model. |

## Shared / Global Decisions

| Candidate | Decision | Rationale |
|-----------|----------|-----------|
| toCsv() serializer | feature-local | Only one consumer (the export route) exists today; promote to shared only when the scheduled-export job needs it. |
| Report-read permission check | reuse existing shared permission model | Export reads the same data the viewer already authorizes; a new scope would duplicate an existing shared decision. |

## Deepening Candidates

- Confirm the streaming-export approach handles 100k+ row reports without exceeding the API pod's memory limits.
- Decide whether the CSV UTF-8 BOM is always emitted or only for locales where Excel needs it.

## Deletion Test

| Candidate | Decision | Rationale |
|-----------|----------|-----------|
| Scheduled/recurring export job | delay | No user has asked for exports larger than an interactive request can serve; building it now is unused structure. |
| Streaming CSV serializer | keep | Survives the deletion test: without it, the 100k+ row success criterion cannot be met without risking OOM. |

## Interfaces as Test Surfaces

- interface: toCsv() serializer
  - callers_rely_on: A pure function that streams rows to a writable without buffering the full result set.
  - must_not_leak: Report-viewer rendering details; the serializer must not import UI code.
  - evidence_needed: Unit test streaming a 100k+ row fixture without exceeding a fixed memory ceiling.

## Seams, Adapters, and Contracts

- seam: Export route to serializer
  - adapter: toCsv() called with the same query result the viewer already fetched
  - contract: The export route never re-queries the data; it reuses the viewer's already-authorized result.
  - stability_class: permanent

## Design-It-Twice (the one high-leverage boundary)

_(No high-leverage option comparison was required for this change.)_

## Context Tiers

- global: Dependency-free single-file HTML is a hard invariant for any generated artifact; the existing report-read permission model applies to every export surface.
- on_demand: This architecture artifact; the CSV-export brainstorm; the reporting module's existing query-layer docs.
- ticket_local: The exporter's feature home, the exact files, the scope fence, and the one acceptance criterion each execution slice owns.

## Review Depth

- **Depth used:** lightweight
- **Why this depth:** the change is a small, well-understood addition to an existing module with no disputed boundaries.

## Recommendations for `/deepen-plan`

- Confirm the streaming approach's memory ceiling before execution hardening.

## Recommendations for `/workflows:work`

- Keep the serializer feature-local; do not promote it to shared until a second consumer exists.

## Recommendations for `/workflows:review`

- Verify the export route reuses the existing permission check rather than introducing a new scope.

## Drift Checks

- A new export format is added without reusing the existing report-read permission check.
- The serializer buffers the full result set in memory instead of streaming.

## Open Questions

_(none)_
