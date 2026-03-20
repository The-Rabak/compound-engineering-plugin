---
name: resolve_parallel
description: Resolve all TODO comments using parallel processing
---

## Goal
Resolve code TODO comments by planning dependencies first and then executing independent fixes in parallel.

## Use this skill when
- The codebase contains TODO comments that should be addressed in one coordinated pass.
- Multiple TODO items can likely be delegated to parallel resolver agents.

## Do not use this skill when
- There are no actionable TODO comments to resolve.
- The work is a PR-comment workflow rather than code TODO comments; use `resolve_pr_parallel`.
- The queue must be triaged before work starts.

## Non-negotiable rules
- Gather all unresolved TODO comments before planning the work.
- Create a dependency-aware plan before implementation.
- Output a Mermaid flow diagram that shows sequential and parallel branches.
- Spawn one `pr-comment-resolver` agent per TODO item.
- Run every independent resolver in parallel.
- Commit the resulting code changes and push them.

## Procedure
Execute the full source-of-truth workflow below. Preserve every conditional branch, phase, checklist, and validation step from the original instructions. When the workflow says to ask, wait, route, or run in parallel, do that exactly.

#### Arguments
[optional: specific TODO pattern or file]

Resolve all TODO comments using parallel processing.

#### Workflow

##### 1. Analyze

Gather the things todo from above.

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
- Push to remote

## Required output
Return:
- The Mermaid execution diagram.
- The list of TODO items resolved.
- The commit hash or commit message used.
- Confirmation that changes were pushed.
