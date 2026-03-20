---
name: workflows:plan
description: Turn a request into an execution plan.
argument-hint: "[feature or bug]"
platforms:
  claude:
    allowed-tools:
      - Read
      - Write
    disable-model-invocation: true
---

Task repo-research-analyst(find relevant repository patterns)
