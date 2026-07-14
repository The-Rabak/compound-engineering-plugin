---
name: workflows:review
description: >-
  Coordinate specialist code reviews grounded in the user story. Prunes,
  deduplicates, and filters candidate findings through WHY context to protect
  purpose while improving quality.
argument-hint: '[branch name, file path, ticket index + execution session, or empty for current branch] [--batches N-M]'
model: claude-opus-4-8
platforms:
  codex:
    model:
---

# Review Command

<command_purpose> Coordinate specialist code-review agents, then synthesize their candidate findings through WHY context, architecture/ticket/evidence contracts, deduplication, and an overengineering reduction lens. The orchestrator is a judgment and artifact compiler, not another broad reviewer. </command_purpose>

## Introduction

<role>Senior Code Review Orchestrator and WHY Guardian. Your mandate is to collect specialist candidate findings, reject noise, resolve contradictions, preserve the user story, and produce the final review artifacts. You must not redo specialist analysis that was delegated to subagents. A technically superior suggestion that does not serve the user story, violates the architecture handoff, or expands scope without need is a regression, not an improvement.</role>

## Prerequisites

<requirements>
- Git repository
- Clean main/master branch (for diff baseline)
- Proper permissions to create worktrees and access the repository
- For document reviews: Path to a markdown file or document
</requirements>

## Main Tasks

### 1. Determine Review Target & Setup (ALWAYS FIRST)

<review_target> #$ARGUMENTS </review_target>

If the review target contains a ticket index path plus an execution session path and `--batches N-M`, this is a ticket-window review. Scope the review to:

- the selected ticket index batch range,
- ticket files referenced by those batches,
- the provided work execution session,
- code changes made for that batch window,
- tests/evidence for that batch window.

Do not review unrelated completed or future ticket batches except when necessary to verify dependency safety or regressions caused by the selected window.

<thinking>
First, I need to determine the review target type and set up the code for analysis.
</thinking>

#### Immediate Actions:

<task_list>

- [ ] Determine review type: branch name, file path (.md), or empty (current branch)
- [ ] Check current git branch
- [ ] Determine the default branch:
  ```bash
  default_branch=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
  [ -z "$default_branch" ] && default_branch=$(git rev-parse --verify origin/main >/dev/null 2>&1 && echo "main" || echo "master")
  ```
- [ ] If ALREADY on the target branch → proceed with analysis
- [ ] If DIFFERENT branch → offer to use worktree: "Use git-worktree skill for isolated analysis" or `git checkout [branch]`
- [ ] Get the list of changed files:
  ```bash
  git diff --name-only ${default_branch}...HEAD
  ```
- [ ] Get the full diff for review:
  ```bash
  git diff ${default_branch}...HEAD
  ```
- [ ] Get commit messages for context:
  ```bash
  git log --oneline ${default_branch}..HEAD
  ```
- [ ] Set up language-specific analysis tools
- [ ] Prepare security scanning environment

Ensure that the code is ready for analysis (either in worktree or on current branch). ONLY then proceed to the next step.

</task_list>

#### Load WHY + Constitution Context (BEFORE running any agents)

<thinking>
Before any review agent runs, I need to understand WHY this code was built. Without this, I'm reviewing HOW code works without knowing WHAT it's supposed to achieve for users. Technical reviewers will suggest changes that are "better" in isolation but could drift the implementation from its purpose.
</thinking>

**Step 1: Find the plan file.** Check these locations in order:

```bash
# Check commit messages for plan references
git log --oneline ${default_branch}..HEAD | grep -i "plan\|docs/plans"

# Check for execution session that references a plan
ls docs/execution-sessions/work-*/STATE.md 2>/dev/null

#check for recent plan files (legacy .md or the pilot .html output of /workflows:plan)
ls -t docs/plans/*-plan*.md docs/plans/*-plan*.html 2>/dev/null | head -5

# Check for architecture files (legacy .md or the .html output of /workflows:architecture since T04)
ls -t docs/architecture/*.md docs/architecture/*.html 2>/dev/null | head -5

# Check for ticket sets
ls -t docs/tickets/*/index.md 2>/dev/null | head -5

# Check for readme files
ls -t README.md 2>/dev/null | head -5
```

If a plan file is found, detect which reader applies from its file extension before reading anything:

- **`.md`** — parse frontmatter and sections as today (legacy path, unchanged).
- **`.html`** — load `commands/workflows/references/html-artifacts/island-extraction-helper.md`, quote its first non-empty line, and use it to read the plan's `#artifact-data` JSON island for the same fixed-core facts the legacy path reads from frontmatter/sections. If extraction fails for any reason, stop immediately and report the artifact path and the exact failure per the helper's fail-loud branch — do not proceed on partial data, scrape the rendered HTML, or fall back to a `.md` mirror (none exists for an `.html` artifact).

`tickets_ref` always resolves to `.md` regardless of the plan's own format. `brainstorm_ref` and `architecture_ref` may also be `.md` or `.html` (since T03 and T04 respectively) rather than `.md`-only. `architecture_ref`'s content is read via the architecture dual-read branch further below. `brainstorm_ref` is only ever carried forward here as a path value for "Canonical WHY Source" -- this file never re-parses the brainstorm artifact's own content, so no dual-read branch applies to it.

Whichever path applied above, extract:
- **Problem Narrative** — why this work exists, what pain it solves
- **User Story** — who benefits and what outcome they get
- **Architectural Context** — how the solution fits in the system
- **Success Criteria** — measurable conditions that define "done"
- **brainstorm_ref** — path to brainstorm document, if available
- **architecture_ref / Related Artifacts** — pointer to the architecture artifact or handoff document, if available
- **tickets_ref / Related Artifacts** — pointer to the ticket set, if available
- **constitution_version** / **constitution_waivers** — what repo-wide rules apply and which exceptions were explicitly approved

If an `architecture_ref` or matching `docs/architecture/*.md`/`docs/architecture/*.html` artifact exists, detect which reader applies from the architecture artifact's own file extension (independent of the plan's):

- **`.md`** -- parse frontmatter and sections as today (legacy path, unchanged).
- **`.html`** (T04) -- load `commands/workflows/references/html-artifacts/island-extraction-helper.md`, quote its first non-empty line, and use it to read the architecture artifact's `#artifact-data` JSON island for the same fixed-core facts the legacy path reads from sections, sourced from the island's `architecture`-kind Tier-2 core instead (see `island-contract.md`'s architecture field-coverage map for the section-name -> island-field mapping). If extraction fails for any reason, stop immediately and report the artifact path and the exact failure per the helper's fail-loud branch -- do not proceed on partial data, scrape the rendered HTML, or fall back to a `.md` mirror (none exists for an `.html` artifact).

Whichever path applied, extract:
- Feature Homes and Ownership
- Shared / Global Decisions
- Deepening Candidates
- Context Tiers
- Deletion Test decisions
- Interfaces as test surfaces
- Seams, Adapters, and Contracts
- Drift Checks
- Recommendations for `/workflows:review`

If no architecture artifact exists, build an explicit architecture handoff contract from the plan's Architectural Context, Key Decisions, Constitution Alignment, brainstorm context, and STATE.md notes. Do not review architecture implicitly.

If a `tickets_ref` or matching `docs/tickets/*/index.md` artifact exists, read the ticket index and the relevant ticket files. Extract:
- ticket order and statuses
- dependency graph
- feature homes and scope fences
- acceptance criteria and evidence commands
- any visible blocker notes or ticket-set review findings

When `--batches N-M` is present, "relevant ticket files" means only tickets named by batches `N` through `M`, plus prerequisite tickets needed to understand dependency safety.

ALWAYS READ THE ARCHITECTURE ARTIFACT (or explicit handoff contract) AND README FILES FOR CONTEXT — they often contain critical information about architectural intent, constraints, and domain knowledge that is not in the plan.

If a STATE.md execution session exists, also read its WHY Linkage and Architecture Handoff sections.

If `docs/constitution.md` exists, read it too and extract:
- core principles
- review guardrails
- required approvals / allowed exceptions
- active version

**Step 2: If no plan exists**, construct minimal WHY from available signals:

- Read commit messages for intent ("feat: add user auth", "fix: email validation")
- Look at the files changed to infer domain and scope
- Check PR description if available
- **Ask the user**: "I couldn't find a plan file for this branch. In one sentence, what problem does this code solve and for whom?" — this grounds the entire review.

**Step 3: Summarize the WHY linkage + constitution context** that will be passed to every agent:

```
WHY CONTEXT FOR REVIEWERS:
- Canonical WHY Source: [brainstorm_ref path when available, otherwise plan path]
- Parent Plan: [plan path or none]
- Review Focus: [one-line outcome and success-criteria labels this review protects]
- Architectural Intent: [arch context summary]
- Architecture Artifact: [docs/architecture/... path or none]
- Ticket Set: [docs/tickets/.../index.md or none]
- Architecture Handoff: [feature homes, shared/global decisions, context tiers, deletion-test decisions, interfaces as test surfaces, seams/adapters/contracts, and drift checks the implementation must honor]
- Constitution Version: [version or none]
- Constitution Guardrails: [relevant principles, review baselines, approvals, waivers]
```

This context is passed to EVERY review agent below. It is not optional.

#### TDD Evidence Gate (BEFORE reviewer dispatch)

If a `docs/execution-sessions/work-*/STATE.md` file exists for this branch, read the completed execution unit session files before dispatching review agents and build a terse evidence ledger.

Apply these references as source-of-truth contracts; do not reconstruct their full rules from memory:
- `commands/workflows/references/tdd-evidence-contract.md`
- `commands/workflows/references/e2e-testing-contract.md`

Classify TDD gate failures explicitly:
- **Missing behavior coverage** -- weak or missing `Red`/`Green`, or evidence that does not prove the requested behavior.
- **Missing cleanup after refactor** -- weak or missing `Post-Refactor Green`, or no rerun evidence after cleanup/refactor was claimed.

The orchestrator owns only the ledger:
- resolved evidence contract and approved exceptions
- unit/session files inspected
- observed `Red`, `Green`, and `Post-Refactor Green` evidence
- e2e evidence locations, missing-evidence notes, and obvious contract failures

Keep the gate output terse and evidence-based. If the gate fails, carry that failure into the final summary even if no reviewer agent finds anything else.

The mandatory `e2e-test-strategist` owns the detailed e2e audit. Pass it the ledger, runtime stack, suggested e2e suite, changed test files, and e2e/TDD contract paths. If the ledger already exposes a contract failure, carry it into final synthesis even if no reviewer repeats it.

#### Protected Artifacts

<protected_artifacts>
The following paths are compound-engineering pipeline artifacts and must never be flagged for deletion, removal, or gitignore by any review agent:

- `docs/plans/*.md` and `docs/plans/*.html` — Plan files created by `/workflows:plan` (legacy Markdown or the pilot HTML-artifact output). These are living documents that track implementation progress (checkboxes are checked off by `/workflows:work` for `.md`; the equivalent status field for `.html`).
- `docs/architecture/*.md` and `docs/architecture/*.html` — Architecture improvement artifacts and handoff contracts created or referenced between planning, deepening, execution, and review (legacy Markdown or the `.html`-artifact output since T04).
- `docs/tickets/**/*.md` — Local ticket artifacts created by `/workflows:to-issues` and updated by ticket-scoped execution.
- `docs/solutions/*.md` — Solution documents created during the pipeline.

If a review agent flags any file in these directories for cleanup or removal, discard that finding during synthesis. Do not create a todo for it.
</protected_artifacts>

#### Load Review Agents

Read `compound-engineering.local.md` in the project root. If found, use `review_agents` from YAML frontmatter. If the markdown body contains review context, pass it to each agent as additional instructions.

If no settings file exists, invoke the `setup` skill to create one. Then read the newly created file and continue.

`review_agents` only decides **which** named review agents `/workflows:review` coordinates. It does **not** authorize direct reviewer dispatch from other workflows or ad hoc prompts. If any other workflow or skill needs named review-agent analysis, route that request through `/workflows:review` instead of spawning the reviewers directly, except for `/workflows:to-issues`, which may run `ticket-flow-auditor` as its explicit ticket-set completion gate before code exists.

Regardless of `review_agents`, `/workflows:review` still adds the mandatory reviewers `agent-native-reviewer`, `learnings-researcher`, `uncle-bob`, `ticket-flow-auditor`, `e2e-test-strategist`, and `code-simplicity-reviewer`. `/workflows:architecture` likewise always runs `architecture-strategist` and `uncle-bob`.

Before dispatch, build one ordered, deduplicated reviewer list:
1. configured `review_agents`
2. mandatory reviewers above
3. conditional reviewers whose triggers match

Dispatch each resolved reviewer at most once. If `code-simplicity-reviewer` is configured, the mandatory reviewer entry is satisfied by the configured reviewer list and must not be dispatched a second time. The orchestrator still applies a lightweight overengineering reduction lens during synthesis, but that lens does not replace the mandatory specialist reviewer.

#### Parallel Agents to review the branch changes:

<parallel_tasks>

Run all configured, mandatory, and conditional review agents in parallel using Task tool. For each agent in the deduplicated reviewer list:

Apply the shared `Named Agent Dispatch` protocol from `commands/workflows/references/orchestration-protocol.md` before every named reviewer dispatch.

- Start with the bundled agent directory and verify the local agent metadata when it exists.
- Fall back to OpenViking/global context only when no bundled agent can be resolved.
- Quote the resolved source path plus the `name` and `model` metadata before dispatching.
- Resolve the concrete subagent identifier and dispatch the subagent itself. Do not paste the agent file body into the delegated prompt.
- If any configured or mandatory reviewer cannot be loaded and quoted, report that the review is incomplete and stop rather than substituting a different reviewer or silently reducing coverage.
- Never dispatch a named agent by name alone.

Build a compact shared review packet before dispatch. Prefer changed-file lists, relevant artifact paths, evidence ledger entries, and scoped diff hunks over pasting the full branch diff into every agent prompt. Include the full diff only when the agent cannot make an evidence-backed judgment from the compact packet and repo inspection.

```
Task {resolved-agent-id}(shared review packet + reviewer-specific focus)
```

**Every agent prompt MUST include the WHY linkage block and architecture handoff block** from the step above. This ensures agents evaluate fitness-for-purpose, not just technical quality. For reviewers that identify code or evidence issues, require the candidate-finding output contract below:

```
## Candidate Findings
- **ID:** <agent-short-name>-<n>
  **Severity:** P1 | P2 | P3
  **Classification:** protects-user-story | constitution-violation | drift-risk | quality-improvement | scope-expansion
  **Evidence:** <file:line, diff hunk, artifact path, or "missing evidence">
  **User-story impact:** <how this affects the recorded success criteria, or "none/general quality">
  **Architecture/ticket impact:** <feature-home, shared/global, dependency, scope-fence, or "none"; note if it Introduces feature-home drift or shared/global drift>
  **Smallest credible fix:** <one concrete fix, not a rewrite plan>
  **Confidence:** high | medium | low

## Non-Issues / Deferred
- <technically valid but out-of-scope, speculative, low-confidence, or overengineered suggestions>
```

Reject raw research dumps. If an agent returns broad notes, distill them into this contract before synthesis. A candidate finding is not automatically a todo.

Exception: `learnings-researcher` should return compact institutional learning matches using its own report shape. During synthesis, link relevant learnings to accepted findings as "Known Pattern" evidence; do not force learning matches to become candidate findings by themselves.

Dispatch each reviewer with a prompt like:

```
Review this change for your assigned focus area.

WHY CONTEXT FOR REVIEWERS:
- Canonical WHY Source: [brainstorm_ref path when available, otherwise plan path]
- Parent Plan: [plan path or "none"]
- Review Focus: [one-line outcome and success-criteria labels]
- Architectural Intent: [arch context]
- Architecture Artifact: [artifact path or "plan-derived handoff"]
- Ticket Set: [ticket index path or "none"]
- Architecture Handoff: [deletion test, interfaces, seams/adapters/contracts, review checks]

For code/evidence findings, return only the candidate-finding contract above. Classify each finding against user-story impact, drift/scope risk, architecture handoff impact, and ticket-scope impact.

Review packet:
[WHY context, architecture handoff, review context, changed files, scoped diff hunks or full diff only when needed, evidence ledger, relevant artifact paths]
```

Always run these regardless of settings. These mandatory reviewers cannot be disabled by `review_agents`:
- Apply the protocol above to `agent-native-reviewer`, then dispatch it with the shared review packet -- verify new or changed user-facing actions have agent-accessible parity.
- Apply the protocol above to `learnings-researcher`, then dispatch it with changed modules, keywords, WHY context, and relevant paths -- search docs/solutions/ for past issues related to this PR's modules and patterns.
- Apply the protocol above to `uncle-bob`, then dispatch it with the shared review packet -- pressure-test naming, cohesion, feature-home boundaries, shared/global extractions, side effects, and long-term changeability.
- Apply the protocol above to `ticket-flow-auditor`, then dispatch it with the shared review packet plus ticket artifacts -- verify plan/ticket/implementation alignment, scope fences, dependency honesty, and execution drift.
- Apply the protocol above to `e2e-test-strategist`, then dispatch it in **AUDIT mode** with the evidence ledger, changed test/runtime files, WHY context, the plan's `runtime_stack` / `## Suggested E2E Suite`, and the TDD/e2e contract paths -- verify e2e was actually implemented and validated. The agent owns detailed e2e contract enforcement.
- Apply the protocol above to `code-simplicity-reviewer`, then dispatch it with the shared review packet -- verify complexity, wrong abstractions, duplication, dead weight, and readability regressions are caught by the specialist reviewer.

</parallel_tasks>

#### Conditional Agents (Run if applicable):

<conditional_agents>

These agents are run ONLY when the branch changes match specific criteria. Check the changed files list to determine if they apply. **Pass the WHY context block to all conditional agents as well.**

Apply the same template-loading rule to every named conditional agent below. Never dispatch them by name alone, and do not silently skip a required conditional reviewer once its trigger conditions are met.

**MIGRATIONS: If PR contains database migrations or data backfills:**

- Apply the protocol above to `data-integrity-guardian`, then dispatch it with migration/backfill files, scoped diff hunks, and WHY context - Reviews migration safety, constraint naming, and migration conventions
- Apply the protocol above to `data-migration-expert`, then dispatch it with migration/backfill files, scoped diff hunks, and WHY context - Validates ID mappings match production, checks for swapped values, verifies rollback safety
- Apply the protocol above to `deployment-verification-agent`, then dispatch it with migration/backfill files, scoped diff hunks, and WHY context - Creates Go/No-Go deployment checklist with SQL verification queries


**When to run:**
- Changed files include `database/migrations/*.php`
- Changes modify columns that store IDs, enums, or mappings
- Changes include data backfill scripts or artisan commands
- Commit messages mention: migration, backfill, data transformation, ID mapping

**What these agents check:**
- `data-integrity-guardian`: Reviews migration safety, project conventions (separate files for table/indexes/FKs, constraint naming with `unq_`/`fk_`/`idx_` prefixes)
- `data-migration-expert`: Verifies hard-coded mappings match production reality (prevents swapped IDs), checks for orphaned associations, validates dual-write patterns
- `deployment-verification-agent`: Produces executable pre/post-deploy checklists with SQL queries, rollback procedures, Horizon monitoring plans

</conditional_agents>

### 4. Orchestrator Operating Boundaries

The orchestrator must not run a second broad code review after specialists return. Its synthesis work is limited to:
- normalizing candidate findings into one shape
- detecting duplicate, overlapping, unsupported, contradictory, or low-confidence findings
- preserving WHY context, success criteria, architecture handoff, ticket scope fences, and evidence contracts
- applying common sense and an overengineering reduction lens
- catching obvious critical omissions, mistaken severity, protected-artifact violations, and specialist errors
- deciding which accepted findings deserve todo files

The orchestrator must not:
- redo security, performance, e2e, architecture, ticket-flow, clean-code, or framework analysis already delegated to an agent
- invent new specialist findings unless they are obvious from the evidence ledger or required to correct a critical contradiction
- expand scope because a specialist suggested a technically sound but unnecessary improvement
- create todos for every candidate finding by default

### 5. Findings Synthesis and Todo Creation Using file-todos Skill

<critical_requirement> Only accepted actionable findings are stored in the todos/ directory using the file-todos skill. Candidate findings from agents must be validated, pruned, deduplicated, severity-checked, and filtered through WHY context plus an overengineering reduction lens before any todo is created. Do not present accepted findings one-by-one for approval before creating todos. </critical_requirement>

#### Step 1: Synthesize Candidate Findings Through WHY Filter

<thinking>
I am about to receive candidate findings from technically-minded agents. My job is NOT to pass them all through -- it is to DISTILL them. Every candidate must be evaluated: is it evidence-backed, non-duplicative, proportional, and aligned with the user story? Technically superior suggestions that do not deliver the user story are regressions, not improvements.
</thinking>

<synthesis_tasks>

- [ ] Collect candidate findings from all parallel agents
- [ ] Surface learnings-researcher results: if past solutions are relevant, flag them as "Known Pattern" with links to docs/solutions/ files
- [ ] Discard any findings that recommend deleting or gitignoring files in `docs/plans/` or `docs/solutions/` (see Protected Artifacts above)
- [ ] Reject or defer candidate findings that are unsupported, low-confidence without corroboration, duplicate another finding, speculative, outside the changed scope, or disproportionate to the user story
- [ ] Apply the overengineering reduction lens: prefer deletion, inlining, local repair, or deferral over generalized abstractions, new frameworks, broad rewrites, or future-proofing that is not required by the success criteria

**WHY-grounded classification (apply to EVERY finding before severity):**

For each candidate finding, ask: "If we act on this finding, what happens to the user story?"

- **🎯 PROTECTS USER STORY** — Finding addresses something that could prevent the user from achieving the stated outcome. (e.g., security hole in the auth flow when the user story is about secure login). These get elevated priority.
- **🏛️ CONSTITUTION VIOLATION** — Implementation or recommendation conflicts with a repo-wide MUST / MUST NOT rule, or bypasses a required approval, without an explicit waiver. These should be treated as blocking unless the constitution is amended or the waiver is approved.
- **⚠️ DRIFT RISK** — Finding suggests a change that is technically valid but would ALTER the user's intended outcome or expand scope beyond the user story. (e.g., "refactor to microservices" when the plan says monolith, or "add OAuth support" when the story only mentions password login). **These must be flagged prominently and NEVER auto-applied.** Present to user with: "This suggestion is technically sound but would change what the feature delivers."
- **🔧 QUALITY IMPROVEMENT** — Finding improves code quality without affecting the user story positively or negatively. Standard review finding. Keep severity as-is.
- **📦 SCOPE EXPANSION** — Finding suggests adding functionality not in the user story or success criteria. Automatically downgrade to P3 regardless of agent-assigned severity, and tag as "Beyond current scope."

- [ ] Categorize accepted findings by type: security, performance, architecture, quality, etc.
- [ ] Assign severity levels: 🔴 CRITICAL (P1), 🟡 IMPORTANT (P2), 🔵 NICE-TO-HAVE (P3)
  - **Override rule**: Findings classified as PROTECTS USER STORY get +1 severity bump (P3→P2, P2→P1)
  - **Override rule**: Findings classified as CONSTITUTION VIOLATION are blocking by default unless a valid waiver exists
  - **Override rule**: Findings classified as SCOPE EXPANSION get capped at P3
- [ ] Remove duplicate or overlapping findings
- [ ] Estimate effort for each accepted finding (Small/Medium/Large)
- [ ] Record rejected/deferred candidate findings separately with a short reason, but do not create todos for them
- [ ] **User Story Delivery Assessment**: After classifying accepted findings, state:
  - "Does the implementation, AS REVIEWED, deliver the user story? YES / PARTIALLY / NO"
  - If PARTIALLY or NO, list which success criteria are unmet and why

</synthesis_tasks>

#### Step 2: Create Todo Files Using file-todos Skill

<critical_instruction> Use the file-todos skill to create todo files only for accepted actionable findings. Do NOT create todos for rejected, duplicate, overengineered, speculative, or low-value findings. Do NOT spawn todo-writing subagents; the orchestrator owns final todo selection and conversion after synthesis. </critical_instruction>

**Execution Strategy:**

1. Synthesize candidate findings into accepted and rejected/deferred groups.
2. Create todos for accepted P1/P2 findings by default.
3. Create todos for P3 findings only when they are concrete, non-trivial, non-overengineered, and worth tracking beyond the review summary.
4. For drift-risk findings, create a todo only when a human decision is required before merge or before more implementation proceeds. Otherwise list the suggestion under rejected/deferred findings with the drift reason.
5. Consolidate results and present summary.

**Process (Using file-todos Skill):**

1. For each accepted todo-worthy finding:

   - Determine severity (P1/P2/P3), applying the WHY override rules from synthesis
   - **Tag with WHY classification**: 🎯 PROTECTS USER STORY / ⚠️ DRIFT RISK / 🔧 QUALITY IMPROVEMENT / 📦 SCOPE EXPANSION
   - **Note which success criterion** this finding affects (or "None — general quality")
   - Write detailed Problem Statement and Findings
   - For DRIFT RISK findings: explicitly state what would change about the user's outcome if the suggestion is followed
   - Create a concise Proposed Solution section. Include multiple options only when there is a real decision to make.
   - Estimate effort (Small/Medium/Large)
   - Add acceptance criteria and work log

2. Use file-todos skill for structured todo management:

   ```bash
   skill: file-todos
   ```

   The skill provides:

   - Template location: `.claude/skills/file-todos/assets/todo-template.md`
   - Naming convention: `{issue_id}-{status}-{priority}-{description}.md`
   - YAML frontmatter structure: status, priority, issue_id, tags, dependencies
   - All required sections: Problem Statement, Findings, Solutions, etc.

3. Create todo files after synthesis:

   ```bash
   {next_id}-pending-{priority}-{description}.md
   ```

4. Examples:

   ```
   001-pending-p1-path-traversal-vulnerability.md
   002-pending-p1-api-response-validation.md
   003-pending-p2-concurrency-limit.md
   004-pending-p3-unused-parameter.md
   ```

5. Follow template structure from file-todos skill: `.claude/skills/file-todos/assets/todo-template.md`

**Todo File Structure (from template):**

Each todo must include:

- **YAML frontmatter**: status, priority, issue_id, tags, dependencies
- **Problem Statement**: What's broken/missing, why it matters
- **Findings**: Discoveries from agents with evidence/location
- **Proposed Solutions**: concise recommended fix; multiple options only when there is a real decision
- **Recommended Action**: (Filled during triage, leave blank initially)
- **Technical Details**: Affected files, components, database changes
- **Acceptance Criteria**: Testable checklist items
- **Work Log**: Dated record with actions and learnings
- **Resources**: Links to PR, issues, documentation, similar patterns

**File naming convention:**

```
{issue_id}-{status}-{priority}-{description}.md

Examples:
- 001-pending-p1-security-vulnerability.md
- 002-pending-p2-performance-optimization.md
- 003-pending-p3-code-cleanup.md
```

**Status values:**

- `pending` - New finding, not started, or awaiting triage/decision
- `in_progress` - Execution is actively working this todo
- `blocked` - A dependency, access issue, missing decision, or external condition prevents progress
- `complete` - Work finished and validated

**Priority values:**

- `p1` - Critical (blocks merge, security/data issues)
- `p2` - Important (should fix, architectural/performance)
- `p3` - Nice-to-have (enhancements, cleanup)

**Tagging:** Always add `code-review` tag, plus: `security`, `performance`, `architecture`, `laravel`, `vue`, `quality`, etc.

#### Step 3: Summary Report

After synthesis and todo creation, present a concise summary:

````markdown
## ✅ Code Review Complete

**Review Target:** Branch `[branch-name]` (vs `[default-branch]`)

### User Story Delivery Assessment

**User Story:** [user story from plan]
**Delivery Status:** ✅ DELIVERS / ⚠️ PARTIALLY DELIVERS / ❌ DOES NOT DELIVER
**Architecture Basis:** [docs/architecture/... path or "plan-derived handoff contract"]

### TDD Evidence Gate

- **Behavior coverage:** PASS / FAIL — [unit/session refs with weak or missing `Red`/`Green` evidence]
- **Cleanup after refactor:** PASS / FAIL — [unit/session refs with weak or missing `Post-Refactor Green` evidence]
- **Real e2e:** PASS / FAIL / N/A — [any Fake-in-e2e, Mock-transport, Empty/hardcoded-pass, Sleep-instead-of-poll, Test-softened-to-pass, Missing-failure-mode, or Unjustified-missing-e2e findings; N/A only with a justified no-runtime-surface exception]

[If PARTIALLY or NO:]
**Gaps:**
- [Success criterion X]: not met because [reason]
- [Success criterion Y]: partially met — [what's missing]

### WHY-Grounded Findings Summary:

- **Candidate Findings Reviewed:** [X]
- **Accepted Findings:** [Y]
- **Todo Files Created:** [Z]
- **Rejected/Deferred Candidate Findings:** [N] — duplicates, unsupported claims, overengineering, scope expansion, drift risk, or low-value P3s
- **🎯 Protects User Story:** [count] — findings that address threats to the user's outcome
- **🏛️ Constitution Violations:** [count] — unwaived conflicts with repo-wide project rules
- **⚠️ Drift Risk:** [count] — suggestions that would ALTER what the feature delivers (review carefully)
- **🔧 Quality Improvements:** [count] — standard technical improvements
- **📦 Scope Expansion:** [count] — suggestions beyond current user story (consider for future work)

### Severity Breakdown:

- **🔴 CRITICAL (P1):** [count] - BLOCKS MERGE
- **🟡 IMPORTANT (P2):** [count] - Should Fix
- **🔵 NICE-TO-HAVE (P3):** [count] - Enhancements

### Created Todo Files:

**P1 - Critical (BLOCKS MERGE):**

- `001-pending-p1-{finding}.md` - {description}
- `002-pending-p1-{finding}.md` - {description}

**P2 - Important:**

- `003-pending-p2-{finding}.md` - {description}
- `004-pending-p2-{finding}.md` - {description}

**P3 - Nice-to-Have:**

- `005-pending-p3-{finding}.md` - {description}

### Rejected / Deferred Candidate Findings:

- `{agent or finding id}` - {short reason: duplicate, unsupported, overengineered, out of scope, drift risk not accepted, low-value P3}

### Review Agents Used:

- rabak-laravel-reviewer
- rabak-vue-reviewer
- security-sentinel
- performance-oracle
- architecture-strategist
- agent-native-reviewer
- e2e-test-strategist
- [other agents]

### Next Steps:

1. **Address P1 Findings**: CRITICAL - must be fixed before merge

   - Review each P1 todo in detail
   - Implement fixes or request exemption
   - Verify fixes before merging PR

2. **Review Drift Risk Findings**: Only drift-risk findings that survived synthesis and require a decision should become todos. If the drift is architectural, update the architecture artifact or explicit handoff contract before more implementation proceeds.

3. **Triage All Todos**:
   ```bash
   ls todos/*-pending-*.md  # View all pending todos
   /workflows:triage todos 001-005  # Replace with the actual first-last todo numbers created in this review
   ```

4. **Work on Triaged Todos**:

   ```bash
   /resolve_todo_parallel  # Fix all approved items efficiently
   ```

5. **Track Progress**:
   - Rename file when status changes: pending → in_progress → complete, or blocked when progress is impeded
   - Update Work Log as you work
   - Commit todos: `git add todos/ && git commit -m "refactor: add code review findings"`

````

### Important: P1 Findings and User Story Delivery Block Merge

Any **🔴 P1 (CRITICAL)** findings must be addressed before merging. Additionally, if the User Story Delivery Assessment is **❌ DOES NOT DELIVER**, the branch should not be merged regardless of P1 count — the code doesn't solve the stated problem.

Any **Missing behavior coverage** TDD gate failure should be treated as merge-blocking even if the implementation currently appears to work; review requires proof, not claims.

Any **Missing cleanup after refactor** TDD gate failure should block merge when cleanup/refactor happened without a trustworthy post-refactor rerun. Otherwise keep it as an important quality finding until the rerun evidence is repaired.

Any **e2e gate failure** (Fake-in-e2e, Mock-transport / not-really-e2e, Empty/hardcoded pass, Sleep-instead-of-poll, Test-softened-to-pass, Missing failure-mode coverage, or Unjustified missing e2e) should be treated as merge-blocking. E2E exists to tell the truth about whether the app works end to end; a green suite that fakes, mocks, sleeps, or softens its way to pass is worse than no suite. The only acceptable absence of e2e is a justified no-runtime-surface N/A exception.

Any unwaived **🏛️ CONSTITUTION VIOLATION** findings should also block merge until the code is fixed, the waiver is explicitly approved, or the constitution is amended.

Any accepted **⚠️ DRIFT RISK** findings must be explicitly reviewed by the user before acting on them. Never auto-resolve drift risk findings — they require a human decision about whether the user story should change.
```

## Final Phase: Workflow Next Step Advisor

After the review summary is presented and todo files are created when findings exist, load the `workflow-next-step` skill. This must be the only final process of the review workflow.

Run it in advisory mode only:
- pass the current workflow name: `workflows:review`
- pass the review target, relevant plan/ticket/session paths, and any created todo paths
- when todos were created, pass the exact created todo filenames so the advisor can recommend the most specific triage command, preferably `/workflows:triage todos <first>-<last>`
- inspect relevant artifacts without mutating them
- output the full core workflow checklist and the exact next-session command with required inputs

This must be the last phase of the workflow. If review stopped before completion, still run the advisor with the current state so it can mark blockers and recommend the recovery step.
