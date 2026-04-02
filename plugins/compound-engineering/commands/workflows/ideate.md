---
name: "workflows:ideate"
description: Generate and rank grounded improvement ideas before selecting one to brainstorm
argument-hint: "[optional: focus area, path, or constraint]"
allowed-tools:
  - Skill(ideate)
disable-model-invocation: true
---

# Ideate on Improvements

Use the `ideate` skill to scan the repository, generate a broad candidate set, reject weak ideas, and preserve the strongest survivors in `docs/ideation/` before handing one off to `/workflows:brainstorm`.

Invoke the ideate skill for: $ARGUMENTS
