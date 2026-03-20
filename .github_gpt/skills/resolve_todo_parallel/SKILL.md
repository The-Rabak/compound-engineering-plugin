---
name: resolve_todo_parallel
description: Resolve all pending CLI todos using parallel processing
---

## Goal
Resolve pending or ready file-based todos with dependency-aware planning, parallel execution, and protected-artifact safeguards.

## Use this skill when
- The `todos/` directory contains pending or ready items that should be executed.
- Multiple todo items can be delegated in parallel once dependencies are understood.

## Do not use this skill when
- The queue still needs human approval and prioritization; use `triage` first.
- The work is a PR comment queue instead of file-based todos.
- The todo list is empty.

## Non-negotiable rules
- Treat `docs/plans/` and `docs/solutions/` as protected artifacts. If a todo recommends deleting, removing, or gitignoring them, skip it and mark it `wont_fix`.
- Gather all unresolved todo files before planning the work.
- Build a dependency-aware Mermaid flow diagram before implementation.
- Spawn one `pr-comment-resolver` agent per actionable todo item.
- Run all independent todo-resolver agents in parallel.
- After the fixes land, update todo files to show resolution or completion.
- Commit and push the branch.

## Procedure
Execute the full source-of-truth workflow below. Preserve every conditional branch, phase, checklist, and validation step from the original instructions. When the workflow says to ask, wait, route, or run in parallel, do that exactly.

#### Arguments
[optional: specific todo ID or pattern]

Resolve all TODO comments using parallel processing.

#### Workflow

##### 1. Analyze

Get all unresolved TODOs from the /todos/\*.md directory

If any todo recommends deleting, removing, or gitignoring files in `docs/plans/` or `docs/solutions/`, skip it and mark it as `wont_fix`. These are compound-engineering pipeline artifacts that are intentional and permanent.

##### 2. Plan

Create a TodoWrite list of all unresolved items grouped by type.Make sure to look at dependencies that might occur and prioritize the ones needed by others. For example, if you need to change a name, you must wait to do the others. Output a mermaid flow diagram showing how we can do this. Can we do everything in parallel? Do we need to do one first that leads to others in parallel? I'll put the to-dos in the mermaid diagram flowwise so the agent knows how to proceed in order.

##### 3. Implement (PARALLEL)

Spawn a pr-comment-resolver agent for each unresolved item in parallel.

So if there are 3 comments, it will spawn 3 pr-comment-resolver agents in parallel. liek this

1. Task pr-comment-resolver(comment1)
2. Task pr-comment-resolver(comment2)
3. Task pr-comment-resolver(comment3)

Always run all in parallel subagents/Tasks for each Todo item.

##### 4. Commit & Resolve

- Commit changes
- Remove the TODO from the file, and mark it as resolved.
- Push to remote

## Required output
Return:
- The Mermaid execution diagram.
- Which todos were skipped as protected-artifact `wont_fix` items.
- Which todos were resolved.
- The commit used.
- Confirmation that the branch was pushed.
