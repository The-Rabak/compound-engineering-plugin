---
name: session-history
description: Recover prior attempts safely by searching repo artifacts first and only then using a bounded recent-session fallback when the harness exposes searchable history
model: claude-sonnet-4-6
---

# Session History

Use this skill when you need to answer "what did we already try?" without blindly dumping prior transcripts into the current context.

This skill exists to prevent repeated dead ends, especially when:

- resuming interrupted work
- debugging a failure that may have been seen before
- writing compounded learnings after several attempts
- comparing current behavior against prior execution or review history

## Core Rule

Search **repo-owned artifacts first**. Only if those artifacts do not answer the question clearly enough should you fall back to a **bounded recent-session search**.

The goal is recovery of useful decisions and evidence, not transcript archaeology for its own sake.

## Source Priority

### Tier 1: Repo-Owned Artifacts (always first)

Search the smallest set of repo artifacts that could answer the question:

- `docs/solutions/`
- `docs/execution-sessions/`
- `docs/plans/`
- `docs/architecture/`
- `docs/tickets/`
- `docs/brainstorms/`
- related `README`, `CHANGELOG`, constitution, or workflow-reference docs when they explain intent or constraints

Prefer artifacts that already encode structured learning, decisions, or execution evidence.

### Tier 2: Recent Harness Sessions (conditional fallback)

Only search prior interactive sessions when:

- the repo artifacts do not explain what was tried
- the problem is recent and likely lives in transient execution history
- the current task needs failure chronology, not just stable docs

Use a **bounded window**. Default to the **last 8 relevant sessions** unless the user asks for a different range.

If the harness exposes searchable session history, use that tool. For example:

- Copilot: prefer structured session-history facilities such as `session_store`
- other harnesses: use their searchable local session history or transcript index if available

If the harness does **not** expose searchable session history, say so plainly and continue from repo artifacts only.

## Retrieval Method

### Step 1: Define the lookup target

Before searching, state what you are trying to recover:

- prior fixes for the same symptom
- failed approaches
- relevant file paths or modules
- decisions that constrained the current design
- exact evidence from a previous reproduction or execution run

### Step 2: Search repo artifacts first

Search for the task topic plus close variants:

- problem terms
- component names
- file/module names
- error text fragments
- feature names
- workflow artifact refs (`brainstorm_ref`, `architecture_ref`, `tickets_ref`, `plan_ref`)

Prefer exact matches first, then broaden.

### Step 3: Decide whether session fallback is needed

Use recent-session lookup only if Tier 1 leaves a material gap.

Good reasons to fall back:

- you found references to prior attempts but not the actual failure progression
- a recent bug/fix loop happened before documentation was updated
- you need to know which hypotheses were already ruled out

Bad reasons to fall back:

- curiosity
- searching for filler context
- loading whole transcripts when a short summary would do

### Step 4: Keep extraction bounded

Never dump raw transcripts into the main thread unless the user explicitly asks for that.

Extract only the minimum useful structure:

- session date / title / branch if available
- task or bug being worked on
- relevant files touched
- key hypotheses tried
- what failed
- what worked
- unresolved blockers

When possible, summarize from structured snippets, checkpoint summaries, or short excerpts instead of full transcripts.

## Output Shape

Return a concise, decision-ready summary:

```markdown
## Prior Context

- **Best artifact matches:** [paths]
- **What was already tried:** [1-3 bullets]
- **What failed:** [1-3 bullets]
- **What worked or partially worked:** [1-3 bullets]
- **Relevant files / modules:** [paths]
- **Remaining uncertainty:** [what still is not known]
```

If session fallback was used, add:

```markdown
- **Recent session window used:** [count and scope]
```

## Guardrails

- Do not treat speculative assistant text as verified fact.
- Do not surface secrets, credentials, or unrelated private conversation content.
- Do not widen the session window just because the first search was noisy.
- Do not quote large transcript blocks when a short synthesis is enough.
- If the evidence is weak, label it as weak.
