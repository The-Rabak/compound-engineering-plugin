---
task: "Add OV global sync command and shared helpers"
task_number: 1
status: completed
attempt_count: 1
domains: [openviking, cli, testing]
plan_file: docs/plans/2026-03-20-fork-sync-official-upstream-audit-plan.md
session_id: work-2026-03-21-144359
---

## What Was Implemented

Added a new `sync-ov` CLI command that loads a portable plugin and refreshes the OpenViking global index from canonical portable content:

- registers every portable agent in the global OV agent registry
- registers every portable skill in the global OV skill registry
- mirrors every non-`SKILL.md` file under each skill directory into the matching global OV skill namespace

Also wired the command into `src/index.ts`, added a `bun run sync:ov` package script, documented the workflow in `README.md`, and added a fake OV core fixture plus CLI tests for the new behavior.

## Files Changed

- `src/commands/sync-ov.ts` -- new OV global sync command
- `src/index.ts` -- wired the new CLI subcommand
- `package.json` -- added `sync:ov`
- `README.md` -- documented OV global sync usage
- `tests/cli.test.ts` -- added sync command coverage and regression tests
- `tests/fixtures/fake-ov-core.sh` -- fake OV helper environment for tests

## Problems Encountered

### Problem 1: shell safety and namespace safety needed explicit guards
- **Error:** the initial implementation needed stronger guarantees around namespace traversal and inherited shell startup files
- **Root cause:** plugin-controlled names flow into OV URIs, and Bash can inherit startup hooks such as `BASH_ENV`
- **Fix:** rejected namespace segments outside safe characters and stripped `BASH_ENV`, `ENV`, and `CDPATH` from the spawned Bash environment

### Problem 2: stock OV helper wrappers are too slow for repo-scale sync
- **Error:** the real helper path blocks too long when syncing the full repo skill/agent set
- **Root cause:** `ov_register_global_agent` and `ov_register_global_skill` internally call `_ov_add_resource ... --wait`
- **Fix:** used the same OV helper internals without `--wait`, while preserving helper fallback behavior for non-OpenViking test environments

## Patterns Discovered

- Portable plugin parsing already provides all metadata needed for OV global registration; the sync command can stay portable-first and avoid generated outputs entirely.
- Skill support files must be mirrored by relative path to preserve `references/`, `templates/`, `scripts/`, `assets/`, and `workflows/` layout in the global namespace.

## Test Results

- Command: `bun test tests/cli.test.ts`
- Result: PASS
- Attempts: 1
