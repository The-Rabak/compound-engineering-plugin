---
name: workflows:architecture
description: >-
  Produce an implementation-guiding architecture handoff between planning and deepening, with optional deep review for risky changes
argument-hint: '[path to plan file]'
platforms:
  codex:
    model: gpt-5.5

---

# Create an architecture improvement artifact

This phase sits **after** `/workflows:plan` and **before** `/deepen-plan`.

Its job is to turn the plan's architectural context into a **consumable artifact** that downstream phases can read instead of relying on hidden oral tradition. The output is not commentary. It is a concrete architecture improvement document that names the deepening candidates, deletion-test results, interfaces, seams, adapters, and contracts that should guide deeper execution hardening.

**Process knowledge:** Load the `agent-native-architecture` skill for design heuristics around deletion tests, interface-as-test-surface thinking, seams, adapters, and contracts.

## Plan File

<plan_path> #$ARGUMENTS </plan_path>

**If the plan path above is empty:**
1. Check for recent plans: `ls -t docs/plans/*-plan*.md 2>/dev/null | head -5`
2. Ask the user: "Which plan should I improve architecturally? Please provide the path (for example `docs/plans/2026-01-15-feat-my-feature-plan.md`)."

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

Write the architecture artifact to:

```text
docs/architecture/YYYY-MM-DD-<topic>-architecture.md
```

Ensure `docs/architecture/` exists before writing.

After writing the artifact:
1. Add or update `architecture_ref: <artifact path>` in the plan frontmatter when possible.
2. If frontmatter cannot be safely updated, add a clearly labeled `## Related Artifacts` section to the plan with the artifact path.
3. Do not silently move the artifact elsewhere.

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
Artifact: docs/architecture/YYYY-MM-DD-<topic>-architecture.md

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
