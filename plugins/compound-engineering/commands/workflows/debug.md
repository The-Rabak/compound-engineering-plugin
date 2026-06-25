---
name: "workflows:debug"
description: Diagnose bugs end-to-end using artifact-first recall, structured reproduction, causal debugging, and fix-or-handoff decision gates
argument-hint: "[bug report, failing command, issue URL, or symptom description]"
---

# Debug a Bug or Failure

This workflow is the first-class debugging lane for compound engineering.

It composes the local stack instead of forcing one prompt to do everything:

- `session-history` for artifact-first recall
- `/reproduce-bug` for reproduction and evidence gathering
- `systematic-debugging` for causal diagnosis
- normal implementation or workflow handoff only after the cause is explicit

Its job is to reach **one honest outcome**:

1. **Fix now** -- the bug is understood well enough for a contained implementation fix
2. **Diagnosis only** -- the root cause or strongest causal chain is known, but implementation should wait
3. **Rethink design** -- the "bug" is really a boundary, ownership, or architecture problem

## Debug Input

<debug_input> #$ARGUMENTS </debug_input>

If the input above is empty, ask the user to provide one of:

- a bug report
- an issue URL or issue number
- a failing command/test
- a symptom description

Do not proceed without a concrete debug target.

## Workflow

### Phase 0: Frame the run

Normalize the debug target and clarify the desired outcome.

If it is not already clear, ask the user which mode they want:

- **Fix now**
- **Diagnosis only**
- **Rethink design**

If the user does not specify a mode, default to:

- **Fix now** for active implementation failures
- **Diagnosis only** for ambiguous reports or early investigation

Also capture:

- expected behavior
- observed behavior
- current confidence in reproduction
- whether the issue looks local, environmental, or structural

### Phase 1: Artifact-first recall

Load the `session-history` skill before doing broad investigation.

Use it to search:

- `docs/solutions/`
- `docs/execution-sessions/`
- `docs/plans/`
- `docs/architecture/`
- `docs/tickets/`
- `docs/brainstorms/`
- other nearby repo artifacts that may explain prior decisions or failed attempts

Only if repo-owned artifacts leave a material gap should you use bounded recent-session history. Keep that fallback tight and summary-only.

Output a short **Prior Context** section before moving on.

### Phase 2: Reproduction and evidence

Use `/reproduce-bug` unless you already have a stable local reproduction and fresh evidence from the current run.

The reproduction pass must leave behind:

- exact repro steps or command
- setup / environment prerequisites
- expected vs observed behavior
- relevant logs, stack traces, screenshots, or failing test output
- status: reproduced, partially reproduced, or blocked

If reproduction is blocked because setup facts are missing, name the blocker explicitly. Do not guess past it.

### Phase 3: Diagnosis

Load the `systematic-debugging` skill.

The diagnosis phase must produce an explicit causal chain:

```text
Trigger -> Mechanism -> Failure
```

If any link in that chain is uncertain, test predictions before moving to implementation.

Do not implement a fix while the causal chain is still fuzzy.

Also perform:

- an assumption audit
- invalidation of failed prior fixes
- a scope check to determine whether this is still a local bug

### Phase 4: Decision gate

Choose the next path honestly.

#### A. Fix now

Only choose this when all of the following are true:

- the bug is reproduced or the evidence is otherwise strong enough
- the causal chain is explicit enough to explain the failure
- the smallest fix is clear
- verification steps are known

If the fix stays small and local, implement it directly in this workflow.

If the fix expands into broader feature or cross-boundary work, stop the debugging run and hand off to `/workflows:plan`, `/workflows:architecture`, `/deepen-plan`, or `/workflows:to-issues` with a concise debug summary instead of letting the debug session sprawl.

#### B. Diagnosis only

Use this when:

- the root cause is known but implementation should wait
- reproduction is partial but the likely cause is already strong
- the user asked for investigation rather than change

Return the diagnosis, confidence, remaining uncertainty, and the best next action.

#### C. Rethink design

Use this when:

- the issue is really wrong feature-home ownership
- shared/global boundaries are dishonest
- a local patch would cement a broken abstraction
- repeated fix attempts fail because the design assumption is wrong

Escalate to the right workflow:

- `/workflows:brainstorm` for reframing the problem
- `/workflows:architecture` for boundary and contract corrections
- `/deepen-plan` or `/workflows:to-issues` when the fix needs a planned execution path

### Phase 5: Output contract

Every run must end with this shape:

```markdown
## Debug Result

- **Mode:** fix now | diagnosis only | rethink design
- **Symptom:** ...
- **Prior context:** ...
- **Reproduction status:** reproduced | partially reproduced | blocked
- **Causal chain:** trigger -> mechanism -> failure
- **Decision:** why this path was chosen
- **Fix or next step:** ...
- **Verification or evidence:** ...
```

## Guardrails

- Do not skip the artifact-first recall step when prior work likely exists.
- Do not skip reproduction when the failure is still only hearsay.
- Do not implement a fix without an explicit causal chain.
- Do not keep debugging locally when the real problem is structural drift.

## Final Phase: Workflow Next Step Advisor

After the debug result is written and any fix/diagnosis/design-escalation decision is clear, load the `workflow-next-step` skill.

Run it in advisory mode only:
- pass the current workflow name: `workflows:debug`
- pass the debug result summary and any artifact paths discovered or changed
- inspect relevant artifacts without mutating them
- output the full core workflow checklist and the exact next-session command with required inputs

This must be the last phase of the workflow. If debugging stopped before completion, still run the advisor with the current state so it can mark blockers and recommend the recovery step.
