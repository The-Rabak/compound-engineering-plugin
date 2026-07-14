---
ticket_id: T02
title: Scrap the MDX visual-artifact system
kind: infra-track
status: completed
plan_ref: docs/plans/2026-07-09-feat-rich-html-artifacts-v1-plan.md
tickets_ref: docs/tickets/2026-07-09-rich-html-artifacts-v1/index.md
architecture_ref: docs/architecture/2026-07-09-rich-html-artifacts-architecture.md
source_packet_ref: "## Execution Slices > Slice A"
feature_home: "cross-cutting removal — no single feature home (spans agents/workflow, commands, commands/workflows/references, skills/workflow-next-step, tests/)"
depends_on: []
dependency_type: none
serves:
  - Brainstorm's binding scrap/remove decision (MDX visual-artifact system)
  - SC (indirect) — removes unmaintained cruft that inflates counts and confuses users
files:
  - portable/compound-engineering/agents/workflow/local-visual-artifact-renderer.md
  - portable/compound-engineering/commands/visual-artifact.md
  - portable/compound-engineering/commands/workflows/references/local-visual-artifacts.md
  - portable/compound-engineering/commands/workflows/references/agent-native-plan-style.md
  - portable/compound-engineering/skills/workflow-next-step/SKILL.md
  - tests/published-surface.test.ts
  - tests/workflow-next-step-skill.test.ts
test_command: bun test tests/published-surface.test.ts tests/workflow-next-step-skill.test.ts
tdd_mode: inherit
---

# Scrap the MDX visual-artifact system

## Serves

- The brainstorm's binding **scrap/remove** decision (per `CONTEXT.md`: "scrap/remove," never "supersede/deprecate").
- SC (indirect) — shrinks the surface and de-risks the pilot; removal is test-guarded.

## Scope

- **Delete:** `agents/workflow/local-visual-artifact-renderer.md`; `commands/visual-artifact.md`; `commands/workflows/references/local-visual-artifacts.md`; `commands/workflows/references/agent-native-plan-style.md` (MDX-only — grep to confirm no non-MDX inbound refs before deleting).
- **Edit** `skills/workflow-next-step/SKILL.md`: remove the "Visual Plan Routing" section (~148–160), the `<visual-plan-gate>` decision gate, and the visual-plan summary line — **and** scrub the gate-order mention at `:52` ("…visual routing, then the graph transition") and confirm the decision-gate step at `:116` is removed. These read "visual routing" / "Visual-plan gate" (spaces), so the hyphenated grep AC below will **not** flag them.
- **Flip tests to assert absence** (template: the existing `retire ideate as a standalone workflow` test): rewrite the MDX assertions in `tests/published-surface.test.ts` to assert the files/commands/agents are **gone** and counts drop to **38 agents / 27 commands**; drop the Visual-Plan-Routing / visual-plan-gate assertions in `tests/workflow-next-step-skill.test.ts`.
- **Regenerate:** `bun run build:platforms` (syncs generated outputs + derived descriptions); update the README/CHANGELOG count references touched by the removal.

## Scope Fence

- **Owns:** removal of the four MDX files + all inbound references + the corresponding test flips.
- **Do not:** touch any `.md`-ref that is not an MDX inbound reference.
- **Do not:** add the composer skill or any new `html-artifacts` file here (that is T03).
- **Do not:** do the single version bump / consolidated CHANGELOG / `/release-docs` — those are consolidated into T06. Only update the count references the removal directly touches.

## Acceptance Criteria

1. `grep -ri "visual-artifact\|local-visual\|agent-native-plan-style" portable/ tests/ plugins/` returns **only** intentional absence-assertions.
2. `bun test` green with the MDX tests flipped (red before removal, green after).
3. `bun run build:platforms` clean; `jq .` valid on `marketplace.json` + `plugin.json`.
4. Component counts after this ticket: **38 agents / 27 commands** (skills unchanged at 27 here; the +1 skill lands in T03).

## Shared / Global Notes

- This is a **cross-cutting removal** with no single feature home — stated explicitly. It spans four directories plus the `tests/` suite.
- The `tests/published-surface.test.ts` file and the generated-plugin surface are **shared mutable surfaces** also touched by T03 and T06 → these tickets stay in separate sequential batches.

## Local Context

- **Canonical WHY source:** `docs/brainstorms/2026-07-09-rich-html-artifacts-brainstorm.md`.
- **This ticket serves:** removing the June MDX visual-artifact system entirely so the pilot's new `html-artifacts` surface is not competing with dead cruft, and so counts are clean for the final reconciliation.
- **Interfaces that matter now:** the surface pins in `tests/published-surface.test.ts` (they currently *enforce* the MDX system) and `tests/workflow-next-step-skill.test.ts` (asserts the visual-plan gate). Flipping them to absence is the removal's proof.
- **Explicit unknown to surface, not guess — the MDX test surface is broader than the plan's "three tests," and the hyphenated grep AC cannot catch space-separated phrases (so a passing grep is necessary but NOT sufficient; the real completeness proof is `bun test` green after the deletes + rebuild).** Verified against the current suite, MDX/count assertions in `tests/published-surface.test.ts` span roughly lines 150–475: the `visual-artifact` command block (~155–188), the `local-visual-artifact-renderer` agent block (~193–290), the `local-visual-artifacts.md` reference block (~236–426), the `docs/visual-artifacts/` gitignore assertion (~413), the workflow-next-step prompt assertions (~450, ~459–460), and the `[rootReadme, pluginReadme, changelog]` loop asserting `"local-only visual artifacts"` (:473, space-separated — grep will miss it) and `"39 specialized agents"` (:474). Plus two count pins this ticket must flip because it drops a command: **`:150` `plugin.commands.length).toBe(28)` → 27**, and **`:232` `agents.length).toBe(39)`** is subsumed by removing the renderer-agent test. **Flip ALL of them — not only the three named in the plan.** The regenerated `pluginReadme`/`changelog` counts fall to 38 on rebuild; only the hand-maintained root-README combined-count string is deferred to T06 (see T06). Surface any assertion whose intent is ambiguous rather than guessing.
- **Delete-safety:** grep each of the four files' identifiers for non-MDX inbound references before deleting; `agent-native-plan-style.md` must be confirmed MDX-only.

## Parent Refs

- Plan: `docs/plans/2026-07-09-feat-rich-html-artifacts-v1-plan.md` → `## Execution Slices > Slice A`
- Canonical WHY: `docs/brainstorms/2026-07-09-rich-html-artifacts-brainstorm.md`
- Architecture: `docs/architecture/2026-07-09-rich-html-artifacts-architecture.md` → "Scrapped home (Slice A)"

## Deeper-Dive Refs

- `CONTEXT.md` → "Flagged ambiguities" (scrap vs supersede, resolved 2026-07-09).
- Plan → "Dependencies & Risks" (test suite pins the surface).
- `CLAUDE.md` → component-update checklist (count reconciliation across four sites).

## Coupling Notes

- **Independent** (no `depends_on`), but **not parallel-safe** with T01/T03/T06: this ticket runs `bun run build:platforms` (regenerates the whole generated tree) and edits `tests/published-surface.test.ts`, both shared mutable surfaces. Keep in its own sequential batch.
- **Blocks T06:** MDX must be gone before the final release reconciliation confirms the final counts (38/27/28).
- Count arithmetic across the set: T02 takes agents 39→38 and commands 28→27; T03 takes skills 27→28; T06 confirms the final target and does the single version bump.
