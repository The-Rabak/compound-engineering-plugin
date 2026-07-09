---
name: "workflows:plan"
description: Transform feature descriptions into structured project plans anchored to user story, architectural context, and success criteria from brainstorm (or constructed fresh when no brainstorm exists)
argument-hint: "[--lite] [feature description, bug report, or improvement idea]"
---

# Create a plan for a new feature or bug fix

## Operating Contract

**Current year: 2026.** Use this when dating plans and checking current documentation.

You are the planning orchestrator. Your job is to compile a high-quality implementation plan from user intent, repository facts, linked artifacts, and focused specialist outputs.

Do the work of an orchestrator:
- establish or inherit the WHY anchor
- gather only the context needed to plan safely
- dispatch focused agents when they add value
- synthesize findings into one coherent plan
- catch contradictions, missing required fields, and critical gaps
- write the final plan file

Do not duplicate specialist work:
- do not re-run deep SpecFlow analysis if `spec-flow-analyzer` was dispatched
- do not re-design the detailed e2e strategy if `e2e-test-strategist` was dispatched
- do not broaden architecture beyond what the plan needs; `/workflows:architecture` owns the dedicated architecture artifact
- do not append raw research dumps or agent reports to the plan
- do not code

Default posture: minimal effective planning. Produce the smallest execution-ready plan that fully satisfies the user request, confirmed decisions, project guardrails, and evidence requirements.

## Feature Description

<feature_description> #$ARGUMENTS </feature_description>

If the feature description is empty, ask the user what feature, bug fix, or improvement they want planned. Do not proceed without a clear planning target.

Set `lite_mode=true` only when the user explicitly asks for `--lite`, "lite", "small", "routine", or equivalent compact planning.

#### Lite Mode Contract

Detect explicit lite intent from `--lite`, "lite", "small", "routine", or equivalent user wording. Lite mode reduces ceremony, not evidence quality or traceability.

When `lite_mode=true`:
- Skip the structured project-input questionnaire unless the user mentions tickets, docs, Figma, or spec files.
- Skip external research unless the topic is high-risk, unfamiliar, or lacks local patterns.
- Use compact SpecFlow/e2e self-checks for low-risk work before specialist dispatch.
- Produce one or a few execution packets by default.
- Recommend direct `/workflows:work <plan>` for small, low-risk plans after the final advisor runs.

## Required References

Use these references as contracts. Load them only when their section is needed; do not paste their full text into prompts.

- `commands/workflows/references/minimal-effective-planning.md`
- `commands/workflows/references/orchestration-protocol.md`
- `commands/workflows/references/execution-shape.md`
- `commands/workflows/references/tdd-evidence-contract.md`
- `commands/workflows/references/e2e-testing-contract.md`
- `commands/workflows/references/vertical-slice-architecture.md` when `execution_shape.mode=vertical-slices`

When dispatching a named agent, apply `Named Agent Dispatch` from `orchestration-protocol.md`: verify the bundled agent source and metadata, dispatch the resolved agent identifier, and pass only workflow-specific payload plus resolved context. Do not paste the agent file body into the prompt.

## Subagent Output Contract

Every planning-time subagent must return compact, plan-ready output in this shape:

```markdown
## Verdict
[1-2 sentences]

## Critical Findings
- [Only blockers, contradictions, or high-risk misses. Say "None" when absent.]

## Plan Deltas
- **Section:** [plan section]
  **Change:** [specific text or decision to incorporate]
  **Reason:** [success criterion, user story need, risk, or source fact]
  **Source:** [file path, URL, artifact path, or "agent judgment"]

## Deferred / Non-goals
- [Useful but out-of-scope ideas]

## Open Questions
- [Questions that block a truthful plan. Say "None" when absent.]
```

The orchestrator may reject a delta, but must record why in the synthesis notes before writing the plan.

## Workflow

### 0. Establish Baselines

Read project baselines before planning:

1. If `docs/constitution.md` exists, read it and extract:
   - constitution version
   - relevant principles and baselines
   - approval or exception rules
   - waiver needs
2. If `compound-engineering.local.md` exists, read its YAML frontmatter and extract the visible `tdd` defaults:
   - `tdd.precedence`
   - `tdd.mode`
   - `tdd.loop`
   - `tdd.evidence.unit`
   - `tdd.evidence.e2e`
   - `tdd.exceptions`
   - `tdd_enabled` as compatibility mirror only
3. Resolve the plan's TDD/evidence contract using `tdd-evidence-contract.md`.
4. Apply `minimal-effective-planning.md` before creating execution packets.

Plan-level `tdd` values override `compound-engineering.local.md` for this plan. Any field set to `inherit` falls back to local config, and when no local config exists the default is Ralph-driven red-green-refactor with unit + e2e evidence required. Any relaxation must use `replacement_evidence`.

#### Specified Scope Contract (Runs Before Issue Planning)

Every plan must classify material scope before execution packet decomposition:
- **Explicitly included:** work the user directly requested.
- **Confirmed by brainstorm/grill-me:** decisions validated through brainstorm, grill-me, or equivalent user confirmation.
- **Inferred as necessary:** work required for success criteria, TDD/evidence, constitution rules, runtime stack, or existing architecture constraints.
- **Deferred / non-goals:** useful ideas that should not enter this execution batch.
- **Complexity Justification path:** if non-trivial complexity is included, explain why the simpler option is insufficient and why deferring it would harm current success criteria.

Every execution packet must trace to explicit, confirmed, or necessary scope. Reject or rework orphan packets before the plan is considered execution-ready.

If the requested work conflicts with the constitution, ask whether this should be a plan waiver or a constitution amendment. Do not invent a waiver.

### 1. Establish the WHY Anchor

Every plan must have:
- Problem Narrative
- User Story
- Architectural Context
- Success Criteria

Choose exactly one source path.

#### Path A: Spec or Plan File Provided

If the arguments contain a `.md` path:
1. Read the file.
2. Announce the source path.
3. Extract title, problem, approach, acceptance criteria, existing tasks, open questions, and any frontmatter refs.
4. If `brainstorm_ref` exists, read that brainstorm and inherit its lynchpin sections.
5. Preserve well-defined sections and enrich only the gaps needed for this workflow's required contract.

#### Path B: Matching Brainstorm Found

If no file path is provided, check `docs/brainstorms/` for a matching recent brainstorm.

Use a brainstorm only when topic/title/frontmatter clearly matches the request. If several match, ask the user which one to use.

When a brainstorm is selected:
1. Read it.
2. Carry forward its Problem Narrative, User Story, Architectural Context, Success Criteria, Chosen Approach, Key Decisions, and Open Questions.
3. Resolve blocking open questions before planning.
4. Do not re-decide settled brainstorm decisions unless research exposes a contradiction.

#### Path C: Standalone Planning

If no source artifact exists:
1. Ask only the questions needed to clarify purpose, constraints, and success criteria.
2. Prefer one concise question at a time.
3. Stop when the feature is clear or the user says to proceed.
4. Synthesize the WHY anchor and ask for confirmation before research when the inferred WHY is not obvious.

For straightforward requests with explicit purpose and success criteria, proceed without extended dialogue.

### 1.5 Gather Project Inputs

In normal mode, ask for external project inputs only when the user mentions or likely has tickets, docs, Figma designs, specs, or requirement files. In lite mode, skip this unless explicitly mentioned.

Supported inputs:
- project management ticket URLs
- wiki/documentation URLs
- Figma URLs
- local `.md` plan/spec paths

For each provided input, fetch or read it with the narrowest available tool. Use helper subagents only when there are multiple inputs or access/extraction is non-trivial. Helper prompts must use the Subagent Output Contract.

If a URL cannot be accessed, ask the user to paste the relevant content.

Store source refs in plan frontmatter:

```yaml
source_docs:
  tickets: []
  docs: []
  figma: []
  plans: []
```

### 1.6 Local Research

Local research is the default because it prevents generic plans. Keep it focused.

In lite mode for low-risk work, do a compact local self-check instead of named-agent fan-out:
- inspect the smallest relevant files/docs
- identify established local patterns
- note whether anything is high-risk, unfamiliar, or patternless

Escalate from self-check to named local agents when local context is weak, scope is cross-cutting, or architecture/evidence could change.

Default named local agents:
- `repo-research-analyst`
- `learnings-researcher`

Payload for both agents:
- feature description
- WHY anchor
- known source docs
- constitution/TDD constraints if present
- request the Subagent Output Contract

Expected local findings:
- concrete file paths and patterns to follow
- relevant `docs/solutions/` learnings
- repo-specific commands, conventions, and constraints
- contradictions between docs and observed practice

### 1.7 External Research Decision

Run external research only when it can change the plan.

Always research:
- security, privacy, auth, payments, data loss, migrations, external APIs, compliance, novel infrastructure

Usually skip:
- clear low-risk local changes with strong in-repo patterns
- lite-mode routine work
- topics already covered by source docs or local learnings

When needed, dispatch focused research agents:
- `best-practices-researcher`
- `framework-docs-researcher`

Payload:
- unresolved decision/risk only, not the whole plan by default
- project versions/constraints when known
- WHY anchor and success criteria
- request the Subagent Output Contract

### 1.8 Synthesize Findings

Before drafting the plan, merge all inputs into a short synthesis table:

```markdown
## Planning Synthesis Notes
- **Accepted deltas:** [agent/source -> plan section -> reason]
- **Rejected/deferred deltas:** [agent/source -> reason]
- **Critical findings resolved:** [finding -> resolution]
- **Open blockers:** [must be empty before final plan unless explicitly marked blocked]
```

This table is for orchestration. Include it in the final plan only when it materially helps downstream execution; otherwise use it to guide the draft and omit it.

Orchestrator conflict rules:
- source artifacts and explicit user decisions outrank generic research
- constitution and approved waivers outrank convenience
- local repo patterns outrank generic best practices unless stale or unsafe
- specialist findings outrank orchestrator self-checks in that specialist's domain
- scope-expanding ideas go to Future Considerations or Deferred / Non-goals unless required now

### 2. Issue Planning & Structure

Use `execution-shape.md` as the source of truth.

Default to `vertical-slices` unless that would fake end-to-end value.

Allowed modes:
- `vertical-slices`
- `infra-track`
- `fix-batch`

Every plan must include:
- `execution_shape` frontmatter
- `## Execution Shape`
- exactly one packet section matching the mode:
  - `## Execution Slices`
  - `## Infrastructure Work Packets`
  - `## Fix Batch Items`

For `vertical-slices`, also apply `vertical-slice-architecture.md` and require feature-home names.

Every execution packet must trace to one of:
- explicitly requested work
- confirmed brainstorm/grill-me decision
- necessary inference for success criteria, TDD/evidence, constitution, runtime stack, or existing architecture

Reject or rework orphan packets before writing the plan.

### 3. Specialist Gates

Specialist gates exist to catch gaps. They do not make the orchestrator a second specialist.

#### SpecFlow Gate

Run a compact self-check first:
- do planned packets cover the user story?
- are acceptance criteria testable?
- are there obvious missing unhappy paths?
- would any added flow be scope creep?

Dispatch `spec-flow-analyzer` only when:
- user flows are ambiguous or multi-role
- state transitions/retries/cancellation/resume matter
- acceptance criteria are thin or disputed
- a missed flow could change execution packets

When dispatched, incorporate only its critical findings and plan deltas. Do not redo its matrix.

#### E2E Gate

Always establish the runtime stack:
- local
- QA
- prod
- whether there is a runtime surface for real e2e

Run a compact e2e self-check first:
- what real app surface can be driven?
- which success criteria need e2e proof?
- is a no-runtime-surface exception genuinely justified?

Dispatch `e2e-test-strategist` in DESIGN mode only when:
- runtime surface is unclear
- real infra/harness requirements are unclear
- failure modes could change the test plan
- e2e is being relaxed or replaced
- the feature touches high-risk seams

When dispatched, insert its plan-ready `## Suggested E2E Suite` deltas. Do not independently redesign the suite.

For simple low-risk plans, the orchestrator may write a compact suggested e2e suite directly from the runtime stack and success criteria, while preserving the `e2e-testing-contract.md` rules.

### 4. Compose the Plan Artifact

Assemble one decision-bearing payload, then hand it to the `html-artifact-composer` skill to project as a self-contained HTML artifact. Do not hand-write HTML and do not hand-write a `.md` file for the plan output — the composer is the single writer of the artifact. (The `.md` brainstorm this plan may have read as *input* in step 1 is unaffected; only the plan's own *output* format changes.)

Write the plan to:

```text
docs/plans/YYYY-MM-DD-<type>-<descriptive-name>-plan.html
```

Use today's date. Keep the filename descriptive and kebab-case.

Ensure `docs/plans/` exists. Ensure `.gitignore` contains `docs/plans/` and `docs/brainstorms/` if `.gitignore` exists or must be created. Do not add `docs/solutions/` to `.gitignore`.

Assemble the payload, then **delegate composition to a fresh subagent per the composer's Invocation contract** (`skills/html-artifact-composer/SKILL.md` → "Invocation — the calling command MUST run the composer in a fresh subagent"). Do **not** load and run the composer inline in this planning context — by now it is large, and the single-file HTML generation belongs in a clean, focused context. Dispatch one fresh subagent and give it only:

- an instruction to **load and follow** `skills/html-artifact-composer/SKILL.md` (point it at the file; do not paste the skill body into the prompt — the skill is its instruction set),
- `target_path`: the path above,
- `payload`: the object below, fully populated from this workflow's steps 0–3. The payload's shape matches `commands/workflows/references/html-artifacts/island-contract.md`'s Tier 1 envelope + Tier 2 `plan` contract core exactly; the composer projects the visible HTML and writes `render_meta` — this workflow does not choose an archetype or write markup by hand.

The subagent writes the artifact and returns its path. If it reports a missing required field, fill it from steps 0–3 and re-dispatch; do not let the composer fabricate a value.

#### Required Island Payload (Tier 1 envelope + Tier 2 contract core)

Gather exactly these fields before invoking the composer — same content the legacy frontmatter used to carry, now the composer's input rather than hand-written YAML:

```yaml
title: [Issue Title]
type: [feat|fix|refactor]
status: active
date: YYYY-MM-DD
constitution:
  version: [version or null]
  waivers: []
refs:
  brainstorm_ref: [path or null]
  architecture_ref: [path or null]
  tickets_ref: null
  source_docs:
    tickets: []
    docs: []
    figma: []
    plans: []
handoff:
  problem_narrative: true
  user_story: true
  architectural_context: true
  success_criteria: true
tdd:
  precedence: plan_overrides_local
  mode: inherit
  loop: inherit
  evidence:
    unit: inherit
    e2e: inherit
  exceptions: []
execution_shape:
  mode: vertical-slices
  rationale: ""
runtime_stack:
  local: ""
  qa: ""
  prod: ""
  e2e_surface: true
```

#### Required Island Content (Tier 3 prose + Tier 2 structured lists)

Gather exactly the content the legacy body sections used to hold — the composer projects each into a navigable section, table, or card grid instead of a markdown heading:

- `problem_narrative`, `user_story`, `architectural_context`, `specified_scope_contract`, `references` — Tier 3 prose, rendered as-is (never machine-parsed downstream).
- `success_criteria[]` (`{ id, statement, verification }`) — the structured twin of the legacy `## Success Criteria` section.
- `suggested_e2e_suite[]` (`{ id, ... }`, semi-structured per scenario) — the structured twin of `## Suggested E2E Suite`.
- `tdd`, `execution_shape`, `constitution` (already gathered above) restate as the composer's `## TDD & Evidence Contract` / `## Execution Shape` / `## Constitution Alignment` equivalents — one structured copy, not a duplicated prose mirror.
- `slices[]` — see Packet Fields below; the composer projects these as a tabbed viewer plus, when the payload has more than one slice with real dependency chains, a milestone/roadmap timeline.
- Anything decision-bearing that has no field above (a bespoke visual, a diagram) goes into `ext{}` on the payload, never handed to the composer as free-floating prose — the composer's hard rule requires island backing for every rendered fact.

Never emit an empty optional element: if a list above is legitimately empty (e.g. no TDD exceptions, no architecture ref yet), pass it as empty/`null` rather than omitting the key — the composer still needs the key present per the fixed-core contract, and an empty value renders as nothing rather than a placeholder.

#### Optional sections catalog (include only when decision-bearing)

None of these have a fixed-core field — gather one only when it changes a decision, and pass it as a named `ext{}` key so the composer projects it as its own section (per the hard rule: bespoke content still needs island backing):

- `ext.stakeholder_impact`
- `ext.technical_considerations`
- `ext.alternative_approaches_considered`
- `ext.dependencies_and_risks`
- `ext.success_metrics`
- `ext.future_considerations`
- `ext.complexity_justification`

Include only when this section changes a decision. Never add an `ext{}` key just to render an empty section.

#### Representative routine plan (compact and scannable)

For routine plans, gather the same required payload but keep prose fields compact and pass one or a few slices. The composer still enforces every invariant (token layer, TOC, exporters, injection-safety) regardless of plan size — "routine" changes how much content there is, never which invariants apply.

#### Packet Fields

Use the exact required fields from `execution-shape.md`, expressed as one `slices[]` entry per execution packet:
- `id`
- `feature_home`
- `scope` (with owns/non-goals/scope fence folded into `scope`/`scope_fence`)
- `scope_fence`
- `files`
- `depends_on`
- `dependency_type`
- `acceptance_criteria`
- `test_command`

For `infra-track` and `fix-batch`, use the matching packet requirements from `execution-shape.md`, mapped onto the same `slices[]` shape.

### 5. Final Validation

Before finishing, validate:

- all four `handoff` fields are true
- `tdd` frontmatter and `## TDD & Evidence Contract` agree
- any TDD/e2e relaxation has `scope`, `reason`, and `replacement_evidence`
- `runtime_stack` and `## Runtime Stack & Environments` agree
- `## Suggested E2E Suite` traces to success criteria or records a justified no-surface exception
- `execution_shape` frontmatter and body agree
- every packet traces to explicit, confirmed, or necessary scope
- non-default execution shape has a rationale
- critical subagent findings were incorporated, rejected with reason, or left as blockers
- no raw subagent report was pasted into the plan
- architecture is the simplest viable option for the current user story
- complexity beyond the baseline has a current, evidence-backed justification

If validation fails and can be repaired without new user input, repair it. If it requires user input, stop with the blocker and run the final advisor with the current state.

## Post-Generation Boundary

Do not offer post-generation menus, direct work starts, remote work starts, review/refine choices, issue creation choices, or local visual artifact choices. The final `workflow-next-step` advisor owns downstream routing after the plan is written.

## Final Phase: Workflow Next Step Advisor

After the plan file is written, load the `workflow-next-step` skill.

Run it in advisory mode only:
- pass the current workflow name: `workflows:plan`
- pass the plan path that was written
- pass `brainstorm_ref` and `architecture_ref` when present
- inspect relevant artifacts without mutating them
- output the full core workflow checklist and the exact next-session command with required inputs

This must be the last phase. If planning stopped before completion, still run the advisor with the current state so it can mark blockers and recommend the recovery step.

NEVER CODE. Research, synthesize, and write the plan only.
