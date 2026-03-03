---
name: cancel-ralph
description: Cancel an active ralph loop
disable-model-invocation: true
---

# Cancel Ralph Loop

Check for and cancel an active ralph loop.

```bash
STATE_FILE=".claude/ralph-loop.local.md"

if [ -f "$STATE_FILE" ]; then
  ITERATION=$(grep "^iteration:" "$STATE_FILE" | sed 's/^iteration: *//')
  MAX=$(grep "^max_iterations:" "$STATE_FILE" | sed 's/^max_iterations: *//')
  echo "Cancelling ralph loop at iteration ${ITERATION}/${MAX}"
  rm -f "$STATE_FILE"
  echo "Ralph loop cancelled."
else
  echo "No active ralph loop found."
fi
```

Run the above script via Bash tool to cancel the loop.
