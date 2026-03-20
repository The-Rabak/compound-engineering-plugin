---
name: brainstorming
description: >-
  This skill should be used before implementing features, building components, or making changes. It guides exploring
  user intent, approaches, and design decisions before planning. Triggers on "let's brainstorm", "help me think
  through", "what should we build", "explore approaches", ambiguous feature requests, or when the user's request has
  multiple valid interpretations that need clarification.
---

## Goal
Clarify what to build before deciding how to build it. Use structured discussion to surface intent, options, and tradeoffs.

## Use this skill when
- Requirements are ambiguous or incomplete.
- Multiple reasonable approaches exist.
- Tradeoffs need exploration with the user.
- Scope, acceptance criteria, or edge cases are still fuzzy.

## Do not use this skill when
- Requirements are already explicit and detailed.
- The task is a straightforward bug fix or a clearly bounded change.
- The next useful step is planning or implementation, not discovery.

## Operating rules
- Start with Phase 0 and decide whether brainstorming is needed at all.
- Ask one question at a time.
- Prefer multiple-choice questions when natural options exist.
- Start broad, then narrow.
- State assumptions explicitly and validate them.
- Ask about success criteria early.
- Propose 2-3 concrete approaches and lead with a recommendation.
- Apply YAGNI constantly: choose the simplest approach that solves the stated problem.
- Keep each section short, then validate understanding before continuing.
- Stay on WHAT to build, not HOW to implement it.

## Procedure / Reference
### Phase 0: assess clarity
Signals that requirements are clear:
- Specific acceptance criteria exist.
- Existing patterns to follow are named.
- Expected behavior is explicit.
- Scope is constrained.

Signals that brainstorming is needed:
- The request uses vague phrases like "make it better".
- Multiple interpretations are plausible.
- Tradeoffs have not been discussed.
- The user seems unsure about direction.

If requirements are already clear, recommend moving directly to planning or implementation.

### Phase 1: understand the idea
Explore:
- Purpose: what problem does this solve?
- Users: who is this for?
- Constraints: dependencies, technical limits, timeline.
- Success: how will success be measured?
- Edge cases: what must not happen?
- Existing patterns: what in the codebase should be matched?

### Phase 2: explore approaches
Use this structure for each option:
```markdown
### Approach A: [Name]

[2-3 sentence description]

**Pros:**
- [Benefit 1]
- [Benefit 2]

**Cons:**
- [Drawback 1]
- [Drawback 2]

**Best when:** [Circumstances where this approach shines]
```

### Phase 3: capture the design
Write the brainstorm output here:
`docs/brainstorms/YYYY-MM-DD-<topic>-brainstorm.md`

Use this file format:
```markdown
---
date: YYYY-MM-DD
topic: <kebab-case-topic>
---

# <Topic Title>

## What We're Building
[Concise description - 1-2 paragraphs max]

## Why This Approach
[Approaches considered and why this one was chosen]

## Key Decisions
- [Decision 1]: [Rationale]
- [Decision 2]: [Rationale]

## Open Questions
- [Any unresolved questions for the planning phase]

## Next Steps
-> `/workflows:plan` for implementation details
```

### Phase 4: handoff
Offer exactly one of these next steps:
1. Proceed to planning via `/workflows:plan`
2. Refine the design further
3. Stop for now and return later

### Anti-patterns to avoid
- Asking five questions at once.
- Jumping into implementation details too early.
- Proposing overbuilt solutions for hypothetical future needs.
- Ignoring existing codebase patterns.
- Making assumptions without confirmation.
- Writing a long design doc when a concise brainstorm is enough.
