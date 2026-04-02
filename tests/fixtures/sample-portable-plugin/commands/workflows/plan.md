---
name: workflows:plan
description: Turn a request into an execution plan.
argument-hint: "[feature or bug]"
model: haiku
platforms:
  claude:
    allowed-tools:
      - Read
      - Write
    disable-model-invocation: true
  copilot:
    model: gpt-5.4-mini
---

Task repo-research-analyst(find relevant repository patterns)
