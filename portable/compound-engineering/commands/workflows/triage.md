---
name: workflows:triage
description: Validate review-created todos, record selected actions, and execute only vetted safe batches through execution-agent
argument-hint: '[todo range or scope] [--auto-recommended] [--execute]'
model: claude-opus-4-8
platforms:
  codex:
    model:
  claude:
    disable-model-invocation: true

---

# Triage Review Todos

## Operating Contract

You are the triage orchestrator. Your job is to turn review-created todos into validated, execution-ready decisions without making the main model redo every specialist's work.

Do the work of an orchestrator:
- identify the exact todo scope
- load every target todo before asking or executing anything
- dispatch focused research only when the todo is not already action-ready
- synthesize compact research briefs into selected actions
- validate evidence, completeness, scope fences, dependencies, and execution safety
- catch contradictions, unsupported recommendations, missing acceptance criteria, and unsafe parallelism
- write the final selected action and work-log entries into todo files
- when `--execute` is present, coordinate execution-agent batches and independently validate completion

Do not become a passive router:
- reject or repair weak research briefs before using them
- inspect cited evidence paths when a recommendation looks unsupported or risky
- block a todo rather than auto-selecting an action that lacks enough evidence
- ensure every selected action is the smallest credible fix for the accepted review finding
- preserve user story, architecture, ticket scope, and evidence contracts when those artifacts exist

Do not duplicate delegated work:
- do not redo broad repository research after a focused triage researcher returns a complete brief
- do not redo security, data, e2e, architecture, clean-code, framework, or ticket-flow analysis already delegated by review, except to catch an obvious contradiction or missing blocker
- do not implement code in the orchestration context
- do not paste agent file bodies into subagent prompts
- do not append raw research dumps to todo files

## Scope

<triage_scope> #$ARGUMENTS </triage_scope>

Flags:
- `--auto-recommended`: select the vetted recommended action for each decision without asking the user. If the recommendation is not evidence-backed, mark the todo `blocked` instead of guessing.
- `--execute`: after all target todos have selected actions recorded, build safe batches and dispatch execution-agent. Without this flag, stop after triage decisions are written.

`--auto-recommended` does not imply `--execute`.

## Required References

Use these contracts when needed. Load only the relevant reference, and do not paste full reference text into subagent prompts.

- `commands/workflows/references/orchestration-protocol.md`
- `commands/workflows/references/execution-agent-prompt.md` when `--execute` is present
- `commands/workflows/references/tdd-evidence-contract.md` when resolving execution evidence expectations
- `commands/workflows/references/e2e-testing-contract.md` when a todo touches runtime/user-facing behavior or e2e evidence

When dispatching a named agent, apply `Named Agent Dispatch` from `orchestration-protocol.md`: verify the bundled agent source and metadata, dispatch the resolved agent identifier, and pass only the workflow-specific payload plus compact resolved context. Do not paste the agent file body.

## Triage Brief Contract

Every focused triage research result must return exactly this compact, todo-ready shape:

```markdown
## Todo Triage Brief
Todo: <path>
Title: <title>
Verdict: ready | needs-decision | blocked
Confidence: high | medium | low

## Evidence Facts
- <path:line or artifact path> - <fact that affects the action>

## Recommended Action
<smallest credible action, or "None - blocked" with reason>

## Alternatives Considered
- <alternative> - <why rejected/deferred>

## Execution Fields
- Likely files: <paths or "unknown">
- Scope fence: <what must not change>
- Acceptance criteria: <testable checklist>
- Validation command: <specific command or justified missing command>
- Dependency notes: <none or exact blockers>

## Decision Needed
None | <one concrete question with options>

## Risks / Specialist Escalation
- <risk, contradiction, missing evidence, or "None">
```

Reject broad notes that do not fit this contract. The orchestrator may ask a researcher for a repaired brief, inspect the cited evidence directly, or mark the todo blocked.

## Workflow

### Step 1: Bootstrap and Target Scope

1. Load project instructions and relevant local workflow context.
2. Resolve the narrowest target todo set from the user scope:
   - explicit file paths
   - numeric ranges such as `todos 001-005`
   - priority/status filters
   - "all open" only when the user explicitly asked for broad scope
3. Read every target todo fully before asking decisions or dispatching execution.
4. Build a deterministic queue sorted by issue id.
5. Record frontmatter status, priority, dependencies, title, current findings, proposed solutions, recommended action, acceptance criteria, likely files, and work-log state.

Recommended discovery:

```bash
rg '^status:\s*(pending|in_progress|blocked|complete)' todos/*.md
```

If the target set is empty, report the exact scope checked and stop.

### Step 2: Build a Readiness Ledger

For each target todo, classify the existing file before dispatching research:

- `ready`: has evidence-backed findings, a clear proposed solution or recommended action, likely files/scope fence, testable acceptance criteria, and validation expectations.
- `needs-research`: missing evidence, likely files, acceptance criteria, validation command, scope fence, or a defensible recommendation.
- `needs-decision`: multiple credible actions remain and user intent or product tradeoff decides the path.
- `blocked`: missing external access, unresolved dependency, absent parent artifact, contradictory evidence, or unsafe recommendation.
- `already-complete`: status is `complete`; include in the report but do not execute.

Use existing review-created todo content first. Do not dispatch a researcher just to restate already complete fields.

### Step 3: Focused Research Only Where Needed

For each `needs-research`, `needs-decision`, or suspicious `ready` todo, dispatch the resolved `todo-triage-researcher` agent with the Triage Brief Contract.

Payload should be compact:
- repository path and branch
- todo file path
- extracted todo sections or the todo file path for the agent to read
- accepted review finding source if present
- parent plan/ticket/architecture refs if present
- known constraints from project instructions
- exact missing fields from the readiness ledger
- request the Triage Brief Contract, not a raw investigation report

Use the same dispatch protocol for optional specialist escalation only when it can change the decision:
- `learnings-researcher` when the todo touches a pattern likely captured in `docs/solutions/`
- `framework-docs-researcher` only for version-sensitive framework/API behavior
- route broad post-implementation quality analysis through `/workflows:review`, not ad hoc reviewers

For low-risk todos that are already nearly ready, a narrow orchestrator self-check is acceptable: inspect only the todo and the directly cited files. Do not perform a new broad repo scan.

### Step 4: Orchestrator Quality Gate

Before selecting or asking about any action, validate every todo brief against this checklist:

- Evidence facts cite real paths, line references, artifacts, or explicit missing-evidence blockers.
- Recommended action is the smallest credible fix for the accepted finding.
- Alternatives are either meaningfully different or omitted because no real decision exists.
- Acceptance criteria are testable and trace to the problem statement.
- Likely files and scope fence are specific enough for an execution agent.
- Validation command is specific, or the absence of one is justified and blocked/deferred.
- Dependencies are explicit and ordered.
- Any security, data migration, e2e, architecture, or public API risk is either covered by prior review evidence, specialist evidence, or marked blocked.
- The brief does not expand scope beyond the review finding or user story.
- The brief does not contradict another targeted todo.

If a brief fails:
1. Inspect the cited evidence directly when the gap is small.
2. Ask the same researcher for a repaired brief when the contract is incomplete.
3. Mark the todo `blocked` when the recommendation cannot be defended.

The orchestrator is accountable for this gate. Do not treat subagent output as authoritative just because it is structured.

### Step 5: Resolve Decisions

If `--auto-recommended` is present:
- Select the vetted recommended action only when the quality gate passed.
- Record `@lrj-auto` as the decision owner in the work log.
- If the recommended action is low-confidence, missing evidence, or materially scope-expanding, mark the todo `blocked` with the reason.

If `--auto-recommended` is absent:
- Ask only one decision question at a time.
- Ask only when a real product, priority, risk, or scope choice remains after research.
- Do not ask the user to choose between fake options when the smallest credible fix is clear.

Decision prompt format:

```markdown
Decision for Todo #NNN:
<clear question>

Research-backed options:
1. <option A>
2. <option B>
3. <option C>

Recommended: <option>
Why: <brief evidence-backed reason>
```

If the user gives freeform direction, normalize it into the selected action and confirm in one sentence before continuing.

### Step 6: Write Selected Actions to Todo Files

Update every target todo immediately after its decision is resolved or blocked.

Expected updates:
1. Add or refresh `## Recommended Action`.
2. Record selected action, likely files, scope fence, acceptance criteria additions if needed, and validation command.
3. Append a dated `## Work Log` entry with:
   - decision owner (`@user` or `@lrj-auto`)
   - evidence summary
   - selected action
   - blocked reason, if blocked
4. Keep status accurate:
   - `pending`: selected action recorded, not executing
   - `in_progress`: actively dispatched under `--execute`
   - `complete`: independently validated after execution
   - `blocked`: cannot continue with a concrete blocker

Do not start execution until all targeted non-complete todos have selected actions or explicit blocked reasons written in their files.

Work log template:

```markdown
### YYYY-MM-DD - Triage decisions recorded

**By:** @user | @lrj-auto

**Actions:**
- <selected action or blocked reason>
- <scope fence and validation command>

**Evidence:**
- <cited finding or research fact>
```

### Step 7: Stop Here Unless `--execute` Is Present

If `--execute` is not present, do not build execution batches and do not dispatch execution-agent. Produce a triage-only report with:

- total targeted
- selected-action count
- blocked count with reasons
- already-complete count
- exact next command if execution is appropriate, such as `/workflows:triage <same-scope> --execute`

Then run the final workflow-next-step advisor.

### Step 8: Build Safe Execution Batches

Only run this step when `--execute` is present.

Build the batch plan from the validated selected actions, not from guesses:

1. Exclude `complete` and `blocked` todos.
2. Build a dependency graph across targeted todos.
3. Compare likely file surfaces and validation commands.
4. Put todos in the same batch only when:
   - dependencies are already complete or outside the target set
   - likely file surfaces do not materially overlap
   - they do not require the same migration, schema, shared contract, generated output, or public API change
   - validation can run independently
5. Serialize when parallel safety is unclear.

The orchestrator owns this batch-safety decision and must explain any risky serialization or blocked parallelism.

### Step 9: Dispatch Execution-Agent with the Canonical Scaffold

Before launching `execution-agent`, apply the shared `Named Agent Dispatch` protocol and resolve the concrete subagent identifier. For the generated Claude plugin the resolved identifier is `compound-engineering:workflow:execution-agent`.

Load `commands/workflows/references/execution-agent-prompt.md` using the reference-template loading protocol. Build the execution prompt from that scaffold only. Do not use a custom triage execution skeleton, and do not paste the `execution-agent` body.

Fill every required scaffold section from concrete sources:
- `## Your Unit`: todo title, selected action, likely files, acceptance criteria, validation command, dependencies, parent refs
- `## Ticket-local context`: problem statement, findings, recommended action, evidence facts, scope fence
- `## Why This Unit Exists`: review finding, user-story/plan/ticket refs when available, or todo-derived purpose fallback
- `## Architectural Context`: parent architecture handoff when available, otherwise the affected component context from the vetted brief plus explicit limits
- `## Architecture Handoff`: deletion-test, interfaces, seams, adapters, contracts, and review guidance when available; otherwise a bounded "no broader architecture change authorized" contract
- `## Learnings from Previous Units`: relevant prior execution or solution-doc notes, or "None found in scoped triage"
- `## Project Conventions`: project instructions plus relevant local config
- `## TDD Execution Contract`: resolved local or parent TDD/evidence expectations, including e2e contract when applicable

If a required section cannot be truthfully populated after narrow artifact lookup, mark the todo `blocked` instead of inventing context.

Every execution-agent owns exactly one todo. Never merge multiple todos into one worker prompt.

### Step 10: Orchestration-Side Validation

Never rely only on subagent self-report. After each execution-agent returns, validate independently:

- expected files changed and unrelated files were not touched
- scope fence was respected
- acceptance criteria are true or explicitly blocked
- targeted validation commands ran and passed, or failures are recorded with exact output
- TDD/e2e evidence expectations were met or justified according to the resolved contract
- todo status, selected action, and work log are accurate

Validation should be evidence-focused, not a second broad implementation pass. Inspect diffs, cited files, and command output. If validation fails, dispatch a scoped execution-agent repair with the exact failure context or mark the todo blocked after repeated failure.

Completion log template:

```markdown
### YYYY-MM-DD - Execution completed

**Actions:**
- <implemented change summary>

**Validation:**
- `<command>` - PASS | FAIL
```

### Step 11: Final Sweep and Report

After all target todos are triaged and any requested execution batches finish:

1. Check no targeted todo remains stale without a selected action, completion evidence, or blocked reason.
2. Report counts for selected, complete, blocked, in-progress, and already-complete todos.
3. List validation commands run.
4. List follow-up work created by execution, if any.

Final report format:

```markdown
## Triage Complete

**Total Targeted:** <n>
**Selected / Pending:** <n>
**Complete:** <n>
**Blocked:** <n>
**In Progress:** <n>
**Already Complete:** <n>

### Selected / Pending
- <todo-id> <title> - <selected action>

### Complete
- <todo-id> <title> - <validation evidence>

### Blocked
- <todo-id> <title> - <reason>

### Validation Run
- `<command>` - <result>
```

## Final Phase: Workflow Next Step Advisor

After all targeted todos are triaged, executed when requested, validated, and reported as complete/blocked/in-progress, load the `workflow-next-step` skill.

Run it in advisory mode only:
- pass the current workflow name: `workflows:triage`
- pass the targeted todo paths and any validation or execution-session evidence
- inspect relevant artifacts without mutating them
- output the full core workflow checklist and the exact next-session command with required inputs

This must be the last phase of the workflow. If triage stopped before completion, still run the advisor with the current state so it can mark blockers and recommend the recovery step.
