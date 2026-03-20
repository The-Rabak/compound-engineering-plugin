---
name: workflows-brainstorm
description: Explore requirements and approaches through collaborative dialogue before planning implementation
---

## Goal
Explore a feature, problem, or improvement through collaborative dialogue so the work is clear before routing to planning.

## Use this skill when
- The user has an idea, problem, or improvement and needs help deciding what to build.
- You need to clarify scope, users, constraints, success criteria, or open questions before planning.
- A brainstorm document should be created in `docs/brainstorms/` for later handoff.

## Do not use this skill when
- Requirements are already specific, constrained, and ready for execution planning.
- The task is to implement code or produce technical build steps.
- The user only needs document polishing; use `document-review` instead.

## Non-negotiable rules
- Never code during this workflow.
- Stay focused on WHAT to build, not HOW to implement it.
- Load and follow the `brainstorming` skill for questioning patterns, approach exploration, and YAGNI discipline.
- Ask one question at a time.
- Apply YAGNI and prefer the simplest viable direction.
- Before handoff, resolve every open question by asking the user directly.

## Procedure
Execute the full source-of-truth workflow below. Preserve every conditional branch, phase, checklist, and validation step from the original instructions. When the workflow says to ask, wait, route, or run in parallel, do that exactly.

#### Arguments
[feature idea or problem to explore]

### Brainstorm a Feature or Improvement

**Note: The current year is 2026.** Use this when dating brainstorm documents.

Brainstorming helps answer **WHAT** to build through collaborative dialogue. It precedes `/workflows-plan`, which answers **HOW** to build it.

**Process knowledge:** Load the `brainstorming` skill for detailed question techniques, approach exploration patterns, and YAGNI principles.

#### Feature Description

#$ARGUMENTS

**If the feature description above is empty, ask the user:** "What would you like to explore? Please describe the feature, problem, or improvement you're thinking about."

Do not proceed until you have a feature description from the user.

#### Execution Flow

##### Phase 0: Assess Requirements Clarity

Evaluate whether brainstorming is needed based on the feature description.

**Clear requirements indicators:**
- Specific acceptance criteria provided
- Referenced existing patterns to follow
- Described exact expected behavior
- Constrained, well-defined scope

**If requirements are already clear:**
Use **AskUserQuestion tool** to suggest: "Your requirements seem detailed enough to proceed directly to planning. Should I run `/workflows-plan` instead, or would you like to explore the idea further?"

##### Phase 1: Understand the Idea

###### 1.1 Repository Research (Lightweight)

Run a quick repo scan to understand existing patterns:

- Use the repo-research-analyst skill to: "Understand existing patterns related to: "

Focus on: similar features, established patterns, CLAUDE.md guidance.

###### 1.2 Collaborative Dialogue

Use the **AskUserQuestion tool** to ask questions **one at a time**.

**Guidelines (see `brainstorming` skill for detailed techniques):**
- Prefer multiple choice when natural options exist
- Start broad (purpose, users) then narrow (constraints, edge cases)
- Validate assumptions explicitly
- Ask about success criteria

**Exit condition:** Continue until the idea is clear OR user says "proceed"

##### Phase 2: Explore Approaches

Propose **2-3 concrete approaches** based on research and conversation.

For each approach, provide:
- Brief description (2-3 sentences)
- Pros and cons
- When it's best suited

Lead with your recommendation and explain why. Apply YAGNI--prefer simpler solutions.

Use **AskUserQuestion tool** to ask which approach the user prefers.

##### Phase 3: Capture the Design

Write a brainstorm document to `docs/brainstorms/YYYY-MM-DD--brainstorm.md`.

**Document structure:** See the `brainstorming` skill for the template format. Key sections: What We're Building, Why This Approach, Key Decisions, Open Questions.

Ensure `docs/brainstorms/` directory exists before writing.

**IMPORTANT:** Before proceeding to Phase 4, check if there are any Open Questions listed in the brainstorm document. If there are open questions, YOU MUST ask the user about each one using AskUserQuestion before offering to proceed to planning. Move resolved questions to a "Resolved Questions" section.

##### Phase 4: Handoff

Use **AskUserQuestion tool** to present next steps:

**Question:** "Brainstorm captured. What would you like to do next?"

**Options:**
1. **Review and refine** - Improve the document through structured self-review
2. **Proceed to planning** - Run `/workflows-plan` (will auto-detect this brainstorm)
3. **Ask more questions** - I have more questions to clarify before moving on
4. **Done for now** - Return later

**If user selects "Ask more questions":** YOU (the model) return to Phase 1.2 (Collaborative Dialogue) and continue asking the USER questions one at a time to further refine the design. The user wants YOU to probe deeper - ask about edge cases, constraints, preferences, or areas not yet explored. Continue until the user is satisfied, then return to Phase 4.

**If user selects "Review and refine":**

Load the `document-review` skill and apply it to the brainstorm document.

When document-review returns "Review complete", present next steps:

1. **Move to planning** - Continue to `/workflows-plan` with this document
2. **Done for now** - Brainstorming complete. To start planning later: `/workflows-plan [document-path]`

#### Output Summary

When complete, display:

```
Brainstorm complete!

Document: docs/brainstorms/YYYY-MM-DD-[topic]-brainstorm.md

Key decisions:
- [Decision 1]
- [Decision 2]

Next: Run `/workflows-plan` when ready to implement.
```

#### Important Guidelines

- **Stay focused on WHAT, not HOW** - Implementation details belong in the plan
- **Ask one question at a time** - Don't overwhelm
- **Apply YAGNI** - Prefer simpler approaches
- **Keep outputs concise** - 200-300 words per section max

NEVER CODE! Just explore and document decisions.

## Required output
Return a concise completion summary that includes:
- The brainstorm document path.
- The key decisions.
- The explicit next-step options, with `/workflows-plan` called out as the normal handoff.
