# Compound Engineering Plugin

Development tools that compound. Every task you complete makes the next one faster -- not through magic, but through structured knowledge capture and reuse.

26 specialized agents. 22 commands. 16 skills. One workflow that actually works.

## Quick Start

```bash
# 1. Add the marketplace
claude /plugin marketplace add https://github.com/The-Rabak/compound-engineering-plugin

# 2. Install the plugin
claude /plugin install compound-engineering

# 3. Navigate to your project and run setup
/compound-engineering:setup
```

Setup auto-detects your stack (Laravel, NestJS, Python, Vue, TypeScript, Rust, etc.) and configures the right review agents for your project.

---

## How It Works

The plugin is built around a **plan → build → review → learn** cycle. Each phase is a standalone command, and learnings from every cycle persist and feed into the next one. The `learnings-researcher` agent surfaces past solutions during planning and review, so you don't solve the same problem twice.

```
  ┌──────────┐      ┌───────────────┐
  │  PLAN    │─────▶│  DEEPEN PLAN  │
  └────┬─────┘      └───────┬───────┘
       │                    │
       ▼                    ▼
  ┌──────────────────────────────────────────┐
  │              WORK                        │
  │                                          │
  │  Orchestrator decomposes plan into tasks │
  │                                          │
  │    ┌────────────┐  ┌────────────┐        │
  │    │ subagent 1 │  │ subagent 2 │  ...   │──▶ commits
  │    └────────────┘  └────────────┘        │
  │           │              │               │
  │           ▼              ▼               │
  │    ┌─────────────────────────────┐       │
  │    │  learnings brief (shared)   │       │    ◀── Ralph Loop
  │    └─────────────────────────────┘       │    variation:
  │           │                              │    iterate until
  │           ▼                              │    all tasks pass
  │    regression guard ──▶ next task        │
  └──────────────────────────────────────────┘
       │
       ▼
  ┌──────────────────────┐
  │       REVIEW         │
  │  (parallel agents)   │──▶ findings
  └──────┬───────────────┘
         │
         ▼
  ┌──────────────────────┐
  │      COMPOUND        │
  │  (capture learnings) │──▶ docs/solutions/
  └──────────────────────┘
```

The **work phase** is where the heavy lifting happens. It implements a variation of the [Ralph Loop](#the-ralph-loop) -- an iterative execution engine that decomposes a plan into scoped chunks, delegates each to a focused subagent, accumulates learnings across tasks, and runs regression guards after every chunk. The orchestrator never writes code itself; it decomposes, delegates, records, and routes. Each subagent gets a scoped prompt with only the context it needs plus a learnings brief filtered by domain relevance.

---

## The Ralph Loop

The Ralph Loop is a self-referential iteration mechanism built on Claude Code's hook system. A stop hook intercepts the session exit, checks whether a completion promise has been met, and if not, feeds the original task back into the conversation with updated iteration state. This creates persistent, goal-directed execution with a guaranteed termination condition.

The `/workflows:work` command uses a variation of this pattern for its internal task loop: the orchestrator iterates over execution chunks, spawning subagents, collecting learnings, running regression guards, and advancing to the next task -- repeating until every chunk in the plan passes or the pipeline is explicitly halted.

The loop terminates when:
- All tasks complete successfully (work phase variation), or
- The agent outputs the agreed-upon completion promise (raw Ralph Loop), or
- The maximum iteration count is reached (default: 10)

No runaway processes. No infinite loops.

**Commands that use the Ralph Loop:**

| Command | What it does |
|---------|-------------|
| `/lrj "feature"` | Full autonomous cycle: plan → deepen → work → review → test → video |
| `/slrj "feature"` | Same as `/lrj` but uses swarm mode for parallel execution |
| `/ralph-loop "task"` | Raw loop -- wrap any prompt in the iteration engine |
| `/cancel-ralph` | Emergency stop for an active loop |

---

## Core Workflow Commands

### `/workflows:brainstorm` -- Explore before building

For when the problem space is fuzzy. Produces a structured brainstorm document.

```
/workflows:brainstorm "how should we handle user notifications?"
```

Output lands in `docs/brainstorms/`.

### `/workflows:plan` -- Turn ideas into implementation plans

Takes a feature description and produces a structured plan with acceptance criteria and code examples. Checks for existing brainstorms, fetches any linked documents, runs local research against your repo patterns and past learnings.

```
/workflows:plan "add a search feature to the dashboard"
```

Output lands in `docs/plans/`. Follow up with `/deepen-plan` to enhance it or `/workflows:work` to start building.

### `/deepen-plan` -- Add depth with parallel research

Takes an existing plan and runs per-section research agents in parallel. Re-fetches linked source docs, checks `docs/solutions/` for relevant past learnings, runs every configured review agent against the plan.

```
/deepen-plan docs/plans/2026-02-17-feat-dashboard-search-plan.md
```

### `/workflows:work` -- Build it

The workhorse, and where the Ralph Loop variation lives. Takes a plan file and executes it through orchestrated subagent delegation:

1. Reads the plan, resolves ambiguity upfront
2. Sets up a feature branch (or worktree for parallel dev)
3. Decomposes into execution chunks with success criteria
4. Iterates through the task loop:
   - Builds a scoped prompt for each chunk (task + relevant files + learnings brief filtered by domain)
   - Spawns a focused subagent that implements, tests, and retries independently
   - Processes results: writes session files, updates learnings brief, checks off plan items
   - Runs regression guards against all previously completed tasks
   - Commits incrementally when a logical unit passes
5. Repeats until every chunk completes or the pipeline is explicitly halted
6. Pushes the branch with a PR description template

### `/workflows:review` -- Multi-agent code review

Reviews your branch diff against main using every configured review agent in parallel. If migrations are present, it also runs the data integrity, migration, and deployment verification agents.

```
/workflows:review                    # current branch vs main
/workflows:review feat/my-branch     # specific branch
```

Findings are categorized P1 (blocks merge), P2 (should fix), P3 (nice-to-have).

### `/workflows:compound` -- Capture what you learned

After solving a hard problem, run this to create a solution document in `docs/solutions/`. These get automatically surfaced during future plans and reviews by the `learnings-researcher` agent. This is how knowledge compounds.

---

## Utility Commands

| Command | Purpose |
|---------|---------|
| `/deepen-plan` | Research-enhance an existing plan |
| `/test-browser` | Browser tests on PR-affected pages (uses agent-browser) |
| `/triage` | Interactive triage of pending todos |
| `/resolve_todo_parallel` | Fix approved todos in parallel |
| `/resolve_parallel` | Fix TODO comments in code |
| `/changelog` | Generate a changelog from recent merges |
| `/feature-video` | Record a video walkthrough and add to PR |
| `/reproduce-bug 123` | Investigate and reproduce a reported bug |
| `/report-bug` | File a bug against the plugin itself |

---

## Agents

### Review (15 agents)

The review agents are the core of the plugin. Each one is a deep specialist -- not a generalist with bullet points, but an agent that knows the current best practices, common pitfalls, and real-world tradeoffs in its domain.

| Agent | Focus |
|-------|-------|
| `rabak-laravel-reviewer` | Laravel 11+, Eloquent, Pest testing, modern PHP 8.3+ |
| `rabak-vue-reviewer` | Vue 3 Composition API, Nuxt 3, Pinia, TypeScript |
| `rabak-nest-reviewer` | NestJS architecture, validation, auth, performance, security |
| `rabak-python-reviewer` | Python conventions, type hints, testing patterns |
| `rabak-rust-reviewer` | Ownership, safety, idiomatic patterns, zero-cost abstractions |
| `rabak-typescript-reviewer` | Strict TypeScript, type safety, module patterns |
| `code-simplicity-reviewer` | Cognitive complexity, YAGNI, dead code, over-engineering |
| `architecture-strategist` | SOLID, Clean Architecture, DDD, architectural anti-patterns |
| `security-sentinel` | OWASP Top 10 2025, supply chain, secrets, API security |
| `performance-oracle` | Big O, DB optimization, caching, Web Vitals, benchmarks |
| `data-integrity-guardian` | Database migrations, referential integrity, rollback safety |
| `data-migration-expert` | Data migration validation, ID mappings, transformation logic |
| `deployment-verification-agent` | Go/No-Go deployment checklists for risky changes |
| `agent-native-reviewer` | Agent-native architecture verification |
| `pattern-recognition-specialist` | Code pattern and anti-pattern analysis |

### Research (5 agents)

| Agent | Focus |
|-------|-------|
| `best-practices-researcher` | External best practices and examples |
| `framework-docs-researcher` | Framework documentation deep dives |
| `git-history-analyzer` | Git history and code evolution analysis |
| `learnings-researcher` | Past solutions from `docs/solutions/` |
| `repo-research-analyst` | Repository structure and convention analysis |

### Design (3 agents)

| Agent | Focus |
|-------|-------|
| `design-implementation-reviewer` | UI vs. design verification |
| `design-iterator` | Iterative UI refinement |
| `figma-design-sync` | Figma-to-code synchronization |

### Workflow (3 agents)

| Agent | Focus |
|-------|-------|
| `bug-reproduction-validator` | Systematic bug reproduction |
| `pr-comment-resolver` | PR comment resolution and implementation |
| `spec-flow-analyzer` | User flow analysis and gap identification |

---

## Skills

| Skill | What it does |
|-------|-------------|
| `setup` | Configure review agents for your project |
| `laravel-conventions` | Modern Laravel coding standards reference |
| `frontend-design` | Production-grade frontend interfaces |
| `resolve-pr-parallel` | Resolve PR review comments in parallel |
| `brainstorming` | Structured collaborative dialogue |
| `compound-docs` | Capture solved problems as documentation |
| `create-agent-skills` | Guide for creating Claude Code skills |
| `skill-creator` | Skill creation templates and patterns |
| `document-review` | Structured document review |
| `file-todos` | File-based todo tracking |
| `git-worktree` | Git worktree management for parallel dev |
| `orchestrating-swarms` | Multi-agent swarm orchestration |
| `agent-native-architecture` | Prompt-native architecture patterns |
| `agent-browser` | CLI-based browser automation |
| `gemini-imagegen` | Image generation via Google Gemini API |
| `rclone` | Cloud storage uploads (S3, R2, B2) |

---

## Configuration

Run `/compound-engineering:setup` in your project root. It creates `compound-engineering.local.md`:

```markdown
---
review_agents: [rabak-laravel-reviewer, code-simplicity-reviewer, security-sentinel, performance-oracle]
plan_review_agents: [code-simplicity-reviewer, architecture-strategist]
---

# Review Context

Project-specific notes for review agents:
- "We use Redis heavily -- check cache invalidation patterns"
- "Performance-critical: API serves 10k req/s"
- "All database IDs must use UUIDs"
```

Edit this file to tune which agents run and what context they receive.

---

## Tips

- **Start with review.** Run `/workflows:review` on your next PR before trying the full cycle.
- **Compound early.** Run `/workflows:compound` after solving hard bugs. It pays dividends on future work.
- **Feed the planner.** Paste ticket URLs, doc links, and design references into `/workflows:plan`. Better inputs, better plans.
- **Go autonomous.** Use `/lrj "feature"` when you want the full cycle hands-free -- plan, build, review, test, all driven by the Ralph Loop.

---

## Troubleshooting

**Context7 MCP not loading** -- Add to `.claude/settings.json`:
```json
{ "mcpServers": { "context7": { "type": "http", "url": "https://mcp.context7.com/mcp" } } }
```

**Review agents not running** -- Make sure `compound-engineering.local.md` exists. Run `/compound-engineering:setup`.

**agent-browser not installed** -- `npm install -g agent-browser && agent-browser install`. Required for `/test-browser` and `/feature-video`.

---

## License

MIT -- see [LICENSE](LICENSE) for details.

Originally forked from [Every Inc's compound-engineering-plugin](https://github.com/EveryInc/compound-engineering-plugin). Dual copyright (c) 2025 Every Inc, (c) 2025 The Rabak.
