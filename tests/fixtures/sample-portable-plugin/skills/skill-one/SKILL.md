---
name: skill-one
description: Shared reusable skill.
model: haiku
platforms:
  claude:
    disable-model-invocation: true
  copilot:
    model: gpt-5.4-mini
  codex:
    model: gpt-5.5
    disable-model-invocation: true
---

# Skill One

Use this skill when the user needs a shared portable workflow.
Follow `/workflows:plan` after collecting enough context.
Review `~/.claude/skills/skill-one/notes.md` for local examples.
