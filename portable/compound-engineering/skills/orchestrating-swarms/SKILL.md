---
name: orchestrating-swarms
description: >-
  This skill should be used when orchestrating multi-agent swarms using Claude Code's TeammateTool
  and Task system. It applies when coordinating multiple agents, running parallel code reviews,
  creating pipeline workflows with dependencies, building self-organizing task queues, or any task
  benefiting from divide-and-conquer patterns.
model: claude-sonnet-4.6
platforms:
  claude:
    disable-model-invocation: true
  copilot:
    model: gpt-5.3-codex
  opencode:
    model: openrouter/moonshotai/kimi-k2.6
---

# orchestrating-swarms Skill

Use swarms when the work has real parallelism, specialist boundaries, or dependency staging. If one agent can finish faster than the coordination overhead, stay single-threaded.

## When to use
- Parallel research, review, or implementation tracks.
- Pipeline work where one stage unlocks another.
- Large tasks that benefit from specialist prompts and explicit handoffs.
- Situations where a leader must merge findings from multiple workers.

## Workflow
1. Decide whether you need a swarm. Prefer one agent for linear work, tiny diffs, or tasks with one obvious path.
2. Break the job into independent units with owners, dependencies, and a concrete finish condition for each unit.
3. Choose the right worker shape: short-lived subagents for one-off work, persistent teammates only when shared coordination is necessary.
4. Give every worker full context: goal, scope, constraints, expected output, and what not to touch.
5. Track progress, unblock dependencies, merge results, verify the combined outcome, then shut the swarm down cleanly.

## Operating guide
### Subagent vs teammate
- Use a normal Task/subagent when you want a focused result returned directly.
- Use a teammate only when the worker needs a shared queue, persistent inbox messaging, or multi-step coordination.
- Keep the team small. Extra workers are justified only when they remove wall-clock time or increase specialist quality.

### Task design
- Write tasks as outcomes, not vague topics.
- Keep scopes non-overlapping unless the assignment is an explicit cross-check.
- Prefer DAG-style dependencies over ad hoc sequencing.
- State what evidence counts as done: files changed, tests run, findings delivered, screenshots captured, or open questions listed.

### Message contract
Have workers report in a terse, machine-checkable shape:
- `status`: ready | blocked | done
- `scope`: what they owned
- `evidence`: commands, files, screenshots, or metrics
- `handoff`: what the next worker or leader must do
- `risks`: unresolved concerns

### Leader responsibilities
- Keep the canonical task list and dependency map.
- Resolve blockers instead of letting workers stall silently.
- Merge duplicate findings and remove contradictory advice.
- Re-run shared verification after integrating worker output.
- Shutdown teammates after their work is accepted.

## Output
- Swarm plan: workers, scopes, dependencies, and completion signals.
- Progress log: blocked vs active vs done.
- Final synthesis: merged findings, verification evidence, and remaining risks.

## Guardrails
- Do not use a swarm as a substitute for thinking through the decomposition.
- Do not create overlapping workers without saying why overlap is useful.
- Do not dispatch named specialists without their full template or operating contract.
- Do not accept worker claims without evidence you can trace.
- Always close the loop with integrated verification, not just per-worker success.
