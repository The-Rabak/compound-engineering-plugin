---
name: resolve_pr_parallel
description: >-
  Resolve all PR comments using parallel processing. Use when addressing PR review feedback, resolving review threads,
  or batch-fixing PR comments.
platforms:
  claude:
    allowed-tools: Bash(git *), Read
    disable-model-invocation: true
---

## Goal
Address unresolved PR review comments with one resolver per comment, parallel execution, thread resolution, and verification.

## Use this skill when
- A PR has unresolved review comments or threads that need to be addressed.
- The goal is to batch-fix review feedback efficiently.

## Do not use this skill when
- The work is about code TODO comments rather than PR comments; use `resolve_parallel`.
- There are no unresolved review comments.
- The platform context cannot be retrieved and the user cannot provide the comments.

## Non-negotiable rules
- Gather unresolved review comments before doing any implementation.
- Use the best available source: pasted comments, `gh`, `glab`, or the platform API.
- Group comments by type so the plan is understandable.
- Spawn one `pr-comment-resolver` agent per unresolved comment.
- Run all independent resolver agents in parallel.
- Resolve threads programmatically after the fixes are committed.
- Re-fetch the review comments at the end and verify that no unresolved threads remain.

## Procedure
Execute the full source-of-truth workflow below. Preserve every conditional branch, phase, checklist, and validation step from the original instructions. When the workflow says to ask, wait, route, or run in parallel, do that exactly.

### Resolve PR Comments in Parallel

Resolve all unresolved PR review comments by spawning parallel agents for each thread.

#### Context Detection

the host CLI automatically detects git context:
- Current branch and associated PR
- All PR comments and review threads
- Works with any PR by specifying the number

#### Workflow

##### 1. Analyze

Gather unresolved review comments. Use one of these methods:

**Option A: User pastes comments**
Ask the user to paste the PR/MR review comments. This is the most reliable method and works with any Git platform.

**Option B: GitHub CLI (`gh`)**
```bash
bash ${GITHUB_GPT_ROOT}/skills/resolve-pr-parallel/scripts/get-pr-comments PR_NUMBER [OWNER/REPO]
```

**Option C: GitLab CLI (`glab`)**
```bash
glab mr view MR_NUMBER --comments
```

**Option D: Platform API (if access token is available)**

For GitHub:
```bash
gh api repos/OWNER/REPO/pulls/PR_NUMBER/reviews
gh api repos/OWNER/REPO/pulls/PR_NUMBER/comments
```

For GitLab:
```bash
curl --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://YOUR_GITLAB_HOST/api/v4/projects/PROJECT_ID/merge_requests/MR_IID/discussions"
```

For Bitbucket:
```bash
curl -u "$BITBUCKET_USER:$BITBUCKET_TOKEN" \
  "https://api.bitbucket.org/2.0/repositories/WORKSPACE/REPO/pullrequests/PR_ID/comments"
```

##### 2. Plan

Create a TodoWrite list of all unresolved items grouped by type:
- Code changes requested
- Questions to answer
- Style/convention fixes
- Test additions needed

##### 3. Implement (PARALLEL)

Spawn a `pr-comment-resolver` agent for each unresolved item in parallel.

If there are 3 comments, spawn 3 agents:

1. Task pr-comment-resolver(comment1)
2. Task pr-comment-resolver(comment2)
3. Task pr-comment-resolver(comment3)

Always run all in parallel subagents/Tasks for each Todo item.

##### 4. Commit & Resolve

- Commit changes with a clear message referencing the PR feedback
- Resolve each thread programmatically (GitHub):

```bash
bash ${GITHUB_GPT_ROOT}/skills/resolve-pr-parallel/scripts/resolve-pr-thread THREAD_ID
```

- Push to remote

##### 5. Verify

Re-fetch comments to confirm all threads are resolved:

```bash
bash ${GITHUB_GPT_ROOT}/skills/resolve-pr-parallel/scripts/get-pr-comments PR_NUMBER
```

Should return an empty array `[]`. If threads remain, repeat from step 1.

#### Scripts

- [scripts/get-pr-comments](scripts/get-pr-comments) - GraphQL query for unresolved review threads (GitHub)
- [scripts/resolve-pr-thread](scripts/resolve-pr-thread) - GraphQL mutation to resolve a thread by ID (GitHub)

#### Success Criteria

- All unresolved review threads addressed
- Changes committed and pushed
- Threads resolved (marked as resolved on the Git platform)
- Empty result from get-pr-comments on verify

## Required output
Return:
- The number of unresolved comments found.
- The list of comments or threads addressed.
- The commit used for the fixes.
- Confirmation that threads were resolved programmatically.
- Verification output showing no unresolved threads remain.
