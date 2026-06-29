---
name: reproduce-bug
description: Reproduce a bug and collect structured evidence for diagnosis, fix planning, or escalation
argument-hint: '[issue number, issue URL, failing command, or bug description]'
platforms:
  codex:
    model:
  claude:
    disable-model-invocation: true

---

# Reproduce Bug Command

This command's job is to produce a **credible reproduction record and evidence pack**.

It is **not** a generic "keep poking until you have a theory" loop. Diagnosis can follow, but the primary contract here is:

1. normalize the bug report
2. establish the environment/setup requirements
3. reproduce the issue or prove why reproduction is currently blocked
4. collect bounded evidence for the next debugging step

If the arguments reference a GitHub issue or tracker URL, read the issue description and relevant comments first.
If the arguments are a failing command, error text, or plain bug description, treat that as the bug intake directly.

## Phase 0: Normalize the Intake

Before doing any deep investigation, write down:

- **Expected behavior**
- **Observed behavior**
- **Known trigger or user flow**
- **Surface type**: CLI / API / background job / browser / visual / unknown
- **Requested outcome**: reproduce only, gather evidence, or prepare for full debug/fix

If key inputs are missing, ask for them instead of inventing a repro story.

## Phase 1: Artifact-First Research

Load the `session-history` skill first so you can search repo-owned artifacts before falling back to transient session history.

Then run one focused research pass.

Before dispatching `repo-research-analyst` or `learnings-researcher`, use the platform's file-search tool against the bundled agent directory to look for `<agent-name>.md`, then use the file-read tool to load the full template. Only if the bundled template cannot be loaded should you fall back to `ov_load_global_agent "<agent-name>"`. Before dispatching, quote the first non-empty line of the loaded template and record the source used. If you cannot quote the template because it was not found or could not be read, stop execution, raise the missing-template issue, and do not dispatch. Never dispatch a named agent by name alone.

Run in parallel:

1. `repo-research-analyst` -- map likely code paths, entry points, logs, and neighboring modules
2. `learnings-researcher` -- look for prior fixes or known failure patterns in `docs/solutions/`

Do **not** keep rerunning the same agents in a fuzzy loop. Only rerun if new evidence materially changes the target area.

## Phase 2: Establish the Reproduction Contract

Before attempting reproduction, identify the minimum setup required:

- branch / commit / environment
- seed data or fixtures
- user account / permissions / feature flags
- services that must be running
- migrations or background workers
- external dependencies or mock requirements

If any of these are unknown or missing, surface that as a reproduction blocker. Do not pretend the bug was "not reproducible" when the environment was incomplete.

## Phase 3: Choose the Reproduction Lane

Pick the narrowest lane that can produce trustworthy evidence.

### Lane A: CLI / API / test / server-side reproduction

Prefer this lane when the issue can be shown through:

- a failing test
- a failing command
- a request/response path
- logs or stack traces
- a minimal script or fixture

Try to reduce the scenario to the smallest repeatable command or input set.

### Lane B: Browser or visual reproduction

Use browser automation only when the bug truly lives in a user flow, UI state transition, or visual rendering path.

If using `agent-browser`:

1. verify the target server is running
2. navigate only to the relevant area
3. capture snapshots/screenshots only at meaningful checkpoints
4. record the exact sequence of user actions and resulting console/network evidence

Browser work is **conditional**, not the default center of the workflow.

## Phase 4: Reproduce or Prove the Blocker

Attempt the reproduction with the chosen lane.

For every serious attempt, record:

- the exact command or user steps
- relevant inputs and setup
- expected result
- actual result
- logs, stack traces, screenshots, or console output
- whether the issue reproduced, partially reproduced, or stayed blocked

Stop once you have one of these outcomes:

1. **Reproduced** -- the bug occurs reliably enough to hand off
2. **Partially reproduced** -- some symptoms match, but a condition is still missing
3. **Blocked** -- reproduction cannot continue until a named dependency or missing fact is provided

Do not continue indefinitely once the outcome is clear.

## Phase 5: Structured Handoff

Return a concise evidence pack using this shape:

```markdown
## Reproduction Result

- **Status:** reproduced | partially reproduced | blocked
- **Expected:** ...
- **Observed:** ...
- **Setup / prerequisites:** ...
- **Exact repro steps or command:** ...
- **Evidence:** logs / stack traces / screenshots / failing test output
- **Likely touchpoints:** `path/to/file`, `path/to/other/file`
- **Open uncertainty:** ...
- **Recommended next step:** `/workflows:debug` | `systematic-debugging` | direct fix | ask for missing setup
```

If you found a likely cause, label it as a **hypothesis** unless it was verified by evidence.

## Guardrails

- Do not post issue comments unless the user explicitly asked for that side effect.
- Do not claim a bug is fixed from this command alone.
- Do not blur reproduction and diagnosis into one unstructured narrative.
- Do not keep looping after the run is clearly reproduced or clearly blocked.
