# Recipe: `seam-contract-ledger`

- **Family:** planning
- **Type:** architecture
- **Tags:** seams, contracts, interfaces, drift

**Intent:** Interface/seam/contract ledger with keep-delete-delay decision badges, for when only the boundary-and-drift portion of an architecture handoff needs projecting.

## When to select this recipe

The artifact's core content is boundary decisions — interfaces as test surfaces, seams/adapters/contracts, and drift checks — rather than a full module blueprint. Pairs with (and is the primary companion recipe for) the `architecture-blueprint` archetype; reach for this recipe sheet alone when a bespoke document needs only the interfaces/seams/drift-checks portion, not the full nine-section handoff (e.g. a focused boundary-review artifact, or an addendum to an existing architecture doc).

## Primitives composed

- The decision-row pattern (`.decision-row`, a `primitives-catalog.md` table-row variant): candidate / badge / rationale in three columns, one row per `deletion_test[]` or `shared_global_decisions[]` entry — visually distinct from the `risk-table` archetype's exception/waiver table (a keep/delete/delay or shared/feature-local badge instead of a severity/impact column).
- A native `<details>` per `interfaces_as_test_surfaces[]` entry (no accordion grouping — each interface stands alone, unlike the `brainstorm-narrative`/`decision-log` single-open Q&A accordion), with a definition list (`callers rely on` / `must not leak` / `evidence needed`) inside.
- A labeled node-arrow-node inline diagram (plain flex row, not SVG) for `seams_adapters_contracts[]` — lighter weight than the `flowchart` archetype's clickable SVG pipeline; use `flowchart` instead when the seam graph has more than a handful of nodes or needs its own detail panel.
- A plain bullet list (`ul.plain-list`) for `drift_checks[]` — a drift check is a flat statement to watch for, not a graded row.

## Section skeleton

1. Interfaces as Test Surfaces (one `<details>` per entry: interface name as summary, callers/leak/evidence as the definition list).
2. Seams, Adapters, and Contracts (node-arrow-node diagram + contract sentence + stability-class tag per entry).
3. Deletion Test (decision-row table, keep/delete/delay badges), when the bespoke document also needs to justify a boundary's presence or absence.
4. Drift Checks (plain bullet list) — always last, since it is the thing a reader checks *after* accepting the boundaries above.

## Island fields this recipe projects

`interfaces_as_test_surfaces[]` (`{interface, callers_rely_on, must_not_leak, evidence_needed}`), `seams_adapters_contracts[]` (`{seam, adapter, contract, stability_class}`), `deletion_test[]` (`{candidate, decision, rationale}`), `drift_checks[]` — all `architecture`-kind Tier-2 contract-core fields (`island-contract.md`). `shared_global_decisions[]` only when the bespoke document also needs the shared/feature-local boundary calls alongside the seam ledger.

## Bespoke-drafting note

Never render an interface, seam, or drift check the island doesn't carry — an empty `interfaces_as_test_surfaces[]`/`seams_adapters_contracts[]`/`drift_checks[]` array means a quiet, honest empty state (or omitting the section entirely), never an invented placeholder boundary. A `deletion_test[]` decision badge must use the island's own `decision` string verbatim (e.g. `"keep"`/`"delete"`/`"delay"`) rather than inventing a fixed enum the schema does not require.
