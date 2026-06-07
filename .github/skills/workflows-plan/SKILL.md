---
name: workflows-plan
description: Transform feature descriptions into structured project plans anchored to user story, architectural context, and success criteria from brainstorm (or constructed fresh when no brainstorm exists)
---

## Arguments
[feature description, bug report, or improvement idea]

# Create a plan for a new feature or bug fix

## Introduction

**Note: The current year is 2026.** Use this when dating plans and searching for recent documentation.

Transform feature descriptions, bug reports, or improvement ideas into well-structured, execution-ready plans that:
1. **Anchor to WHY** -- every plan traces back to a user story and problem narrative
2. **Map WHERE** -- architectural context grounds slice decomposition in the system's structure
3. **Define DONE** -- success criteria tied to user outcomes, not just technical checkboxes
4. **Honor project guardrails** -- constitution principles, baselines, and approval rules are made explicit
5. **Make TDD explicit** -- the plan declares the Ralph/default loop, required unit + e2e evidence, and any justified exceptions
6. **Choose the right execution shape** -- vertical slices are the default, but infra tracks and fix batches are valid when they fit the real work better
7. **Enable architecture-first execution** -- `/workflows-architecture` turns the plan into a dedicated architecture artifact before `/deepen-plan`, `/workflows-work`, and `/workflows-review` harden or execute it
8. **Favor simplest viable architecture** -- default to the least-complex design that satisfies the user story and success criteria; only add complexity when research-backed and explicitly justified

Plans consume the project constitution from `/workflows-constitution` when available, plus lynchpin artifacts from `/workflows-brainstorm` when available, or construct feature context fresh when running standalone. Either way, the plan document carries forward the WHY, WHERE, DONE, GUARDRAIL, TDD, and **execution shape** contract that all downstream phases depend on. After the plan is written, the next explicit step is `/workflows-architecture`, not direct deepening.

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
   - a constitution amendment to be handled by `/workflows-constitution`

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
- **Shared source of truth:** Reuse `references/tdd-evidence-contract.md` for contract resolution, the `## TDD & Evidence Contract` section shape, Ralph evidence semantics, and exception handling.

#### Execution Shape Baseline (Runs Before Path A/B/C)

Use `references/execution-shape.md` as the single source for choosing and documenting the execution shape.
When the chosen mode is `vertical-slices`, also apply `references/vertical-slice-architecture.md` as the source of truth for feature-home naming, shared/global placement, and context-tier language.

- **Default mode:** `vertical-slices`
- **Allowed overrides:** `infra-track`, `fix-batch`
- **Override rule:** Any non-default mode must include a short rationale in frontmatter and in the plan body
- **Anti-coercion rule:** Do not force work into slices if that would create fake end-to-end structure

#### Simplicity Baseline (Runs Before Path A/B/C)

- **Default posture:** choose the simplest plan that can honestly meet the user story and success criteria
- **No speculative architecture:** avoid pre-emptive abstractions, framework migrations, or broad foundation work unless required now
- **Complexity gate:** if adding complexity, add a short "Complexity Justification" note with:
  - why simpler options are insufficient
  - what risk/requirement this complexity addresses
  - why deferring it would be harmful
- **Defer by default:** if complexity is useful but not required for current success criteria, place it in Future Considerations instead of core execution packets

#### Path A: Spec/Plan File Provided

**Check if arguments contain a plan or spec file:**

If the feature description (`#$ARGUMENTS`) is or contains a path to a `.md` file (e.g., `docs/plans/some-plan.md`, `spec.md`, `~/notes/feature-plan.md`):

1. Read the file
2. Announce: "Found existing plan/spec: `[file path]`. Using as foundation."
3. Extract: title, problem statement, proposed approach, acceptance criteria, execution shape (if any), and any existing execution units
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

In Step 2 (Issue Planning), **build upon the existing plan structure** -- preserve its sections, fill gaps, add the execution-shape contract and execution-readiness fields to any legacy execution units that lack them, and enrich with research findings. Do NOT discard or rewrite sections that are already well-defined.

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
   - **User Story** -- the north star (carry forward, plan slices must trace to this)
   - **Architectural Context** -- the WHERE map (feeds `{{ARCHITECTURAL_CONTEXT}}` in work.md)
   - **Success Criteria** -- the DONE definition (plan acceptance criteria must include these)
   - **Stakeholder Impact** -- who is affected (informs stakeholder analysis)
   - **Chosen Approach** and **Key Decisions** -- the WHAT (informs slice decomposition)
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

- Use the fetch-and-summarize skill to: ticket_urls → Extract ticket title, description, acceptance criteria, status
- Use the fetch-and-summarize skill to: doc_urls → Extract key decisions, requirements, technical context
- Use the fetch-and-summarize skill to: figma_urls → Extract design intent, component structure, interaction patterns
- Use the read-and-extract skill to: plan_file_paths → Read each `.md` file, extract structure (title, problem statement, approach, tasks, acceptance criteria, open questions). Identify which sections are well-defined vs need enrichment.

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

Before dispatching any named agent below, apply the shared `Named Agent Dispatch` protocol in `references/orchestration-protocol.md`.

- Use the repo-research-analyst skill to: feature_description
- Use the learnings-researcher skill to: feature_description

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

Before dispatching any named research agent below, apply the shared `Named Agent Dispatch` protocol in `references/orchestration-protocol.md`.

- Use the best-practices-researcher skill to: feature_description
- Use the framework-docs-researcher skill to: feature_description

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
- "No existing patterns found for this -- higher risk, may need more slices for validation."
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

- [ ] Use the adaptive template spine first; add optional sections only when they change decisions
- [ ] Keep architecture minimal by default; include only components required to meet current success criteria
- [ ] Record omitted optional sections only when their absence needs explicit callout
- [ ] Gather supporting materials (error logs, screenshots, design mockups)
- [ ] Prepare code examples or reproduction steps if applicable, name the mock filenames in the lists

**Execution Shape Selection (traced to user story):**

Use `references/execution-shape.md` as the source of truth for selecting and documenting the plan's execution shape.
When the mode is `vertical-slices`, also use `references/vertical-slice-architecture.md`.

Default to **`vertical-slices`**:
- User Story → Phase/Track (optional grouping) → Slice → Files
- Start with the thinnest tracer bullet
- Slice vertically across layers when needed
- Name the feature home each slice primarily changes
- Treat phases as wrappers, not executable units
- Forbid horizontal slice titles unless they still produce a demoable outcome

Switch only when that default would be fake:
- **`infra-track`** for enabling/foundation work with no honest user-visible tracer bullet yet
- **`fix-batch`** for a batch of small mostly independent fixes

Every plan must record:
- `execution_shape.mode`
- `execution_shape.rationale` (required when mode is not `vertical-slices`)
- A matching `## Execution Shape` section in the body

**Execution Readiness:**

For plans that will be executed via `/workflows-work`, the plan must include the packet section required by the selected mode:
- `## Execution Slices`
- `## Infrastructure Work Packets`
- `## Fix Batch Items`

Each packet must include the fields defined in `references/execution-shape.md`. Plans without a declared shape and packet structure will be flagged for refinement before execution begins.
For `vertical-slices`, every packet must also name the feature home and stay honest about which supporting code remains shared/global.

**TDD & Evidence Contract (mandatory):**

- [ ] Use `references/tdd-evidence-contract.md` as the single source for contract resolution, the `## TDD & Evidence Contract` section shape, Ralph evidence semantics, and approved exceptions
- [ ] Add a `tdd:` frontmatter block to every plan
- [ ] Add a `## TDD & Evidence Contract` section that states the resolved loop and evidence in plain language
- [ ] Default to Ralph-driven `red-green-refactor` with unit + e2e evidence
- [ ] If the plan weakens that default (`mode: standard`, `unit: optional`, `e2e: optional`, or similar), record a justified exception with `scope`, `reason`, and `replacement_evidence`
- [ ] Make it obvious whether each `tdd` field is inherited or plan-specific so downstream phases do not guess

### 3. SpecFlow Analysis (grounded in user story)

After planning the issue structure, run SpecFlow Analyzer to validate the feature specification **against the user story and success criteria**:

Apply the shared `Named Agent Dispatch` protocol from `references/orchestration-protocol.md` to `spec-flow-analyzer`. Bundled template lookup still comes first, OpenViking/global context is last-resort only, and dispatch is forbidden unless you can quote the first non-empty line of the loaded template.

- Use the spec-flow-analyzer skill to: feature_description, user_story, success_criteria, research_findings

The SpecFlow Analyzer should evaluate:
- Do the planned slices cover all aspects of the user story?
- Are there user flows implied by the user story that the plan doesn't address?
- Do edge cases threaten any of the success criteria?
- Are there gaps between what the user needs (story) and what the plan delivers (slices)?

**SpecFlow Analyzer Output:**

- [ ] Review SpecFlow analysis results
- [ ] Incorporate any identified gaps or edge cases into the issue
- [ ] Update acceptance criteria based on SpecFlow findings
- [ ] **Flag any flows that don't trace back to the user story** -- these may be scope creep or may reveal a gap in the user story itself

### 4. Build One Adaptive Plan Template

**Important for `/workflows-work` compatibility:** Every plan shape must still declare `execution_shape` and include the matching packet section from `references/execution-shape.md`.

**WHY-by-reference rule:** The plan still carries the canonical WHY anchor (`Problem Narrative`, `User Story`, `Architectural Context`, `Success Criteria`), while downstream execution/review/ticket artifacts reference the source path (`brainstorm_ref` or `plan_ref`) plus concise local intent instead of copied WHY prose.

Use one adaptive template. Start with the decision-bearing spine, then include optional sections only when they materially change scope, sequencing, risks, validation, or approvals.

#### Decision-bearing spine (always emit)

- Frontmatter with `handoff`, `tdd`, and `execution_shape`
- `## Problem Narrative`
- `## User Story`
- `## Architectural Context`
- `## Success Criteria`
- `## TDD & Evidence Contract`
- `## Execution Shape`
- `## Constitution Alignment`
- `## Implementation`
- Exactly one execution packet section matching `execution_shape.mode`
- `## References`

#### Optional sections catalog (include only when decision-bearing)

For every optional section below, use this rule:
- **Include only when this section changes a decision**
- **If not needed, omit it entirely (omit if N/A)**

- `## Stakeholder Impact` (when stakeholder trade-offs affect sequencing or approvals)
- `## Technical Considerations` (when architecture/security/performance constraints change implementation choices)
- `## Alternative Approaches Considered` (when rejected options explain why the chosen path is safer or simpler)
- `## Dependencies & Risks` (when external blockers or risk controls affect ordering or go/no-go)
- `## Success Metrics` (when post-release measurement changes acceptance or rollout strategy)
- `## Future Considerations` (when valuable ideas are intentionally deferred to protect current scope)
- `## Complexity Justification` (**required** when adding non-trivial complexity beyond the simplicity baseline)

Never add optional sections as empty placeholders.

#### Adaptive template structure

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
execution_shape:
  mode: vertical-slices # vertical-slices | infra-track | fix-batch
  rationale: ""
---

# [Issue Title]

## Problem Narrative
[2-4 sentences: who has the problem, what triggers it, and the impact.]

## User Story
As a [persona],
I need to [action]
so that [outcome],
because currently [pain point]
which causes [impact].

## Architectural Context
- **Lives in:** [service/module/layer with file paths]
- **Feature home:** [primary namespace/directory]
- **Interacts with:** [neighboring systems/modules]
- **Entry point:** [UI/API/CLI/event]
- **Data:** [only when needed to make decisions]
- **Dependencies:** [only when they affect order/scope]

## Success Criteria
- [ ] [Measurable user outcome tied to the story]
- [ ] [Observable behavior proving the problem is solved]

## TDD & Evidence Contract
Use the exact section shape from `references/tdd-evidence-contract.md` with resolved values for this plan. Make every deviation explicit with `replacement_evidence`.

## Execution Shape
- **Mode:** vertical-slices
- **Why:** [Why this mode matches the real work]

## Constitution Alignment
- **Relevant principles:** [Project rules that apply]
- **Required approvals:** [Any required approvals]
- **Waivers:** [None, or approved exceptions]

## Implementation
[Brief approach summary focused on current scope]

## Execution Slices
Use this section only when `execution_shape.mode` is `vertical-slices`. If mode is `infra-track` or `fix-batch`, replace with the matching packet section from `references/execution-shape.md`.

##### Slice 1.1: [Tracer Bullet Slice Title]
**Slice type:** tracer-bullet
**Serves:** [Which success criterion this slice proves]
**Demo scenario:** [Smallest end-to-end observable behavior]
**Feature home:** `path/to/feature-home/`
**Files:** `path/to/file1.ext`, `path/to/file2.ext`
**Depends on:** None
**Dependency type:** real | stub-available | parallel-safe

###### What to build
[Thin vertical cut]

###### Scope
- **Owns:** [...]
- **Non-goals:** [...]
- **Scope fence:** [...]

###### Acceptance criteria
- [ ] Criterion 1
- [ ] Criterion 2

###### Evidence
- **Test command:** `<project-appropriate test command>`
- **Evidence focus:** [What this proves]

<!-- Optional sections from the catalog go here only when they change decisions; otherwise omit if N/A -->

## References
- Related issue: #[issue_number]
- Documentation: [relevant_docs_url]
````

#### Representative routine plan (compact and scannable)

This example is intentionally short because no optional sections change decisions. It is valid as-is.

```markdown
# fix: normalize webhook retry logging

## Problem Narrative
Retry attempts are logged with inconsistent fields, which makes support triage slow during incidents.

## User Story
As an on-call engineer, I need retry logs to use one schema so that I can filter failures quickly during incidents.

## Success Criteria
- [ ] Every retry log includes `attempt`, `delay_ms`, and `job_id`
- [ ] Support can filter failed retries by `job_id` in one query

## Execution Shape
- **Mode:** vertical-slices
- **Why:** One tracer bullet can prove end-to-end logging normalization.

## Execution Slices
##### Slice 1.1: normalize retry logger fields
**Slice type:** tracer-bullet
**Serves:** success criterion 1 and 2
...
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
- [ ] Every execution slice states which user story aspect / success criterion it serves
- [ ] `handoff` frontmatter fields are all `true`
- [ ] `tdd` frontmatter is present and the precedence rule is explicit
- [ ] `## TDD & Evidence Contract` names the effective loop, required evidence, and any justified exceptions
- [ ] `execution_shape` frontmatter is present and matches the body section
- [ ] Non-default execution shapes include an explicit rationale

**Content Quality:**

- [ ] Title is searchable and descriptive
- [ ] Labels accurately categorize the issue
- [ ] All included sections are complete; omitted optional sections are intentionally omitted
- [ ] Links and references are working
- [ ] Acceptance criteria are measurable
- [ ] Architecture is the simplest viable option for the current user story and success criteria
- [ ] Any added complexity is explicitly justified; non-essential complexity is deferred to Future Considerations
- [ ] Add names of files in pseudo code examples and todo lists
- [ ] Add an ERD mermaid diagram if applicable for new model changes

**Execution Readiness (for `/workflows-work`):**

- [ ] The selected execution shape matches the real work instead of forcing fake verticality
- [ ] The plan includes the packet section required by the selected mode
- [ ] Every packet includes the required fields from `references/execution-shape.md`
- [ ] If mode is `vertical-slices`, every slice names its feature home and stays explicit about what remains shared/global
- [ ] If mode is `vertical-slices`, the first slice is a tracer bullet, not a broad foundation phase
- [ ] If mode is `vertical-slices`, no slice is a disguised horizontal layer bucket unless it still delivers a demoable outcome
- [ ] Packet scope is explicit enough that an executor does not need to infer missing boundaries from adjacent packets
- [ ] Packet success criteria are testable (not vague)
- [ ] Dependencies are explicit wherever ordering matters
- [ ] Architectural context is specific enough to fill `{{ARCHITECTURAL_CONTEXT}}` in execution agent prompts
- [ ] The plan declares unit + e2e evidence by default, or records a justified exception with replacement evidence
- [ ] Validation/test commands collectively satisfy the resolved TDD contract

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
2. **Run `/workflows-architecture`** - Create the dedicated architecture improvement artifact in `docs/architecture/` and record the handoff contract
3. **Run `/deepen-plan`** - Enhance each section with architecture guidance plus parallel research agents after the architecture handoff is explicit
4. **Run `/workflows-to-issues`** - Create local ticket artifacts once the architecture handoff is explicit
5. **Review and refine** - Improve the document through structured self-review
6. **Start `/workflows-work`** - Begin implementing this plan locally once the architecture handoff is explicit
7. **Start `/workflows-work` on remote** - Begin implementing in Claude Code on the web once the architecture handoff is explicit (use `&` to run in background)
8. **Create Issue** - Create issue in project tracker

Based on selection:
- **Open plan in editor** → Run `open docs/plans/<plan_filename>.md` to open the file in the user's default editor
- **`/workflows-architecture`** → Call the /workflows-architecture command with the plan file path
- **`/deepen-plan`** → Call the /deepen-plan command with the plan file path only after architecture improvement is complete and `architecture_ref` or a labeled handoff artifact has been recorded
- **`/workflows-to-issues`** → Call `/workflows-to-issues` with the plan file path after architecture guidance is explicit; recommend this after `/deepen-plan`, but allow it directly after `/workflows-plan` when the user wants earlier backlog shaping
- **Review and refine** → Load the `document-review` skill in **plan** mode against the plan and any linked brainstorm / architecture context already recorded, using concise headless output when this handoff runs non-interactively.
- **`/workflows-work`** → Call the /workflows-work command with the plan file path once the architecture artifact or explicit architecture handoff contract is available
- **`/workflows-work` on remote** → Run `/workflows-work docs/plans/<plan_filename>.md &` after the architecture handoff is explicit so execution agents do not guess at boundaries
- **Create Issue** → See "Issue Creation" section below
- **Other** (automatically provided) → Accept free text for rework or specific changes

**Note:** If running `/workflows-plan` with ultrathink enabled, automatically run `/workflows-architecture` and then `/deepen-plan` after plan creation for maximum depth and grounding.

Loop back to options after Simplify or Other changes until user selects `/workflows-work`.

## Issue Creation

When user selects "Create Issue":

1. **Save the plan as a tracker-ready description:**

   The plan file is already in markdown format. Inform the user:
   - "Plan saved at `[plan_path]`. You can create a ticket using the plan content."
   - Copy the plan content to clipboard if possible, or point to the file path

2. **After creation:**
   - Ask if they want to proceed to `/workflows-architecture`, then `/deepen-plan`, or `/workflows-work` once the architecture handoff is explicit

## Downstream Phase Integration

The plan document is a structured contract consumed by all downstream phases. Here's how each phase uses it:

**`/workflows-architecture`** reads:
- Problem Narrative, User Story, Success Criteria, and Architectural Context -- the WHY/WHERE contract it must preserve
- Execution shape plus execution packets -- identifies the deepening candidates and boundaries that need structural clarification
- `references/vertical-slice-architecture.md` -- supplies the feature-home, shared/global, and context-tier contract
- Constitution Alignment / waivers / brainstorm decisions -- keeps architecture decisions inside approved project guardrails
- **Must write**: a dedicated artifact in `docs/architecture/` plus an `architecture_ref` back into the plan

**`/deepen-plan`** reads:
- Execution shape plus execution packets -- enriches each with parallel research and splits, merges, or reshapes packets when the current mode is weak
- Success criteria -- validates they are testable and complete
- Architectural Context -- uses it to ground research in the right part of the system
- `tdd` frontmatter and `## TDD & Evidence Contract` -- preserves the effective Ralph/default loop, evidence requirements, and any justified exceptions
- `architecture_ref` or the latest matching `docs/architecture/` artifact -- uses deepening candidates, feature homes, shared/global decisions, context tiers, deletion-test decisions, interface test surfaces, seams, adapters, and contracts to guide hardening
- **Must preserve**: Problem Narrative, User Story, and handoff contract unchanged

**`/workflows-to-issues`** reads:
- plan WHY artifacts and execution packets -- these become the canonical source and base work units
- `architecture_ref` / `docs/architecture/` artifact / explicit architecture handoff contract -- supplies feature homes, shared/global boundaries, context tiers, and drift checks for ticket shaping
- `tdd` frontmatter + `## TDD & Evidence Contract` -- preserves evidence expectations inside each ticket packet
- **Packaging rule:** tickets keep WHY linkage by path (`brainstorm_ref` when present, otherwise `plan_ref`) plus concise local intent, not full copied WHY blocks
- **Must write**: a local ticket set in `docs/tickets/` plus `tickets_ref` or a labeled related-artifact link back into the plan

**`/workflows-work`** reads:
- **Canonical WHY source refs** (`brainstorm_ref`/`plan_ref`) + concise unit purpose lines -- the orchestrator uses these to validate task outcomes make sense in context, not just pass tests
- **Architectural Context** -- feeds directly into `{{ARCHITECTURAL_CONTEXT}}` in each execution agent's prompt loaded from the canonical execution-agent template. This is WHY grounded arch context matters -- every subagent gets system-level awareness
- **Implementation phases & tasks** -- the execution chunk structure (Feature home, Files, Depends on, Success criteria, Test command)
- **Success Criteria** -- the orchestrator checks final outcomes against these, not just individual task passes
- **`constitution_version` / `constitution_waivers` / Constitution Alignment** -- the execution phase enforces repo-wide guardrails and knows which exceptions were approved
- **`brainstorm_ref`** -- if present, the orchestrator can read the original brainstorm for additional context
- **`references/vertical-slice-architecture.md` + architecture handoff** -- keep business logic in the feature home while shared/global abstractions stay shared when DRY/SOLID requires it

**`/workflows-review`** reads:
- **Canonical WHY source refs** (`brainstorm_ref`/`plan_ref`) + concise review focus line -- the frame for evaluating whether the implementation solves the right problem
- **Success-criteria focus labels** -- the measurable outcomes that the review should verify
- **Architectural Context** -- used to evaluate whether the implementation respects system boundaries and integration points
- **`architecture_ref` / `docs/architecture/` artifact / explicit architecture handoff contract** -- supplies the architecture intent, feature homes, shared/global boundary decisions, context tiers, deletion-test outcomes, interfaces, seams, adapters, and contracts that reviewers must verify or flag as drift
- **`tdd` frontmatter + `## TDD & Evidence Contract`** -- review must verify the declared evidence exists and that any deviation from Ralph/unit+e2e is explicitly justified
- **`execution_shape` + execution packets** -- review uses the chosen mode to judge whether the work was decomposed honestly and executed completely
- **Constitution Alignment and waivers** -- used to distinguish approved exceptions from blocking constitution violations
- **Stakeholder Impact** (when present) -- informs stakeholder-perspective review
- **Named reviewer ownership** -- `/workflows-review` owns named review-agent coordination, template loading, and WHY-context injection for reviewer prompts

NEVER CODE! Just research and write the plan.
