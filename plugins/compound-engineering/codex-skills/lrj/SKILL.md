---
name: lrj
description: Full autonomous engineering workflow
argument-hint: "[feature description]"
model: gpt-5.5
disable-model-invocation: true
---

## Arguments
[feature description]

Run these slash commands in order. Do not do anything else.

1. `$workflows-plan skill $ARGUMENTS`
2. `$deepen-plan skill`
3. `$workflows-work skill` -- this is the default Ralph-driven execution path and should emit red, green, and post-refactor green evidence unless the plan declares an explicit exception
4. `$workflows-review skill`
5. `$resolve_todo_parallel skill`
6. `$test-browser skill`
7. `$feature-video skill`
8. Output `<promise>DONE</promise>` when video is in PR

Start with step 1 now.
