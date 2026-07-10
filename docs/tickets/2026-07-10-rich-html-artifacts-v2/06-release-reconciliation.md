---
ticket_id: T06
title: Release reconciliation (version bump + CHANGELOG + release-docs)
kind: infra-track
status: completed
plan_ref: docs/plans/2026-07-09-feat-rich-html-artifacts-v2-plan.md
tickets_ref: docs/tickets/2026-07-10-rich-html-artifacts-v2/index.md
architecture_ref: docs/architecture/2026-07-09-rich-html-artifacts-architecture.md
source_packet_ref: "## Implementation (One consolidated version bump + CHANGELOG + /release-docs at the very end, matching v1's release-reconciliation slice T06)"
feature_home: repo release surface (plugin.yaml version, CHANGELOG, docs site)
depends_on:
  - T05
dependency_type: hard
serves:
  - "Ships SC1–SC5 as one coherent release — the consolidated version/CHANGELOG/docs reconciliation the plan defers to the very end."
files:
  - portable/compound-engineering/plugin.yaml
  - plugins/compound-engineering/CHANGELOG.md
  - docs/
test_command: "bun test (full suite green)  +  bun run verify:generated  +  jq validation of marketplace.json/plugin.json"
tdd_mode: inherit
---

# Release reconciliation (version bump + CHANGELOG + release-docs)

## Serves

The cross-cutting release discipline that ships SC1–SC5 as one coherent version — the plan's explicit "one consolidated version bump + CHANGELOG + `/release-docs` at the very end, matching v1's release-reconciliation slice (T06)."

## Scope

**Owns:**
- Version bump in `portable/compound-engineering/plugin.yaml` (from the current `v4.21.0` baseline to the v2 release version) and a `bun run build:platforms` so the generated `plugins/` tree carries the new version.
- `plugins/compound-engineering/CHANGELOG.md` entry documenting the v2 surface: the `html-artifact-mutator` skill, `deepen-plan` HTML mutation, `brainstorm`/`architecture` HTML conversion + mutation, and the completed `.md`-ref sweep.
- Running `/release-docs` to rebuild the documentation site with the current component surface.
- Final validation gates: full `bun test` green, `bun run verify:generated` clean, `jq` validation of `marketplace.json` and `plugin.json`.

**Non-goals:** the descriptive **component-count string** (`… 29 skills`) and the `published-surface.test.ts` count-pin flip are **already done in T01** (the sole count-changing ticket) — do **not** re-touch the count strings here. T06 changes the **version** field and CHANGELOG/docs, which are orthogonal to the count.

## Scope Fence

- No feature/behavior changes — this is release plumbing only. If any test is red or `verify:generated` is dirty, stop and route the failure back to the owning ticket rather than patching it here.
- Do not alter the count strings (T01's surface); only the version and release/docs surfaces.
- No new npm dependency; official plugin spec only (no custom marketplace fields).

## Acceptance Criteria

- `plugin.yaml` version bumped; `bun run build:platforms` run; generated tree matches (`bun run verify:generated` clean).
- CHANGELOG entry present and accurate for the v2 surface.
- `/release-docs` run; docs site reflects the current surface.
- Full `bun test` green; `marketplace.json` and `plugin.json` pass `jq` validation.

## Shared / Global Notes

Touches repo-global release surfaces (`plugin.yaml` version, `CHANGELOG.md`, docs site). Follows the `CLAUDE.md` component-update checklist and edit-portable-first discipline. This ticket runs **last** precisely so all portable edits from T01–T05 are already settled before the one consolidated release reconciliation.

## Local Context

- **Canonical WHY source:** `docs/brainstorms/2026-07-09-rich-html-artifacts-brainstorm.md`.
- **This ticket serves:** delivering the whole v2 rollout as a single clean published release instead of dribbling partial version bumps across slices.
- **Concrete files/interfaces that matter now:**
  - `portable/compound-engineering/plugin.yaml` (carries `version` only — **not** the count string, per the plan's corrected bookkeeping).
  - `plugins/compound-engineering/CHANGELOG.md`.
  - `/release-docs` command (documentation site rebuild).
  - v1 precedent: `docs/tickets/2026-07-09-rich-html-artifacts-v1/06-release-reconciliation.md` (the v4.21.0 reconciliation this mirrors).
- **Architectural boundary notes:** release-only; behavior lives in T01–T05.
- **Explicit unknowns to surface:** the exact target version number (minor vs patch bump) — confirm against the repo's versioning convention (`docs/solutions/plugin-versioning-requirements.md`: MINOR for new agents/commands/skills added) before bumping rather than assuming.

## Parent Refs

- Plan → `## Implementation` (the consolidated end-of-run release reconciliation) + `## Constitution Alignment` (CLAUDE.md checklist).
- Ticket set: `docs/tickets/2026-07-10-rich-html-artifacts-v2/index.md`.

## Deeper-Dive Refs

- `CLAUDE.md` → "Updating the Compounding Engineering Plugin" checklist (version bump, rebuild, docs, JSON validation).
- `docs/solutions/plugin-versioning-requirements.md` — the semver convention (MAJOR/MINOR/PATCH criteria) that resolves the minor-vs-patch unknown above.
- v1 release ticket: `docs/tickets/2026-07-09-rich-html-artifacts-v1/06-release-reconciliation.md`.

## Coupling Notes

- **Hard dependency:** T05 (and transitively T01–T04) — every portable edit must be in before the consolidated release.
- **No file overlap** with T01's count-string surface (this ticket edits `version` + CHANGELOG + docs, not the count strings). Runs `bun run build:platforms` + `/release-docs`, which regenerate shared trees — another reason it stands alone as the final batch.
