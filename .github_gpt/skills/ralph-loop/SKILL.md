---
name: ralph-loop
description: Start a self-referential loop that continues until a completion promise is met
---

## Goal
Start a self-referential loop that keeps re-entering until a completion promise is emitted or the iteration limit is reached.

## Use this skill when
- The user wants an autonomous retry loop.
- A task should keep re-running until an explicit completion signal is produced.

## Operating rules
- Run the setup script before starting the loop.
- Pass the prompt, completion promise, and max iterations exactly as arguments.
- After setup, continue with the requested prompt and rely on the stop hook to re-feed the loop.
- Signal completion with the exact promise wrapper.

## Procedure / Reference
### Arguments
```text
"<prompt>" --completion-promise "<text>" --max-iterations <n>
```

### Setup command
```bash
bash "${GITHUB_GPT_ROOT}/scripts/setup-ralph-loop.sh" $ARGUMENTS
```

### Completion signal
```text
<promise>YOUR_PROMISE_TEXT</promise>
```
