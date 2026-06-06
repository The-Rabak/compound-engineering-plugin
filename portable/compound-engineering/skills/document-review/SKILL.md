---
name: document-review
description: >-
  Review workflow artifacts such as brainstorms, plans, architecture docs, tickets, and compounded
  learnings with artifact-aware lenses, including headless workflow invocation
model: claude-sonnet-4-6
platforms:
  copilot:
    model: gpt-5.3-codex
  opencode:
    model: openrouter/moonshotai/kimi-k2.6
---

# Document Review

Improve workflow documents through structured, artifact-aware review.

This skill supports both:

- **interactive refinement** -- the user wants a review pass and can answer questions
- **headless refinement** -- another workflow invokes review non-interactively and needs a concise result

## Step 1: Get and classify the artifact

If a document path is provided, read it first and infer the artifact type from path and content.

If no document is specified, ask which artifact to review or look for the most recent relevant file in:

- `docs/brainstorms/`
- `docs/plans/`
- `docs/architecture/`
- `docs/tickets/`
- `docs/solutions/`

Classify the artifact as one of:

- **brainstorm**
- **plan**
- **architecture**
- **ticket-index**
- **ticket**
- **solution**
- **generic-doc** (only if it clearly does not fit the above)

If the caller already specified the review mode, trust it unless the file clearly contradicts it.

## Step 2: Load the minimum linked context

Do not review an artifact in isolation when its contract depends on linked docs.

Load only the minimum linked artifacts needed to judge handoff integrity:

- **brainstorm** -> constitution when present
- **plan** -> `brainstorm_ref`, constitution, and `architecture_ref` if already recorded
- **architecture** -> parent plan and relevant brainstorm context
- **ticket-index** -> parent plan + architecture artifact
- **ticket** -> parent ticket index + plan + architecture artifact
- **solution** -> nearby related solution docs or referenced execution/session artifacts when present

If a required linked artifact is missing, note that as a review finding instead of inventing the missing context.

## Step 3: Choose the review lenses

Always review for these baseline lenses:

- **Clarity** -- vague language, hidden assumptions, or ambiguous ownership
- **Decision honesty** -- real decisions made, real open questions named
- **Specificity** -- enough detail for the next workflow step, not bloated filler
- **YAGNI / simplicity** -- no speculative work disguised as readiness

Then apply artifact-specific lenses.

### Brainstorm review

- **WHY fidelity** -- problem narrative, user story, and success criteria align
- **Stakeholder clarity** -- who is affected and why is actually clear
- **Ambiguity pressure-test** -- important unknowns are surfaced before planning

### Plan review

- **Handoff integrity** -- brainstorm, constitution, source docs, and architecture refs align
- **Execution-shape honesty** -- slices/tracks/batches match the real work
- **TDD & evidence contract** -- test expectations and exceptions are explicit
- **Scope discipline** -- plan stays implementable without fake AI-shaped batching

### Architecture review

- **Feature-home honesty** -- ownership is explicit and believable
- **Shared/global boundary honesty** -- truly shared concerns are separated from feature-local work
- **Deletion test / seam quality** -- abstractions are justified, not decorative
- **Downstream usefulness** -- `/deepen-plan`, `/workflows:work`, and `/workflows:review` can actually use this artifact

### Ticket-index review

- **Dependency ordering** -- batch order and blockers are believable
- **Parallel safety** -- file overlap and shared mutable state are accounted for
- **Resume quality** -- index acts as an execution cursor, not a directory listing
- **WHY tracing** -- ticket set still points back to the parent intent

### Ticket review

- **Ticket-local sufficiency** -- enough context to execute without copying the whole plan
- **Scope fence honesty** -- non-goals and boundaries are explicit
- **Evidence commands** -- proof paths are concrete
- **Parent-link integrity** -- ticket points to the right index/plan/architecture artifacts

### Solution review

- **Institutional reuse** -- this teaches something future work can actually reuse
- **Root cause and prevention quality** -- not just "what we changed," but why
- **Searchability** -- title/category/structure make future lookup realistic
- **Noise control** -- keep the learning crisp instead of turning it into a diary

## Step 4: Identify findings

Keep findings short and actionable. Use these buckets:

1. **Blocking gaps** -- artifact is not ready for the next step
2. **Important improvements** -- not blocking, but meaningfully improves handoff quality
3. **Minor fixes** -- clarity, wording, formatting, or duplication cleanup

Also identify one **critical improvement** if a single change would most improve the artifact.

## Step 5: Make changes

1. **Auto-fix minor issues** inline
2. **Make safe structural edits** when the intended meaning is already clear
3. **Ask approval before changing meaning** when running interactively
4. **In headless mode, do not invent missing decisions** -- leave concise findings instead

Keep edits in the same file. Do not create parallel review docs, checklists, or metadata-only artifacts.

### Simplification Guidance

Simplification is purposeful removal of unnecessary complexity, not shortening for its own sake.

**Simplify when:**
- Content serves hypothetical future needs, not current ones
- Sections repeat information already covered elsewhere
- Detail exceeds what's needed to take the next step
- Abstractions or structure add overhead without clarity

**Don't simplify:**
- Constraints or edge cases that affect implementation
- Rationale that explains why alternatives were rejected
- Open questions that need resolution

## Step 6: Return the right output shape

### Interactive mode

After changes are complete, ask:

1. **Refine again** - Another review pass
2. **Review complete** - Document is ready

### Iteration Guidance

After 2 refinement passes, recommend completion—diminishing returns are likely. But if the user wants to continue, allow it.

Return control to the caller (workflow or user) after selection.

### Headless mode

If this skill was invoked by another workflow for a non-interactive pass, do **not** ask follow-up questions unless a blocking ambiguity truly prevents review.

Return a concise summary:

```markdown
## Document Review

- **Artifact type:** ...
- **Critical improvement:** ...
- **Edits made:** ...
- **Remaining blockers or open questions:** ...
```

## What NOT to Do

- Do not rewrite the entire artifact unless the existing structure is unusable
- Do not add new requirements the user or parent artifacts did not establish
- Do not over-engineer or add shadow process
- Do not create separate review files or metadata-only artifacts
