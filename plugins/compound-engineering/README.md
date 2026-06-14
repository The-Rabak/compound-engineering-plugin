# Compounding Engineering Plugin

AI-powered development tools that get smarter with every use. Make each unit of engineering work easier than the last. Includes 34 specialized agents, 28 commands, and 26 skills.

This Claude plugin install surface contains only Claude-relevant files. Codex plugin metadata and Copilot assets are generated only on explicit target builds/installs from the canonical portable source in `portable/compound-engineering/`.

## Support policy

- OpenCode first-class, GitHub Copilot and Codex second, Claude Code third.
- **Keep:** OpenCode-first portable source, this generated Claude Code plugin, and explicit Copilot/Codex exports.
- **Codex:** explicit full local export plus repo marketplace packaging through `.codex-plugin/plugin.json`, `codex-skills/`, and `.agents/plugins/marketplace.json`.
- **De-emphasize:** compatibility exporters for Droid, Pi, Gemini, and Kiro, plus legacy Claude-home sync mirrors.
- **Removed legacy surfaces:** `.github_gpt/` and dormant Cursor-specific export/sync code that no longer fit the supported target matrix.

## Workflow contract highlights

- `/workflows:architecture` is the architecture-improvement handoff between planning and `/deepen-plan`.
- `/workflows:to-issues` turns plans into local ticket artifacts with compact execution context, a dependency graph, and conservative execution batches before implementation, using `focused-ticket-priming` and `ticket-flow-auditor`.
- `/workflows:plan`, `/deepen-plan`, and `/workflows:work` now default to issue-shaped execution slices, with the first slice acting as the tracer bullet, while still allowing explicit `infra-track` and `fix-batch` modes when slices would be fake.
- `/workflows:work` can execute the next safe batch directly from a ticket index while preserving parent plan and architecture refs.
- Vertical slices now carry a feature-home module contract: feature business logic stays co-located, while truly shared utilities and adapters stay global.
- `/brownfield-maintenance` is the on-demand repair path for inherited repos whose AI-layer docs, prompts, and reviewer coverage have drifted.
- `/workflows:work` is the Ralph-first execution path; `/ralph-loop` and `/cancel-ralph` are helpers, not a detached workflow.
- Plans default to unit + e2e evidence unless an explicit exception documents replacement evidence.

## Full workflow guide

Use this sequence when you want the full compound workflow instead of an ad hoc prompt chain:

1. `/workflows:brainstorm` -- clarify the problem, user story, and constraints.
2. `/workflows:plan` -- choose the execution shape and define packets.
3. `/workflows:architecture` -- lock feature homes, shared/global boundaries, and architecture handoff details.
4. `/deepen-plan` -- harden the plan with research and review.
5. `/workflows:to-issues` -- generate `docs/tickets/...` with `focused-ticket-priming`, then write the dependency graph and batch cursor into `index.md` before `ticket-flow-auditor` gates the set.
6. `/workflows:work <ticket-index>` -- execute the next safe batch from the ticket index while preserving parent plan and architecture refs.
7. `/workflows:review` -- review code, ticket drift, architecture fit, and TDD evidence together.
8. `/workflows:compound` -- turn the result into reusable team knowledge.

### Ticketized execution guidance

- Prefer `/workflows:to-issues` after `/deepen-plan` for the sharpest execution packets.
- Use the ticket index as the default `/workflows:work` input once it exists.
- Treat feature-home ownership and scope fences as hard boundaries, not suggestions.
- Use `/brownfield-maintenance` separately when an inherited repo needs workflow repair before normal feature delivery.

## Migration notes

- `/technical_review` is no longer part of the supported workflow. Use `/workflows:architecture` between planning and `/deepen-plan`, then continue through `/workflows:work` and `/workflows:review`.
- OpenCode remains the canonical first-class surface for the source repo. This generated Claude output is the third-class compatibility surface, while Copilot and Codex are supported second-class generated outputs.
- `.github_gpt/` and dormant Cursor-specific export/sync code have been removed from the supported workflow. Droid, Pi, Gemini, and Kiro remain de-emphasized compatibility exporters.
- Ralph evidence is now part of the normal work/review contract: red, green, and post-refactor green proof are expected unless a plan records an explicit exception.

### Verification guidance

```bash
bun run build:platforms
bun run verify:generated
bun test
```

## Components

| Component | Count |
|-----------|-------|
| Agents | 34 |
| Commands | 28 |
| Skills | 26 |
| Hooks | 0 |
| MCP Servers | 1 |

## Agents

Agents are organized into categories for easier discovery.

### Review (21)

| Agent | Description |
|-------|-------------|
| `agent-native-reviewer` | Verify features are agent-native (action + context parity) |
| `architecture-strategist` | Analyze architectural decisions and compliance |
| `code-simplicity-reviewer` | Eliminate complexity, wrong abstractions, and readability regressions |
| `constitution-guardian` | Enforce repo rules derived from constitutions, architecture docs, and governing markdown |
| `data-integrity-guardian` | Database migrations and data integrity |
| `data-migration-expert` | Validate data migrations and ID mappings |
| `deployment-verification-agent` | Create Go/No-Go deployment checklists for risky data changes |
| `rabak-frontend-races-reviewer` | Review React, Vue, and async UI code for race conditions and stale state bugs |
| `rabak-java-reviewer` | Java/JVM code review with a high bar for deep modules, contracts, and maintainable performance |
| `rabak-laravel-reviewer` | Modern Laravel 11+ code review (architecture, Eloquent, testing) |
| `rabak-nest-reviewer` | NestJS code review enforcing simplicity, performance, and security |
| `rabak-python-reviewer` | Python code review with strict conventions |
| `rabak-rust-reviewer` | Rust code review for ownership, safety, idiomatic patterns, and zero-cost abstractions |
| `rabak-typescript-reviewer` | TypeScript code review with strict conventions |
| `rabak-vue-reviewer` | Vue 3 / Nuxt 3 code review (Composition API, TypeScript, Pinia) |
| `pattern-recognition-specialist` | Analyze code for patterns and anti-patterns |
| `performance-oracle` | Performance analysis and optimization |
| `schema-drift-detector` | Detect unrelated schema dump and schema artifact drift in database PRs |
| `security-sentinel` | Security audits and vulnerability assessments |
| `ticket-flow-auditor` | Review plan-to-ticket and ticket-to-implementation alignment, dependency order, scope fences, and execution drift |
| `uncle-bob` | Clean-code reviewer focused on naming, cohesion, side effects, boundaries, and tests that keep code changeable |

### Research (6)

| Agent | Description |
|-------|-------------|
| `best-practices-researcher` | Gather external best practices and examples |
| `framework-docs-researcher` | Research framework documentation and best practices |
| `git-history-analyzer` | Analyze git history and code evolution |
| `issue-intelligence-analyst` | Analyze GitHub issues to surface recurring themes and pain patterns |
| `learnings-researcher` | Search institutional learnings for relevant past solutions |
| `repo-research-analyst` | Research repository structure and conventions |

### Design (3)

| Agent | Description |
|-------|-------------|
| `design-implementation-reviewer` | Verify UI implementations match Figma designs |
| `design-iterator` | Iteratively refine UI through systematic design iterations |
| `figma-design-sync` | Synchronize web implementations with Figma designs |

### Workflow (4)

| Agent | Description |
|-------|-------------|
| `bug-reproduction-validator` | Systematically reproduce and validate bug reports |
| `execution-agent` | Execute scoped `/workflows:work` tickets and units with strict clean-code, DRY, SOLID, and Ralph-aware delivery discipline |
| `pr-comment-resolver` | Address PR comments and implement fixes |
| `spec-flow-analyzer` | Analyze user flows and identify gaps in specifications |

## Commands

### Workflow Commands

Core workflow commands use `workflows:` prefix to avoid collisions with built-in commands:

| Command | Description |
|---------|-------------|
| `/workflows:constitution` | Create or update the repo-level constitution that governs downstream workflows |
| `/workflows:brainstorm` | Explore requirements and approaches before planning |
| `/workflows:plan` | Create implementation plans with issue-shaped execution slices and structured project inputs |
| `/workflows:architecture` | Produce a dedicated architecture improvement artifact before deepening and execution |
| `/workflows:to-issues` | Convert plans into local vertical-slice ticket artifacts with scoped execution context |
| `/workflows:review` | Run comprehensive code reviews |
| `/workflows:triage` | Research todos, record chosen actions, then execute safe batches in swarm mode |
| `/workflows:work` | Execute execution slices systematically |
| `/workflows:debug` | Orchestrate reproduction, diagnosis, fix decisions, and design escalation for bugs and failures |
| `/workflows:compound` | Document solved problems to compound team knowledge |
| `/workflows:compound-refresh` | Refresh stale learnings and pattern docs in `docs/solutions/` |

### Utility Commands

| Command | Description |
|---------|-------------|
| `/lrj` | Full autonomous engineering workflow |
| `/slrj` | Full autonomous workflow with swarm mode for parallel execution |
| `/deepen-plan` | Enhance plans and harden execution slices with parallel research |
| `/changelog` | Create engaging changelogs for recent merges |
| `/create-agent-skill` | Create or edit Claude Code skills |
| `/generate_command` | Generate new slash commands |
| `/heal-skill` | Fix skill documentation issues |
| `/brownfield-maintenance` | Audit and fill brownfield AI-layer gaps outside the main feature workflow |
| `/report-bug` | Report a bug in the plugin |
| `/reproduce-bug` | Reproduce bugs and collect structured evidence for diagnosis or escalation |
| `/resolve_parallel` | Resolve TODO comments in parallel |
| `/resolve_todo_parallel` | Resolve todos in parallel |
| `/test-browser` | Run browser tests on PR-affected pages |
| `/feature-video` | Record video walkthroughs and add to PR description |
| `/ralph-loop` | Start a self-referential loop until completion promise is met |
| `/cancel-ralph` | Cancel an active ralph loop |
| `/deploy-docs` | Deploy documentation site |

## Skills

### Architecture & Design

| Skill | Description |
|-------|-------------|
| `agent-native-audit` | Run a scored audit of agent-native architecture principles |
| `agent-native-architecture` | Build AI agents using prompt-native architecture |
| `adversarial-plan-audit` | Run a deep adversarial review of plans and architecture before implementation |

### Development Tools

| Skill | Description |
|-------|-------------|
| `compound-refresh` | Refresh stale learnings and pattern docs in `docs/solutions/` against the current codebase |
| `compound-docs` | Capture solved problems as categorized documentation |
| `create-agent-skills` | Expert guidance for creating Claude Code skills |
| `frontend-design` | Create production-grade frontend interfaces |
| `focused-ticket-priming` | Turn one plan packet into one compact ticket-local execution packet |
| `laravel-conventions` | Modern Laravel coding standards reference |
| `skill-creator` | Guide for creating effective Claude Code skills |

### Content & Workflow

| Skill | Description |
|-------|-------------|
| `brainstorming` | Explore requirements and approaches through collaborative dialogue |
| `caveman` | Ultra-compressed communication mode for terse, technically exact responses |
| `document-review` | Review workflow artifacts with artifact-aware lenses and headless refinement |
| `file-todos` | File-based todo tracking system |
| `finishing-branch` | Structured branch completion with verification, merge/PR options, and cleanup |
| `git-worktree` | Manage Git worktrees for parallel development |
| `grill-me` | Stress-test plans and designs by interviewing one decision at a time |
| `resolve-pr-parallel` | Resolve PR review comments in parallel |
| `session-history` | Recover prior attempts from repo artifacts first, then bounded recent session history |
| `setup` | Configure which review agents run for your project |
| `systematic-debugging` | Structured debugging with explicit causal chains, prediction tests, and design escalation gates |
| `ubiquitous-language` | Build a DDD-style glossary and canonical domain vocabulary from the conversation |

### Multi-Agent Orchestration

| Skill | Description |
|-------|-------------|
| `orchestrating-swarms` | Comprehensive guide to multi-agent swarm orchestration |

### File Transfer

| Skill | Description |
|-------|-------------|
| `rclone` | Upload files to S3, Cloudflare R2, Backblaze B2, and cloud storage |

### Browser Automation

| Skill | Description |
|-------|-------------|
| `agent-browser` | CLI-based browser automation using Vercel's agent-browser |

### Image Generation

| Skill | Description |
|-------|-------------|
| `gemini-imagegen` | Generate and edit images using Google's Gemini API |

## MCP Servers

| Server | Description |
|--------|-------------|
| `context7` | Framework documentation lookup via Context7 |

### Context7

**Tools provided:**
- `resolve-library-id` - Find library ID for a framework/package
- `get-library-docs` - Get documentation for a specific library

Supports 100+ frameworks including Laravel, Vue, Nuxt, Django, React, and more.

MCP servers start automatically when the plugin is enabled.

## Browser Automation

This plugin uses **agent-browser CLI** for browser automation tasks. Install it globally:

```bash
npm install -g agent-browser
agent-browser install  # Downloads Chromium
```

The `agent-browser` skill provides comprehensive documentation on usage.

## Installation

Claude Code:

```bash
claude /plugin install compound-engineering
```

Codex full local export:

```bash
bun run cli:install ./portable/compound-engineering --to codex
```

Codex repo marketplace output is generated explicitly with `bun run build:codex` at `.agents/plugins/marketplace.json` and points at this plugin folder's `.codex-plugin/plugin.json`.

Codex plugin package caveat: native Codex plugins package installable **skills**. The complete compound-engineering Codex environment also needs custom agents in `.codex/agents`, MCP config in `.codex/config.toml`, hooks in `.codex/hooks.json`, and local marketplace metadata in `.agents/plugins/marketplace.json`. Use the direct Codex installer command above for the complete setup; `bun run build:codex` generates the ignored repo-local marketplace and skill package explicitly.

## Known Issues

### MCP Servers Not Auto-Loading

**Issue:** The bundled Context7 MCP server may not load automatically when the plugin is installed.

**Workaround:** Manually add it to your project's `.claude/settings.json`:

```json
{
  "mcpServers": {
    "context7": {
      "type": "http",
      "url": "https://mcp.context7.com/mcp"
    }
  }
}
```

Or add it globally in `~/.claude/settings.json` for all projects.

## Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

## License

MIT
