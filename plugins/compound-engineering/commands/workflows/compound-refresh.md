---
name: "workflows:compound-refresh"
description: Refresh stale learnings and pattern docs in docs/solutions/ against the current codebase
argument-hint: "[mode:autonomous] [optional: scope hint]"
allowed-tools:
  - Skill(compound-refresh)
disable-model-invocation: true
---

# Refresh Compounded Learnings

Use the `compound-refresh` skill to review `docs/solutions/`, update drifted learnings, replace misleading guidance, archive obsolete docs, and report what changed or still needs attention.

Invoke the compound-refresh skill for: $ARGUMENTS
