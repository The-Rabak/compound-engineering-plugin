---
name: ralph-loop
description: Start a self-referential loop that continues until a completion promise is met
argument-hint: '"<prompt>" --completion-promise "<text>" --max-iterations <n>'
disable-model-invocation: true
---

# Ralph Loop

Start a self-referential loop using the stop hook mechanism.

## Setup

Run the setup script via Bash tool:

```bash
bash "${CLAUDE_PLUGIN_ROOT}/scripts/setup-ralph-loop.sh" $ARGUMENTS
```

After setup, proceed with the prompt specified in the arguments. The stop hook will prevent exit and feed the prompt back until the completion promise is output or max iterations are reached.

To signal completion, output: `<promise>YOUR_PROMISE_TEXT</promise>`
