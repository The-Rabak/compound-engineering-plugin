---
name: cancel-ralph
description: Cancel an active ralph loop
---

## Goal
Cancel an active ralph loop by removing its state file.

## Use this skill when
- The user wants to stop a running ralph loop.
- You need to confirm whether a loop is active and terminate it cleanly.

## Operating rules
- Check `.github/ralph-loop.local.md` first.
- If the state file exists, report the current iteration, remove the file, and confirm cancellation.
- If the state file does not exist, report that no active loop was found.

## Procedure / Reference
```bash
STATE_FILE=".github/ralph-loop.local.md"

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
