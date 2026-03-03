---
name: workflows:work
description: Execute work plans efficiently while maintaining quality and finishing features
argument-hint: "[plan file, specification, or todo file path]"
---

# Work Plan Execution Command

Execute a work plan efficiently while maintaining quality and finishing features.

## Introduction

This command takes a work document (plan, specification, or todo file) and executes it systematically using a **subagent orchestration model**. The orchestrator (this conversation) decomposes the plan into scoped chunks and delegates each to a focused subagent. Each subagent implements, tests, and retries independently. Execution learnings accumulate across tasks via session files, compounding knowledge throughout the build.

## Input Document

<input_document> #$ARGUMENTS </input_document>

## Execution Workflow

### Phase 1: Quick Start

1. **Read Plan and Clarify**

   - Read the work document completely
   - Review any references or links provided in the plan
   - If anything is unclear or ambiguous, ask clarifying questions now
   - Get user approval to proceed
   - **Do not skip this** - better to ask questions now than build the wrong thing

2. **Setup Environment**

   First, check the current branch:

   ```bash
   current_branch=$(git branch --show-current)
   default_branch=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')

   # Fallback if remote HEAD isn't set
   if [ -z "$default_branch" ]; then
     default_branch=$(git rev-parse --verify origin/main >/dev/null 2>&1 && echo "main" || echo "master")
   fi
   ```

   **If already on a feature branch** (not the default branch):
   - Ask: "Continue working on `[current_branch]`, or create a new branch?"
   - If continuing, proceed to step 3
   - If creating new, follow Option A or B below

   **If on the default branch**, choose how to proceed:

   **Option A: Create a new branch**
   ```bash
   git pull origin [default_branch]
   git checkout -b feature-branch-name
   ```
   Use a meaningful name based on the work (e.g., `feat/user-authentication`, `fix/email-validation`).

   **Option B: Use a worktree (recommended for parallel development)**
   ```bash
   skill: git-worktree
   # The skill will create a new branch from the default branch in an isolated worktree
   ```

   **Option C: Continue on the default branch**
   - Requires explicit user confirmation
   - Only proceed after user explicitly says "yes, commit to [default_branch]"
   - Never commit directly to the default branch without explicit permission

   **Recommendation**: Use worktree if:
   - You want to work on multiple features simultaneously
   - You want to keep the default branch clean while experimenting
   - You plan to switch between branches frequently

3. **Preview Task Breakdown**
   - Mentally identify the major tasks from the plan
   - Note any questions about dependencies or scope
   - The formal task decomposition happens in Phase 2 Step 4 (STATE.md), which is the persistent record of progress
   - TodoWrite can be used for in-conversation progress tracking if helpful, but STATE.md is the source of truth

### Phase 2: Orchestrated Execution

Phase 2 is where the orchestrator (this conversation) decomposes the plan into scoped chunks and delegates each to a focused subagent. The orchestrator does NOT implement code itself -- it decomposes, delegates, records, and routes.

#### Step 1: Validate Plan Readiness

Before executing, validate that the plan has granular, testable chunks. Each implementation task should have:

- **Task description** -- what needs to be done
- **Files to create/modify** -- specific file paths
- **Success criteria** -- checkboxes that define "done"
- **Test command** -- how to verify the task works
- **Dependencies** -- which other tasks must complete first

If the plan lacks these details, refuse to proceed and suggest running `/deepen-plan` or manually breaking down the plan into well-defined tasks before continuing.

#### Step 2: Check for Resumable Session

Before creating a new session, check for existing incomplete sessions for the same plan:

```bash
ls docs/execution-sessions/work-*/STATE.md 2>/dev/null
```

If a previous session exists for the same plan file and has `status: in_progress`:

- Ask the user: "Found incomplete session `[session_id]` for this plan. Resume where you left off, or start fresh?"
- **If resume**: Read STATE.md, skip completed tasks, load the learnings brief, and continue from `current_task`
- **If fresh**: Archive the old session directory (rename with `-archived` suffix), then start a new session

If no resumable session exists, proceed to Step 3.

#### Step 3: Initialize Execution Session

Create a persistent execution session to track progress:

```bash
SESSION_ID="work-$(date +%Y-%m-%d-%H%M%S)"
mkdir -p docs/execution-sessions/${SESSION_ID}
```

Create a `STATE.md` file in the session directory:

```markdown
---
plan_file: [path to plan]
started: [ISO timestamp]
status: in_progress
current_task: 0
total_tasks: [count]
session_id: [SESSION_ID]
---

## Task Status
| # | Task | Status | Attempts | Session File |
|---|------|--------|----------|--------------|
| 1 | [task name] | pending | -- | -- |
| 2 | [task name] | pending | -- | -- |
...

## Learnings Brief
_No learnings yet._
```

#### Step 4: Decompose Plan into Execution Chunks

The orchestrator parses the plan and creates a list of execution chunks. Each chunk is a self-contained unit of work. The orchestrator does the heavy lifting here:

- **Break large phases** into smaller tasks if needed (each task should be completable in one subagent session)
- **Identify file dependencies** between tasks (Task B modifies a file created by Task A)
- **Determine parallelizable tasks** -- tasks with non-overlapping file sets can run simultaneously
- **Ensure each chunk has clear success criteria** -- if the plan already defines them, use them directly; otherwise, the orchestrator must create them

If the plan already has well-defined tasks with success criteria, use them directly. If not, the orchestrator must create them before proceeding.

#### Step 5: Execute Task Loop

For each task (or parallel batch of tasks), follow this cycle:

##### a. Build Scoped Prompt

For each task, the orchestrator constructs a focused prompt containing ONLY what the subagent needs:

- **Task description and acceptance criteria** -- exactly what to implement
- **Files to read/create/modify** -- from the plan
- **Success criteria and test command** -- how the subagent knows it succeeded
- **Learnings brief** from previous tasks, filtered by domain relevance (only include backend learnings for backend tasks, frontend learnings for frontend tasks, etc.)
- **Project conventions** from CLAUDE.md
- **Relevant code patterns** from the plan's references section (if any)

##### b. Spawn Subagent

Delegate the task to a focused subagent:

```
Task(general-purpose, prompt=scoped_prompt)
```

The subagent prompt must instruct it to:

1. Read referenced files and understand existing patterns
2. Implement the task following conventions
3. Write tests matching the success criteria
4. Run the test command
5. If tests fail: analyze failure, fix, and retry (up to 3 internal attempts)
6. Return a structured execution report containing:
   - Summary of what was implemented
   - Files created/modified (with paths)
   - Problems encountered and how they were fixed
   - Patterns discovered (naming conventions, architectural patterns, etc.)
   - Final test results (pass/fail)
   - Attempt count

**For parallel tasks**: Spawn multiple subagents simultaneously. Only parallelize tasks with non-overlapping file sets. Before parallelizing, verify file sets do not overlap.

**Example scoped prompt:**

```
You are implementing Task 3 of a feature plan. Here is your scoped context:

## Task
Create the UserAuthService with JWT token generation and validation.

## Files to Create/Modify
- Create: `src/services/UserAuthService.ts`
- Create: `tests/UserAuthService.test.ts`
- Modify: `src/app.ts` (register service)

## Success Criteria
- [ ] UserAuthService instantiates correctly
- [ ] authenticate() returns JWT token for valid credentials
- [ ] authenticate() throws AuthenticationError for invalid credentials
- [ ] Token validation works for valid and expired tokens

## Test Command
npm test -- --filter UserAuthService

## Conventions
- Use dependency injection pattern
- Variables are camelCase
- Type annotations on all parameters and return types

## Learnings from Previous Tasks
- [backend] Use jest.mock() for module mocking
- [backend] Factory pattern: createUser() helper not new User()
- [testing] Use expect().toThrow() for error assertions

## Instructions
1. Read the referenced files and understand existing patterns
2. Implement the task following the conventions above
3. Write tests matching the success criteria
4. Run the test command
5. If tests fail: analyze, fix, retry (up to 3 attempts)
6. Return a structured report: summary, files changed, problems encountered and fixes, patterns discovered, test results, attempt count
```

##### c. Process Subagent Results

When the subagent returns, the orchestrator processes the results:

**1. Write session file** to `docs/execution-sessions/${SESSION_ID}/task-{nn}-{slug}.md`:

```markdown
---
task: "[task name]"
task_number: [n]
status: [completed|failed]
attempt_count: [n]
domains: [backend, frontend, testing, database, etc.]
plan_file: [path]
session_id: [SESSION_ID]
---

## What Was Implemented
[From subagent report]

## Files Changed
- `path/to/file.php` -- created/modified

## Problems Encountered
### Problem 1: [title]
- **Error:** [exact error message]
- **Root cause:** [analysis]
- **Fix:** [what was done]

### Problem 2: ...

## Patterns Discovered
- [pattern 1]
- [pattern 2]

## Test Results
- Command: `[test command]`
- Result: PASS/FAIL
- Attempts: [n]
```

**2. Update STATE.md** -- mark the task status, increment `current_task`, update the task status table

**3. Update learnings brief** -- add new learnings from this task, tagged by domain, deduplicated against existing learnings

**4. Update plan file** -- check off completed items (`[ ]` to `[x]`) in the original plan document

**5. Regression guard** -- run test commands from ALL previously completed tasks. If any regress:
   - Log the regression in the current task's session file
   - Spawn a fix subagent with context about what broke and why
   - Do not proceed to the next task until the regression is fixed

**6. Incremental commit** if appropriate (logical unit complete, tests pass):

   | Commit when... | Don't commit when... |
   |----------------|---------------------|
   | Logical unit complete (model, service, component) | Small part of a larger unit |
   | Tests pass + meaningful progress | Tests failing |
   | About to switch contexts (backend to frontend) | Purely scaffolding with no behavior |
   | About to attempt risky/uncertain changes | Would need a "WIP" commit message |

   **Heuristic:** "Can I write a commit message that describes a complete, valuable change? If yes, commit. If the message would be 'WIP' or 'partial X', wait."

   ```bash
   # 1. Verify tests pass (use project's test command)
   # 2. Stage only files related to this logical unit (not `git add .`)
   git add <files related to this logical unit>
   # 3. Commit with conventional message
   git commit -m "feat(scope): description of this unit"
   ```

   **Note:** Incremental commits use clean conventional messages without attribution footers. The final Phase 4 commit/PR includes the full attribution.

##### d. Handle Failures

If a subagent fails after its internal retries:

1. **Reframe**: Can the task be broken down differently? Try spawning a new subagent with a different approach or smaller scope.
2. **Ask user**: Use AskUserQuestion -- "Task [name] failed after 3 attempts. [error summary]. How should I proceed?"
   - Options: "Retry with different approach", "Skip and continue", "Stop pipeline", "I'll fix it manually"
3. **Skip and continue**: Mark task as `skipped` in STATE.md. Note it as a blocker for any dependent tasks. Dependent tasks are also skipped automatically.
4. **Stop pipeline**: Save all state to STATE.md with `status: paused`, present a summary of what was completed and what remains.

### Phase 3: Quality Check

1. **Run Core Quality Checks**

   Always run before submitting:

   ```bash
   # Run full test suite (use project's test command)
   # Detect and run: npm test, pytest, cargo test, phpunit, go test, etc.

   # Run linting (per CLAUDE.md)
   # Use project-specific linter: eslint, ruff, clippy, pint, etc.
   ```

2. **Consider Reviewer Agents** (Optional)

   Use for complex, risky, or large changes. Read agents from `compound-engineering.local.md` frontmatter (`review_agents`). If no settings file, invoke the `setup` skill to create one.

   Run configured agents in parallel with Task tool. Present findings and address critical issues.

3. **Final Validation**
   - All tasks in STATE.md marked `completed` (or explicitly `skipped` with user approval)
   - All tests pass (including regression tests from every completed task)
   - Linting passes
   - Code follows existing patterns
   - Figma designs match (if applicable)
   - No console errors or warnings

4. **Prepare Operational Validation Plan** (REQUIRED)
   - Add a `## Post-Deploy Monitoring & Validation` section to the PR description for every change.
   - Include concrete:
     - Log queries/search terms
     - Metrics or dashboards to watch
     - Expected healthy signals
     - Failure signals and rollback/mitigation trigger
     - Validation window and owner
   - If there is truly no production/runtime impact, still include the section with: `No additional operational monitoring required` and a one-line reason.

### Phase 4: Ship It

1. **Create Commit**

   ```bash
   git add .
   git status  # Review what's being committed
   git diff --staged  # Check the changes

   # Commit with conventional format
   git commit -m "$(cat <<'EOF'
   feat(scope): description of what and why

   Brief explanation if needed.
   EOF
   )"
   ```

2. **Capture and Upload Screenshots for UI Changes** (REQUIRED for any UI work)

   For **any** design changes, new views, or UI modifications, you MUST capture and upload screenshots:

   **Step 1: Start dev server** (if not running)
   ```bash
   # Laravel: Docker containers should be running
   # Frontend: npm run dev
   ```

   **Step 2: Capture screenshots with agent-browser CLI**
   ```bash
   agent-browser open http://localhost:[port]/[route]
   agent-browser snapshot -i
   agent-browser screenshot output.png
   ```
   See the `agent-browser` skill for detailed usage.

   **Step 3: Upload using imgup skill**
   ```bash
   skill: imgup
   # Then upload each screenshot:
   imgup -h pixhost screenshot.png  # pixhost works without API key
   # Alternative hosts: catbox, imagebin, beeimg
   ```

   **What to capture:**
   - **New screens**: Screenshot of the new UI
   - **Modified screens**: Before AND after screenshots
   - **Design implementation**: Screenshot showing Figma design match

   **IMPORTANT**: Always include uploaded image URLs in MR description. This provides visual context for reviewers and documents the change.

3. **Push Branch and Create Merge Request**

   ```bash
   git push -u origin feature-branch-name
   ```

   After pushing, inform the user with the MR description template below. They can create the MR in GitLab's web UI or using `glab mr create` if available.

   **MR Description Template:**

   ```markdown
   ## Summary
   - What was built
   - Why it was needed
   - Key decisions made

   ## Testing
   - Tests added/modified
   - Manual testing performed

   ## Post-Deploy Monitoring & Validation
   - **What to monitor/search**
     - Logs:
     - Metrics/Dashboards:
   - **Validation checks (queries/commands)**
     - `command or query here`
   - **Expected healthy behavior**
     - Expected signal(s)
   - **Failure signal(s) / rollback trigger**
     - Trigger + immediate action
   - **Validation window & owner**
     - Window:
     - Owner:
   - **If no operational impact**
     - `No additional operational monitoring required: <reason>`

   ## Before / After Screenshots
   | Before | After |
   |--------|-------|
   | ![before](URL) | ![after](URL) |

   ## Figma Design
   [Link if applicable]

   ---

   [![Compound Engineered](https://img.shields.io/badge/Compound-Engineered-6366f1)](https://github.com/The-Rabak/compound-engineering-plugin)
   ```

   **Save the MR description** to a file the user can copy from:
   ```bash
   # Write MR description to a temp file for easy copy-paste
   cat > /tmp/mr-description.md <<'MRDESC'
   [filled-in MR description from template above]
   MRDESC
   echo "MR description saved to /tmp/mr-description.md"
   ```

4. **Finalize Execution Session**

   Update the session STATE.md:
   - Set `status: completed`
   - Record final summary and completion timestamp

   If the input document has YAML frontmatter with a `status` field, update it to `completed`:
   ```
   status: active  →  status: completed
   ```

5. **Notify User**
   - Summarize what was completed
   - Link to PR
   - Highlight any tasks that were skipped and why
   - Reference the execution session directory for detailed logs
   - Note any follow-up work needed
   - Suggest next steps if applicable

---

## Swarm Mode (Optional)

For complex plans with multiple independent workstreams, enable swarm mode for parallel execution with coordinated agents.

### When to Use Swarm Mode

| Use Swarm Mode when... | Use Standard Mode when... |
|------------------------|---------------------------|
| Plan has 5+ independent tasks | Plan is linear/sequential |
| Multiple specialists needed (review + test + implement) | Single-focus work |
| Want maximum parallelism | Simpler mental model preferred |
| Large feature with clear phases | Small feature or bug fix |

### Enabling Swarm Mode

To trigger swarm execution, say:

> "Make a Task list and launch an army of agent swarm subagents to build the plan"

Or explicitly request: "Use swarm mode for this work"

### Swarm Workflow

When swarm mode is enabled, the workflow changes:

1. **Create Team**
   ```
   Teammate({ operation: "spawnTeam", team_name: "work-{timestamp}" })
   ```

2. **Create Task List with Dependencies**
   - Parse plan into TaskCreate items
   - Set up blockedBy relationships for sequential dependencies
   - Independent tasks have no blockers (can run in parallel)

3. **Spawn Specialized Teammates**
   ```
   Task({
     team_name: "work-{timestamp}",
     name: "implementer",
     subagent_type: "general-purpose",
     prompt: "Claim implementation tasks, execute, mark complete",
     run_in_background: true
   })

   Task({
     team_name: "work-{timestamp}",
     name: "tester",
     subagent_type: "general-purpose",
     prompt: "Claim testing tasks, run tests, mark complete",
     run_in_background: true
   })
   ```

4. **Coordinate and Monitor**
   - Team lead monitors task completion
   - Spawn additional workers as phases unblock
   - Handle plan approval if required

5. **Cleanup**
   ```
   Teammate({ operation: "requestShutdown", target_agent_id: "implementer" })
   Teammate({ operation: "requestShutdown", target_agent_id: "tester" })
   Teammate({ operation: "cleanup" })
   ```

See the `orchestrating-swarms` skill for detailed swarm patterns and best practices.

**Note:** Swarm mode bypasses the orchestrated execution model (Phase 2). This means no execution session files, no learnings brief accumulation, no STATE.md, and no regression guard. Use swarm mode when speed and parallelism matter more than knowledge compounding. For features where execution learnings are valuable, use the standard orchestrated execution.

---

## Key Principles

### Orchestrator is Lean, Subagents are Focused

- The orchestrator decomposes, delegates, records, and routes. It does NOT implement code itself.
- Each subagent gets only the context it needs. No conversation history pollution.
- Learnings compound: each task benefits from everything learned in previous tasks.

### Start Fast, Execute Faster

- Get clarification once at the start, then execute
- Don't wait for perfect understanding - ask questions and move
- The goal is to **finish the feature**, not create perfect process

### The Plan is Your Guide

- Work documents should reference similar code and patterns
- Load those references and follow them
- Don't reinvent - match what exists

### Test As You Go

- Run tests after each change, not at the end
- Fix failures immediately
- Regression guard catches breakages early
- Continuous testing prevents big surprises

### Quality is Built In

- Follow existing patterns
- Write tests for new code
- Run linting before pushing
- Use reviewer agents for complex/risky changes only

### Ship Complete Features

- Mark all tasks completed before moving on
- Don't leave features 80% done
- A finished feature that ships beats a perfect feature that doesn't

### Failures are Handled Gracefully

- Escalation path (reframe, ask user, skip, stop) -- not infinite loops
- Progress is persistent: STATE.md means you can resume after crashes
- Regression is caught early: previous tests re-run after each task

## Quality Checklist

Before creating PR, verify:

- [ ] All clarifying questions asked and answered
- [ ] All tasks in STATE.md marked completed (or explicitly skipped with user approval)
- [ ] Tests pass (run project's test command)
- [ ] Regression tests from all completed tasks pass
- [ ] Linting passes (use linting-agent)
- [ ] Code follows existing patterns
- [ ] Figma designs match implementation (if applicable)
- [ ] Before/after screenshots captured and uploaded (for UI changes)
- [ ] Commit messages follow conventional format
- [ ] PR description includes Post-Deploy Monitoring & Validation section (or explicit no-impact rationale)
- [ ] PR description includes summary, testing notes, and screenshots
- [ ] PR description includes Compound Engineered badge
- [ ] Execution session files saved in `docs/execution-sessions/`

## When to Use Reviewer Agents

**Don't use by default.** Use reviewer agents only when:

- Large refactor affecting many files (10+)
- Security-sensitive changes (authentication, permissions, data access)
- Performance-critical code paths
- Complex algorithms or business logic
- User explicitly requests thorough review

For most features: tests + linting + following patterns is sufficient.

## Common Pitfalls to Avoid

- **Analysis paralysis** - Don't overthink, read the plan and execute
- **Skipping clarifying questions** - Ask now, not after building wrong thing
- **Ignoring plan references** - The plan has links for a reason
- **Testing at the end** - Test continuously or suffer later
- **Orchestrator doing implementation** - Delegate to subagents, don't implement inline
- **Skipping regression checks** - A passing task that breaks previous work is not progress
- **Losing session state** - Always write to STATE.md before and after each task
- **Dumping all session files into subagent context** - Use the learnings brief, filtered by domain
- **Over-reviewing simple changes** - Save reviewer agents for complex work
- **80% done syndrome** - Finish the feature, don't move on early
