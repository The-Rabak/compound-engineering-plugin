---
task: "Apply explicit model policy to portable definitions and supporting guidance docs"
task_number: 2
status: completed
attempt_count: 1
domains: [model-routing, copilot, security]
plan_file: docs/plans/2026-03-20-fork-sync-official-upstream-audit-plan.md
session_id: work-2026-03-22-084937
---

## What Was Implemented

Applied the new explicit model-routing policy across portable agents and skills, updated repo-authored guidance docs that still taught stale model aliases, fixed portable Copilot skill emission so copied skills honor Copilot model overrides and body rewrites, and hardened `sync-ov` against inherited shell-function and PATH injection.

## Files Changed

- `portable/compound-engineering/agents/**/*.md`
- `portable/compound-engineering/skills/**/SKILL.md`
- `portable/compound-engineering/skills/create-agent-skills/references/*.md`
- `src/converters/claude-to-copilot.ts`
- `src/targets/copilot.ts`
- `src/types/copilot.ts`
- `src/commands/sync-ov.ts`
- `tests/cli.test.ts`
- `tests/fixtures/sample-portable-plugin/skills/skill-one/SKILL.md`
- `tests/fixtures/fake-ov-core.sh`
- `todos/001-completed-p2-fix-copilot-portable-skill-emission.md`

## Problems Encountered

### Problem 1: portable Copilot skills ignored `platforms.copilot.model`
- **Error:** rerun TypeScript review confirmed copied Copilot skills still emitted the shared/Claude model and skipped Copilot body rewrites
- **Root cause:** portable skills were copied as raw directories, so `SKILL.md` never passed through the Copilot transformation path
- **Fix:** carried portable skill model metadata through the Copilot bundle and rewrote copied `SKILL.md` files with Copilot frontmatter and transformed content

### Problem 2: `sync-ov` hardening initially broke real OV execution
- **Error:** `bun run sync:ov` started failing with exit `127` after the first shell-hardening change
- **Root cause:** a too-restrictive fixed `PATH` removed required OV binaries such as `ov` and `openviking-server` from `~/.local/bin`
- **Fix:** replaced the blanket path with a trusted-path allowlist, kept `BASH_FUNC_*` stripping, and retained absolute `/bin/cp` and `/bin/mkdir` in the fast path

## Patterns Discovered

- Portable skills need the same target-platform rendering boundary as generated command-skills; otherwise model routing and content rewrites quietly diverge.
- Shell hardening should use allowlisted executable directories rather than an over-minimized `PATH` when repo automation depends on user-installed helper binaries.

## Test Results

- Command: `bun test tests/cli.test.ts tests/converter.test.ts` and `bun test tests/cli.test.ts && bun run sync:ov`
- Result: PASS
- Attempts: 1
