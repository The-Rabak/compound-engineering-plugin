# Compound Engineering Plugin

Portable source-of-truth and OpenCode-first release repository for the `compound-engineering` plugin.

The project packages a constitution-first, spec-driven workflow system for AI-assisted engineering: **32 specialized agents, 26 commands, and 25 skills** built from one portable definition set and emitted into multiple agent harnesses.

- **OpenCode** -- first-class authoring and daily-driver surface
- **GitHub Copilot** -- second-class generated output
- **Claude Code** -- third-class generated compatibility output

## What makes this repo different

Most AI engineering toolkits are loose collections of prompts. This repo is opinionated about the whole delivery loop.

### 1. Workflow-native, not prompt-native

The core value is the workflow:

`constitution -> ideate -> brainstorm -> plan -> architecture -> deepen-plan -> work -> review -> compound`

Each phase has a defined purpose, handoff, and artifact. The system is designed to reduce drift between what you intended, what you built, and what got reviewed.

Planning, deepening, and execution now default to **issue-shaped vertical slices**. The first slice should be a tracer bullet, and later slices widen or harden the feature without regressing into layer-by-layer planning. When the work is honestly better represented as enablement or a tiny-fix batch, the workflow can switch to explicit `infra-track` or `fix-batch` execution shapes instead of faking verticality.

### 2. Architecture happens before execution hardening

`/workflows:architecture` is a first-class phase, not an afterthought. It creates an architecture artifact in `docs/architecture/` that captures deletion tests, interfaces, seams, adapters, contracts, and deepening candidates.

Downstream phases consume the **architecture artifact or explicit architecture handoff contract** instead of relying on hidden prompt lore.

### 3. Ralph-first TDD is part of the contract

TDD is no longer a soft preference or a hidden flag.

- plans declare the effective TDD contract
- `/workflows:work` treats Ralph as the default execution loop
- review checks evidence instead of trusting claims

The expected loop is simple and strict:

1. create failing tests first
2. implement the smallest change that gets green
3. refactor for clarity, structure, and efficiency
4. rerun tests and preserve evidence

By default that means **unit + e2e evidence**, unless a plan records an explicit exception.

### 4. Specialist reviewers with real depth

The plugin is strongest when a task needs judgment, not just linting.

| Area | Examples |
|---|---|
| Architecture | `architecture-strategist`, `agent-native-architecture`, `spec-flow-analyzer` |
| Code quality | `code-simplicity-reviewer`, `performance-oracle`, `security-sentinel`, `uncle-bob` |
| Data safety | `data-integrity-guardian`, `data-migration-expert`, `schema-drift-detector` |
| Language depth | `rabak-laravel-reviewer`, `rabak-typescript-reviewer`, `rabak-python-reviewer`, `rabak-rust-reviewer`, `rabak-vue-reviewer`, `rabak-nest-reviewer` |
| Research and knowledge | `repo-research-analyst`, `framework-docs-researcher`, `learnings-researcher`, `compound-docs` |

### 5. One portable source, multiple delivery surfaces

Everything starts in `portable/compound-engineering/`.

From there the repo generates:

- `.github/` for GitHub Copilot
- `plugins/compound-engineering/` for Claude Code
- `.claude-plugin/marketplace.json` for Claude marketplace metadata

That gives you one canonical source with multiple supported outputs instead of platform-specific drift.

## Where this plugin is strongest

This repo is built for:

- **general product engineering** -- not only AI-native apps
- **AI-assisted delivery** -- when you want a disciplined workflow around agents
- **polyglot teams** -- especially TypeScript, Python, PHP/Laravel, Rust, Vue/Nuxt, and NestJS
- **high-risk change review** -- data integrity, security, performance, race conditions, architectural fit
- **compounding teams** -- where solved problems should become reusable knowledge instead of disappearing into chat history

## The workflow, properly explained

| Phase | What it produces | Why it exists |
|---|---|---|
| `/workflows:constitution` | repo-wide principles and guardrails | keeps project-wide policy out of feature-specific docs |
| `/workflows:ideate` | grounded candidate directions | avoids rushing into the first idea |
| `/workflows:brainstorm` | feature-level WHY / WHAT / WHERE handoff | clarifies the problem and intended outcome |
| `/workflows:plan` | execution-ready HOW | chooses an execution shape, then breaks work into slices or other execution packets with dependencies and success criteria |
| `/workflows:architecture` | architecture artifact in `docs/architecture/` | forces the important structural decisions into the open |
| `/deepen-plan` | stronger plan with research and review input | hardens the selected execution backlog before execution |
| `/workflows:work` | executed implementation with session state and learnings | drives the Ralph-first build loop by executing the selected units through scoped subagents |
| `/workflows:review` | purpose-aware review against code, architecture, and evidence | checks fit, not just syntax |
| `/workflows:compound` | reusable solution docs and refreshed learnings | turns one solved problem into future leverage |

### Recommended happy path

For most serious work:

1. `/workflows:brainstorm`
2. `/workflows:plan`
3. `/workflows:architecture`
4. `/deepen-plan`
5. `/workflows:work`
6. `/workflows:review`
7. `/workflows:compound`

### What changed in the new workflow

- `/technical_review` is gone
- `/workflows:architecture` is now the supported architecture handoff
- plan/deepen/work now default to issue-shaped vertical slices and tracer-bullet sequencing, while still allowing explicit `infra-track` and `fix-batch` modes when slices would be fake
- Ralph-driven TDD is explicit across setup, planning, execution, and review
- workflow prompts are slimmer because shared contracts now live in reusable references
- heavyweight agent and skill prompts were tightened around a shared concise structure

## Support model

| Surface | Status | Notes |
|---|---|---|
| Portable source + OpenCode install/convert + `bun run sync:ov` | **First-class** | primary authoring and day-to-day workflow |
| Generated Copilot output in `.github/` | **Second-class** | supported GitHub-native output |
| Generated Claude Code plugin + marketplace metadata | **Third-class** | supported compatibility output |
| Codex, Droid, Pi, Gemini, Kiro exporters | **De-emphasized** | kept as compatibility bridges, not co-equal surfaces |
| `.github_gpt/` and dormant Cursor-specific export/sync code | **Removed** | removed to stop unsupported workflow drift |

## Quick start

### Use the first-class OpenCode path

```bash
bun run cli:install ./portable/compound-engineering --to opencode
```

That installs into `~/.config/opencode` by default and rewrites Claude-specific paths into OpenCode equivalents.

### Build the generated outputs

```bash
bun run build:platforms
```

This regenerates:

- `.github/`
- `plugins/compound-engineering/`
- `.claude-plugin/marketplace.json`

### Sync portable assets into OpenViking globals

```bash
bun run sync:ov
```

This registers portable agents, skills, and command-derived workflow skills into the OpenViking global index.

### Use the generated Claude plugin

```bash
claude /plugin marketplace add https://github.com/The-Rabak/compound-engineering-plugin
claude /plugin install compound-engineering
/compound-engineering:setup
```

## Repository layout

```text
compound-engineering-plugin/
├── portable/compound-engineering/    # Canonical source
├── plugins/compound-engineering/     # Generated Claude Code plugin
├── .claude-plugin/marketplace.json   # Generated Claude marketplace entry
├── .github/                          # Generated Copilot assets
├── docs/                             # Workflow outputs and institutional knowledge
├── src/                              # Converter, writer, and sync tooling
└── tests/                            # Converter, generator, and contract coverage
```

## Docs outputs

Workflow artifacts live under `docs/`:

- `docs/constitution.md` -- repo-level constitution
- `docs/ideation/` -- ideation artifacts
- `docs/brainstorms/` -- feature-level spec and handoff docs
- `docs/plans/` -- implementation plans
- `docs/architecture/` -- architecture improvement artifacts between planning and deepening
- `docs/solutions/` -- compounded learnings that should remain committed
- `docs/execution-sessions/` -- local execution logs and resumability artifacts

## Why this repo compounds

The goal is not just to help an agent finish a task.

The goal is that every unit of work improves the next one:

- plans get clearer
- architecture decisions get captured
- execution learnings accumulate
- review gets evidence instead of claims
- solved problems become reusable docs

That is the core idea behind this plugin: **engineering systems should make future engineering easier**.

## Development notes

- edit **portable** source first
- rebuild generated outputs after portable changes
- keep root `README.md` repo-focused and `plugins/compound-engineering/README.md` catalog-focused
- validate generated files before committing
- prefer constitution updates for repo-wide policy changes instead of burying them in a single feature brainstorm

## Validation commands

```bash
bun run build:platforms
bun run verify:generated
bun test
cat .claude-plugin/marketplace.json | jq .
cat plugins/compound-engineering/.claude-plugin/plugin.json | jq .
```
