---
name: lrj
description: LEEROY JENKINS - Full autonomous engineering workflow from an existing plan through ticketization, ticket audit, two-batch work/review/triage loops, and validation
argument-hint: "[path to plan file]"
model: opus-4.8
disable-model-invocation: true
---

# LRJ Autonomous Delivery Loop

You are the LRJ coordinator. Coordinate the loop only. Do not do the phase work inline.

LRJ accepts exactly one input: a path or link to an existing implementation plan file.

<plan_file> #$ARGUMENTS </plan_file>

If the input is empty, ambiguous, or not a readable plan file, stop and ask for the plan file path. Do not create a new plan, deepen a plan, or infer the target from recent files.

## Model and Subcontext Rules

Each phase must run in its own isolated subcontext using the highest-grade model available for the harness:

- Codex: `gpt-5.5`
- Claude and other non-Codex harnesses: `opus-4.8`

The main LRJ context is responsible for orchestration, artifact capture, dependency ordering, and validation only. Every phase subcontext may spawn its own subagents and processes according to that command's workflow; coordinate them one phase at a time and wait for each phase to finish before launching the next.

For every phase subcontext:

1. pass only the required input artifacts listed below,
2. require a concise completion report with generated or consumed artifact paths,
3. capture the output paths before continuing,
4. stop immediately if a required artifact is missing or malformed.

## Required Flow

Run exactly this flow:

1. `/workflows:to-issues <plan_file>`
2. Run `ticket-flow-auditor` against the generated ticket set.
3. If the ticket audit flags blocking gaps, repair the ticket files immediately and rerun `ticket-flow-auditor` until no blocking ticket-set gaps remain.
4. Loop over the ticket index in windows of two batches at a time:
   - `/workflows:work <tickets_index_file> --batches <start>-<end>`
   - `/workflows:review <tickets_index_file> <work_execution_session> --batches <start>-<end>`
   - `/workflows:triage <review_todo_range> --auto-recommended --execute` when review creates todos
   - run all project tests and e2e tests for the window, then fix failures immediately
   - create one detailed git commit for all changes made during that two-batch window
5. Repeat until every ticket batch is complete and validated.

Do not run the old plan, deepen, legacy todo resolver, browser-test, or feature-video LRJ phases.

## Phase Contracts

### 1. Ticketize

Launch `/workflows:to-issues` in its own subcontext with this exact input:

```text
<plan_file>
```

The subcontext must return:

- `tickets_index_file`: the generated `docs/tickets/.../index.md`
- `total_batches`: the total number of batches recorded in the ticket index
- any blocking ticketization findings

Stop if `tickets_index_file` is absent or unreadable, or if `total_batches` cannot be determined from the index.

### 2. Ticket-Set Audit Gate

Before implementation starts, run the `ticket-flow-auditor` review agent in its own subcontext with this exact input:

```text
Review Mode: ticket-set audit before execution
Plan: <plan_file>
Tickets index: <tickets_index_file>
```

The audit subcontext must return:

- `blocking_gaps`: ticket contract, dependency, scope, feature-home, context, or batch-safety issues that make implementation unsafe
- `recommendations`: non-blocking improvements
- `batch_safety_notes`: whether the dependency graph and parallel batches are honest enough to execute

If `blocking_gaps` is not empty:

1. Repair the ticket index and ticket files immediately in the main LRJ context.
2. Keep repairs limited to ticket artifacts unless the auditor proves the parent plan must be corrected.
3. Rerun `ticket-flow-auditor` on the repaired ticket set.
4. Do not enter the work loop until the auditor reports no blocking ticket-set gaps.

### 3. Batch Cursor Loop

Initialize `current_batch = 1` and `batch_window = 2`.

While `current_batch <= total_batches`:

1. Set `batch_start = current_batch`.
2. Set `batch_end = min(current_batch + batch_window - 1, total_batches)`.
3. Record the pre-window git status and changed-file baseline.
4. Run one complete work/review/triage/validation/commit cycle for `batch_start-batch_end`.
5. Advance `current_batch = batch_end + 1` only after the full cycle passes validation and its detailed commit exists.

Persist the cursor in the LRJ completion notes after every cycle so the loop can be resumed if interrupted:

```markdown
LRJ cursor:
- tickets_index_file: <tickets_index_file>
- total_batches: <total_batches>
- last_validated_batch: <batch_end>
- last_commit: <commit_sha>
- next_batch: <batch_end + 1>
```

### 4. Work Window

Launch `/workflows:work` in its own subcontext with this exact input:

```text
<tickets_index_file> --batches <batch_start>-<batch_end>
```

The subcontext must execute only the selected ticket batches and return:

- `work_execution_session`: the execution session path or log path for the completed work
- updated ticket index status for the selected batches
- validation evidence produced by the work phase

Stop if `work_execution_session` is absent or if any selected batch still has failed work without an explicit blocker.

### 5. Review Window

Launch `/workflows:review` in its own subcontext with this exact input:

```text
<tickets_index_file> <work_execution_session> --batches <batch_start>-<batch_end>
```

The subcontext must review only the selected batch window against the ticket index and execution session, then return:

- `review_todo_range`: the exact todo range or scope generated by review
- review summary and blocker status

If review produces no todos, set `review_todo_range` to `none` and continue to validation for this batch window.

### 6. Triage Review Todos

If `review_todo_range` is not `none`, launch `/workflows:triage` in its own subcontext with this exact input:

```text
<review_todo_range> --auto-recommended --execute
```

The triage subcontext must:

- research each review todo,
- select the recommended option automatically for every decision,
- write the selected actions into the todo files,
- immediately execute the todos using the existing triage execution flow,
- validate each todo marked `complete` independently,
- return complete/blocked counts and validation evidence.

Stop if triage leaves unblocked review todos incomplete.

### 7. Batch Validation

Run validation from the main LRJ context after every batch-window cycle.

Required validation:

1. Inspect project scripts and test configuration.
2. Run the full test suite.
3. Run e2e tests when the project defines an e2e script, browser-test script, Playwright/Cypress config, or equivalent e2e command. E2E must be real e2e per `commands/workflows/references/e2e-testing-contract.md` (drive the real app, no fakes, no hardcoded/softened passes); a failing e2e means the app is broken — fix the app, never the assertion. The mandatory `e2e-test-strategist` AUDIT reviewer runs automatically inside `/workflows:review`.
4. Run generated-output verification when the repo defines it.

For this plugin repo, the baseline validation commands are:

```bash
bun run build:platforms
bun run verify:generated
bun test
```

If validation fails, fix the failure immediately in the smallest safe scope, rerun the failing command, then rerun `/workflows:review <tickets_index_file> <work_execution_session> --batches <batch_start>-<batch_end>` if the fix touched implementation code. Repeat review, triage, and validation until the batch window is clean or a concrete external blocker prevents progress.

Do not advance the cursor while tests, e2e checks, generated-output verification, review, or triage are failing for the selected batch window.

### 8. Batch Commit

After batch validation passes, create exactly one detailed git commit for all changes made during the selected two-batch window.

Before staging:

1. Compare the current worktree against the pre-window git status baseline.
2. Identify the files changed by the selected batch window, including implementation files, tests, ticket/index status updates, execution-session artifacts, and review/triage todo updates.
3. Do not stage unrelated pre-existing user changes that were present before the batch window.
4. If unrelated pre-existing changes make the batch diff impossible to isolate, stop and report the blocker instead of committing mixed work.

Commit requirements:

- Stage all and only changes made by the selected batch window.
- Use a detailed multi-line commit message.
- Include the batch range, ticket ids or ticket files, work session path, review todo range, validation commands/results, and a concise implementation summary.
- If review or triage produced fixes in the same window, include those fixes in the same window commit.
- If validation repairs were needed, include them in the same window commit and mention the rerun evidence.
- After committing, record `commit_sha` in the LRJ cursor.

Commit message shape:

```text
<type>: complete ticket batches <batch_start>-<batch_end>

Tickets:
- <ticket id or file>
- <ticket id or file>

Work session: <work_execution_session>
Review todos: <review_todo_range>

Changes:
- <implementation summary>
- <test/review/triage repair summary>

Validation:
- <command>: <result>
- <command>: <result>
```

Do not advance the cursor if the commit fails, if there are uncommitted selected-window changes after committing, or if the commit accidentally includes unrelated pre-window changes.

## Completion Report

End with:

```markdown
## LRJ Complete

Plan: <plan_file>
Tickets: <tickets_index_file>
Total batches: <total_batches>
Last validated batch: <last_validated_batch>
Work sessions:
- <batch_start>-<batch_end>: <work_execution_session>
Review todos:
- <batch_start>-<batch_end>: <review_todo_range>
Commits:
- <batch_start>-<batch_end>: <commit_sha>

Validation:
- <command>: <pass/fail>
- <command>: <pass/fail>

Blocked:
- <none or concrete blocker>
```

Output `<promise>DONE</promise>` only after all required phases and validation pass.
