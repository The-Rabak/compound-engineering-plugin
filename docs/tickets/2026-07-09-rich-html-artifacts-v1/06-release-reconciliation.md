---
ticket_id: T06
title: Release reconciliation — version bump, counts, CHANGELOG, docs rebuild
kind: infra-track
status: ready
plan_ref: docs/plans/2026-07-09-feat-rich-html-artifacts-v1-plan.md
tickets_ref: docs/tickets/2026-07-09-rich-html-artifacts-v1/index.md
architecture_ref: docs/architecture/2026-07-09-rich-html-artifacts-architecture.md
source_packet_ref: "## Execution Slices > Slice D (release reconciliation)"
feature_home: "cross-cutting release reconciliation — plugin.yaml + generated metadata surface (no single feature home)"
depends_on:
  - T02
  - T05
dependency_type: hard
serves:
  - SC (indirect) — a consistent, correctly-versioned shipped plugin surface (component-update checklist)
files:
  - portable/compound-engineering/plugin.yaml
  - plugins/compound-engineering/CHANGELOG.md
  - tests/published-surface.test.ts
  - .claude-plugin/marketplace.json
  - plugins/compound-engineering/.claude-plugin/plugin.json
  - plugins/compound-engineering/README.md
  - README.md
test_command: bun test
tdd_mode: inherit
---

# Release reconciliation — version bump, counts, CHANGELOG, docs rebuild

## Serves

- SC (indirect) — the pilot ships as a consistent, correctly-versioned plugin surface: the single version bump, a consolidated CHANGELOG entry, reconciled counts across every pinned site, and a docs rebuild. This is the plan's deliberately-consolidated "final slice" packaging step.

## Scope

- **Single version bump** in `portable/compound-engineering/plugin.yaml`.
- **Consolidated CHANGELOG entry** (Keep-a-Changelog): MDX removal (T02) + the new `html-artifacts` subsystem (T01/T03/T04).
- `bun run build:platforms`; `bun run verify:generated`; `jq .` on `marketplace.json` + `plugin.json`.
- **Confirm the final count target — 38 agents / 27 commands / 28 skills — everywhere:** the four description sites (`plugin.yaml`, generated `plugin.json`, `marketplace.json`, `plugins/.../README.md`) AND the pinned root-README assertion pair at `tests/published-surface.test.ts:125–126`. Concretely: **update `:125` `toContain(...)` to `"38 specialized agents, 27 commands, and 28 skills"`**, and **replace** the historical string in `:126`'s `.not.toContain(...)` — it currently guards `"34 specialized agents, 28 commands, and 26 skills"` (an *older* surface, like the `:57` stale guard — NOT the pre-v1 39/28/27 string) — with the now-superseded pre-v1 `"39 specialized agents, 28 commands, and 27 skills"` so the guard asserts the old surface is gone.
- `/release-docs` docs rebuild.

## Scope Fence

- **Owns:** the one-time release reconciliation only.
- **Do not:** author or edit any `html-artifacts` file, composer, dual-read, or gate logic (T01/T03/T04/T05).
- **Do not:** re-run or alter the equivalence gate (T05) — this ticket runs only after the gate has passed.
- **Do not:** introduce any custom marketplace fields (stick to the official Claude Code plugin spec).
- Do the version bump **once, here** — earlier tickets deliberately deferred it to avoid churn.

## Acceptance Criteria

1. Version bumped once in `plugin.yaml`; generated outputs regenerated via `bun run build:platforms`.
2. Counts consistent at **38 agents / 27 commands / 28 skills** across all four description sites and the root-README assertion pair: `:125` `toContain` updated to the new target, and `:126`'s `.not.toContain` historical string replaced with the pre-v1 `39/28/27` string.
3. Consolidated CHANGELOG entry present (MDX removal + `html-artifacts` subsystem).
4. `bun test` green; `bun run verify:generated` clean; `jq .` valid on `marketplace.json` + `plugin.json`.
5. `/release-docs` rebuild complete and count strings in the docs surface match `find` across all sites.

## Shared / Global Notes

- Cross-cutting packaging with **no single feature home** — it reconciles the plugin-metadata surface (`plugin.yaml`, generated `plugin.json`, `marketplace.json`, README, CHANGELOG) and the surface-pinning tests.
- **Global guardrails:** edit portable source first; counts must match across every site; only official plugin-spec fields.

## Local Context

- **Canonical WHY source:** `docs/brainstorms/2026-07-09-rich-html-artifacts-brainstorm.md`.
- **This ticket serves:** landing the pilot as a coherent release — one version bump, one CHANGELOG entry, reconciled counts, rebuilt docs — after the go/no-go gate (T05) has passed.
- **Count arithmetic across the set:** T02 took agents 39→38 and commands 28→27; T03 took skills 27→28. This ticket **confirms** the final target and does the single version bump; it should not itself change component counts.
- **Precise count-pin surface (verified — the plan's "four sites" are not exhaustive, but one commonly-miscited line is NOT this ticket's).** `tests/published-surface.test.ts:474`'s `toContain("39 specialized agents")` lives *inside* the MDX presence loop (`[rootReadme, pluginReadme, changelog]`, :472–475) that **T02** rewrites/removes — do **not** treat it as a surviving standalone docs-surface pin here; T02 owns it. This ticket's pinned sites are the four description strings plus the root-README pair at `:125–126`. Notes: `:41` uses a **dynamic** `${plugin.agents.length}` template (auto-adjusts — no manual edit); `:57`'s `not.toContain("Includes 29 specialized agents, 25 commands")` is an **unrelated stale-negative guard** (leave it). Do not assume the named sites are exhaustive — grep the count string across `tests/`, `docs/`, and README (and reconcile against `find`) before declaring done.

## Parent Refs

- Plan: `docs/plans/2026-07-09-feat-rich-html-artifacts-v1-plan.md` → `## Execution Slices > Slice D` (Release reconciliation) and the `## Implementation` bookkeeping rule
- Canonical WHY: `docs/brainstorms/2026-07-09-rich-html-artifacts-brainstorm.md`
- Architecture: `docs/architecture/2026-07-09-rich-html-artifacts-architecture.md` → "Recommendations for /workflows:work" (reconcile the surface)

## Deeper-Dive Refs

- `CLAUDE.md` → the component-update checklist (counts across four sites + version bump + `bun run build:platforms` + README/CHANGELOG + `/release-docs` + `jq` validation).
- `docs/solutions/plugin-versioning-requirements.md`.
- Plan → Slice D "Release reconciliation" + the pinned-assertion deepening update.

## Coupling Notes

- **Hard dependencies:** T02 (MDX gone before final counts) and T05 (gate passed → then ship). T03 is transitive via T05 (the +1 skill and the composed artifact).
- **File overlap with T02 and T03:** all three touch `tests/published-surface.test.ts` and the generated-plugin surface (via `bun run build:platforms`). This is why T02, T03, and T06 are each in **separate sequential batches** — never parallel.
- This is the **last** ticket; on completion the ticket set is done and the plan's pilot is release-ready.
