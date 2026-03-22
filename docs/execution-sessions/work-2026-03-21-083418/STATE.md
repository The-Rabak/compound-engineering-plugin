---
plan_file: docs/plans/2026-03-20-fork-sync-official-upstream-audit-plan.md
started: 2026-03-21T08:34:18Z
completed: 2026-03-21T09:58:51Z
status: completed
current_task: 10
total_tasks: 10
session_id: work-2026-03-21-083418
---

## Task Status
| # | Task | Status | Attempts | Session File |
|---|------|--------|----------|--------------|
| 1 | Model-routing plumbing in runtime and tests | completed | 1 | `task-01-model-routing-plumbing.md` |
| 2 | Explicit model routing in selected portable content | completed | 1 | `task-02-explicit-model-routing.md` |
| 3 | OV mirroring convention and touched-file sync | completed | 1 | `task-03-ov-mirroring.md` |
| 4 | Regenerate outputs and validate | completed | 1 | `task-04-regenerate-and-validate.md` |
| 5 | Adopt locked upstream agent batch | completed | 1 | `task-05-adopt-upstream-agents.md` |
| 6 | Mirror second batch to OV | completed | 1 | `task-06-mirror-second-batch.md` |
| 7 | Validate second batch and finalize | completed | 1 | `task-07-validate-second-batch.md` |
| 8 | Adopt agent-native-audit skill | completed | 1 | `task-08-adopt-agent-native-audit.md` |
| 9 | Mirror skill batch to OV | completed | 1 | `task-09-mirror-skill-batch.md` |
| 10 | Validate skill batch and finalize | completed | 1 | `task-10-validate-skill-batch.md` |

## Learnings Brief
- [runtime] Portable parsing now preserves a Claude/shared `model` plus an optional `copilotModel` derived from `platforms.copilot.model`.
- [writers] Claude skill frontmatter can emit `model`, and Copilot command-generated skills should prefer `copilotModel` before shared `model`.
- [testing] The `sample-portable-plugin` fixture is the main place to prove portable parser, Claude writer, and CLI build behavior together.
- [content] The first safe explicit-model batch is the research agents, using shared `model: haiku` plus `platforms.copilot.model: gpt-5.4-mini`.
- [content] The next locked adoption slice is three agents: `issue-intelligence-analyst`, `schema-drift-detector`, and a React/Vue-focused `rabak-frontend-races-reviewer`.
- [content] A low-risk locked skill slice is `agent-native-audit`, because it adds a single skill without forcing broader workflow naming or docs-directory changes.
- [ov] Mirror repo files under `viking://resources/_global/repos/compound-engineering-plugin/<relative directory>` and use `_ov_add_resource` against the matching parent URI.
- [ov] Updated portable agent definitions should also be refreshed in the global OV agent registry, not only mirrored under the repo subtree.
- [ov] Standalone skills can be refreshed in the global OV skill registry and mirrored under the repo subtree without adding extra support files.
- [docs] Adding agents requires updating `portable/compound-engineering/plugin.yaml` version plus `plugins/compound-engineering/README.md` and `plugins/compound-engineering/CHANGELOG.md`.
- [adoption] Upstream generated plugin prompts can be used as source material, but Rails- or Stimulus-specific assumptions need direct rewriting for this fork's framework-agnostic/Laravel/React/Vue fit.
- [docs] Adding a standalone skill only changes skill counts and skill tables; the plugin version can stay stable when the slice lands under the same unreleased branch version.
- [next] The next likely sync candidates are heavier workflow skills such as `ce-ideate` or `ce-compound-refresh`, which require local convention decisions instead of direct drop-in adoption.

## Final Summary

Implemented the initial fork-sync rollout slice on a dedicated feature branch:

- added runtime support for skill-level models and Copilot-specific model overrides
- applied explicit low-cost routing to the first research-agent batch
- regenerated Claude and Copilot outputs
- mirrored all changed files into OV and refreshed updated research agents in the global OV agent registry
- passed full repository validation with `bun run build:platforms` and `bun test`

Second rollout slice in progress:

- added three more upstream-sync agents in the portable source and regenerated outputs
- bumped plugin version to `4.2.0` and updated plugin docs/counts
- mirrored the new slice into OV and refreshed the three new agents in the global OV agent registry
- revalidated with `bun run build:platforms`, JSON validation, and `bun test`

Third rollout slice in progress:

- added the `agent-native-audit` skill to the portable source and regenerated outputs
- updated plugin docs/counts from 18 to 19 skills under the existing `4.2.0` release entry
- mirrored the new skill slice into OV and refreshed it in the global OV skill registry
- revalidated with `bun run build:platforms`, generated JSON checks, and `bun test`
