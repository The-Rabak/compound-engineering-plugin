---
name: "workflows:compound-refresh"
description: Refresh stale learnings and pattern docs in docs/solutions/ against the current codebase
argument-hint: "[mode:autonomous] [optional: scope hint]"
allowed-tools:
  - Skill(compound-refresh)
  - Skill(workflow-next-step)
disable-model-invocation: true
---

# Refresh Compounded Learnings

Use the `compound-refresh` skill to review `docs/solutions/`, update drifted learnings, replace misleading guidance, archive obsolete docs, and report what changed or still needs attention.

Invoke the compound-refresh skill for: $ARGUMENTS

## Final Phase: Workflow Next Step Advisor

After the `compound-refresh` skill reports what changed or still needs attention, load the `workflow-next-step` skill.

Run it in advisory mode only:
- pass the current workflow name: `workflows:compound-refresh`
- pass any refreshed, archived, or blocked `docs/solutions/` paths reported by the refresh
- inspect relevant artifacts without mutating them
- output the full core workflow checklist and the exact next-session command with required inputs

This must be the last phase of the workflow. If refresh stopped before completion, still run the advisor with the current state so it can mark blockers and recommend the recovery step.
