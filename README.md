# Compound Engineering Plugin

Portable source-of-truth and release repository for the `compound-engineering` plugin.

The project packages a constitution-first, spec-driven workflow system for AI-assisted engineering: **29 specialized agents, 25 commands, and 24 skills** built from one portable definition set and emitted into multiple agent harnesses.

## What this repository ships

- `portable/compound-engineering/` -- canonical hand-edited source
- `plugins/compound-engineering/` -- generated Claude Code plugin
- `.github/` -- generated GitHub Copilot agents, skills, and MCP config
- converter/install tooling for OpenCode, Codex, Pi, Droid, Gemini, Kiro, and Copilot
- OpenViking sync tooling for global agent and skill registration

For the exhaustive generated component catalog, see `plugins/compound-engineering/README.md`.

## Core methodology

This repo now treats delivery as a layered spec system instead of letting workflow documents drift into overlapping roles:

1. **`/workflows:constitution`** -- create or amend the repo-level constitution in `docs/constitution.md`
2. **`/workflows:ideate`** -- generate grounded candidate directions
3. **`/workflows:brainstorm`** -- produce the feature-level spec and handoff contract
4. **`/workflows:plan`** -- translate that direction into an implementation plan
5. **`/deepen-plan`** -- deepen the plan with parallel research and review
6. **`/workflows:work`** -- execute through orchestrated subagents
7. **`/workflows:review`** -- review against the code diff, user story, and constitution
8. **`/workflows:compound` / `/workflows:compound-refresh`** -- preserve and refresh learnings

### Spec-driven layers

- **Project constitution** -- repo-wide principles, guardrails, waivers, and amendment rules
- **Brainstorm artifact** -- feature-level WHY / WHAT / WHERE handoff contract
- **Plan artifact** -- execution-ready HOW, task decomposition, dependencies, and validation
- **Work and review** -- enforce both the feature contract and the project constitution
- **Compounded learnings** -- keep the system alive as the project evolves

### Subagent dispatch rule

Orchestrators should not dispatch named specialist agents by name alone. They should first load the bundled agent template from `portable/compound-engineering/agents/` when present, or load the global definition via OpenViking:

```bash
source ~/.copilot-skills/ov-core.sh
AGENT_TEMPLATE=$(ov_load_global_agent "<agent-name>")
```

Then include that template in the spawned task prompt.

## Repository layout

```text
compound-engineering-plugin/
├── portable/compound-engineering/    # Canonical source
├── plugins/compound-engineering/     # Generated Claude Code plugin
├── .claude-plugin/marketplace.json   # Generated Claude marketplace entry
├── .github/                          # Generated Copilot assets
├── docs/                             # Workflow outputs and institutional knowledge
├── src/                              # Converter, writer, and sync tooling
└── tests/                            # Converter and generator coverage
```

## Quick start

### Use the Claude plugin

```bash
claude /plugin marketplace add https://github.com/The-Rabak/compound-engineering-plugin
claude /plugin install compound-engineering
/compound-engineering:setup
```

### Build generated repo outputs

```bash
bun run build:platforms
```

This regenerates:

- `plugins/compound-engineering/` for Claude Code
- `.github/` for GitHub Copilot

### Verify committed outputs

```bash
bun run verify:generated
bun test
```

## Export and sync targets

### Install to OpenCode

```bash
bun run cli:install ./portable/compound-engineering --to opencode
```

That writes into `~/.config/opencode` by default. Claude-specific paths in commands, agents, and copied skill bodies are rewritten to OpenCode paths such as `~/.config/opencode/agents/`.

### Sync to OpenViking globals

```bash
bun run sync:ov
```

This registers portable agents, skills, and command-derived workflow skills into the OpenViking global index and mirrors skill support files so future sessions can load them by name.

### Convert to other targets

```bash
bun run convert ./portable/compound-engineering --to codex --output ./tmp/codex
bun run convert ./portable/compound-engineering --to copilot --output ./tmp/copilot
```

## Docs conventions

Workflow artifacts live under `docs/`:

- `docs/constitution.md` -- repo-level constitution
- `docs/ideation/` -- ideation artifacts
- `docs/brainstorms/` -- feature-level spec and handoff docs
- `docs/plans/` -- implementation plans
- `docs/solutions/` -- compounded learnings that should remain committed
- `docs/execution-sessions/` -- local execution logs and resumability artifacts

## Development notes

- Edit **portable** source first
- Rebuild generated outputs after portable changes
- Keep root README repo-focused and `plugins/compound-engineering/README.md` catalog-focused
- Validate generated files before committing
- Prefer constitution updates for repo-wide policy changes instead of burying them in a single feature brainstorm

## Validation commands

```bash
bun run build:platforms
bun run verify:generated
bun test
cat .claude-plugin/marketplace.json | jq .
cat plugins/compound-engineering/.claude-plugin/plugin.json | jq .
```
