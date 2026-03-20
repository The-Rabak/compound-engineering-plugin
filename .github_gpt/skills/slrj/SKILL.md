---
name: slrj
description: Full autonomous engineering workflow using swarm mode for parallel execution
---

## Goal
Run the autonomous workflow with swarm execution where specified and mandatory parallel follow-up stages.

## Use this skill when
- The user wants the full LRJ pipeline but with swarm execution and explicit parallel stages.
- The work phase should use a swarm of agents, and post-work review plus browser testing should overlap.

## Do not use this skill when
- The user wants the linear non-swarm pipeline; use `lrj` instead.
- Only one workflow stage is needed.
- You cannot support the required swarm or parallel execution model.

## Non-negotiable rules
- Preserve the same end-to-end routing as LRJ.
- Use swarm mode for `/workflows-work`.
- After work completes, you must run `/workflows-review` and `/compound-engineering-test-browser` in parallel as background tasks.
- Wait for both parallel tasks to finish before continuing.
- Do not skip `resolve_todo_parallel` or `feature-video`.
- Do not reorder the pipeline.

## Procedure
Execute the full source-of-truth workflow below. Preserve every conditional branch, phase, checklist, and validation step from the original instructions. When the workflow says to ask, wait, route, or run in parallel, do that exactly.

#### Arguments
[feature description]

Swarm-enabled LRJ. Run these steps in order, parallelizing where indicated.

#### Sequential Phase

1. `/compound-engineering-ralph-loop "finish all slash commands" --completion-promise "DONE"`
2. `/workflows-plan $ARGUMENTS`
3. `/compound-engineering-deepen-plan`
4. `/workflows-work` -- **Use swarm mode**: Make a Task list and launch an army of agent swarm subagents to build the plan

#### Parallel Phase

After work completes, launch steps 5 and 6 as **parallel swarm agents** (both only need code to be written):

5. `/workflows-review` -- spawn as background Task agent
6. `/compound-engineering-test-browser` -- spawn as background Task agent

Wait for both to complete before continuing.

#### Finalize Phase

7. `/compound-engineering-resolve_todo_parallel` -- resolve any findings from the review
8. `/compound-engineering-feature-video` -- record the final walkthrough and add to PR
9. Output `DONE` when video is in PR

Start with step 1 now.

## Required output
Output exactly: `DONE` when the final feature video has been added to the PR.
