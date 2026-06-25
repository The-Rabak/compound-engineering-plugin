---
name: workflow-next-step
description: This skill should be used at the end of core compound-engineering workflows to inspect completed artifacts, show the workflow progress checklist, and give the exact next-session command with inputs.
model: gpt-5.5
---

# Workflow Next Step

Use this skill as the final handoff phase after a core compound-engineering workflow completes. Inspect repo artifacts, mark completed phases for the current feature or maintenance lane, and tell the user exactly what to run in the next session.

## Core Graph

Full feature delivery path:

```text
constitution -> brainstorm -> grill-with-docs -> plan -> architecture -> deepen-plan -> to-issues -> work -> review -> triage -> compound
```

Lite feature path:

```text
brainstorm/plan --lite -> work -> review -> triage if review creates todos -> compound if reusable knowledge exists
```

Side lanes:

- `debug` diagnoses failures, then either fixes locally or hands off to `brainstorm`, `plan`, `architecture`, `deepen-plan`, or `to-issues`.
- `compound-refresh` maintains existing `docs/solutions/` knowledge and is not part of one feature's delivery chain.

## Inputs

Infer the current workflow from the just-finished command when possible. Otherwise infer from the newest relevant artifact and user context.

Prefer explicit paths over discovery:

1. command argument paths
2. paths printed by the completed workflow
3. frontmatter refs in known artifacts
4. newest matching artifacts by date and topic

Never mark a step complete only because an unrelated file exists. Match by explicit ref, topic slug, date proximity, source path, or parent/child frontmatter.

## Artifact Checks

Use these checks to decide whether each step is complete for the current feature.

| Step | Completion evidence |
|---|---|
| constitution | `docs/constitution.md` exists with active/versioned constitution content. Optional for a feature unless the repo already has one. |
| brainstorm | Matching `docs/brainstorms/YYYY-MM-DD-*-brainstorm.md` exists with `status: complete`, all `handoff.*` fields true, and no unresolved open questions. |
| grill-with-docs | `CONTEXT.md` exists or was updated with canonical glossary terms, and the active brainstorm or plan has inline additions to decision-bearing sections such as `## Chosen Approach`, `## Key Decisions`, `## Architectural Context`, `## Resolved Questions`, `## Implementation`, or execution packets. |
| plan | Matching `docs/plans/YYYY-MM-DD-*-plan.md` exists with `status: active` or later, `handoff.*` true, `tdd`, `execution_shape`, runtime/e2e sections, and execution packets. |
| architecture | Matching `docs/architecture/YYYY-MM-DD-*-architecture.md` exists and the parent plan records it with `architecture_ref` or a labeled related-artifact link. |
| deepen-plan | The selected plan was updated by deepening, or a `*-plan-deepened.md` file exists; WHY handoff remains intact; architecture artifact or explicit handoff was consumed. |
| to-issues | `docs/tickets/YYYY-MM-DD-<topic>/index.md` exists with ticket files, dependency graph, execution batches, `last_completed_batch`, and the parent plan records `tickets_ref` or a labeled related-artifact link. |
| work | `docs/execution-sessions/work-*/STATE.md` for the current plan/ticket source has `status: completed`, unit files exist, relevant plan/ticket statuses were updated, and validation/evidence is recorded. |
| review | A review summary was produced, TDD/e2e evidence was checked when relevant, and review findings were either absent or written to `todos/`. |
| triage | Targeted todo files are `complete` or explicitly `blocked`, with selected actions, research notes, and validation/work logs recorded. |
| compound | A relevant `docs/solutions/<category>/<filename>.md` exists for a non-trivial solved problem, or the workflow explicitly determined no reusable knowledge needed capture. |

## Routing Rules

Apply these rules after building the checklist.

1. After `brainstorm`, recommend `grill-with-docs` before planning unless the request is explicitly lite/trivial and no domain terms or open boundary questions exist.
2. After `grill-with-docs`, recommend `/workflows:plan` with the enriched brainstorm path.
3. After `plan`, recommend `/workflows:architecture` with the plan path. Allow direct `/workflows:work <plan>` only for lite/small plans with an explicit architecture handoff.
4. After `architecture`, recommend `/deepen-plan <plan>`.
5. After `deepen-plan`, recommend `/workflows:to-issues <plan>` when the plan has a real `architecture_ref` and more than one execution packet, meaningful dependencies, or feature-home boundaries to preserve. Recommend `/workflows:work <plan>` only for compact/lite plans.
6. After `to-issues`, recommend `/workflows:work <ticket-index>`.
7. After `work`, recommend `/workflows:review`, passing the ticket index plus execution session when ticketized execution was used.
8. After `review`, recommend `/workflows:triage` when `todos/*-pending-*.md` exists. If no todos exist, recommend `/workflows:compound` only when the solution was non-trivial or introduced reusable knowledge.
9. After `triage`, recommend another scoped `/workflows:review` when triage executed code changes. Otherwise recommend `/workflows:compound` when reusable knowledge exists.
10. After `compound`, report the chain complete unless the user wants to add the learning to a skill or refresh existing docs.
11. After `debug`, recommend the command named in the debug result's `Fix or next step`. If the result is `rethink design`, prefer `/workflows:brainstorm` or `/workflows:architecture` according to the stated issue.
12. After `compound-refresh`, report maintenance complete and recommend the next feature workflow only when the user has an active feature artifact.

## Required Output

End with exactly these sections.

````markdown
## Workflow Progress

- [ ] constitution — <artifact or reason not applicable>
- [ ] brainstorm — <artifact or missing requirement>
- [ ] grill-with-docs — <CONTEXT.md / feature-doc evidence or missing requirement>
- [ ] plan — <artifact or missing requirement>
- [ ] architecture — <artifact or missing requirement>
- [ ] deepen-plan — <artifact or missing requirement>
- [ ] to-issues — <artifact or missing requirement>
- [ ] work — <artifact or missing requirement>
- [ ] review — <artifact or missing requirement>
- [ ] triage — <artifact or missing requirement>
- [ ] compound — <artifact or missing requirement>

## Next Session

Recommended next step: `<command or skill name>`

Run it with:
```text
<exact command and arguments>
```

Inputs to pass:
- `<path or context>`

Why this is next:
- <one to three bullets tied to the artifact checks>

Stop condition for that next step:
- <artifact or state the next session should produce>
````

For a side lane, keep the same section names but clearly label the checklist as the nearest feature chain or "maintenance lane" when no feature chain is active.

## Constraints

- Do not mutate artifacts while advising next steps.
- Do not invent missing paths.
- Do not summarize every file inspected; cite only the artifacts that explain the recommendation.
- Keep the output concise enough to paste into a new session.
- Prefer a single next command over a menu.
