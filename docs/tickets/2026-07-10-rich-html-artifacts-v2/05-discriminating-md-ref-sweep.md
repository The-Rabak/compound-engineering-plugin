---
ticket_id: T05
title: Complete the discriminating system-wide .md-ref sweep
kind: hardening
status: completed
plan_ref: docs/plans/2026-07-09-feat-rich-html-artifacts-v2-plan.md
tickets_ref: docs/tickets/2026-07-10-rich-html-artifacts-v2/index.md
architecture_ref: docs/architecture/2026-07-09-rich-html-artifacts-architecture.md
source_packet_ref: "## Execution Slices > Slice 5 — Complete the discriminating system-wide `.md`-ref sweep"
feature_home: cross-cutting (skills + command prompts — stated explicitly in the plan)
depends_on:
  - T02
  - T03
  - T04
dependency_type: hard
serves:
  - "SC5 — every remaining brainstorm/architecture/deepen-pointing .md-ref and artifact-check is dual-read/.html-aware; tickets/todos/execution-sessions/docs/solutions/config stay Markdown."
files:
  - portable/compound-engineering/skills/workflow-next-step/SKILL.md
  - portable/compound-engineering/commands/workflows/review.md
  - portable/compound-engineering/commands/workflows/to-issues.md
  - portable/compound-engineering/commands/workflows/work.md
  - portable/compound-engineering/commands/deepen-plan.md
  - portable/compound-engineering/agents/review/constitution-guardian.md
  - portable/compound-engineering/skills/document-review/SKILL.md
  - portable/compound-engineering/skills/session-history/SKILL.md
test_command: "bun test  +  grep audit for un-migrated workflow-artifact .md refs AND stale v1-only caveats"
tdd_mode: inherit
---

# Complete the discriminating system-wide .md-ref sweep

## Serves

SC5 — a system-wide grep for `.md` artifact-path patterns shows every brainstorm/plan/architecture/deepen-pointing ref/check is dual-read / `.html`-aware; tickets/todos/execution-sessions/`docs/solutions/`/`CONTEXT.md`/`constitution.md`/`CLAUDE.md` remain Markdown.

## Scope

**Owns** the grep-enumerated remaining hits pointing at the four converted workflow artifacts:
- `skills/workflow-next-step/SKILL.md` — `:77` (brainstorm glob), `:80` (architecture glob), and `:42` (the sentence *"Every other artifact kind (brainstorm, architecture, …) stays `.md`-only in v1"* — must itself be revised).
- `commands/workflows/review.md` — `:102` (`ls -t docs/architecture/*.md`) and `:212` (reference-docs listing). **`:128` is owned by T04** (architecture read) — do not touch it here.
- `agents/review/constitution-guardian.md` — `:28` (`docs/architecture/**/*.md`).
- `skills/document-review/SKILL.md` — `:32`, `:34` (brainstorm/architecture directory listings).
- `skills/session-history/SKILL.md` — `:43`, `:45` (brainstorm/architecture directory listings).

**Closes a pre-existing gap:** `document-review` and `session-history` have **NO `.html` awareness at all** today — they are blind even to the `plan.html` v1 already ships (zero `.html` hits in either file). So make them dual-read for **all** converted artifact types (plan included), not just brainstorm/architecture — otherwise `document-review` (invoked by `architecture.md`'s escalated-review path) and `session-history` silently mis-handle HTML artifacts. This completes the stated SC5 sweep; it is not scope creep.

**Also owns (added after the `ticket-flow-auditor` sweep — these are the "across skills/commands" surface SC5 promises but the plan's Slice 5 enumeration missed):**
- **`to-issues.md` is a structured architecture consumer, not just a plan-reader.** `to-issues.md:79` extracts *"feature-home ownership and shared/global decisions from the architecture artifact"* — the exact Tier-2 island fields T04 authors — and `:78` reads `brainstorm_ref`. After T03/T04 these resolve to `.html`. Make the `:78–79` architecture/brainstorm reads dual-read via `island-extraction-helper.md`. Without this, every post-T04 `/workflows:to-issues` run scrapes rendered HTML for feature-homes — the precise "downstream consumer parsing rendered HTML" drift the architecture handoff forbids.
- **Retire the stale v1-only caveats that become FALSE after T03/T04:** `to-issues.md:72`, `review.md:116`, and `work.md:61` all assert *"Only the plan artifact may be `.html` in v1; `brainstorm_ref`, `architecture_ref` … always resolve to `.md`."* Revise each so it no longer instructs consumers to force brainstorm/architecture to Markdown. (These are correctness instructions, not cosmetics — left as-is they would actively direct an executor to mis-read a converted artifact.)
- **Secondary brainstorm WHY-context reads** at `deepen-plan.md:115`, `work.md:88`, `review.md:123` (loose prose reads for WHY context, not contract extraction). Audit each: make it dual-read, **or** explicitly document it as an acceptable-degradation case with a stated rationale so SC5 is not silently over-claimed. Do not skip them silently. *(The structured architecture reads in `deepen-plan.md:117`/`review.md:128`/`work.md:89` are already owned by T04 — do not duplicate them here.)*

**Non-goals:** any new conversion or composer/mutator change (T01–T04 own those); touching non-workflow-artifact `.md` refs; re-wiring the T04-owned structured architecture read spans (`review.md:128`, `work.md:89`, `deepen-plan.md`'s architecture read).

## Scope Fence

- **Discriminating:** update **only** refs/checks pointing at the four converted workflow artifacts (`brainstorm`, `plan`, `architecture`, and deepen-pointing). Leave every non-workflow-artifact `.md` ref untouched — tickets/todos/execution-sessions/`docs/solutions/`/`CONTEXT.md`/`constitution.md`/`CLAUDE.md` stay Markdown (the architecture handoff's "`.md`-refs migrated beyond the converted workflow artifacts" drift-check applies).
- Do not touch the T04-owned structured architecture read spans: `review.md:128`, `work.md:89`, and `deepen-plan.md`'s architecture read. T05 owns the *other* spans in those files (`review.md:102`/`:212`/`:116` caveat; `work.md:61` caveat + `:88` brainstorm read; `deepen-plan.md:115` brainstorm read) — different lines, sequential after T04, no race.
- A loose WHY-prose read may be left `.md`-only **only if** the ticket records an explicit acceptable-degradation rationale; silent skipping is not allowed (that is how SC5 gets over-claimed).
- No new npm dependency; reuse the shared dual-read idiom.

## Acceptance Criteria

- Grep audit shows **no un-migrated workflow-artifact refs**: every brainstorm/plan/architecture/deepen-pointing discovery glob and artifact-check (including the structured architecture read in `to-issues.md:79`) is dual-read / `.html`-aware across the enumerated files.
- Grep audit shows **no stale v1-only caveat remains**: no command/skill still instructs consumers that `brainstorm_ref`/`architecture_ref` "always resolve to `.md`" (`to-issues.md:72`, `review.md:116`, `work.md:61` revised).
- `document-review` and `session-history` are dual-read for **all** converted kinds (plan included).
- Every secondary brainstorm WHY-read (`deepen-plan.md:115`, `work.md:88`, `review.md:123`) is either made dual-read or carries an explicit acceptable-degradation note — none silently skipped.
- Downstream discovery tests green; `bun test` green; `bun run build:platforms` run and `bun run verify:generated` clean.
- The revised `workflow-next-step/SKILL.md:42` sentence no longer claims brainstorm/architecture are `.md`-only.

## Shared / Global Notes

Cross-cutting cleanup spanning shared skills and command prompts (feature home is explicitly "cross-cutting" per the plan — this is the one slice where no single feature home owns the change). Every edit reuses the shared dual-read idiom + `island-extraction-helper.md`; no new shared abstraction is introduced.

## Local Context

- **Canonical WHY source:** `docs/brainstorms/2026-07-09-rich-html-artifacts-brainstorm.md`.
- **This ticket serves:** finishing the migration so a half-converted chain (some consumers HTML-aware, some blind) can't silently mis-handle the converted artifacts.
- **Concrete files/lines that matter now:** the enumerated hits above (grep-verified in the plan's Slice 5 deepening **plus** the `to-issues.md` structured architecture consumer, the three stale v1-only caveats, and the secondary brainstorm reads surfaced by the `ticket-flow-auditor` sweep — the plan's Slice 5 enumeration missed these because the architecture handoff's `handoff:` frontmatter declared only `deepen_plan`/`work`/`review` as consumers). Re-run the grep at execution time to catch any hit still missed — the acceptance bar is the *audit*, not just this list.
- **Architectural boundary notes:** discriminating sweep — the discipline is "migrate workflow-artifact refs, leave everything else Markdown." When in doubt whether a `.md` ref points at a converted workflow artifact, surface it rather than migrating blindly.
- **Explicit unknowns to surface:** any `.md` ref discovered by the audit that is **not** in the plan's enumeration — decide (and record) whether it points at a converted workflow artifact before touching it.

## Parent Refs

- Plan → `## Execution Slices > Slice 5` + its `#### Deepening (grounded against shipped v1)` (the enumerated sweep surface).
- Architecture handoff: `docs/architecture/2026-07-09-rich-html-artifacts-architecture.md` (the "`.md`-refs migrated beyond converted artifacts" drift check).
- Ticket set: `docs/tickets/2026-07-10-rich-html-artifacts-v2/index.md`.

## Deeper-Dive Refs

- Plan `## Success Criteria` SC5 (grep audit + downstream discovery tests).
- The shipped dual-read idiom already in `to-issues.md`/`work.md`/`review.md` to mirror.

## Coupling Notes

- **Hard dependencies:** T02, T03, T04 — the sweep can only assert "no un-migrated refs" once all conversions have landed.
- **File overlaps with T02/T04 (all sequential singletons — T05 runs last of the four, so no race; spans are disjoint):**
  - `review.md` — T04 owns `:128` (architecture read); T05 owns `:102` glob + `:212` listing + `:116` stale caveat.
  - `work.md` — T04 owns `:89` (architecture read); T05 owns `:61` stale caveat + `:88` brainstorm read.
  - `deepen-plan.md` — T02 owns the plan dual-read (`~:30`/`:96–117`); T04 owns the architecture read (`:117`); T05 owns `:115` brainstorm read.
  - `to-issues.md` — T05 exclusively (the newly-swept structured architecture consumer + brainstorm read + `:72` caveat).
- **Shared-tree coupling:** runs `bun run build:platforms`.
