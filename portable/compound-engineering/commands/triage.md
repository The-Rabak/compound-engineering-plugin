---
name: triage
description: Triage review todos, resolve open decisions one-by-one, then orchestrate execution-agent runs with strict per-item validation
argument-hint: '[todo range or scope]'
platforms:
  claude:
    disable-model-invocation: true
---

- Read all target todo files before asking decisions.
- Keep main context as orchestration + validation space; execution agents do implementation.

Use this command when you need to process review todos end-to-end:

1. triage each todo,
2. resolve open questions with the user,
3. write decisions into todo files,
4. execute todos one at a time via execution-agent with full context packets,
5. validate each result independently,
6. close statuses cleanly.

## Core Rule Set

**IMPORTANT: During triage/decision phases, DO NOT implement code fixes.**

This command is for:

- Review-todo triage and decision closure
- Converting vague todos into executable units
- Sequential execution-agent dispatch with rich context
- Independent orchestration-side validation and status control

## Workflow

### Step 1: Bootstrap and Scope

1. Load project context and memory first.
2. Identify target todos from user scope (range, priority, status, or "all open").
3. Build a deterministic queue sorted by todo id.

Recommended checks:

```bash
rg '^status:\s*(pending|in_progress|ready)' todos/*.md
```

### Step 2: Read and Triage All Target Todos

Read each todo fully before asking any question. Capture:

- Problem statement quality
- Missing decisions or unresolved options
- Dependency and ordering concerns
- Validation expectations
- Coupled files/tests/docs likely needed for execution

Present triage output per todo in this format:

```markdown
---
Todo #NNN: [Title]

Status: [pending/in_progress/ready]
Priority: [p1/p2/p3]
Dependencies: [none/list]

Open Decisions:
1. [Decision question]
2. [Decision question]

Execution Risks:
- [Risk]

Initial Recommendation:
- [Suggested choice and why]
---
```

### Step 3: Resolve Open Decisions (One Question at a Time)

Ask only one question at a time. Do not batch decisions.

Decision prompt format:

```markdown
Decision for Todo #NNN:
[Clear question]

Recommended: [option]
1. [option A]
2. [option B]
3. [option C]
```

Rules:

- Wait for explicit answer before asking next question.
- If user gives freeform decision, normalize it and confirm in one sentence.
- No implementation starts until decisions for that todo are resolved.

### Step 4: Write Decisions Back into Todo Files

Update todo files immediately after each resolved decision.

Expected updates:

1. Add/refresh `## Recommended Action`
2. Append `## Work Log` entry with decision outcome
3. Keep status accurate:
   - stays `pending` after triage-only updates
   - moves to `in_progress` when execution starts
   - moves to `done` only after independent validation passes

Work log template:

```markdown
### YYYY-MM-DD - Triage decisions recorded

**By:** @user

**Actions:**
- [Decision 1 captured]
- [Decision 2 captured]

**Learnings:**
- [Why this direction was chosen]
```

### Step 5: Build an Execution Packet per Todo

Before launching execution-agent, prepare a full context packet. Do not send minimal prompts.

Every packet must include:

- Repository path and branch
- Exact todo file path and title
- Goal and acceptance criteria
- Resolved decisions (explicitly listed)
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

## Likely Files
- [file]
- [file]

## Validation Contract
- run/update tests relevant to this todo
- report red/green/post-refactor evidence
- provide changed files and rationale
```

### Step 6: Execute One Todo at a Time via execution-agent

For each todo in queue:

1. Set todo status to `in_progress`
2. Dispatch execution-agent in sync mode with full packet
3. Review execution report
4. Validate independently from orchestration context
5. If validation fails, keep `in_progress`, refine packet, and re-run
6. On success, set status to `done` and log completion evidence in todo

Do not run parallel execution agents for this workflow unless user asks for parallelism.

### Step 7: Orchestration-Side Validation (Mandatory)

Never rely only on subagent self-report. Orchestrator validates.

Validation checklist per todo:

- targeted tests pass for changed area
- expected files actually changed
- scope fence was respected
- todo acceptance criteria now true
- todo status/frontmatter/log updated

Completion log template:

```markdown
### YYYY-MM-DD - Execution completed

**Actions:**
- [Implemented change summary]

**Validation:**
- `command 1`
- `command 2`
```

### Step 8: Final Sweep and Completion Report

After all todos processed:

1. Check no target todo remains `pending`/`in_progress`
2. Report done/incomplete counts
3. List any blocked items with exact blocker

Final report format:

```markdown
## Triage + Execution Complete

**Total Targeted:** [X]
**Done:** [Y]
**Still Open:** [Z]

### Done
- [todo-id] [title]

### Still Open / Blocked
- [todo-id] [reason]

### Validation Run
- [key command]
- [key command]
```

## Example Interaction Flow

```markdown
Todo #057 has one open decision: auth hardening now vs defer.
Recommendation: defer auth to next phase and document deployment constraint.

Which direction do you want?
1. Defer auth now and document constraints (Recommended)
2. Implement auth hardening now
```

Then:

```markdown
Recorded decision in `todos/057-...md`.
Now dispatching execution-agent for todo 057 with full packet.
```

Then:

```markdown
Todo 057 implemented and validated.
Status updated to done.
Proceeding to todo 058.
```

## Important Implementation Details

### Status Discipline

- `pending`: triaged but not executing
- `in_progress`: actively executing/iterating
- `done`: validated and closed
- `blocked`: cannot continue; include concrete blocker

### Context Discipline

- Main context owns orchestration, decisions, validation, and status integrity.
- execution-agent owns code edits for one scoped todo at a time.
- Do not duplicate the same implementation work in both contexts.

### Decision Discipline

- Ask one decision question at a time.
- Write answers into todo immediately.
- Never "assume defaults" if user decision is explicitly required.

### Execution Prompt Quality Bar

Bad packet:
- "Implement todo 059"

Good packet:
- includes decisions, acceptance criteria, scope fence, likely files, and tests.

### Do / Don't

- ✅ Do triage all targeted todos before heavy execution when user asks for prep.
- ✅ Do capture recommendations before asking decisions.
- ✅ Do validate each completed todo independently.
- ✅ Do keep todo files as source of truth.
- ❌ Don't code during triage-only phase.
- ❌ Don't ask multiple decisions in one message.
- ❌ Don't mark done before orchestration-side validation.
- ❌ Don't drop decision outcomes from todo logs.

## Done Options

When all targeted todos are processed, end with:

```markdown
What would you like to do next?

1. commit and push current completed todo batch
2. stop here
```
