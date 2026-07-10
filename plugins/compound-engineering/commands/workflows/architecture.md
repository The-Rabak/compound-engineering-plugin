---
name: "workflows:architecture"
description: Produce an implementation-guiding architecture handoff between planning and deepening, with optional deep review for risky changes
argument-hint: "[path to plan file]"
---

# Create an architecture improvement artifact

This phase sits **after** `/workflows:plan` and **before** `/deepen-plan`.

Its job is to turn the plan's architectural context into a **consumable artifact** that downstream phases can read instead of relying on hidden oral tradition. The output is not commentary. It is a concrete architecture improvement document that names the deepening candidates, deletion-test results, interfaces, seams, adapters, and contracts that should guide deeper execution hardening.

**Process knowledge:** Load the `agent-native-architecture` skill for design heuristics around deletion tests, interface-as-test-surface thinking, seams, adapters, and contracts.

## Plan File

<plan_path> #$ARGUMENTS </plan_path>

**If the plan path above is empty:**
1. Check for recent plans (a plan may be a legacy `.md` file or the pilot `.html` output of `/workflows:plan`): `ls -t docs/plans/*-plan*.md docs/plans/*-plan*.html 2>/dev/null | head -5`
2. Ask the user: "Which plan should I improve architecturally? Please provide the path (for example `docs/plans/2026-01-15-feat-my-feature-plan.md` or `docs/plans/2026-01-15-feat-my-feature-plan.html`)."

Do not proceed until you have a valid plan file path.

## Required inputs

The architecture phase requires these inputs from the plan or linked artifacts:

- **Problem Narrative** -- why this work exists
- **User Story** -- who needs what outcome
- **Success Criteria** -- what must be true for the work to be done
- **Architectural Context** -- where the change lives and what it touches
- **Implementation phases/tasks** -- the proposed execution shape
- **`brainstorm_ref` / constitution alignment / waivers / source docs** -- when present

Use `commands/workflows/references/execution-shape.md` to interpret the plan's packet structure before deciding whether a boundary belongs in a feature home, shared/global scope, or a different execution mode entirely.

If any required WHY or WHERE inputs are missing, stop and tell the user exactly what is missing. Do not invent architectural context.

## Required reference contract

Before drafting the artifact, load both of these references from `commands/workflows/references/` (or the generated platform-local equivalent):

- `commands/workflows/references/architecture-improvement-prompt.md`
- `commands/workflows/references/vertical-slice-architecture.md`

Follow this protocol:
1. Use the platform's file-search tool against the command reference directory to look for both files.
2. Use the file-read tool to load both files in full.
3. Before continuing, quote the first non-empty line of each loaded reference and record which files you used.
4. If you cannot load and quote both references, stop and report the missing template instead of improvising.

Use those references as the **mandatory artifact contract**.

## Review depth

Default path: lightweight implementation handoff.

- Treat routine plans as guidance-first: produce the architecture artifact without mandatory named-reviewer ceremony.
- Focus the default pass on a concrete module blueprint, feature homes, shared/global boundaries, arrangement, contents, rationale, and downstream guardrails.
- Record the chosen review depth in the artifact so `/deepen-plan`, `/workflows:work`, and `/workflows:review` inherit the same context.

Escalate to deep architecture review when risk is high.

- Trigger escalation when work is genuinely novel, has high blast radius, introduces major shared/global extraction, or leaves boundary ownership disputed.
- For escalated runs, apply the shared `Named Agent Dispatch` protocol from `commands/workflows/references/orchestration-protocol.md`.
- Then run `architecture-strategist` and `uncle-bob`, fold findings back into the artifact, and resolve meaningful conflicts explicitly.
- After merging reviewer findings, run `document-review` in **architecture** mode for final tightening.
- If an escalated run cannot load/quote required reviewers, stop and report the phase as incomplete rather than silently reducing scrutiny.

## Workflow

### 1. Read the plan and linked context

Read the plan file and extract:
- Problem Narrative
- User Story
- Success Criteria
- Architectural Context
- Key Decisions / Approaches Considered (when present)
- Task list and dependencies
- Current or likely feature homes
- `brainstorm_ref`, `constitution_version`, `constitution_waivers`, `source_docs`, and any existing `architecture_ref`

If `brainstorm_ref` exists, read it for stakeholder impact, resolved questions, and architectural context that should not be lost.

If an existing `architecture_ref` already exists, read it first and decide whether to update it in place or replace it with a newer artifact. Do not create duplicate artifacts without explaining why.

### 2. Run the architecture improvement pass (default lightweight)

Use the reference contract to produce explicit architectural guidance:

1. **Build a module blueprint** -- identify each module, feature home, arrangement, main contents, and rationale so implementation knows what to build and why.
2. **Confirm shared/global decisions** -- keep feature-home ownership, shared/global extractions, and reason-to-change boundaries explicit.
3. **Name deepening candidates** -- call out only the areas that need deeper treatment before execution hardening.
4. **Run the deletion test** -- state what stays concrete, what is delayed, and why.
5. **Define interfaces as test surfaces** -- name stable caller/test behavior and what must not leak.
6. **Map seams, adapters, and contracts** -- show where variation is expected and what promises must remain stable.
7. **Use design-it-twice only for high leverage** -- compare options when risk justifies it; routine details can stay single-path.
8. **Split context tiers** -- keep global, on-demand, and ticket-local context explicit.
9. **Translate findings into downstream guidance** -- what `/deepen-plan`, `/workflows:work`, and `/workflows:review` should preserve or verify.

If you cannot explain a proposed abstraction in terms of deletion test, interface, seam, or adapter, it is not ready to include.

### 2.5 Decide whether deep review escalation is required

Choose one path and document it in the artifact:

- **Routine/default:** no named-reviewer ceremony; rely on the lightweight architecture contract and explicit downstream handoff.
- **Escalated/deep:** run `architecture-strategist`, `uncle-bob`, and `document-review` as defined in **Review depth**.

For escalated/deep runs, resolve meaningful conflicts explicitly in the artifact instead of picking one silently.

### 3. Write the artifact

Assemble one decision-bearing payload, then hand it to the `html-artifact-composer` skill to project as a self-contained HTML artifact. Do not hand-write HTML and do not hand-write a `.md` file for the architecture output — the composer is the single writer of the artifact.

Write the architecture artifact to:

```text
docs/architecture/YYYY-MM-DD-<topic>-architecture.html
```

Use today's date. Keep the filename descriptive and kebab-case, matching the parent plan's topic.

Ensure `docs/architecture/` exists before writing.

#### Required Island Payload (Tier 1 envelope + Tier 2 `architecture` contract core)

Gather exactly these fields before invoking the composer. The payload's shape matches `commands/workflows/references/html-artifacts/island-contract.md`'s Tier 1 envelope + Tier 2 `architecture` contract core exactly:

```yaml
title: [Topic Title]
type: [feat|fix|refactor] # inferred from the parent plan's own type -- the architecture template has no frontmatter type: key of its own; gather/infer it the same way date/status are gathered (see island-contract.md's architecture frontmatter-keys note)
status: complete
date: YYYY-MM-DD
refs:
  brainstorm_ref: [path or null]
  architecture_ref: null # an architecture artifact never references itself
  tickets_ref: null
  source_docs:
    tickets: []
    docs: []
    figma: []
    plans: []
plan_ref: [the plan path this run improved]
feature_homes: [] # [{ feature_home, owns, notes }]
shared_global_decisions: [] # [{ candidate, decision, rationale }]
deepening_candidates: [] # string[]
context_tiers:
  global: ""
  on_demand: ""
  ticket_local: ""
deletion_test: [] # [{ candidate, decision, rationale }]
interfaces_as_test_surfaces: [] # [{ interface, callers_rely_on, must_not_leak, evidence_needed }]
seams_adapters_contracts: [] # [{ seam, adapter, contract, stability_class }]
drift_checks: [] # string[]
recommendations:
  deepen_plan: []
  work: []
  review: []
handoff:
  deepen_plan: true
  work: true
  review: true
```

Gather these fields directly from the workflow steps above (module blueprint, feature-home ownership, shared/global decisions, deepening candidates, deletion test, interfaces/seams/contracts, context tiers, drift checks, downstream recommendations). Never emit an empty optional element by omitting its key — the composer still needs every key present per the fixed-core contract; a legitimately empty list or comparison (e.g. no Design-It-Twice ran) still needs its key present as `[]`/`""`.

#### Required Island Content (Tier 3 prose)

- `purpose_linkage` — canonical WHY source, local intent, success-criteria focus, and architectural scope.
- `module_blueprint` — the full module / feature-home / contains / rationale table.
- `design_it_twice` — the high-leverage option comparison when one applied; `""` when none did.
- `review_depth` — the chosen depth (`lightweight`/`escalated`) and why, from step 2.5 above.
- `open_questions` — any unresolved architecture-level questions; `""` when none remain.

#### Dispatch the composer via a fresh subagent

Do **not** load and run the composer inline in this architecture context — by this point the context holds the full plan read, the architecture-improvement pass, and (for escalated runs) reviewer findings, none of which the projection needs. Mirror the exact fresh-subagent Invocation contract `commands/workflows/plan.md` and `commands/workflows/brainstorm.md` already use at their own artifact-write steps (`skills/html-artifact-composer/SKILL.md` → "Invocation"):

1. **Assemble the `payload`** from the fields gathered above — it alone must carry every fact the artifact will show. Include `type` in the envelope payload; the composer's required-field check fails loud if it is missing.
2. **Dispatch one fresh subagent** whose entire context is: an instruction to **load and follow** `skills/html-artifact-composer/SKILL.md` (point it at the file; do not paste the skill body into the prompt — the skill is its instruction set), `target_path` (the path above), and the `payload`.
3. **The subagent returns only** the written artifact path (plus any missing-required-field report). On a missing-field report, fill the field from the workflow steps above and re-dispatch — never let the composer fabricate a value.

After the artifact is written:
1. **Record `architecture_ref` back into the plan, dual-read by the plan's own file extension:**
   - **`.md` plan** — add or update `architecture_ref: <artifact path>` in the plan frontmatter directly (legacy path, unchanged). If frontmatter cannot be safely updated, add a clearly labeled `## Related Artifacts` section to the plan with the artifact path instead.
   - **`.html` plan** — never edit the rendered markup directly. Route through `skills/html-artifact-mutator/SKILL.md` (the shared T01 update capability) with `mutation: { class: "scalar", field: "refs.architecture_ref", value: <artifact path> }` against the plan's own path as `target_path`. This is the scalar-only dispatch carve-out: it runs entirely inline, no subagent. Follow the mutator's single-element-or-fallback rule for the rendered view — if the old value (`null`, since no architecture ref existed before this run) has no unique rendered element to patch, the mutator appends the graceful "Related Artifacts" fallback section and logs it, which is the expected outcome for a first-time architecture_ref back-write.
2. Do not silently move the artifact elsewhere.

For escalated/deep runs, run the `document-review` skill in **architecture** mode against the architecture artifact plus the parent plan context. This pass can run headlessly. Its job is to tighten feature-home ownership, shared/global boundary honesty, deletion-test justification, and downstream handoff usefulness without creating a parallel shadow spec.

## Required outputs

A complete run must leave behind all of the following:

- **Architecture artifact** in `docs/architecture/`
- **Explicit artifact path** recorded back into the plan via `architecture_ref` or `## Related Artifacts`
- **Module blueprint** that tells implementation which modules/feature homes to build, how they are arranged, what they contain, and why
- **Feature-home ownership decisions** for the main slices or modules
- **Shared/global boundary decisions** that keep DRY and SOLID honest
- **Context tiers** that separate global, on-demand, and ticket-local context
- **Deepening candidates** the next phase can act on
- **Deletion-test decisions** that justify which abstractions stay or go
- **Interface / seam / adapter / contract guidance** stated in plain language
- **Review depth record** (`lightweight` or `escalated`) and why that depth was chosen
- **Clear next step**: run `/deepen-plan` with the updated plan

## Handoff

When complete, summarize:

```text
Architecture improvement complete!

Plan: <plan_path>
Artifact: docs/architecture/YYYY-MM-DD-<topic>-architecture.html

Key deepening candidates:
- <candidate 1>
- <candidate 2>

Deletion test:
- Keep: <what stays concrete>
- Add later only if needed: <what failed the deletion test>

Review depth:
- <lightweight | escalated>
- Why: <why this depth fits the current plan risk>

Next: Run `/deepen-plan <plan_path>` so execution hardening uses this architecture artifact.
```

Do not offer a local visual artifact choice here. The final `workflow-next-step` advisor owns visual-plan recommendations and downstream routing after the architecture artifact is finalized.

## Final Phase: Workflow Next Step Advisor

After the architecture artifact is written and recorded back into the plan, load the `workflow-next-step` skill.

Run it in advisory mode only:
- pass the current workflow name: `workflows:architecture`
- pass the plan path and architecture artifact path
- inspect relevant artifacts without mutating them
- output the full core workflow checklist and the exact next-session command with required inputs

This must be the last phase of the workflow. If architecture work stopped before completion, still run the advisor with the current state so it can mark blockers and recommend the recovery step.

NEVER CODE! This phase produces architecture guidance and artifact contracts, not implementation changes.
