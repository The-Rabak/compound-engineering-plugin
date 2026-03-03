#!/usr/bin/env bash
# Ralph Loop Stop Hook
# Checks if a ralph-loop is active and prevents exit until completion promise is met
# or max iterations are reached.

set -euo pipefail

STATE_FILE=".claude/ralph-loop.local.md"

# If no state file, allow normal exit
if [ ! -f "$STATE_FILE" ]; then
  exit 0
fi

# Read state from YAML frontmatter
get_frontmatter_value() {
  local key="$1"
  grep "^${key}:" "$STATE_FILE" 2>/dev/null | head -1 | sed "s/^${key}: *//" | tr -d '"'
}

ACTIVE=$(get_frontmatter_value "active")
ITERATION=$(get_frontmatter_value "iteration")
MAX_ITERATIONS=$(get_frontmatter_value "max_iterations")
PROMISE=$(get_frontmatter_value "completion_promise")
ORIGINAL_PROMPT=$(get_frontmatter_value "original_prompt")

# Validate state file
if [ -z "$ACTIVE" ] || [ "$ACTIVE" != "true" ]; then
  rm -f "$STATE_FILE"
  exit 0
fi

if [ -z "$ITERATION" ] || [ -z "$MAX_ITERATIONS" ]; then
  # Corrupted state - clean up and exit
  rm -f "$STATE_FILE"
  exit 0
fi

# Check if max iterations reached
if [ "$ITERATION" -ge "$MAX_ITERATIONS" ]; then
  echo "Ralph Loop: Max iterations ($MAX_ITERATIONS) reached. Exiting." >&2
  rm -f "$STATE_FILE"
  exit 0
fi

# Check for completion promise in stdin (Claude's last output)
LAST_OUTPUT=""
if [ ! -t 0 ]; then
  LAST_OUTPUT=$(cat)
fi

if [ -n "$PROMISE" ] && echo "$LAST_OUTPUT" | grep -q "<promise>${PROMISE}</promise>"; then
  echo "Ralph Loop: Completion promise found. Exiting." >&2
  rm -f "$STATE_FILE"
  exit 0
fi

# Increment iteration counter
NEW_ITERATION=$((ITERATION + 1))
sed -i.bak "s/^iteration: .*/iteration: ${NEW_ITERATION}/" "$STATE_FILE"
rm -f "${STATE_FILE}.bak"

# Block the stop and feed the prompt back
cat <<EOF
{"decision":"block","reason":"Ralph Loop iteration ${NEW_ITERATION}/${MAX_ITERATIONS}","prompt":"Continue the ralph loop. Iteration ${NEW_ITERATION} of ${MAX_ITERATIONS}. Original task: ${ORIGINAL_PROMPT}"}
EOF
