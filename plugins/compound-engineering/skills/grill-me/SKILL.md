---
name: grill-with-docs
description: Grilling session that challenges your plan against the existing domain model, sharpens terminology, and updates documentation (CONTEXT.md, brainstorm docs, plan docs, ADRs) inline as decisions crystallise. Use when user wants to stress-test a plan against their project's language and documented decisions.
---

<what-to-do>

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time, waiting for feedback on each question before continuing.

If a question can be answered by exploring the codebase, explore the codebase instead.

</what-to-do>

<supporting-info>

## Domain awareness

During codebase exploration, also look for existing documentation, especially the active feature artifact for the current discussion.

### File structure

Most repos have a repo-wide constitution, a glossary-oriented `CONTEXT.md`, and feature documents under `docs/`:

```
/
├── CONSTITUTION.md
├── CONTEXT.md
├── docs/
│   ├── brainstorms/
│   │   └── 2026-04-30-checkout-race-brainstorm.md
│   ├── plans/
│   │   └── 2026-05-01-fix-checkout-race-plan.md
│   └── architecture/
│       ├── 2026-04-30-nucleus-stage-1-architecture.md
└── src/
```

Create files lazily -- only when you have something to write. If no `CONTEXT.md` exists, create one when the first term is resolved. If no `CONSTITUTION.md` exists, advise the user to create one using the workflows-constitution command using the context from this session.

## During the session

### Choose the right documentation sink

Before grilling, decide where concrete decisions belong:

1. If a plan file exists for the current feature, or the session is clearly continuing plan work, the plan file is the implementation-decision sink.
2. Otherwise, if a brainstorm document exists for the current feature, or the session is clearly continuing brainstorm work, the brainstorm document is the implementation-decision sink.
3. `CONTEXT.md` is only for canonical domain language. ADRs remain for cross-feature decisions that deserve a durable architectural record.
4. If neither a plan nor a brainstorm artifact exists, do not invent one just for this skill unless the user explicitly asks for it.

### Challenge against the glossary

When the user uses a term that conflicts with the existing language in `CONTEXT.md`, call it out immediately. "Your glossary defines 'cancellation' as X, but you seem to mean Y — which is it?"

### Sharpen fuzzy language

When the user uses vague or overloaded terms, propose a precise canonical term. "You're saying 'account' — do you mean the Customer or the User? Those are different things."

### Discuss concrete scenarios

When domain relationships are being discussed, stress-test them with specific scenarios. Invent scenarios that probe edge cases and force the user to be precise about the boundaries between concepts.

### Cross-reference with code

When the user states how something works, check whether the code agrees. If you find a contradiction, surface it: "Your code cancels entire Orders, but you just said partial cancellation is possible — which is right?"

### Update CONTEXT.md inline

When a term is resolved, update `CONTEXT.md` right there. Don't batch these up — capture them as they happen. Use the format in [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md).

### Update the active feature doc inline

After each question is answered with concrete implementation, architecture, data-shape, API, dependency, boundary, rollout, or operational detail, immediately write it into the active feature doc. Do not wait until the end of the session, and do not leave the decision only in chat history.

Prefer updating the most specific existing section over inventing a catch-all notes bucket:

- **Brainstorm doc:** update the Chosen Approach, Key Decisions, and Architectural Context content, and move answered items into Resolved Questions.
- **Plan doc:** update the Implementation/Overview, Technical Considerations, Architectural Context, and Success Criteria content, and the relevant execution slice, acceptance criteria, or file list when the answer changes execution shape.
- If a new answer supersedes earlier wording, edit the earlier section in place so the document stays coherent.

`CONTEXT.md` should be totally devoid of implementation details. Do not treat `CONTEXT.md` as a spec, a scratch pad, or a repository for implementation decisions. It is a glossary and nothing else.

### `grill-with-docs` is the canonical brainstorm mutator (`.md` vs `.html`)

Detect the active feature doc's format by extension before writing -- a brainstorm or plan may now be a legacy `.md` file or the composer's `.html` output (`island-contract.md`).

- **`.md` brainstorm or plan** -- edit the file directly as today: the section updates above (Chosen Approach, Key Decisions, Architectural Context, Resolved Questions, etc.) are literal Markdown edits (legacy path, unchanged).
- **`.html` brainstorm** -- `grill-with-docs` is the canonical brainstorm mutator: it is the skill that first proves in-place mutation on this artifact kind. A content decision (a rewritten Key Decision, an updated Chosen Approach, a question moved from Open to Resolved) never edits the rendered markup directly -- it routes through `skills/html-artifact-mutator/SKILL.md` (the shared T01 update capability; do not reimplement or re-derive its read/parse/mutate/re-serialize/re-project pipeline here):
  1. Load and follow `commands/workflows/references/html-artifacts/island-contract.md` ("Mutation contract" section, including the brainstorm-kind Tier-2 core) and the mutator's own `SKILL.md`.
  2. Build `mutation: { class: "content", patch: {...} }` against the brainstorm's `.html` path, supplying the complete new value for each changed top-level field -- e.g. the full `key_decisions[]` array with one entry rewritten, or the full `resolved_questions[]` **and** `open_questions[]` arrays together when a question moves from one to the other (supply both fields' complete new values in the same patch).
  3. The mutator handles fail-loud extraction, mutable-region validation, and re-serialization; never touch a Tier-1 envelope key (including `render_meta`) from this path.
  4. Content mutations always re-project. Dispatch **one fresh subagent** with exactly: an instruction to load and follow `skills/html-artifact-composer/SKILL.md` in re-projection mode (point at the file; do not paste the skill body into the prompt), the brainstorm's `target_path`, and the recorded `render_meta` read back from the just-mutated island. The subagent re-renders only the affected section(s), reusing the exact `archetypes`/`design_seed` already recorded -- never reclassifying, never inventing a fact the island doesn't carry. The update is not complete, and must not be reported complete to the user, until this subagent returns the rewritten artifact path.
- **`.html` plan** -- when the active sink is the plan instead of the brainstorm, the same routing already exists via `/deepen-plan`'s `.html`-plan content-enrichment step; `grill-with-docs` only needs to pick the active sink per "Choose the right documentation sink" above and hand the same content decision to that existing path.

## Final Handoff: Workflow Next Step Advisor

After the grilling session has resolved the current decision branch, updated `CONTEXT.md` for canonical domain language, and updated the active brainstorm or plan with concrete decisions, load the `workflow-next-step` skill.

Run it in advisory mode only:
- pass the current workflow name: `grill-with-docs`
- pass `CONTEXT.md`
- pass the active brainstorm or plan path that was updated
- inspect relevant artifacts without mutating them
- output the full core workflow checklist and the exact next-session command with required inputs

This must be the last phase of the session. If grilling stopped before decisions were resolved, still run the advisor with the current state so it can mark blockers and recommend the recovery step.


</supporting-info>
