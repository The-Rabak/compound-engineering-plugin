---
task: "Model-routing plumbing in runtime and tests"
task_number: 1
status: completed
attempt_count: 1
domains: [runtime, converter, testing]
plan_file: docs/plans/2026-03-20-fork-sync-official-upstream-audit-plan.md
session_id: work-2026-03-21-083418
---

## What Was Implemented

Added skill-level `model` support plus optional `copilotModel` plumbing on agents, commands, and skills so the portable parser can preserve provider-specific overrides separately from the Claude/shared value. Updated the Claude writer to emit skill `model` and the Copilot converter to prefer `copilotModel` for agents and generated skills while falling back to shared `model`.

## Files Changed

- `src/types/claude.ts` -- added `model` to `ClaudeSkill` and `copilotModel` to agent, command, and skill types
- `src/parsers/portable.ts` -- generalized platform config lookup and parsed Copilot model overrides
- `src/targets/claude.ts` -- wrote skill `model` into Claude output frontmatter
- `src/converters/claude-to-copilot.ts` -- preserved Copilot-preferred model values for agents and generated skills
- `tests/portable-parser.test.ts` -- added parser assertions for shared and Copilot model values
- `tests/claude-writer.test.ts` -- added skill model writer assertion
- `tests/cli.test.ts` -- added end-to-end build assertions for Claude and Copilot model output
- `tests/converter.test.ts` -- added Copilot converter override and fallback tests
- `tests/fixtures/sample-portable-plugin/commands/workflows/plan.md` -- added shared model and Copilot override fixture data
- `tests/fixtures/sample-portable-plugin/skills/skill-one/SKILL.md` -- added shared model and Copilot override fixture data

## Problems Encountered

None.

## Patterns Discovered

- Portable parsing already treated `platforms.claude.*` as a provider-specific override layer, so adding a parallel `copilotModel` field was the smallest safe extension.
- `formatFrontmatter()` naturally omits `undefined` values, which keeps optional model fields low-risk.
- Copilot command conversion is the right place to preserve command model routing for generated skills.

## Test Results

- Command: `bun test tests/portable-parser.test.ts tests/claude-writer.test.ts tests/cli.test.ts tests/converter.test.ts`
- Result: PASS
- Attempts: 1
