---
date: 2026-07-09
topic: feat-csv-export
type: feat
status: complete
handoff:
  problem_narrative: true
  user_story: true
  architectural_context: true
  success_criteria: true
---

<!--
FROZEN PRE-MIGRATION FIXTURE (T03, html-artifacts v2).

This is a checked-in legacy `.md` brainstorm captured to represent the
hand-authored template `/workflows:brainstorm` used BEFORE this ticket
rewired it to emit `.html` via the composer. It is the `.md` comparison arm
of the T03 cross-arm oracle. It encodes the SAME feature and the SAME
contract facts as `tests/fixtures/html-artifacts/representative-brainstorm.html`
(the `.html` arm) -- same problem narrative, user story, architectural
context, success criteria, chosen approach, key decisions, and resolved
questions. Do not "modernize" it to `.html`; its whole job is to be the
legacy-format twin so the brainstorm-input dual-read path can be proven
equivalent. Any drift between this file's contract facts and the `.html`
island's fields makes the oracle meaningless -- keep the two in lockstep.

Note: `frontmatter.type` above is not present in `brainstorm.md`'s actual
legacy template (which only ever had `date`/`topic`/`status`/`handoff`) --
it is added here because the shared Tier-1 envelope requires `type` for
every kind. This is a surfaced, documented gap between the pre-migration
template and the schema's envelope, not a silent addition (see
`island-contract.md`'s brainstorm frontmatter-keys coverage table).
-->

# Add CSV Export to the Reporting Dashboard

## Problem Narrative

Analysts currently screenshot report tables to share them, losing precision and making downstream re-analysis impossible.

## User Story

As an analyst, I need to export any report I can view as a CSV file, so that I can re-analyze the underlying numbers in my own tools instead of retyping them from a screenshot.

## Success Criteria

- A user can export any report they can view as a CSV file.
- Exported CSV opens correctly in Excel and Google Sheets without column misalignment.

## Architectural Context

Lives in the existing reporting module; the serializer is a pure function reused by both the new export route and, later, a scheduled-export job.

- **Lives in:** the existing reporting module
- **Feature home:** `src/reporting/`
- **Interacts with:** the reporting API layer and the report-viewer UI
- **User entry point:** an "Export CSV" button on the report toolbar
- **Data:** reads the same report query result the viewer already renders; writes nothing
- **Dependencies:** the existing report-read permission model
- **Shared / global notes:** the serializer is a pure function, reusable by a later scheduled-export job -- keep it feature-local for now, promote only if a second consumer appears

## Chosen Approach

Add a pure toCsv() serializer reused by a new export API route and a UI button, rather than a client-side-only export or a background export job, because it fully satisfies both success criteria with the least moving parts.

## Key Decisions

- Stream the export instead of buffering the whole CSV in memory: Some reports have 100k+ rows; buffering risks OOM on the API pod.
- Reuse the existing report-read permission for the export endpoint instead of a new scope: Export is the same data the user can already view; a new scope would be needless complexity.

## Scope Boundary

Explicitly included: serializer, export route, UI button. Deferred: scheduled/recurring exports, XLSX format.

## Non-goals / Deferred Ideas

- Scheduled/recurring exports
- XLSX format

## Constitution Alignment

- **Relevant project rules:** none recorded
- **No amendment needed because:** no `docs/constitution.md` exists for this repository

## Approaches Considered

A client-side-only export was rejected because large reports would freeze the browser tab. A background export job was rejected as premature -- no user has asked for exports larger than an interactive request can serve.

## Stakeholder Impact

- **End users:** Analysts get a direct export path.
- **Developers:** Engineering gains a reusable serializer for a later scheduled-export feature.
- **Operations:** No operations impact beyond normal feature rollout.
- **Business:** No business impact beyond normal feature rollout.

## Open Questions

_(none -- all resolved below)_

## Resolved Questions

- Should exports support XLSX as well as CSV? No -- deferred; CSV alone satisfies both success criteria and the user's stated workflow.
