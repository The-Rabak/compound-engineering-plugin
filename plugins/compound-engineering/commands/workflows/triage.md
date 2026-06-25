---
name: "workflows:triage"
description: Research each todo, resolve decisions one-by-one, write chosen actions into todo files, then execute safe batches in swarm mode with execution-agent
argument-hint: "[todo range or scope] [--auto-recommended] [--execute]"
model: opus-4.8
disable-model-invocation: true
---

- Read all target todo files before asking decisions.
- Keep main context as orchestration, research, decision, and validation space; execution agents do implementation.
- Do not start execution until all targeted todos are fully triaged and updated in place.
- If invoked with `--auto-recommended`, select the researched recommended action for every open decision without asking the user.

Use this command when you need to process review todos end-to-end:

1. research each todo against the current codebase,
2. present grounded action options to the user,
3. resolve open questions one-by-one,
4. write the selected action and context back into every todo file,
5. build safe swarm batches with dedicated execution scopes,
6. orchestrate execution-agent runs with full packets,
7. validate each result independently,
8. close statuses cleanly.

## Core Rule Set

**IMPORTANT: During research and decision phases, DO NOT implement code fixes.**

This command is for:

- Review-todo triage and decision closure
- Converting vague todos into researched, executable units
- Writing action-ready todo files before execution starts
- Swarm orchestration with strict scope fences and independent validation

## Workflow

### Step 1: Bootstrap and Scope

1. Load project context and memory first.
2. Identify target todos from user scope (range, priority, status, or "all open").
3. Build a deterministic queue sorted by todo id.
4. Confirm dependency order before any execution planning.

Recommended checks:

```bash
rg '^status:\s*(pending|in_progress|blocked|complete)' todos/*.md
```

### Step 2: Read and Research Every Target Todo Before Asking Decisions

Read each todo fully before asking any question. Then do focused repository research for that todo so your proposed actions are grounded in reality rather than guesswork.

Research for each todo should cover:

- Problem statement quality and missing acceptance criteria
- Relevant code paths, modules, tests, docs, and prior patterns
- Dependency and ordering concerns
- Likely implementation surface and blast radius
- Validation expectations and evidence commands
- Risks, blockers, or ambiguity that should shape the decision

The research pass must produce concrete action options. Do not present shallow "maybe do X" suggestions; each option must reflect what you found in the codebase.

Present triage output per todo in this format:

```markdown
---
Todo #NNN: [Title]

Status: [pending/in_progress/blocked/complete]
Priority: [p1/p2/p3]
Dependencies: [none/list]

Research Summary:
- Relevant files: [file], [file]
- Existing pattern: [summary]
- Validation surface: [tests/checks]

Possible Actions:
1. [Action name] - [what changes] - [main tradeoff]
2. [Action name] - [what changes] - [main tradeoff]
3. [Action name] - [what changes] - [main tradeoff]

Recommended Action:
- [Suggested action and why]

Open Decisions:
1. [Decision question]
2. [Decision question]

Execution Risks:
- [Risk]
---
```

### Step 3: Resolve Open Decisions One Question at a Time

Ask only one question at a time. Do not batch decisions.

Automation mode:

- If the scope includes `--auto-recommended`, do not ask decision questions.
- For every open decision, choose the researched Recommended Action.
- Record the decision as `@lrj-auto` in the todo work log with the evidence-backed reason.
- Continue directly into execution after all targeted todos are updated.
- If no Recommended Action can be defended from the research, mark that todo `blocked` with the missing evidence instead of guessing.

Decision prompt format:

```markdown
Decision for Todo #NNN:
[Clear question]

Research-backed options:
1. [option A]
2. [option B]
3. [option C]

Recommended: [option]
Why: [brief evidence-based reason]
```

Rules:

- Wait for explicit answer before asking the next question.
- If user gives freeform direction, normalize it and confirm in one sentence.
- No implementation starts until the full target set has been triaged and all required decisions are resolved.

### Step 4: Write the Selected Action Back into Every Todo File

Update todo files immediately after each resolved decision so the todo becomes the authoritative execution packet seed.

Expected updates:

1. Add or refresh `## Recommended Action`
2. Record the chosen action, scope fence, likely files, and validation commands
3. Append `## Work Log` entry with decision outcome and research summary
4. Keep status accurate:
   - stays `pending` after triage-only updates
   - moves to `in_progress` only when the todo is dispatched to execution
   - moves to `complete` only after independent validation passes

Work log template:

```markdown
### YYYY-MM-DD - Triage decisions recorded

**By:** @user

**Actions:**
- [Selected action recorded]
- [Scope fence or dependency decision recorded]

**Learnings:**
- [Relevant codebase pattern discovered]
- [Why this direction was chosen]
```

### Step 5: Build a Swarm Plan After All Todos Are Triaged

Do not execute immediately after the first todo is approved. First finish triage for the full target set, then build a safe execution plan.

Create:

1. A dependency graph across all targeted todos
2. A file-overlap and blast-radius check
3. Parallel-safe batches where each todo has a dedicated scope
4. A fallback serialization rule for any items that overlap too much

Only put todos in the same swarm batch when:

- their dependencies are already complete or outside the target set,
- their likely file surfaces do not materially overlap,
- they do not require the same migration, schema, or shared contract change,
- their validation can run independently.

If parallel safety is unclear, split the work into smaller or serial batches.

### Step 6: Build a Full Execution Packet per Todo

Before launching execution-agent, prepare a full context packet. Do not send minimal prompts.

Every packet must include:

- Repository path and branch
- Exact todo file path and title
- Goal and acceptance criteria
- Research summary and selected action
- Explicitly resolved decisions
- Scope fence (what not to change)
- Likely files and tests
- Validation expectations
- Reporting contract (what execution-agent must return)

Execution packet skeleton:

```markdown
AGENT_TEMPLATE loaded via local agent repository. Follow exactly.

Repository: [path]
Branch: [branch]

## Your Unit
Todo file: [path]
Title: [title]
Goal: [goal]

## Selected Action
- [final action]

## Research Summary
- [existing pattern]
- [relevant files]
- [validation surface]

## Decisions (Final)
- [decision]
- [decision]

## Architecture Handoff
Acceptance criteria:
1. [...]
2. [...]

Scope fence:
- [...]
- [...]

Likely files:
- [file]
- [file]

Validation contract:
- run/update tests relevant to this todo
- report red/green/post-refactor evidence
- provide changed files and rationale
```

### Step 7: Execute in Swarm Mode with Dedicated Scopes

Execute by safe batch, not by one giant parallel blast and not by immediate one-off serial runs.

For each safe batch:

1. Set each batch todo status to `in_progress`
2. Dispatch one `execution-agent` per todo with its full packet and dedicated scope
3. Keep the orchestrator focused on batch coordination, validation, and status integrity
4. Wait for every agent in the batch to complete
5. Review each execution report separately
6. Validate each todo independently from the orchestration context
7. Mark validated todos `complete`; keep failures `in_progress` or `blocked` with exact reasons
8. Only advance dependent batches after prerequisites are truly complete

Hard rules:

- Every execution-agent owns exactly one todo scope at a time.
- Do not merge multiple todos into one agent prompt.
- Do not allow two agents to edit the same unstable surface unless the batch plan explicitly proves safety.
- If one todo in a batch fails, do not discard successful siblings; validate and close each todo independently.

### Step 8: Orchestration-Side Validation (Mandatory)

Never rely only on subagent self-report. Orchestrator validates.

Validation checklist per todo:

- targeted tests pass for the changed area
- expected files actually changed
- scope fence was respected
- todo acceptance criteria are now true
- todo status, selected action, and work log are updated

Completion log template:

```markdown
### YYYY-MM-DD - Execution completed

**Actions:**
- [Implemented change summary]

**Validation:**
- `command 1`
- `command 2`
```

### Step 9: Final Sweep and Completion Report

After all todos are processed:

1. Check no target todo remains stale without explanation
2. Report complete, blocked, and in-progress counts
3. List any follow-up work created by the execution batches

Final report format:

```markdown
## Triage + Swarm Execution Complete

**Total Targeted:** [X]
**Complete:** [Y]
**Still Open:** [Z]

### Complete
- [todo-id] [title]

### Still Open / Blocked
- [todo-id] [reason]

### Validation Run
- [key command]
- [key command]
```

## Important Implementation Details

### Status Discipline

- `pending`: triaged and documented, but not executing yet
- `in_progress`: actively executing or retrying
- `complete`: validated and closed
- `blocked`: cannot continue; include concrete blocker

### Context Discipline

- Main context owns research, decisions, swarm planning, validation, and status integrity.
- execution-agent owns code edits for one scoped todo at a time.
- Do not duplicate the same implementation work in both contexts.

### Decision Discipline

- Research before presenting options.
- Ask one decision question at a time.
- Write answers into the todo immediately.
- Never "assume defaults" if user decision is explicitly required, except when `--auto-recommended` explicitly authorizes the researched recommended action.

### Swarm Planning Quality Bar

Bad swarm plan:
- "Run all open todos in parallel"

Good swarm plan:
- groups only dependency-safe, low-overlap todos into the same batch
- gives each todo its own packet, scope fence, and validation path
- serializes risky overlaps instead of pretending they are safe

### Do / Don't

- ✅ Do research each todo before presenting options.
- ✅ Do capture possible actions grounded in the current codebase.
- ✅ Do update all targeted todo files before starting execution.
- ✅ Do batch execution in swarm mode only when scopes are truly parallel-safe.
- ✅ Do validate each completed todo independently.
- ❌ Don't code during the research and decision phase.
- ❌ Don't ask multiple decisions in one message.
- ❌ Don't start execution before the target set is fully triaged.
- ❌ Don't mark complete before orchestration-side validation.
- ❌ Don't drop selected actions or research findings from todo logs.

## Done Options

When all targeted todos are processed, end with:

```markdown
What would you like to do next?

1. commit and push current completed todo batch
2. stop here
```

## Final Phase: Workflow Next Step Advisor

After all targeted todos are triaged, executed when requested, validated, and reported as complete/blocked/in-progress, load the `workflow-next-step` skill.

Run it in advisory mode only:
- pass the current workflow name: `workflows:triage`
- pass the targeted todo paths and any validation or execution-session evidence
- inspect relevant artifacts without mutating them
- output the full core workflow checklist and the exact next-session command with required inputs

This must be the last phase of the workflow. If triage stopped before completion, still run the advisor with the current state so it can mark blockers and recommend the recovery step.
