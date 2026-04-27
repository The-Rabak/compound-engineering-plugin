---
name: workflows:plan
description: >-
  Transform feature descriptions into structured project plans anchored to user story, architectural context, and success criteria from brainstorm (or constructed fresh when no brainstorm exists)
argument-hint: '[feature description, bug report, or improvement idea]'
---

# Create a plan for a new feature or bug fix

## Introduction

**Note: The current year is 2026.** Use this when dating plans and searching for recent documentation.

Transform feature descriptions, bug reports, or improvement ideas into well-structured, execution-ready plans that:
1. **Anchor to WHY** -- every plan traces back to a user story and problem narrative
2. **Map WHERE** -- architectural context grounds task decomposition in the system's structure
3. **Define DONE** -- success criteria tied to user outcomes, not just technical checkboxes
4. **Honor project guardrails** -- constitution principles, baselines, and approval rules are made explicit
5. **Make TDD explicit** -- the plan declares the Ralph/default loop, required unit + e2e evidence, and any justified exceptions
6. **Enable architecture-first execution** -- `/workflows:architecture` turns the plan into a dedicated architecture artifact before `/deepen-plan`, `/workflows:work`, and `/workflows:review` harden or execute it

Plans consume the project constitution from `/workflows:constitution` when available, plus lynchpin artifacts from `/workflows:brainstorm` when available, or construct feature context fresh when running standalone. Either way, the plan document carries forward the WHY, WHERE, DONE, GUARDRAIL, and TDD contract that all downstream phases depend on. After the plan is written, the next explicit step is `/workflows:architecture`, not direct deepening.

## Feature Description

<feature_description> #$ARGUMENTS </feature_description>

**If the feature description above is empty, ask the user:** "What would you like to plan? Please describe the feature, bug fix, or improvement you have in mind."

Do not proceed until you have a clear feature description from the user.

### 0. Idea Refinement & WHY Anchoring

This step establishes the plan's WHY anchor -- whether from a brainstorm, a spec file, or fresh dialogue. Every path must produce or inherit: **problem narrative**, **user story**, **architectural context**, and **success criteria**. When `docs/constitution.md` exists, every path must also inherit or explicitly waive the relevant project guardrails.

#### Constitution Baseline (Runs Before Path A/B/C)

If `docs/constitution.md` exists:

1. Read it completely before planning.
2. Extract:
   - constitution version
   - relevant core principles
   - applicable engineering baselines
   - approval and exception rules
3. Treat these as non-negotiables unless the plan records an explicit waiver.
4. If the feature appears to conflict with the constitution, ask the user whether this should be:
   - a plan waiver for this feature
   - a constitution amendment to be handled by `/workflows:constitution`

#### TDD Baseline (Runs Before Path A/B/C)

If `compound-engineering.local.md` exists:

1. Read the YAML frontmatter before planning.
2. Extract the visible local `tdd` contract:
   - `tdd.precedence`
   - `tdd.mode`
   - `tdd.loop`
   - `tdd.evidence.unit`
   - `tdd.evidence.e2e`
   - `tdd.exceptions`
   - `tdd_enabled` (compatibility mirror only)
3. Treat these as repo-local defaults, not hidden implementation details.

Every plan must then write its own `tdd:` frontmatter block plus a `## TDD & Evidence Contract` section.

- **Precedence rule:** Plan-level `tdd` values override `compound-engineering.local.md` for that plan.
- **Fallback rule:** Any plan field set to `inherit` falls back to the local config.
- **No-local-config fallback:** If there is no local config, default to Ralph-driven `red-green-refactor` with both unit and e2e evidence required.
- **Exception rule:** Any deviation from the resolved default loop or evidence requirements must be explicit and justified in `tdd.exceptions` and in the plan body.
- **Shared source of truth:** Reuse `commands/workflows/references/tdd-evidence-contract.md` for contract resolution, the `## TDD & Evidence Contract` section shape, Ralph evidence semantics, and exception handling.

#### Path A: Spec/Plan File Provided

**Check if arguments contain a plan or spec file:**

If the feature description (`#$ARGUMENTS`) is or contains a path to a `.md` file (e.g., `docs/plans/some-plan.md`, `spec.md`, `~/notes/feature-plan.md`):

1. Read the file
2. Announce: "Found existing plan/spec: `[file path]`. Using as foundation."
3. Extract: title, problem statement, proposed approach, acceptance criteria, implementation phases, and any existing tasks
4. **Check for brainstorm reference** -- look for a `brainstorm_ref` field in frontmatter, or search `docs/brainstorms/` for a matching topic. If found, read and extract lynchpin artifacts (see Path B).
5. **Extract or construct WHY artifacts from the spec:**
   - If the spec has a Problem Narrative / User Story / Architectural Context -- use them directly
   - If the spec only has a "Problem Statement" -- synthesize a user story from it:
     - Who has this problem? (infer from context or ask)
     - What do they need? (from the spec's proposed solution)
     - Why does it matter? (from the spec's motivation)
   - If the spec lacks architectural context -- note it for research phase (Step 1 will fill it in)
6. **Skip free-form idea refinement** -- the spec defines WHAT to build
7. Proceed to Step 0.5 to gather any additional project inputs, then to research

In Step 2 (Issue Planning), **build upon the existing plan structure** -- preserve its sections, fill gaps, add execution-readiness fields (Files, Depends on, Success criteria, Test command) to any tasks that lack them, and enrich with research findings. Do NOT discard or rewrite sections that are already well-defined.

#### Path B: Brainstorm Document Found

**If arguments are NOT a file path, check for brainstorm output:**

Before asking questions, look for recent brainstorm documents in `docs/brainstorms/` that match this feature:

```bash
ls -la docs/brainstorms/*.md 2>/dev/null | head -10
```

**Relevance criteria:** A brainstorm is relevant if:
- The topic (from filename or YAML frontmatter) semantically matches the feature description
- Created within the last 14 days
- If multiple candidates match, use the most recent one

**If a relevant brainstorm exists:**
1. Read the brainstorm document
2. **Parse handoff frontmatter** -- check for `handoff.problem_narrative`, `handoff.user_story`, `handoff.architectural_context`, `handoff.success_criteria`
3. Announce: "Found brainstorm from [date]: [topic]. Consuming lynchpin artifacts."
4. **Extract and surface all lynchpin sections:**
   - **Problem Narrative** -- the synthesized WHY (carry forward verbatim into plan)
   - **User Story** -- the north star (carry forward, plan tasks must trace to this)
   - **Architectural Context** -- the WHERE map (feeds `{{ARCHITECTURAL_CONTEXT}}` in work.md)
   - **Success Criteria** -- the DONE definition (plan acceptance criteria must include these)
   - **Stakeholder Impact** -- who is affected (informs stakeholder analysis)
   - **Chosen Approach** and **Key Decisions** -- the WHAT (informs task decomposition)
   - **Open Questions** -- must be resolved before planning proceeds
5. **If any handoff fields are `false` or sections are empty**, flag them: "Brainstorm is missing [X]. I'll construct this during planning."
6. **Resolve open questions** -- if the brainstorm has unresolved questions, use **AskUserQuestion tool** to resolve each one before proceeding
7. **Skip free-form idea refinement** -- the brainstorm already established WHY and WHAT
8. Use brainstorm decisions as input to the research phase

**If multiple brainstorms could match:**
Use **AskUserQuestion tool** to ask which brainstorm to use, or whether to proceed without one.

#### Path C: No Brainstorm (Standalone Planning)

**If no brainstorm found (or not relevant), construct WHY artifacts from scratch:**

**Phase C.1: Idea Refinement Dialogue**

Refine the idea through collaborative dialogue using the **AskUserQuestion tool**:

- Ask questions one at a time to understand the idea fully
- Prefer multiple choice questions when natural options exist
- Focus on understanding: purpose, constraints and success criteria
- Continue until the idea is clear OR user says "proceed"

**Gather signals for research decision.** During refinement, note:

- **User's familiarity**: Do they know the codebase patterns? Are they pointing to examples?
- **User's intent**: Speed vs thoroughness? Exploration vs execution?
- **Topic risk**: Security, payments, external APIs warrant more caution
- **Uncertainty level**: Is the approach clear or open-ended?

**Skip option:** If the feature description is already detailed, offer:
"Your description is detailed. Should I proceed with research, or would you like to refine it further?"

**Phase C.2: Synthesize WHY Artifacts (mandatory before research)**

After idea refinement, before proceeding to research, synthesize the plan's WHY anchor. This is lighter than a full brainstorm but still establishes the foundation that all downstream phases need:

**Problem Narrative** (2-4 sentences):
Synthesize: who has the problem, what triggers it, what the impact is. Not a restatement of the feature request -- a narrative about why this matters.

**User Story:**
```
As a [persona],
I need to [action]
so that [outcome],
because currently [pain point]
which causes [impact].
```

If the feature has multiple personas or use cases, construct the primary user story plus brief secondary stories.

**Architectural Context** (rough -- research will refine):
- **Likely lives in:** [best guess of service/module/layer]
- **Likely interacts with:** [neighboring systems]
- **Entry point:** [UI/API/CLI/event]

This is a hypothesis -- the research phase (Step 1) will validate or correct it.

**Success Criteria** (3-5 measurable outcomes):
Tied to the user story's "so that" clause, not just technical correctness. How will a real user know this works?

Use **AskUserQuestion tool** to present the synthesized WHY artifacts and ask: "Here's my understanding of WHY we're building this. Does this capture it correctly, or should I adjust anything?"

Revise based on feedback before proceeding.

### 0.5 Gather Project Inputs

Use the **AskUserQuestion tool** to collect structured project inputs. Ask these 4 questions in sequence:

**Question 1:** "Do you have any project management tickets related to this feature?"
- Options: `["None", "Enter URLs"]`
- If "Enter URLs": Ask user to paste ticket URLs (comma-separated)

**Question 2:** "Do you have any wiki or documentation pages related to this feature?"
- Options: `["None", "Enter URLs"]`
- If "Enter URLs": Ask user to paste documentation URLs (comma-separated)

**Question 3:** "Do you have any Figma designs related to this feature?"
- Options: `["None", "Enter URLs"]`
- If "Enter URLs": Ask user to paste Figma design URLs (comma-separated)

**Question 4:** "Do you have any existing plan, spec, or requirements documents (.md files) to build from?"
- Options: `["None", "Enter file paths"]`
- If "Enter file paths": Ask user to paste file paths (comma-separated, relative or absolute)

**Processing inputs:**

For any non-empty inputs, launch **parallel subagents** to fetch and summarize each document:

- For helper subagents in this step (`fetch-and-summarize`, `read-and-extract`), define the full extraction contract in the prompt itself. Do not rely on implicit behavior, hidden defaults, or platform-specific assumptions.

- Task fetch-and-summarize(ticket_urls) → Extract ticket title, description, acceptance criteria, status
- Task fetch-and-summarize(doc_urls) → Extract key decisions, requirements, technical context
- Task fetch-and-summarize(figma_urls) → Extract design intent, component structure, interaction patterns
- Task read-and-extract(plan_file_paths) → Read each `.md` file, extract structure (title, problem statement, approach, tasks, acceptance criteria, open questions). Identify which sections are well-defined vs need enrichment.

**Handle `MANUAL_INPUT_NEEDED`:** If a subagent cannot access a URL (authentication required, private resource), use the **AskUserQuestion tool** to ask: "I couldn't access [URL]. Could you paste the relevant content from this document?"

**Consolidate into `project_context` block:**

```markdown
## Project Context (from structured inputs)

### Project Tickets
- [TICKET-123](url): Summary of ticket...

### Documentation
- [Doc Title](url): Key decisions and requirements...

### Figma Designs
- [Design Name](url): Design intent and component overview...

### Existing Plans / Specs
- [filename.md](path): Structure summary, well-defined sections, gaps to fill...
```

**Store source URLs/paths in plan frontmatter** under `source_docs:`:

```yaml
source_docs:
  tickets:
    - https://tracker.example.com/TICKET-123
  docs:
    - https://wiki.example.com/pages/doc-id
  figma:
    - https://figma.com/file/abc123
  plans:
    - docs/specs/existing-feature-spec.md
```

If all three inputs are "None", skip this step and proceed.

## Main Tasks

### 1. Local Research (Always Runs - Parallel)

<thinking>
First, I need to understand the project's conventions, existing patterns, and any documented learnings. This is fast and local - it informs whether external research is needed.
</thinking>

Run these agents **in parallel** to gather local context:

Before dispatching any named agent below, apply the shared `Named Agent Dispatch` protocol in `commands/workflows/references/orchestration-protocol.md`.

- Task repo-research-analyst(feature_description)
- Task learnings-researcher(feature_description)

**What to look for:**
- **Repo research:** existing patterns, CLAUDE.md guidance, technology familiarity, pattern consistency
- **Learnings:** documented solutions in `docs/solutions/` that might apply (gotchas, patterns, lessons learned)

These findings inform the next step.

### 1.5. Research Decision

Based on signals from Step 0 and findings from Step 1, decide on external research.

**High-risk topics → always research.** Security, payments, external APIs, data privacy. The cost of missing something is too high. This takes precedence over speed signals.

**Strong local context → skip external research.** Codebase has good patterns, CLAUDE.md has guidance, user knows what they want. External research adds little value.

**Uncertainty or unfamiliar territory → research.** User is exploring, codebase has no examples, new technology. External perspective is valuable.

**Announce the decision and proceed.** Brief explanation, then continue. User can redirect if needed.

Examples:
- "Your codebase has solid patterns for this. Proceeding without external research."
- "This involves payment processing, so I'll research current best practices first."

### 1.5b. External Research (Conditional)

**Only run if Step 1.5 indicates external research is valuable.**

Run these agents in parallel:

Before dispatching any named research agent below, apply the shared `Named Agent Dispatch` protocol in `commands/workflows/references/orchestration-protocol.md`.

- Task best-practices-researcher(feature_description)
- Task framework-docs-researcher(feature_description)

### 1.6. Consolidate Research & Validate WHY Artifacts

After all research steps complete, consolidate findings and validate/refine the WHY artifacts:

**Research findings consolidation:**

- Document relevant file paths from repo research (e.g., `app/Services/ExampleService.php:42`)
- **Include relevant institutional learnings** from `docs/solutions/` (key insights, gotchas to avoid)
- **Include project context** from structured inputs (project tickets, documentation, Figma designs)
- **Include constitution context** from `docs/constitution.md` when present (relevant principles, required approvals, waiver needs)
- Note external documentation URLs and best practices (if external research was done)
- List related issues or PRs discovered
- Capture CLAUDE.md conventions

**Validate and refine WHY artifacts against research:**

Now that we have concrete codebase knowledge, refine the WHY artifacts established in Step 0:

1. **Architectural Context** -- the repo research likely revealed the actual module structure, neighboring services, and data flow patterns. Update the architectural context from hypothesis to grounded fact:
   - Confirm or correct "Lives in" with actual file paths and module structure
   - Confirm or correct "Interacts with" based on discovered dependencies
   - Add data flow specifics from codebase patterns
   - Note any conventions from CLAUDE.md that constrain architecture

2. **Success Criteria** -- check if research uncovered edge cases, existing test patterns, or quality gates that should be added to success criteria

3. **User Story** -- rarely changes from research, but if learnings reveal the problem is different than assumed, flag it: "Research suggests the user story may need adjustment because [finding]."

**Research implications for approach:**

Explicitly state how research findings confirm, challenge, or refine the planned approach relative to the user story. Examples:
- "Codebase already has a similar pattern in `app/Services/AuthService.php` -- we should follow it for consistency, which aligns with the user story because..."
- "Learnings doc warns about [gotcha] -- this affects our approach because..."
- "No existing patterns found for this -- higher risk, may need more tasks for validation."
- "Constitution requires [baseline] -- the plan must make that visible in acceptance criteria or approvals."

**Optional validation:** Briefly summarize the refined WHY artifacts and key research findings, then ask if anything looks off or missing before proceeding to planning.

### 2. Issue Planning & Structure

<thinking>
Think like a product manager -- what would make this issue clear, actionable, and traceable to user outcomes? Every section should connect back to the WHY.
</thinking>

**Title & Categorization:**

- [ ] Draft clear, searchable issue title using conventional format (e.g., `feat: Add user authentication`, `fix: Cart total calculation`)
- [ ] Determine issue type: enhancement, bug, refactor
- [ ] Convert title to filename: add today's date prefix, strip prefix colon, kebab-case, add `-plan` suffix
  - Example: `feat: Add User Authentication` → `2026-01-21-feat-add-user-authentication-plan.md`
  - Keep it descriptive (3-5 words after prefix) so plans are findable by context

**Stakeholder Analysis (grounded in WHY artifacts):**

- [ ] Identify stakeholders from the user story and brainstorm's stakeholder impact (if available)
- [ ] For each stakeholder group, state how this plan addresses their needs:
  - End users: How does this solve the problem stated in the user story?
  - Developers: How does this fit the architectural context? What patterns does it establish?
  - Operations: What are the deployment/monitoring implications?
- [ ] Flag any stakeholder concerns not addressed by the current approach

**Content Planning:**

- [ ] Choose appropriate detail level based on issue complexity and audience
- [ ] List all necessary sections for the chosen template
- [ ] Gather supporting materials (error logs, screenshots, design mockups)
- [ ] Prepare code examples or reproduction steps if applicable, name the mock filenames in the lists

**Phase Decomposition (traced to user story):**

Each implementation phase must state **what aspect of the user story it serves**. This creates a traceable chain:
- User Story → Phase → Tasks → Files

When decomposing into phases:
- **Group by user-facing capability**, not by technical layer. "User can log in" is a phase; "Create database tables" is a task within a phase.
- **Each phase should deliver a testable slice** of the user story where possible
- **Cross-reference success criteria** -- map each success criterion to the phase(s) that deliver it
- **Architectural context informs boundaries** -- use the WHERE map to identify natural phase boundaries (e.g., service boundaries, module boundaries)

**Execution Readiness:**

For plans that will be executed via `/workflows:work`, ensure each implementation task includes:
- **Files:** List of files to create or modify
- **Depends on:** Which other tasks must complete first (or "None")
- **Success criteria:** Testable checkboxes that define "done"
- **Test command:** The exact command to verify the task is complete. Across the plan, these commands must satisfy the plan-level TDD evidence contract.

This structured format enables the `/workflows:work` orchestrator to delegate each task to a focused subagent with clear scope and termination criteria. Plans without this structure will be flagged for refinement before execution begins.

**TDD & Evidence Contract (mandatory):**

- [ ] Use `commands/workflows/references/tdd-evidence-contract.md` as the single source for contract resolution, the `## TDD & Evidence Contract` section shape, Ralph evidence semantics, and approved exceptions
- [ ] Add a `tdd:` frontmatter block to every plan
- [ ] Add a `## TDD & Evidence Contract` section that states the resolved loop and evidence in plain language
- [ ] Default to Ralph-driven `red-green-refactor` with unit + e2e evidence
- [ ] If the plan weakens that default (`mode: standard`, `unit: optional`, `e2e: optional`, or similar), record a justified exception with `scope`, `reason`, and `replacement_evidence`
- [ ] Make it obvious whether each `tdd` field is inherited or plan-specific so downstream phases do not guess

### 3. SpecFlow Analysis (grounded in user story)

After planning the issue structure, run SpecFlow Analyzer to validate the feature specification **against the user story and success criteria**:

Apply the shared `Named Agent Dispatch` protocol from `commands/workflows/references/orchestration-protocol.md` to `spec-flow-analyzer`. Bundled template lookup still comes first, OpenViking/global context is last-resort only, and dispatch is forbidden unless you can quote the first non-empty line of the loaded template.

- Task spec-flow-analyzer(feature_description, user_story, success_criteria, research_findings)

The SpecFlow Analyzer should evaluate:
- Do the planned phases cover all aspects of the user story?
- Are there user flows implied by the user story that the plan doesn't address?
- Do edge cases threaten any of the success criteria?
- Are there gaps between what the user needs (story) and what the plan delivers (tasks)?

**SpecFlow Analyzer Output:**

- [ ] Review SpecFlow analysis results
- [ ] Incorporate any identified gaps or edge cases into the issue
- [ ] Update acceptance criteria based on SpecFlow findings
- [ ] **Flag any flows that don't trace back to the user story** -- these may be scope creep or may reveal a gap in the user story itself

### 4. Choose Implementation Detail Level

**Important for `/workflows:work` compatibility:** All detail levels can be executed, but the MORE and A LOT levels produce plans with structured execution chunks (per-task success criteria, test commands, file lists) that enable the subagent orchestration model in `/workflows:work`. MINIMAL plans work but may require the orchestrator to decompose tasks further before delegating to subagents.

**All detail levels include WHY sections.** The Problem Narrative, User Story, Architectural Context, and Success Criteria are mandatory at every level -- they are the contract that downstream phases depend on. The difference between levels is how much implementation detail surrounds them.

Select how comprehensive you want the issue to be, simpler is mostly better.

#### 📄 MINIMAL (Quick Issue)

**Best for:** Simple bugs, small improvements, clear features

**Includes:**

- WHY anchor (problem narrative, user story, arch context, success criteria) -- brief
- Basic acceptance criteria
- Essential context only

**Note:** MINIMAL plans may need to be enriched with per-task success criteria before running `/workflows:work`. The orchestrator can handle this decomposition automatically, but providing structured tasks up front leads to more predictable execution.

**Structure:**

````markdown
---
title: [Issue Title]
type: [feat|fix|refactor]
status: active
date: YYYY-MM-DD
constitution_version: [version from docs/constitution.md, or null]
constitution_waivers: []
brainstorm_ref: [path to brainstorm doc, or null]
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
  mode: inherit # inherit | ralph | standard
  loop: inherit # inherit | red-green-refactor | implementation-first
  evidence:
    unit: inherit # inherit | required | optional
    e2e: inherit # inherit | required | optional
  exceptions: [] # [{ scope, reason, replacement_evidence }]
---

# [Issue Title]

## Problem Narrative

[2-4 sentences: who has the problem, what triggers it, what the impact is.
Carried forward from brainstorm or constructed in Step 0.]

## User Story

As a [persona],
I need to [action]
so that [outcome],
because currently [pain point]
which causes [impact].

## Architectural Context

- **Lives in:** [service/module/layer -- with actual file paths from research]
- **Interacts with:** [neighboring systems/modules]
- **Entry point:** [UI/API/CLI/event]

## Success Criteria

- [ ] [Measurable outcome tied to user story's "so that"]
- [ ] [Observable behavior proving the problem is solved]

## TDD & Evidence Contract

Use the exact section shape from `commands/workflows/references/tdd-evidence-contract.md` with the resolved values for this plan. Do not omit any bullet, and make every deviation explicit with `replacement_evidence`.

## Constitution Alignment

- **Relevant principles:** [Project rules that apply to this work]
- **Required approvals:** [Any approvals mandated by the constitution]
- **Waivers:** [None, or explicit approved exceptions]

## Implementation

[Brief description of what to build and how]

## References

- Related issue: #[issue_number]
- Documentation: [relevant_docs_url]
````

#### 📋 MORE (Standard Issue)

**Best for:** Most features, complex bugs, team collaboration

**Includes everything from MINIMAL plus:**

- Detailed background and motivation
- Technical considerations
- Phased implementation with story tracing
- Success metrics
- Dependencies and risks

**Structure:**

```markdown
---
title: [Issue Title]
type: [feat|fix|refactor]
status: active
date: YYYY-MM-DD
constitution_version: [version from docs/constitution.md, or null]
constitution_waivers: []
brainstorm_ref: [path to brainstorm doc, or null]
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
  mode: inherit # inherit | ralph | standard
  loop: inherit # inherit | red-green-refactor | implementation-first
  evidence:
    unit: inherit # inherit | required | optional
    e2e: inherit # inherit | required | optional
  exceptions: [] # [{ scope, reason, replacement_evidence }]
---

# [Issue Title]

## Problem Narrative

[The synthesized problem statement. WHY we're building this.
2-4 sentences: who has the problem, what triggers it, what the impact is.]

## User Story

As a [persona],
I need to [action]
so that [outcome],
because currently [pain point]
which causes [impact].

## Architectural Context

- **Lives in:** [service/module/layer -- grounded in repo research]
- **Interacts with:** [neighboring systems/modules with file paths]
- **Entry point:** [UI/API/CLI/event]
- **Data:** [what data flows, where it lives]
- **Dependencies:** [what this depends on, what may depend on it]
- **Conventions:** [relevant CLAUDE.md or project conventions]

## Success Criteria

- [ ] [Measurable outcome 1 -- tied to user story's "so that"]
- [ ] [Measurable outcome 2 -- observable behavior]
- [ ] [Measurable outcome 3 -- proving the problem is solved]

## TDD & Evidence Contract

Use the exact section shape from `commands/workflows/references/tdd-evidence-contract.md` with the resolved values for this plan. Do not omit any bullet, and make every deviation explicit with `replacement_evidence`.

## Constitution Alignment

- **Relevant principles:** [Project rules that apply to this work]
- **Applicable baselines:** [Testing, security, docs, operations, portability, etc.]
- **Required approvals:** [Any approvals mandated by the constitution]
- **Waivers:** [None, or explicit approved exceptions]

## Overview

[Comprehensive description of what we're building and the chosen approach]

## Technical Considerations

- Architecture impacts
- Performance implications
- Security considerations

## Implementation Phases

#### Phase 1: [Phase Name]
**Serves:** [Which aspect of the user story / which success criterion this phase delivers]

##### Task 1.1: [Task Name]
**Files:** `path/to/file1.php`, `path/to/file2.php`
**Depends on:** None
**Success criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
**Test command:** `<project-appropriate test command>`

##### Task 1.2: [Task Name]
**Files:** `path/to/file3.php`
**Depends on:** Task 1.1
**Success criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
**Test command:** `<project-appropriate test command>`

#### Phase 2: [Phase Name]
**Serves:** [Which aspect of the user story / which success criterion this phase delivers]

##### Task 2.1: [Task Name]
**Files:** `path/to/file4.php`
**Depends on:** Task 1.2
**Success criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
**Test command:** `<project-appropriate test command>`

## Acceptance Criteria

- [ ] Detailed requirement 1
- [ ] Detailed requirement 2
- [ ] Testing requirements

## Success Metrics

[How we measure success -- tied to the user story and problem narrative]

## Dependencies & Risks

[What could block or complicate this]

## References & Research

- Similar implementations: [file_path:line_number]
- Best practices: [documentation_url]
- Related PRs: #[pr_number]
```

#### 📚 A LOT (Comprehensive Issue)

**Best for:** Major features, architectural changes, complex integrations

**Includes everything from MORE plus:**

- Detailed implementation plan with phases
- Alternative approaches considered (traced to user story)
- Extensive technical specifications
- Resource requirements and timeline
- Future considerations and extensibility
- Risk mitigation strategies
- Documentation requirements

**Structure:**

```markdown
---
title: [Issue Title]
type: [feat|fix|refactor]
status: active
date: YYYY-MM-DD
constitution_version: [version from docs/constitution.md, or null]
constitution_waivers: []
brainstorm_ref: [path to brainstorm doc, or null]
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
  mode: inherit # inherit | ralph | standard
  loop: inherit # inherit | red-green-refactor | implementation-first
  evidence:
    unit: inherit # inherit | required | optional
    e2e: inherit # inherit | required | optional
  exceptions: [] # [{ scope, reason, replacement_evidence }]
---

# [Issue Title]

## Problem Narrative

[Detailed problem analysis. WHY we're building this.
Who has the problem, what triggers it, what the impact is, and what happens if we don't solve it.]

## User Story

As a [persona],
I need to [action]
so that [outcome],
because currently [pain point]
which causes [impact].

### Secondary Stories (if applicable)

As a [persona 2], I need to [action] so that [outcome].

## Architectural Context

- **Lives in:** [service/module/layer -- grounded in repo research with file paths]
- **Interacts with:** [neighboring systems/modules with specific integration points]
- **Entry point:** [UI/API/CLI/event -- specific routes, components, or endpoints]
- **Data:** [what data flows, where it lives, schema implications]
- **Dependencies:** [what this depends on, what may depend on it]
- **Conventions:** [relevant CLAUDE.md or project conventions]
- **Boundary constraints:** [what this should NOT touch or change]

## Success Criteria

- [ ] [Measurable outcome 1 -- tied to user story]
- [ ] [Measurable outcome 2 -- observable behavior]
- [ ] [Measurable outcome 3 -- proving the problem is solved]
- [ ] [Non-functional: performance target]
- [ ] [Non-functional: security requirement]

## TDD & Evidence Contract

Use the exact section shape from `commands/workflows/references/tdd-evidence-contract.md` with the resolved values for this plan. Do not omit any bullet, and make every deviation explicit with `replacement_evidence`.

## Constitution Alignment

- **Relevant principles:** [Project rules that apply to this work]
- **Applicable baselines:** [Testing, security, docs, operations, portability, etc.]
- **Required approvals:** [Any approvals mandated by the constitution]
- **Waivers:** [None, or explicit approved exceptions]

## Stakeholder Impact

- **End users:** [How their experience changes -- from user story]
- **Developers:** [How this affects the codebase -- from architectural context]
- **Operations:** [Deployment, monitoring, infrastructure impact]
- **Business:** [Revenue, cost, compliance, timeline impact]

## Overview

[Executive summary of what we're building, the chosen approach, and why this approach best serves the user story]

## Proposed Solution

[Comprehensive solution design]

## Technical Approach

### Architecture

[Detailed technical design, grounded in the architectural context map]

### Implementation Phases

#### Phase 1: [Foundation]
**Serves:** [Which aspect of the user story / which success criteria this phase delivers]
**Rationale:** [Why this phase comes first -- what it enables for subsequent phases]

##### Task 1.1: [Task Name]
**Files:** `path/to/file1.php`, `path/to/file2.php`
**Depends on:** None
**Success criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
**Test command:** `<project-appropriate test command>`

##### Task 1.2: [Task Name]
**Files:** `path/to/file3.php`
**Depends on:** Task 1.1
**Success criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
**Test command:** `<project-appropriate test command>`

#### Phase 2: [Core Implementation]
**Serves:** [Which aspect of the user story / which success criteria this phase delivers]
**Rationale:** [Why this phase order -- what it builds on from Phase 1]

##### Task 2.1: [Task Name]
**Files:** `path/to/file4.php`, `path/to/file5.php`
**Depends on:** Task 1.2
**Success criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
**Test command:** `<project-appropriate test command>`

##### Task 2.2: [Task Name]
**Files:** `path/to/file6.php`
**Depends on:** Task 2.1
**Success criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
**Test command:** `<project-appropriate test command>`

#### Phase 3: [Polish & Optimization]
**Serves:** [Which success criteria / quality aspects this phase delivers]

##### Task 3.1: [Task Name]
**Files:** `path/to/file7.php`
**Depends on:** Task 2.2
**Success criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
**Test command:** `<project-appropriate test command>`

### Phase-to-Story Traceability

| Success Criterion | Delivered by Phase(s) | Key Tasks |
|---|---|---|
| [Criterion 1 from Success Criteria] | Phase 1, Phase 2 | Task 1.1, Task 2.1 |
| [Criterion 2 from Success Criteria] | Phase 2 | Task 2.1, Task 2.2 |

## Alternative Approaches Considered

[Other solutions evaluated and why rejected -- **relative to the user story and success criteria**, not just technical tradeoffs]

## Acceptance Criteria

### Functional Requirements

- [ ] Detailed functional criteria

### Non-Functional Requirements

- [ ] Performance targets
- [ ] Security requirements
- [ ] Accessibility standards

### Quality Gates

- [ ] Unit + e2e evidence captured, or a justified exception with replacement evidence
- [ ] Documentation completeness
- [ ] Code review approval

## Success Metrics

[Detailed KPIs and measurement methods -- tied to user story outcomes]

## Dependencies & Prerequisites

[Detailed dependency analysis]

## Risk Analysis & Mitigation

[Comprehensive risk assessment -- including risks to delivering the user story, not just technical risks]

## Resource Requirements

[Team, time, infrastructure needs]

## Future Considerations

[Extensibility and long-term vision]

## Documentation Plan

[What docs need updating]

## References & Research

### Internal References

- Architecture decisions: [file_path:line_number]
- Similar features: [file_path:line_number]
- Configuration: [file_path:line_number]

### External References

- Framework documentation: [url]
- Best practices guide: [url]
- Industry standards: [url]

### Related Work

- Previous PRs: #[pr_numbers]
- Related issues: #[issue_numbers]
- Design documents: [links]
```

### 5. Issue Creation & Formatting

<thinking>
Apply best practices for clarity and actionability, making the issue easy to scan and understand
</thinking>

**Content Formatting:**

- [ ] Use clear, descriptive headings with proper hierarchy (##, ###)
- [ ] Include code examples in triple backticks with language syntax highlighting
- [ ] Add screenshots/mockups if UI-related (drag & drop or use image hosting)
- [ ] Use task lists (- [ ]) for trackable items that can be checked off
- [ ] Add collapsible sections for lengthy logs or optional details using `<details>` tags
- [ ] Apply appropriate emoji for visual scanning (🐛 bug, ✨ feature, 📚 docs, ♻️ refactor)

**Cross-Referencing:**

- [ ] Link to related issues/PRs using #number format
- [ ] Reference specific commits with SHA hashes when relevant
- [ ] Link to code using permalink features (branch + commit SHA for permanent links)
- [ ] Mention relevant team members with @username if needed
- [ ] Add links to external resources with descriptive text

**Code & Examples:**

````markdown
# Good example with syntax highlighting and line references


```php
// app/Services/UserService.php:42
public function processUser(User $user): array
{
    // Implementation here
}
```

# Collapsible error logs

<details>
<summary>Full error stacktrace</summary>

`Error details here...`

</details>
````

**AI-Era Considerations:**

- [ ] Account for accelerated development with AI pair programming
- [ ] Include prompts or instructions that worked well during research
- [ ] Note which AI tools were used for initial exploration (Claude, Copilot, etc.)
- [ ] Emphasize comprehensive testing given rapid implementation
- [ ] Document any AI-generated code that needs human review

### 6. Final Review & Submission

**Pre-submission Checklist:**

**WHY Integrity:**

- [ ] Problem Narrative accurately captures who has the problem and why it matters
- [ ] User Story is complete (persona, action, outcome, pain point, impact)
- [ ] Architectural Context is grounded in actual repo research (not hypothetical)
- [ ] Success Criteria are tied to user outcomes, not just technical checkboxes
- [ ] If `docs/constitution.md` exists, Constitution Alignment names the applicable rules, approvals, and any waivers explicitly
- [ ] Every implementation phase states which user story aspect / success criterion it serves
- [ ] `handoff` frontmatter fields are all `true`
- [ ] `tdd` frontmatter is present and the precedence rule is explicit
- [ ] `## TDD & Evidence Contract` names the effective loop, required evidence, and any justified exceptions

**Content Quality:**

- [ ] Title is searchable and descriptive
- [ ] Labels accurately categorize the issue
- [ ] All template sections are complete
- [ ] Links and references are working
- [ ] Acceptance criteria are measurable
- [ ] Add names of files in pseudo code examples and todo lists
- [ ] Add an ERD mermaid diagram if applicable for new model changes

**Execution Readiness (for `/workflows:work`):**

- [ ] Each task has: Files, Depends on, Success criteria, Test command
- [ ] Task success criteria are testable (not vague)
- [ ] Dependencies between tasks are explicit
- [ ] Architectural context is specific enough to fill `{{ARCHITECTURAL_CONTEXT}}` in execution agent prompts
- [ ] The plan declares unit + e2e evidence by default, or records a justified exception with replacement evidence
- [ ] Task test commands collectively satisfy the resolved TDD contract

## Directory Setup & Gitignore

Before writing the plan file, ensure the output directory and gitignore rules exist:

```bash
# Create docs/plans/ directory if it doesn't exist
mkdir -p docs/plans

# Ensure docs/plans/ and docs/brainstorms/ are in .gitignore (but NOT docs/solutions/)
if [ -f .gitignore ]; then
  grep -qxF 'docs/plans/' .gitignore || echo 'docs/plans/' >> .gitignore
  grep -qxF 'docs/brainstorms/' .gitignore || echo 'docs/brainstorms/' >> .gitignore
else
  printf 'docs/plans/\ndocs/brainstorms/\n' > .gitignore
fi
```

**IMPORTANT:** `docs/solutions/` must NOT be added to .gitignore -- it contains committed institutional knowledge.

## Output Format

**Filename:** Use the date and kebab-case filename from Step 2 Title & Categorization.

```
docs/plans/YYYY-MM-DD-<type>-<descriptive-name>-plan.md
```

Examples:
- ✅ `docs/plans/2026-01-15-feat-user-authentication-flow-plan.md`
- ✅ `docs/plans/2026-02-03-fix-checkout-race-condition-plan.md`
- ✅ `docs/plans/2026-03-10-refactor-api-client-extraction-plan.md`
- ❌ `docs/plans/2026-01-15-feat-thing-plan.md` (not descriptive - what "thing"?)
- ❌ `docs/plans/2026-01-15-feat-new-feature-plan.md` (too vague - what feature?)
- ❌ `docs/plans/2026-01-15-feat: user auth-plan.md` (invalid characters - colon and space)
- ❌ `docs/plans/feat-user-auth-plan.md` (missing date prefix)

## Post-Generation Options

After writing the plan file, use the **AskUserQuestion tool** to present these options:

**Question:** "Plan ready at `docs/plans/YYYY-MM-DD-<type>-<name>-plan.md`. What would you like to do next?"

**Options:**
1. **Open plan in editor** - Open the plan file for review
2. **Run `/workflows:architecture`** - Create the dedicated architecture improvement artifact in `docs/architecture/` and record the handoff contract
3. **Run `/deepen-plan`** - Enhance each section with architecture guidance plus parallel research agents after the architecture handoff is explicit
4. **Review and refine** - Improve the document through structured self-review
5. **Start `/workflows:work`** - Begin implementing this plan locally once the architecture handoff is explicit
6. **Start `/workflows:work` on remote** - Begin implementing in Claude Code on the web once the architecture handoff is explicit (use `&` to run in background)
7. **Create Issue** - Create issue in project tracker

Based on selection:
- **Open plan in editor** → Run `open docs/plans/<plan_filename>.md` to open the file in the user's default editor
- **`/workflows:architecture`** → Call the /workflows:architecture command with the plan file path
- **`/deepen-plan`** → Call the /deepen-plan command with the plan file path only after architecture improvement is complete and `architecture_ref` or a labeled handoff artifact has been recorded
- **Review and refine** → Load `document-review` skill.
- **`/workflows:work`** → Call the /workflows:work command with the plan file path once the architecture artifact or explicit architecture handoff contract is available
- **`/workflows:work` on remote** → Run `/workflows:work docs/plans/<plan_filename>.md &` after the architecture handoff is explicit so execution agents do not guess at boundaries
- **Create Issue** → See "Issue Creation" section below
- **Other** (automatically provided) → Accept free text for rework or specific changes

**Note:** If running `/workflows:plan` with ultrathink enabled, automatically run `/workflows:architecture` and then `/deepen-plan` after plan creation for maximum depth and grounding.

Loop back to options after Simplify or Other changes until user selects `/workflows:work`.

## Issue Creation

When user selects "Create Issue":

1. **Save the plan as a tracker-ready description:**

   The plan file is already in markdown format. Inform the user:
   - "Plan saved at `[plan_path]`. You can create a ticket using the plan content."
   - Copy the plan content to clipboard if possible, or point to the file path

2. **After creation:**
   - Ask if they want to proceed to `/workflows:architecture`, then `/deepen-plan`, or `/workflows:work` once the architecture handoff is explicit

## Downstream Phase Integration

The plan document is a structured contract consumed by all downstream phases. Here's how each phase uses it:

**`/workflows:architecture`** reads:
- Problem Narrative, User Story, Success Criteria, and Architectural Context -- the WHY/WHERE contract it must preserve
- Implementation phases and tasks -- identifies the deepening candidates that need structural clarification
- Constitution Alignment / waivers / brainstorm decisions -- keeps architecture decisions inside approved project guardrails
- **Must write**: a dedicated artifact in `docs/architecture/` plus an `architecture_ref` back into the plan

**`/deepen-plan`** reads:
- Implementation phases and tasks -- enriches each with parallel research (best practices, performance, UI patterns)
- Success criteria -- validates they are testable and complete
- Architectural Context -- uses it to ground research in the right part of the system
- `tdd` frontmatter and `## TDD & Evidence Contract` -- preserves the effective Ralph/default loop, evidence requirements, and any justified exceptions
- `architecture_ref` or the latest matching `docs/architecture/` artifact -- uses deepening candidates, deletion-test decisions, interface test surfaces, seams, adapters, and contracts to guide hardening
- **Must preserve**: Problem Narrative, User Story, and handoff contract unchanged

**`/workflows:work`** reads:
- **Problem Narrative & User Story** -- the orchestrator uses these to validate task outcomes make sense in context, not just pass tests
- **Architectural Context** -- feeds directly into `{{ARCHITECTURAL_CONTEXT}}` in each execution agent's prompt. This is WHY grounded arch context matters -- every subagent gets system-level awareness
- **`architecture_ref` / `docs/architecture/` artifact / explicit architecture handoff contract** -- feeds deletion-test decisions, interfaces as test surfaces, seams, adapters, and contracts into execution so subagents do not invent structure ad hoc
- **`tdd` frontmatter + `## TDD & Evidence Contract`** -- plan-level values win; `inherit` falls back to `compound-engineering.local.md`; if neither exists, execution should assume Ralph-driven unit + e2e evidence
- **Implementation phases & tasks** -- the execution chunk structure (Files, Depends on, Success criteria, Test command)
- **Success Criteria** -- the orchestrator checks final outcomes against these, not just individual task passes
- **`constitution_version` / `constitution_waivers` / Constitution Alignment** -- the execution phase enforces repo-wide guardrails and knows which exceptions were approved
- **`brainstorm_ref`** -- if present, the orchestrator can read the original brainstorm for additional context

**`/workflows:review`** reads:
- **Problem Narrative & User Story** -- the frame for evaluating whether the implementation solves the right problem
- **Success Criteria** -- the measurable outcomes that the review should verify
- **Architectural Context** -- used to evaluate whether the implementation respects system boundaries and integration points
- **`architecture_ref` / `docs/architecture/` artifact / explicit architecture handoff contract** -- supplies the architecture intent, deletion-test outcomes, interfaces, seams, adapters, and contracts that reviewers must verify or flag as drift
- **`tdd` frontmatter + `## TDD & Evidence Contract`** -- review must verify the declared evidence exists and that any deviation from Ralph/unit+e2e is explicitly justified
- **Constitution Alignment and waivers** -- used to distinguish approved exceptions from blocking constitution violations
- **Stakeholder Impact** (A LOT level) -- informs stakeholder-perspective review

NEVER CODE! Just research and write the plan.
