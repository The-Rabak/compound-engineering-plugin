---
name: lrj
description: Full autonomous engineering workflow
argument-hint: '[feature description]'
platforms:
  claude:
    disable-model-invocation: true
---

Run these slash commands in order. Do not do anything else.

1. `/workflows:plan $ARGUMENTS`
2. `/compound-engineering:deepen-plan`
3. `/workflows:work` -- this is the default Ralph-driven execution path and should emit red, green, and post-refactor green evidence unless the plan declares an explicit exception
4. `/workflows:review`
5. `/compound-engineering:resolve_todo_parallel`
6. `/compound-engineering:test-browser`
7. `/compound-engineering:feature-video`
8. Output `<promise>DONE</promise>` when video is in PR

Start with step 1 now.
