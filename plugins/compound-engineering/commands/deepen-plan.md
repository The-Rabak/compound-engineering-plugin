---
name: deepen-plan
description: Enhance a plan with parallel research agents grounded in user story, architectural context, and success criteria without duplicating specialist work
argument-hint: "[path to plan file]"
---

# Deepen Plan - Targeted Hardening Mode

## Introduction

**Note: The current year is 2026.** Use this only when checking current documentation, framework versions, deprecations, or external best practices.

This command takes an existing plan from `/workflows:plan` and hardens only the unresolved questions, risks, execution-packet gaps, source-doc discrepancies, architecture handoff gaps, and e2e weaknesses that could affect execution quality.

Default mode: targeted deepening. Research only unresolved questions, risks, or decisions that the plan explicitly leaves open, then fold findings directly into the relevant section.

Exhaustive fan-out is opt-in. Only run broad "cover everything" sweeps when the user explicitly requests exhaustive depth.

The orchestrator is a compiler and editor, not a second specialist. It extracts the plan contract, creates a deepening manifest, dispatches narrow specialists when they add value, resolves contradictions, accepts or rejects deltas, and writes the final plan. It must not redo specialist analysis, paste raw reports, discover every available skill, dispatch broad review agents, or expand scope just because a recommendation is technically sound.

## Plan File

<plan_path> #$ARGUMENTS </plan_path>

If the plan path above is empty:
1. Check for recent plans (a plan may be a legacy `.md` file or the pilot `.html` output of `/workflows:plan`): `ls -t docs/plans/*-plan*.md docs/plans/*-plan*.html 2>/dev/null | head -5`
2. Ask the user: "Which plan would you like to deepen? Please provide the path (e.g., `docs/plans/2026-01-15-feat-my-feature-plan.md` or `docs/plans/2026-01-15-feat-my-feature-plan.html`)."

Do not proceed until you have a valid plan file path.

## Required References

Use these references as contracts. Load only the references needed for the current plan; do not paste their full text into subagent prompts.

- `commands/workflows/references/orchestration-protocol.md`
- `commands/workflows/references/minimal-effective-planning.md`
- `commands/workflows/references/execution-shape.md`
- `commands/workflows/references/tdd-evidence-contract.md`
- `commands/workflows/references/e2e-testing-contract.md` when the plan has a runtime surface or a suggested e2e suite
- `commands/workflows/references/vertical-slice-architecture.md` when `execution_shape.mode=vertical-slices`
- `commands/workflows/references/html-artifacts/island-extraction-helper.md` when the plan path is `.html`, or when `architecture_ref` (T04) resolves to `.html`
- `commands/workflows/references/html-artifacts/island-contract.md` and `skills/html-artifact-mutator/SKILL.md` when this run will back-write into an `.html` plan (a content enrichment or a `status`/`tickets_ref` scalar patch)

When dispatching a named agent, apply `Named Agent Dispatch` from `orchestration-protocol.md`: verify the bundled agent source and metadata, dispatch the resolved agent identifier, and pass only workflow-specific payload plus resolved context. Do not paste the agent file body into the prompt.

## Operating Contract

The orchestrator owns:
- extracting WHY, architecture, TDD/evidence, runtime/e2e, and execution-shape context
- building a short deepening manifest of risks and gaps
- selecting the smallest useful specialist set
- merging plan-ready deltas into one coherent plan
- catching contradictions, missing required fields, critical mistakes, and scope drift
- writing the updated plan file

The orchestrator does not own:
- deep framework documentation research when `framework-docs-researcher` is dispatched
- external best-practice synthesis when `best-practices-researcher` is dispatched
- institutional learning search when `learnings-researcher` is dispatched
- flow-matrix analysis when `spec-flow-analyzer` is dispatched
- e2e suite hardening when `e2e-test-strategist` is dispatched
- code review or implementation review; named review agents belong to `/workflows:review`, except explicit pre-code artifact checks documented in this command
- ticket packaging; `/workflows:to-issues` and `focused-ticket-priming` own ticket-local context
- coding

Only launch research/review agents for unresolved questions. Use the word "review" here to mean artifact-focused plan review only; do not dispatch broad code-review agents from this workflow.

## Subagent Output Contract

Every deepening-time helper or named specialist must return compact, plan-ready output in this shape:

```markdown
## Verdict
[1-2 sentences on whether this area needs a plan change.]

## Critical Findings
- [Only blockers, contradictions, source-doc mismatches, or high-risk misses. Say "None" when absent.]

## Plan Deltas
- **Section:** [plan section]
  **Change:** [specific text or decision to incorporate]
  **Reason:** [success criterion, user story need, architecture handoff, source fact, or risk]
  **Source:** [file path, URL, artifact path, agent name, or "agent judgment"]

## Deferred / Non-goals
- [Useful but out-of-scope ideas.]

## Open Questions
- [Questions that block truthful deepening. Say "None" when absent.]
```

Reject raw research dumps. If a helper returns broad notes, distill them into this contract before synthesis.

## Workflow

### 1. Load The Current Plan Contract

**Dual-read by plan-file extension.** Detect which reader applies from the plan path's extension before reading anything:

- **`.md`** -- parse frontmatter and sections as today (legacy path, unchanged).
- **`.html`** -- load `commands/workflows/references/html-artifacts/island-extraction-helper.md`, quote its first non-empty line, and use it to read the plan's `#artifact-data` JSON island. Read the same fixed-core facts the legacy path reads from frontmatter/sections, sourced from the island instead (see the helper's field-coverage-map pointer for the frontmatter-key/section-name -> island-field mapping). If extraction fails for any reason, stop immediately and report the artifact path and the exact failure per the helper's fail-loud branch -- do not proceed on partial data, scrape the rendered HTML, or fall back to a `.md` mirror (none exists for an `.html` artifact).

`architecture_ref` may now be `.md` **or** `.html` (T04) -- detect its own extension independently of the plan's, and read it via the dual-read branch below (where `architecture_ref` is read). `tickets_ref` still always resolves to `.md` regardless of the plan's own format -- read it as legacy Markdown. `brainstorm_ref` may also be `.md` **or** `.html` (T03) -- detect its own extension independently of the plan's, and read it via the dual-read branch below (where `brainstorm_ref` is read).

Read the plan and extract only the contract needed for deepening:
- Problem Narrative
- User Story
- Architectural Context
- Success Criteria
- `handoff` frontmatter
- `source_docs`, `brainstorm_ref`, `architecture_ref`, `tickets_ref`
- `execution_shape` frontmatter and `## Execution Shape`
- execution packets for the selected mode
- `tdd` frontmatter and `## TDD & Evidence Contract`
- `runtime_stack`, `## Runtime Stack & Environments`, and `## Suggested E2E Suite` when present
- explicit open questions, risks, TODOs, and uncertainty markers

If any `handoff` field is false or missing, flag it before deepening: "Plan is missing [X]. Deepening may add technically correct but purpose-misaligned changes. Consider running `/workflows:plan` to repair the plan first." Continue only when the missing field is not required for the requested hardening.

Read `brainstorm_ref` only when it exists and the plan needs missing stakeholder impact, rejected approaches, resolved-question context, or WHY clarification. Detect which reader applies from its own file extension (independent of the plan's):

- **`.md`** -- parse frontmatter and sections as today (legacy path, unchanged).
- **`.html`** (T03) -- load `commands/workflows/references/html-artifacts/island-extraction-helper.md`, quote its first non-empty line, and use it to read the brainstorm artifact's `#artifact-data` JSON island for the same fixed-core facts, sourced from the island's `brainstorm`-kind Tier-2 core instead. If extraction fails for any reason, stop immediately and report the artifact path and the exact failure per the helper's fail-loud branch -- do not proceed on partial data, scrape the rendered HTML, or fall back to a `.md` mirror (none exists for an `.html` artifact).

Do not summarize the entire brainstorm; extract only facts that affect the manifest.

Read `architecture_ref` when present, detecting which reader applies from its own file extension (independent of the plan's):

- **`.md`** -- parse frontmatter and sections as today (legacy path, unchanged).
- **`.html`** (T04) -- load `commands/workflows/references/html-artifacts/island-extraction-helper.md`, quote its first non-empty line, and use it to read the architecture artifact's `#artifact-data` JSON island. Read the same fixed-core facts the legacy path reads from sections, sourced from the island's `architecture`-kind Tier-2 core instead (see `island-contract.md`'s architecture field-coverage map for the section-name -> island-field mapping). If extraction fails for any reason, stop immediately and report the artifact path and the exact failure per the helper's fail-loud branch -- do not proceed on partial data, scrape the rendered HTML, or fall back to a `.md` mirror (none exists for an `.html` artifact).

Whichever path applied, extract: Feature Homes and Ownership, shared/global decisions, deepening candidates, context tiers, deletion-test decisions, interfaces as test surfaces, seams, adapters, contracts, drift checks, and downstream recommendations. If no architecture artifact exists, build a compact explicit architecture handoff contract from the plan's Architectural Context, Key Decisions, Constitution Alignment, brainstorm context, and Related Artifacts. Record whether the handoff is real or plan-derived.

### 2. Resolve Required Contracts

Use `commands/workflows/references/tdd-evidence-contract.md` to resolve the effective TDD contract: plan values override local defaults, `inherit` falls back, and no local config falls back to Ralph-driven `red-green-refactor` with unit + e2e evidence required.

Do not silently weaken the TDD or e2e contract. If the plan weakens Ralph, unit evidence, or e2e evidence without a justified exception and replacement evidence, add the justified exception or stop and surface the blocker.

Resolve execution shape first using `commands/workflows/references/execution-shape.md`:
- validate against the selected mode, not vertical slices unconditionally
- for `vertical-slices`, apply `commands/workflows/references/vertical-slice-architecture.md`
- if the mode looks wrong, add a `### WHY Reassessment` note instead of silently rewriting intent
- keep packet tracing lines intact

For each packet, check only the selected mode's required fields:
- `vertical-slices`: slice type, serves, demo scenario, feature home, scope, scope fence, files, depends on, dependency type, success criteria, test command
- `infra-track`: capability enabled, consumers / downstream work unlocked, scope, files, depends on, risk / rollback, validation command, success criteria
- `fix-batch`: problem, repro / expected outcome, files, depends on, validation command, success criteria

Report:

```text
Execution Readiness: X/Y packets have complete structure (Z%)
```

If readiness is below 80%, add missing fields only when the plan or linked artifacts give enough evidence. If reconstructing packet boundaries would require guessing, mark that as a blocker for `/workflows:plan`, `/workflows:architecture`, or human repair.

Flag packet complexity only when it affects execution safety: more than one meaningful outcome, missing scope fence, unresolved shared mutable state, unclear dependency type, high blast radius without rollback, or validation evidence that cannot satisfy the resolved TDD/e2e contract.

### 3. Build The Deepening Manifest

Create a short private manifest before dispatching specialists:

```markdown
## Deepening Manifest
- **Area:** [execution packet, e2e suite, architecture handoff, source doc, framework decision, prior learning, flow gap]
  **Why it matters:** [success criterion, user story need, architecture decision, or execution risk]
  **Evidence available:** [plan section, architecture artifact, source doc ref, repo pattern]
  **Needed specialist:** [none | learnings-researcher | framework-docs-researcher | best-practices-researcher | spec-flow-analyzer | e2e-test-strategist | document-review | source-doc helper]
  **Payload scope:** [exact section or risk, not the whole plan unless required]
```

Default to no specialist when the plan and local artifacts already answer the question. Exhaustive breadth requires explicit user request and must be labeled `exhaustive` in the synthesis notes.

### 4. Dispatch Only Narrow Specialists

Use the smallest set that can close the manifest. Every dispatch must request the Subagent Output Contract and include only:
- compact WHY context
- relevant architecture handoff excerpt
- resolved TDD/evidence expectations when relevant
- the exact unresolved area
- the relevant plan section or packet
- source paths or URLs needed for that area

Preferred specialists:
- `learnings-researcher`: one run for relevant `docs/solutions/` knowledge. Do not hand-roll a full learning-file sweep in the orchestrator.
- `framework-docs-researcher`: version-specific official docs, APIs, migrations, or framework behavior.
- `best-practices-researcher`: current external guidance only when local patterns and source docs cannot settle the decision.
- `spec-flow-analyzer`: ambiguous multi-role flows, state transitions, retries, cancellation, resume, or thin acceptance criteria.
- `e2e-test-strategist` in HARDEN mode: when `runtime_stack.e2e_surface` is not `false` or the plan has a `## Suggested E2E Suite`.
- `document-review` in plan mode: only when the plan or architecture handoff is internally contradictory, missing required handoff fields, or likely to become a durable reference that needs artifact-level tightening.

Source documents:
- If `source_docs` exist, re-fetch or re-read only documents that can change the deepening manifest.
- Helpers must return source-fact deltas, acceptance criteria, changed timestamps, discrepancies, and citations using the Subagent Output Contract.
- Never feed full source-document contents to all later agents unless the user explicitly asks for exhaustive source reanalysis.

Review-agent boundary:
- Do not dynamically discover all available review agents.
- Do not dispatch broad code-review agents from `/deepen-plan`; `/workflows:review` owns that phase.
- If pre-code architecture or plan criticism is needed and no listed specialist fits, use `document-review` or stop with an explicit open question.

### 5. Synthesize Findings

Build a short synthesis ledger before editing:

```markdown
## Deepening Synthesis Notes
- **Accepted deltas:** [source -> plan section -> reason]
- **Rejected/deferred deltas:** [source -> reason]
- **Critical findings resolved:** [finding -> resolution]
- **Open blockers:** [must be empty before final plan unless explicitly marked blocked]
```

Conflict rules:
- source artifacts and explicit user decisions outrank generic research
- constitution and approved waivers outrank convenience
- architecture artifact decisions outrank plan-derived guesses
- local repo patterns outrank generic best practices unless stale, unsafe, or contradicted by current docs
- specialist findings outrank orchestrator self-checks in that specialist's domain
- scope-expanding ideas go to Deferred / Non-goals or Future Considerations unless required for current success criteria

Simplicity pass:
- preserve targeted deepening by default
- prefer the least-complex change that satisfies the user story, success criteria, architecture handoff, and evidence contract
- remove or defer speculative, redundant, or "nice to have" recommendations
- include complexity only when backed by source facts, repo constraints, or concrete risk mitigation

### 6. Update The Plan

Never modify these original contract sections:
- Problem Narrative
- User Story
- Architectural Context
- Success Criteria
- execution-shape contract and packet tracing lines
- handoff frontmatter

If research suggests those sections are wrong, add a `### WHY Reassessment` note at the end instead of rewriting them.

Preserve the plan's `tdd` frontmatter and `## TDD & Evidence Contract`. You may clarify precedence, validation commands, missing justifications, and replacement evidence, but any relaxation from Ralph/unit+e2e must be explicit and justified.

Harden `## Suggested E2E Suite` only by adding coverage and rigor: real-app drive, real transport, real infra, no fakes, poll-not-sleep, no hardcoded passes, live-value assertions, environment tags, and relevant failure modes. Do not remove scenarios or soften assertions to make execution easier. If no runtime surface exists, verify the justified N/A exception instead of inventing a suite.

Integrate findings inline into the relevant plan section. Do not append raw sub-agent dumps.

```markdown
## [Original Section Title]

[Original content preserved -- including execution-shape and packet tracing lines]

- [Deepening update: concrete recommendation tied to a success criterion or risk]
- [Constraint/tradeoff clarified and where it applies]
- [Evidence/reference link only when it materially supports the update]
```

Optional compact change note, only when it helps downstream readers:

```markdown
### Optional compact change note
- Updated sections: [list]
- Why these updates matter: [1-2 concise bullets tied to success criteria/risks]
```

**Write the update by plan-file extension.**

- **`.md` plan** -- update the plan file in place as today: edit frontmatter/sections directly (legacy path, unchanged).
- **`.html` plan** -- content enrichment (execution packets, `tdd` contract clarifications, `## Suggested E2E Suite` hardening, a `### WHY Reassessment` note, or any other Tier-2/3/4 field) never edits the rendered markup directly; it routes through `skills/html-artifact-mutator/SKILL.md` (the shared T01 update capability -- do not reimplement or re-derive its read/parse/mutate/re-serialize/re-project pipeline here):
  1. Load and follow `commands/workflows/references/html-artifacts/island-contract.md` ("Mutation contract" section) and the mutator's own `SKILL.md`.
  2. Build `mutation: { class: "content", patch: {...} }` against `target_path` (the plan's `.html` path), supplying the complete new value for each changed top-level field -- e.g. the full `slices[]` array with the enriched packet, the full `tdd` object with the clarified evidence, the full `suggested_e2e_suite[]` array with the hardened scenario. A `### WHY Reassessment` note has no fixed-schema home, so it goes into `ext{}`.
  3. The mutator handles the fail-loud extraction, mutable-region validation, and re-serialization; never touch a Tier-1 envelope key (including `render_meta`) from this path.
  4. Content mutations always re-project -- this mirrors the composer's 3-part Invocation contract (`commands/workflows/plan.md:339-359`). Dispatch **one fresh subagent** with exactly: an instruction to **load and follow** `skills/html-artifact-composer/SKILL.md` in re-projection mode (point at the file; do not paste the skill body into the prompt), `target_path`, and the recorded `render_meta` read back from the just-mutated island. The subagent re-renders only the affected section(s), reusing the exact `archetypes`/`design_seed` already recorded -- it must never reclassify the design or invent a fact the island doesn't carry. The deepening is not complete, and must not be reported as complete, until this subagent returns the rewritten artifact path. If it reports a missing required field, fill it from the deepening synthesis and re-dispatch -- never let it fabricate a value.

If the user asks for a separate file, append `-deepened` after `-plan` for either format, e.g. `2026-01-15-feat-auth-plan-deepened.md` / `...-plan-deepened.html`.

### 7. Land Scalar Back-Writes (`status`, `tickets_ref`)

Deepening can also confirm or change two Tier-1 scalars: the plan's `status` (for example, once deepening resolves a previously-flagged readiness gap) and `refs.tickets_ref` (for example, recording a ticket set that already exists but was not yet linked back to this plan). This is the only status/ref back-write logic in this command today -- there is no other write path to retrofit, so every write of these two fields must be `.html`-aware from here on.

- **`.md` plan** -- edit the `status` / `tickets_ref` frontmatter field directly (legacy path, unchanged).
- **`.html` plan** -- route through `skills/html-artifact-mutator/SKILL.md` with `mutation: { class: "scalar", field: "status" | "refs.tickets_ref", value }` against `target_path`. This is the scalar-only dispatch carve-out: it runs entirely inline, no subagent. Follow the mutator's single-element-or-fallback rule for the rendered view -- if the old value is rendered as exactly one element, its text is replaced in place; otherwise the mutator appends the graceful "Related Artifacts" fallback section and logs that the fallback ran. Never touch `title`, `type`, `date`, `kind`, `schema_version`, or `render_meta` from this path -- they sit outside the scalar mutable region.

## Quality Checks

Before finalizing:

Content integrity:
- [ ] Findings are integrated inline in the relevant sections with no raw append dumps
- [ ] The synthesis ledger accepted, rejected, or blocked every critical specialist delta
- [ ] Links and citations are relevant and not decorative
- [ ] No contradictions remain between plan, architecture handoff, TDD/evidence, runtime/e2e, and execution packets
- [ ] Execution packets have complete required fields for the selected mode or blockers are explicit
- [ ] Simplification pass removed/deferred unnecessary complexity

WHY and evidence integrity:
- [ ] Problem Narrative, User Story, Success Criteria, and Architectural Context are unmodified from the original plan
- [ ] `handoff` frontmatter remains intact and accurate
- [ ] `execution_shape` frontmatter and `## Execution Shape` still agree
- [ ] Every packet still traces to the user story, success criteria, or explicit enabling outcome
- [ ] Scope-expanding recommendations are deferred instead of silently added to packets
- [ ] `tdd` frontmatter and `## TDD & Evidence Contract` still agree on precedence, loop, evidence, and justified exceptions
- [ ] `## Suggested E2E Suite` was hardened or a justified no-surface N/A was confirmed

HTML-artifact integrity (only when the plan is `.html`):
- [ ] Every content patch stayed inside the content-class mutable region -- no Tier-1 envelope key, no `render_meta`, was included in `patch`
- [ ] A content mutation's fresh-subagent re-projection ran and returned before the deepening was reported complete
- [ ] `render_meta` is byte-identical after the mutation (reused, not regenerated)
- [ ] Any `status`/`tickets_ref` back-write stayed inside the scalar mutable region and ran inline (no subagent)
- [ ] No fact was written into the rendered HTML that is not already on the island

## Post-Enhancement Boundary

Do not offer post-enhancement option menus, direct work starts, review/refine choices, deepen-further loops, diff viewing, or revert prompts here. The final `workflow-next-step` advisor owns downstream routing after the enhanced plan is written.

## Final Phase: Workflow Next Step Advisor

After the plan has been deepened, load the `workflow-next-step` skill.

Run it in advisory mode only:
- pass the current workflow name: `deepen-plan`
- pass the deepened plan path
- pass `architecture_ref` and `tickets_ref` when present
- inspect relevant artifacts without mutating them
- output the full core workflow checklist and the exact next-session command with required inputs

This must be the last phase of the workflow. If deepening stopped before completion, still run the advisor with the current state so it can mark blockers and recommend the recovery step.

## Example Enhancement

Before:

```markdown
## Technical Approach

Use React Query for data fetching with optimistic updates.
```

After:

```markdown
## Technical Approach

Use React Query for data fetching with optimistic updates.
- Set `staleTime` and `cacheTime` to match the freshness requirement in success criterion #2.
- Standardize `queryKey` factories to prevent stale invalidation paths.
- Add targeted retry and error-boundary behavior for transient network failures.

### Optional compact change note
- Updated section: Technical Approach
- Why: tightened cache behavior and failure handling for the plan's responsiveness and reliability criteria.
```

NEVER CODE! Just research and enhance the plan.
