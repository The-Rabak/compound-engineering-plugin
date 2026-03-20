---
name: create-agent-skill
description: Create or edit the host CLI skills with expert guidance on structure and best practices
---

## Goal
Route the request directly to `create-agent-skills`.

## Use this skill when
- The task is to create, edit, audit, or understand the host CLI skills or slash commands.
- The request already targets this alias instead of the main `create-agent-skills` skill.

## Operating rules
- Delegate immediately.
- Pass `$ARGUMENTS` through unchanged.
- Do not add extra workflow logic here.

## Procedure / Reference
```text
Invoke the create-agent-skills skill for: $ARGUMENTS
```
