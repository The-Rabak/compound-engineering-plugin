# Compound Engineering Plugin

Portable source-of-truth and OpenCode-first release repository for the `compound-engineering` plugin.

The project packages a constitution-first, spec-driven workflow system for AI-assisted engineering: **36 specialized agents, 28 commands, and 26 skills** built from one portable definition set and emitted into multiple agent harnesses.

- **OpenCode** -- first-class authoring and daily-driver surface
- **GitHub Copilot** -- second-class generated output
- **OpenAI Codex** -- second-class generated output with full local export and repo marketplace packaging
- **Claude Code** -- third-class generated compatibility output

## What makes this repo different

Most AI engineering toolkits are loose collections of prompts. This repo is opinionated about the whole delivery loop.

### 1. Workflow-native, not prompt-native

The core value is the workflow:

`constitution -> brainstorm -> plan -> architecture -> deepen-plan -> to-issues -> work -> review -> triage -> compound`

Each phase has a defined purpose, handoff, and artifact. The system is designed to reduce drift between what you intended, what you built, and what got reviewed.

For small, low-risk changes, the compact track is:

`brainstorm/plan --lite -> work -> review -> triage if review creates todos -> compound if reusable knowledge exists`

The lite mode is for small, low-risk changes and preserves TDD/evidence and scope contracts while reducing questionnaire, research, and ticketization ceremony.

Finalized brainstorms, plans, architecture handoffs, and reviews can now offer optional **local-only visual artifacts** as MDX sidecars under `docs/visual-artifacts/` without replacing the canonical Markdown artifact or adding hosted Plan MCP infrastructure. The renderer loads the BuilderIO Agent-Native plan style guidance, generates the pinned block catalog with `@agent-native/core@0.67.0`, and writes structured Plan primitives such as diagrams, file trees, tabs, checklists, annotated code, diffs, schema/API blocks, and wireframes when the source supports them. It writes `preview.html` by default, and `/visual-artifact <artifact-path>` wraps local check and static preview from only the artifact path; `--serve` requires a reachable local Plan UI on `127.0.0.1:3001` by default.

Planning, deepening, and execution now default to **issue-shaped vertical slices**. The first slice should be a tracer bullet, and later slices widen or harden the feature without regressing into layer-by-layer planning. Those slices now inherit a **feature-home module contract**: business logic should live together under one feature namespace, while truly shared utilities and adapters stay global. When the work is honestly better represented as enablement or a tiny-fix batch, the workflow can switch to explicit `infra-track` or `fix-batch` execution shapes instead of faking verticality.

### 2. Architecture happens before execution hardening

`/workflows:architecture` is a first-class phase, not an afterthought. It creates an architecture artifact in `docs/architecture/` that captures feature homes, shared/global decisions, context tiers, deletion tests, interfaces, seams, adapters, contracts, and deepening candidates.

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

- `plugins/compound-engineering/` for Claude Code
- `.claude-plugin/marketplace.json` for Claude marketplace metadata

GitHub Copilot and Codex outputs are generated only on explicit request into ignored target-specific paths. `.github/workflows` remains normal repository CI/deploy configuration.

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
| `/workflows:brainstorm` | feature-level WHY / WHAT / WHERE handoff | clarifies the problem and intended outcome |
| `/workflows:plan` | execution-ready HOW | chooses an execution shape, then breaks work into slices or other execution packets with dependencies and success criteria |
| `/workflows:architecture` | architecture artifact in `docs/architecture/` | forces the important structural decisions into the open |
| `/deepen-plan` | stronger plan with research and review input | hardens the selected execution backlog before execution |
| `/workflows:to-issues` | local ticket set in `docs/tickets/` | turns one large plan into smaller vertical-slice execution packets, builds a conservative dependency graph plus parallel-safe batches, then gates the set with `ticket-flow-auditor` |
| `/workflows:work` | executed implementation with session state and learnings | drives the Ralph-first build loop by executing either plan units or the next safe batch from a ticket index through scoped subagents |
| `/workflows:review` | purpose-aware review against code, architecture, tickets, and evidence | checks fit, not just syntax |
| `/workflows:triage` | researched todo decisions and safe follow-up execution batches | turns review-created todos into approved actions before compounding or follow-up work |
| `/workflows:compound` | reusable solution docs and refreshed learnings | turns one solved problem into future leverage |

### Recommended happy path

For most serious work:

1. `/workflows:brainstorm`
2. `/workflows:plan`
3. `/workflows:architecture`
4. `/deepen-plan`
5. `/workflows:to-issues`
6. `/workflows:work`
7. `/workflows:review`
8. `/workflows:triage`
9. `/workflows:compound`

When review produces follow-up todos, use `/workflows:review` -> `/workflows:triage` -> `/workflows:compound` so findings are researched, resolved, and captured before the work is considered complete.

### What is new in the ticketized flow

- **`focused-ticket-priming`** turns one execution packet into one compact ticket-local packet instead of copying the whole plan into every task.
- **`ticket-execution-contract.md`** gives ticket creation, ticket execution, and review one shared schema for frontmatter, sections, refs, ticket status, index batching, and resumable progress.
- **`ticket-flow-auditor`** now closes `/workflows:to-issues` and also runs inside `/workflows:review`, so the same reviewer checks both pre-execution ticket quality and post-implementation ticket drift.
- **Index-driven `/workflows:work`** can execute the next safe ticket batch directly from `docs/tickets/.../index.md`, using the index as the execution cursor and the selected ticket files as the local packets.

## Full updated workflow guidance

Use the full chain when you want the plugin to take a feature from vague intent to reusable learning without bloating execution context.

| Step | Run | Main artifact | Guidance |
|---|---|---|---|
| 1 | `/workflows:brainstorm` | `docs/brainstorms/...` | Capture the WHY, intended outcome, and architectural context before planning. |
| 2 | `/workflows:plan` | `docs/plans/...` | Choose an honest execution shape and define packets with dependencies and evidence expectations. |
| 3 | `/workflows:architecture` | `docs/architecture/...` | Lock feature homes, shared/global boundaries, context tiers, seams, and drift checks before hardening the plan. |
| 4 | `/deepen-plan` | updated `docs/plans/...` | Stress-test the chosen backlog with research and reviewers until boundaries and execution packets are solid. |
| 5 | `/workflows:to-issues` | `docs/tickets/.../index.md` + ticket files | Use `focused-ticket-priming` to shrink each packet into one execution-ready ticket, then write the dependency graph, conservative execution batches, and `last_completed_batch` cursor into the index before `ticket-flow-auditor` signs off. |
| 6 | `/workflows:work <ticket-index>` | `docs/execution-sessions/...` | Prefer the ticket index as the execution entrypoint. `/workflows:work` reads the next batch from the index, runs only that safe batch, and advances the index cursor when the batch is complete. |
| 7 | `/workflows:review` | review findings | Review against code, architecture, ticket artifacts, and TDD evidence. This is where post-implementation ticket drift is checked. |
| 8 | `/workflows:triage` | ready/complete todos or follow-up execution batches | Research review-created todos, choose actions, and execute safe batches when appropriate. |
| 9 | `/workflows:compound` | `docs/solutions/...` | Capture the solved pattern so the next task starts from accumulated knowledge instead of chat history. |

### Practical usage rules

1. Run **`/workflows:to-issues` after `/deepen-plan`** when you want the cleanest execution packets. Run it right after `/workflows:plan` only when you explicitly want earlier backlog shaping and you are willing to preserve visible uncertainty.
2. Treat **the ticket index as the default execution entrypoint** once ticket artifacts exist. Let `/workflows:work` pick the next batch from `index.md` instead of hand-selecting from the full plan every time.
3. Keep **business logic inside the feature home** named by the architecture artifact. Only move code into shared/global space when the reason to change is truly cross-feature.
4. Let **`ticket-flow-auditor` findings block execution** when it reports missing dependency order, weak WHY tracing, oversized tickets, or scope fences that are too vague to enforce.
5. Use **lite mode** for small, low-risk changes where `/workflows:plan --lite` can produce one or a few execution packets and then hand directly to `/workflows:work`.
6. Use **`/brownfield-maintenance`** outside the happy path when the repo already exists and the AI-layer docs, prompts, or review contracts need repair before you can trust the workflow.

### What changed in the new workflow

- `/technical_review` is gone
- `/workflows:architecture` is now the supported architecture handoff
- `/workflows:to-issues` is the local-artifact-first ticketization step between deepening and execution, now powered by the `focused-ticket-priming` skill and the reusable `ticket-flow-auditor`
- `/workflows:work` can execute the next safe batch directly from `docs/tickets/.../index.md`, while still allowing a single ticket file when you need a narrower manual run
- `/workflows:triage` now sits after `/workflows:review` in the documented delivery loop, before reusable knowledge is compounded
- `/workflows:brainstorm --lite` and `/workflows:plan --lite` support compact planning for small changes without weakening TDD/evidence or scope traceability
- plan/deepen/work now default to issue-shaped vertical slices and tracer-bullet sequencing, while still allowing explicit `infra-track` and `fix-batch` modes when slices would be fake
- `/brownfield-maintenance` is the on-demand repair path for inherited repos whose AI-layer docs, prompts, and reviewer coverage have drifted
- Ralph-driven TDD is explicit across setup, planning, execution, and review
- workflow prompts are slimmer because shared contracts now live in reusable references
- heavyweight agent and skill prompts were tightened around a shared concise structure

## Support model

| Surface | Status | Notes |
|---|---|---|
| Portable source + OpenCode install/convert + `bun run sync:ov` | **First-class** | primary authoring and day-to-day workflow |
| Explicit Copilot output in ignored `.github/agents`, `.github/skills`, and `.github/copilot-mcp-config.json` | **Second-class** | supported GitHub-native output, generated only when requested |
| Codex local export and generated repo marketplace | **Second-class** | writes `.agents/skills`, `.codex/agents`, MCP/hooks config, and installable plugin metadata |
| Generated Claude Code plugin + marketplace metadata | **Third-class** | supported compatibility output |
| Droid, Pi, Gemini, Kiro exporters | **De-emphasized** | kept as compatibility bridges, not co-equal surfaces |
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

- `plugins/compound-engineering/`
- `.claude-plugin/marketplace.json`

To generate other harness assets explicitly:

```bash
bun run build:copilot
bun run build:codex
```

### Export directly into Codex

```bash
bun run cli:install ./portable/compound-engineering --to codex
```

That writes Codex-discoverable skills to `~/.agents/skills`, custom agents to `~/.codex/agents`, MCP config to `~/.codex/config.toml`, hooks to `~/.codex/hooks.json`, and a personal marketplace entry under `~/.agents/plugins/marketplace.json`.

#### Codex plugin package caveat

Codex native plugins package installable **skills**. This repo also ships Codex custom agents, MCP config, hooks, and local marketplace metadata, which live outside the native skills package:

- custom agents: `~/.codex/agents/*.toml`
- direct skill export: `~/.agents/skills/*/SKILL.md`
- MCP config: `~/.codex/config.toml`
- hooks: `~/.codex/hooks.json`
- personal marketplace: `~/.agents/plugins/marketplace.json`

Use `bun run cli:install ./portable/compound-engineering --to codex` when you want the complete working Codex environment, including custom agents used by command-derived skills. `bun run build:codex` generates the ignored repo-local Codex package/export surface explicitly.

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
├── .github/workflows/                # Repository CI/deploy workflows
├── docs/                             # Workflow outputs and institutional knowledge
├── src/                              # Converter, writer, and sync tooling
└── tests/                            # Converter, generator, and contract coverage
```

## Docs outputs

Workflow artifacts live under `docs/`:

- `docs/constitution.md` -- repo-level constitution
- `docs/brainstorms/` -- feature-level spec and handoff docs
- `docs/plans/` -- implementation plans
- `docs/architecture/` -- architecture improvement artifacts between planning and deepening
- `docs/tickets/` -- local ticket sets created from plans before execution
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

Validate explicit Codex exports only after running `bun run build:codex`:

```bash
cat .agents/plugins/marketplace.json | jq .
cat plugins/compound-engineering/.codex-plugin/plugin.json | jq .
```
