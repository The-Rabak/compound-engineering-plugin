---
name: systematic-debugging
description: Use when debugging unexpected errors during implementation -- provides a structured 4-phase methodology instead of trial-and-error
model: claude-sonnet-4-6
---

# Systematic Debugging

A structured methodology for debugging unexpected errors encountered during implementation. Prevents trial-and-error guessing by enforcing a disciplined observe-hypothesize-test-fix cycle with an explicit causal-chain gate.

**Announce at start:** "I'm using the systematic-debugging skill to diagnose this issue."

## When to Use

- A test fails unexpectedly during implementation
- An error occurs that you did not anticipate
- A subagent has retried 2+ times without success
- Something "should work" but does not
- You are tempted to make random changes hoping something fixes it

## When NOT to Use

- The error message is clear and the fix is obvious (just fix it)
- You are validating a reported bug (use the `bug-reproduction-validator` agent instead)
- The failure is a known issue documented in `docs/solutions/`

## The 4-Phase Process

### Phase 1: Observe

Gather evidence before forming any theories. Do not skip this phase.

1. **Reproduce the error** -- Run the exact command that failed. Confirm you see the same error.
2. **Read the full error** -- Read the COMPLETE error message, stack trace, and any surrounding output. Do not skim.
3. **Check the context** -- What changed recently? What was the last thing that worked? What is different now?
4. **Gather state** -- Check relevant logs, database state, environment variables, configuration files, or any other state that could be relevant.
5. **Note the symptoms** -- Write down exactly what you observe:
   - What happens (the error)
   - What should happen (expected behavior)
   - When it happens (always, sometimes, under specific conditions)
6. **Define the boundary** -- Identify the failing surface precisely:
   - entry point
   - affected module or feature home
   - dependencies involved
   - whether this looks local, environmental, or cross-boundary
7. **Record prior attempts** -- What fixes or hypotheses were already tried? Which ones failed?

**Output of Phase 1:** A clear, factual description of the symptoms with no theories attached.

### Phase 2: Hypothesize

Form structured theories about the root cause. Do not jump to fixing yet.

1. **List 3 possible root causes** ranked by likelihood.

2. **For each hypothesis, write the causal chain explicitly:**

   ```text
   Trigger -> Mechanism -> Failure
   ```

   Example:

   ```text
   Empty cache key -> config loader returns fallback shape -> validator receives missing field -> request fails with 500
   ```

3. **Identify the uncertain links** in each chain.

4. **For each hypothesis, define:**
   - What evidence would confirm it
   - What evidence would rule it out
   - One prediction the system should make if the hypothesis is true
   - How to test that prediction without implementing the fix yet

5. **Run a lightweight assumption audit:**
   - Which inputs am I assuming are valid?
   - Which environment facts am I assuming are true?
   - Which "this should never happen" beliefs need verification?

**Do NOT:**
- Start fixing before completing this phase
- Settle on one theory without considering alternatives
- Assume the most obvious cause is correct without verification
- Proceed without at least one explicit trigger -> mechanism -> failure chain

### Phase 3: Test

Verify or eliminate each hypothesis systematically. Start with the most likely.

1. **Test the most likely hypothesis first:**
   - Add a diagnostic check (log statement, assertion, breakpoint, print)
   - Run the failing scenario
   - Does the evidence confirm or rule out this hypothesis?

2. **If confirmed:** Move to Phase 4 (Fix)
3. **If ruled out:** Test the next hypothesis
4. **If all 3 ruled out:** Return to Phase 2 with new hypotheses based on what you learned

For every uncertain link in the causal chain, test a prediction:

- "If the config is malformed before validation, the raw config dump should already be missing field X"
- "If the queue worker is using stale code, restarting it should change the stack frame path"
- "If the issue is permission-based, the same request should succeed under the admin fixture"

**Techniques:**
- **Binary search:** Comment out half the changes, see if the error persists. Narrow down.
- **Isolation:** Run the failing code in isolation (unit test, REPL, minimal reproduction)
- **Comparison:** Compare working state (git stash, previous commit) with broken state
- **Minimal reproduction:** Create the smallest possible case that reproduces the error

**Do NOT:**
- Make changes to fix the problem while still in this phase
- Skip hypotheses because you "feel" the first one is right
- Change multiple things at once (change one variable at a time)
- Keep trusting a hypothesis after a failed fix or failed prediction. Invalidate it and loop back explicitly.

### Phase 4: Fix

Apply a targeted fix to the confirmed root cause. You are only allowed to enter this phase once the causal chain is explicit enough to explain why the failure happens.

1. **Fix the root cause** -- not the symptom. If the error is "undefined is not a function," the fix is not adding a null check -- it is understanding WHY the value is undefined and fixing THAT.

2. **Make the minimal fix** -- Change as little as possible. Do not refactor, clean up, or "improve" other code while fixing the bug.

3. **Verify the fix:**
   - Run the exact same command/test that originally failed
   - Confirm it passes
   - Run related tests to check you did not break anything else
   - If the fix introduces new failures, return to Phase 1 with the new error

4. **Check for siblings** -- Is this same bug likely to exist in similar code elsewhere? If so, fix those too.

5. **Remove diagnostics** -- Remove any log statements, debug prints, or breakpoints added during Phase 3.

6. **Invalidate failed fixes explicitly** -- If the attempted fix does not hold, say what part of the chain was wrong and return to Phase 1 or 2. Never silently stack another guess on top.

### Design Escalation Gate

Stop treating the problem as a local bug and recommend a design-level workflow when any of these are true:

- the real fix changes feature-home ownership or shared/global boundaries
- the failure exposes a wrong abstraction, wrong contract, or missing seam
- multiple attempted local fixes fail because the architecture assumption is wrong
- the smallest honest fix is no longer small

When that happens, recommend `/workflows:debug` for orchestration or escalate to `/workflows:brainstorm`, `/workflows:architecture`, or `/deepen-plan` as appropriate.

## After Debugging

### Document the Root Cause

Include in your execution report:

```markdown
### Debugging Session
- **Symptom:** [what failed]
- **Causal chain:** [trigger -> mechanism -> failure]
- **Root cause:** [what was actually wrong]
- **Fix:** [what was changed]
- **Prevention:** [how to prevent this in the future]
```

This information feeds into the learnings brief for subsequent tasks and can be captured in `docs/solutions/` via `/workflows:compound`.

### Feed Forward

If you discovered a pattern that would help prevent this issue in the future:
- Note it in the "Patterns Discovered" section of your execution report
- The orchestrator will add it to the learnings brief for subsequent tasks

## Anti-Patterns (What NOT to Do)

- **Shotgun debugging:** Making random changes hoping something works. Always hypothesize first.
- **Fix-and-pray:** Applying a fix without understanding why it works. If you cannot explain the root cause, you have not found it.
- **Stack Overflow driven development:** Copying a fix from the internet without understanding what it does or why it applies to your situation.
- **Symptom masking:** Adding a try/catch, null check, or default value that hides the real problem instead of fixing it.
- **Tunnel vision:** Fixating on one hypothesis without considering alternatives. The first theory is often wrong.
- **Chainless fixing:** Changing code before you can state the trigger -> mechanism -> failure path with reasonable confidence.
