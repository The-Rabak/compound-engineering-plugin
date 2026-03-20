---
name: lrj
description: Full autonomous engineering workflow
---

## Goal
Run the full autonomous engineering workflow as a strict end-to-end sequence with no deviations.

## Use this skill when
- The user wants the full autonomous workflow from planning through video-ready PR output.
- You must chain the standard compound-engineering workflow commands in their canonical order.

## Do not use this skill when
- Only one stage of the workflow is needed.
- The user wants a swarm-enabled variant; use `slrj` instead.
- You are being asked to improvise, skip stages, or reorder the pipeline.

## Non-negotiable rules
- Run the workflow exactly in the prescribed order.
- Do not add side steps, substitutions, or shortcuts.
- Wait for each step to complete before starting the next one.
- Do not skip review, todo resolution, browser testing, or feature video.
- The workflow is complete only when the video is in the PR and the final promise is emitted.

## Procedure
Execute the full source-of-truth workflow below. Preserve every conditional branch, phase, checklist, and validation step from the original instructions. When the workflow says to ask, wait, route, or run in parallel, do that exactly.

#### Arguments
[feature description]

Run these slash commands in order. Do not do anything else.

1. `/compound-engineering-ralph-loop "finish all slash commands" --completion-promise "DONE"`
2. `/workflows-plan $ARGUMENTS`
3. `/compound-engineering-deepen-plan`
4. `/workflows-work`
5. `/workflows-review`
6. `/compound-engineering-resolve_todo_parallel`
7. `/compound-engineering-test-browser`
8. `/compound-engineering-feature-video`
9. Output `DONE` when video is in PR

Start with step 1 now.

## Required output
Output exactly: `DONE` when the final feature video has been added to the PR.
