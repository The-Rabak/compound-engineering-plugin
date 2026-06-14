# Changelog

All notable changes to the compound-engineering plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.16.1] - 2026-06-14

### Changed

- **`/lrj` command** -- Replaced the old plan/deepen/work/review/resolve flow with a plan-file-only coordinator that runs `/workflows:to-issues`, gates generated tickets through `ticket-flow-auditor`, repairs blocking ticket issues before implementation, then loops through `/workflows:work`, `/workflows:review`, `/workflows:triage --auto-recommended --execute`, and validation two ticket batches at a time.
- **Ticket-window execution** -- `/workflows:work` and `/workflows:review` now accept `--batches N-M` so LRJ can keep each feedback cycle scoped to the current ticket window instead of reviewing the whole ticket set every time.
- **Workflow model routing** -- `/lrj`, `/workflows:to-issues`, `/workflows:work`, `/workflows:review`, and `/workflows:triage` now declare `opus-4.8` for Claude/non-Codex surfaces while preserving `gpt-5.5` for Codex exports.

### Removed

- **`/slrj` command** -- Removed the redundant swarm-specific LRJ entrypoint; `/lrj` now coordinates isolated phase subcontexts while each workflow command manages its own subagents.

## [4.16.0] - 2026-06-08

### Added

- **Codex full export** -- Added a full Codex export path that writes command-derived skills, portable skills, custom agent TOML files, MCP config, hooks, plugin metadata, and marketplace metadata from the portable source.
- **Target model metadata** -- Added target-specific model routing across agents, commands, skills, and reusable skill templates, preserving a heavier-work tier and a lightweight scan/research tier without leaking unrelated harness model IDs into generated install surfaces.

### Changed

- **Support-surface cleanup** -- OpenCode first-class, GitHub Copilot and Codex second, Claude Code third; Droid, Pi, Gemini, and Kiro remain de-emphasized compatibility exporters.
- **Codex command compatibility** -- Codex export now treats slash-command entrypoints as skills instead of deprecated custom prompts and rewrites Claude-specific paths into Codex `.agents` / `.codex` locations.

## [4.15.0] - 2026-06-01

### Added

- **`session-history` skill** -- New artifact-first recall layer that searches repo-owned workflow artifacts before falling back to a bounded recent-session window when the harness exposes searchable session history.
- **`/workflows:debug` command** -- New first-class debug workflow that orchestrates prior-context lookup, reproduction, causal diagnosis, fix-now vs diagnosis-only vs rethink-design decisions, and honest escalation paths.

### Changed

- **Ideation workflow simplification** -- Removed `/workflows:ideate` and the standalone `ideate` skill from the published workflow surface. Brainstorm now owns optional idea shortlisting (candidate generation + adversarial culling) in one repo-scan path, without default `docs/ideation/` artifact output.
- **`/reproduce-bug` command** -- Reframed around reproduction and evidence gathering instead of fuzzy repeated investigation loops. It now supports plain bug reports and failing commands in addition to issue intake, treats browser automation as conditional, captures environment/setup blockers explicitly, and emits a structured handoff for downstream debugging.
- **`systematic-debugging` skill** -- The four-phase method now enforces an explicit trigger -> mechanism -> failure causal chain, prediction-based testing for uncertain links, lightweight assumption audits, failed-fix invalidation, and design-escalation criteria when the problem is architectural rather than local.
- **`document-review` skill** -- Expanded from brainstorm/plan refinement into an artifact-aware reviewer for brainstorms, plans, architecture docs, tickets, and compounded learnings, with concise headless-mode output for workflow invocation.
- **Workflow handoffs** -- `brainstorm`, `plan`, `architecture`, `deepen-plan`, `to-issues`, `compound`, and `work` now reference the upgraded review/debug surfaces so artifact refinement and failure handling stay aligned across the full workflow chain.

## [4.14.0] - 2026-06-01

### Changed

- **`/workflows:triage` command** -- Renamed the old `/triage` workflow to a namespaced command, added a mandatory research pass that produces evidence-backed action options for each todo, and changed execution to safe swarm batches built from dedicated per-todo execution packets.
- **Generated export cleanup** -- Repo builds now clear stale generated Claude command output before regeneration, and OV/OpenCode sync/install now prune the legacy `triage` surface when `/workflows:triage` is present, so renamed workflows stop leaking old installable artifacts across exported platforms.

## [4.13.0] - 2026-05-24

### Added

- **`execution-agent` agent** -- New workflow execution agent for `/workflows:work` ticket and unit delivery, with strict clean-code, DRY, SOLID, doc-block, import-order, and Ralph evidence guardrails.

### Changed

- **`/workflows:work`** -- Ticket execution, retries, and regression repairs now dispatch through the named `execution-agent`, with the full bundled agent template plus injected execution packet context loaded on every run.
- **Execution prompt contract** -- `execution-agent-prompt.md` now serves as the injected context scaffold for the named `execution-agent` instead of acting like a standalone worker prompt.

## [4.12.0] - 2026-05-24

### Changed

- **`/workflows:to-issues`** -- Ticket sets now require a conservative dependency graph, explicit parallel-safe execution batches, and an index-level `last_completed_batch` cursor so ticketized execution can resume from `index.md`.
- **`/workflows:work`** -- Now accepts ticket indexes as the default ticketized entrypoint, selects the next safe batch from `docs/tickets/.../index.md`, and advances the batch cursor only after the whole batch completes.
- **`ticket-flow-auditor` and ticket contracts** -- Review and shared ticket contracts now verify batch safety, dependency layering, and file-overlap honesty so parallel execution stays race-safe.

## [4.11.1] - 2026-05-24

### Changed

- **`grill-with-docs` / `grill-me` skill** -- Concrete implementation and architecture decisions now get written inline into the active brainstorm or plan artifact during the grilling session, while `CONTEXT.md` stays glossary-only.

## [4.11.0] - 2026-05-20

### Added

- **`focused-ticket-priming` skill** -- New ticket-packaging skill that converts one execution packet into one compact ticket-local execution packet with parent refs, feature-home ownership, and evidence commands.
- **`ticket-flow-auditor` agent** -- New reusable reviewer that audits ticket sets after `/workflows:to-issues` and checks plan/ticket/implementation alignment during `/workflows:review`.
- **Ticket execution contract** -- Added a shared `ticket-execution-contract.md` reference so ticket files now have one exact frontmatter/body schema across ticketization, execution, and review.

### Changed

- **`/workflows:to-issues`** -- Now loads the focused ticket-priming skill, writes tickets against the shared ticket execution contract, and closes with an explicit `ticket-flow-auditor` review sweep.
- **`/workflows:work`** -- Now accepts ticket artifacts directly, preserves `plan_ref` / `tickets_ref` / `architecture_ref`, and treats one ticket as one pre-scoped execution unit.
- **`/workflows:review`** -- Now reads ticket-set artifacts, protects `docs/tickets/`, and runs `ticket-flow-auditor` as a mandatory reviewer.

## [4.10.0] - 2026-05-20

### Added

- **`/workflows:to-issues` command** -- New ticketization workflow that converts plans into local `docs/tickets/` artifacts with compact ticket-local context, explicit `tickets_ref` linkage, and a final ticket-set review sweep before execution.

### Changed

- **Ticketization contract** -- Added a shared `ticketization-contract.md` reference so the new `/workflows:to-issues` step uses a stable contract for output paths, local-artifact-first behavior, context packaging, and blocker classification.
- **Workflow order** -- The recommended delivery chain now runs `/workflows:to-issues` between `/deepen-plan` and `/workflows:work` so execution can target smaller ticket artifacts instead of the full plan when appropriate.

## [4.9.0] - 2026-05-20

### Added

- **`/brownfield-maintenance` command** -- New on-demand maintenance workflow for inherited repos that need an AI-layer audit, gap list, and safe fill-gap pass outside the canonical feature delivery flow.

### Changed

- **Vertical-slice architecture contract** -- Added a shared `vertical-slice-architecture.md` workflow reference so planning, architecture, deepening, work, and review now agree on feature homes, shared/global boundaries, and post-plan context tiers.
- **`/workflows:architecture` handoff shape** -- The architecture artifact contract now requires feature-home ownership, shared/global placement decisions, context tiers, and drift checks in addition to the existing deletion-test and seam/adapter guidance.
- **Execution packet expectations** -- `vertical-slices` packets and execution prompts now surface the feature home explicitly so downstream execution stays aligned with the module boundary instead of only the file list.
- **Review boundary enforcement** -- `uncle-bob`, `/workflows:architecture`, and `/workflows:review` now explicitly flag feature-home drift and unjustified shared/global extraction drift.

## [4.7.0] - 2026-05-16

### Added

- **`uncle-bob` agent** -- New clean-code-style reviewer focused on naming, cohesion, abstraction levels, side effects, dependency direction, error handling, and tests that document behavior. The prompt is written in original wording rather than reproducing copyrighted source text.

### Changed

- **Published surface counts** -- Claude plugin docs and generated metadata now reflect 32 specialized agents across the portable and generated bundles.
- **Claude Ralph hook removal** -- Removed the unused Claude stop-hook wiring for Ralph loop operations, and the generated Claude bundle now cleans up stale `hooks/` output when no portable hooks are defined.
- **Workflow reviewer policy** -- `/workflows:architecture` now explicitly runs `architecture-strategist` plus `uncle-bob` as mandatory architecture reviewers, and `/workflows:review` treats `uncle-bob` as a mandatory reviewer alongside the existing baseline agents.

## [4.6.0] - 2026-05-07

### Changed

- **Anthropic model IDs** -- Updated explicit Claude Sonnet and Claude Haiku references to the current documented IDs used by Claude Code, including the OpenCode alias map and authoring guidance.
- **`/workflows:review`** -- Tightened reviewer dispatch rules so named review agents remain owned by the review workflow, missing reviewer templates hard-stop the run, and mandatory reviewers cannot be silently skipped.
- **`/workflows:work` and execution template** -- Execution subagents must now originate from the canonical `execution-agent-prompt.md` template for initial runs, retries, fix loops, and regression repairs. The template now enforces reuse-first implementation, deliberate DRY/SOLID decisions, and explicit variable naming.
- **Orchestration guidance** -- `orchestrating-swarms`, `setup`, `create-agent-skills`, and workflow handoff docs now explicitly forbid ad hoc named-reviewer dispatch and reinforce template-source loading requirements for execution workers.

## [4.5.0] - 2026-04-30

### Added

- **`rabak-java-reviewer` agent** -- Java/JVM specialist reviewer with a high bar for deep modules, clear interfaces, modern Java design, and maintainable performance-aware code.
- **`constitution-guardian` agent** -- Repo-governance reviewer that derives standards from governing markdown, architecture docs, and repo instructions, then raises any unjustified rule violation as a P1.

### Changed

- **`code-simplicity-reviewer`** -- Rewritten into a shorter, stricter reviewer focused on DRY failures, branching complexity, dead weight, readability regressions, and bad abstractions.
- **`setup` skill** -- Now auto-detects Java projects, configures `rabak-java-reviewer`, and treats `constitution-guardian` as a baseline review agent in default review suites.

## [4.4.0] - 2026-04-27

### Added

- **`caveman` skill** -- Ultra-compressed response mode that preserves technical accuracy while minimizing token usage after an explicit user trigger.
- **`grill-me` skill** -- Single-question design interrogation workflow for stress-testing plans and resolving dependencies one branch at a time.
- **`ubiquitous-language` skill** -- DDD-oriented glossary generator that extracts canonical domain terminology from the conversation and writes `UBIQUITOUS_LANGUAGE.md`.

### Changed

- **Support-surface cleanup** -- Generated metadata and plugin docs now present the supported ladder explicitly: OpenCode first-class, GitHub Copilot second, Claude Code third. Codex, Droid, Pi, Gemini, and Kiro remain as de-emphasized compatibility exporters, while removed `.github_gpt/` and dormant Cursor-specific paths are no longer described as core surfaces.
- **Architecture handoff workflow** -- `/workflows:architecture` is now the documented architecture-improvement step between planning and `/deepen-plan`, and downstream prompts consume an architecture artifact or explicit handoff contract instead of stale legacy technical-review language.
- **Ralph/TDD evidence contract** -- Plan, execution, and review prompts now share a single Ralph-first TDD contract that defaults to unit + e2e evidence, requires stable red/green/post-refactor proof, and keeps `/ralph-loop` helpers subordinate to `/workflows:work`.

### Migration notes

- **Workflow order** -- Replace any `/technical_review` usage with `/workflows:architecture` after planning, then continue through `/deepen-plan`, `/workflows:work`, and `/workflows:review`.
- **Platform support** -- Treat OpenCode as first-class, GitHub Copilot as second-class generated output, and Claude Code as third-class generated output. Compatibility exporters remain available but are no longer presented as co-equal surfaces.
- **Removed legacy surfaces** -- `.github_gpt/` and dormant Cursor-specific export/sync code are no longer part of the supported workflow.
- **Verification** -- Validate the generated surfaces with `bun run build:platforms && bun run verify:generated && bun test`.

## [4.3.0] - 2026-04-25

### Added

- **`/workflows:constitution` command** -- Portable workflow entrypoint for creating and amending a repo-level `docs/constitution.md` artifact. Uses tool-agnostic blocking-question guidance, writes versioned project principles and phase guardrails, and makes constitution governance a first-class step before ideation, brainstorming, planning, execution, and review.

### Changed

- **Workflow SDD alignment** -- `ideate`, `brainstorm`, `plan`, `work`, and `review` now treat the constitution as a project-level governing artifact instead of implicitly overloading brainstorm docs to play that role.
- **`/workflows:plan`** -- Plans now record constitution context via `constitution_version`, `constitution_waivers`, and a `Constitution Alignment` section so downstream phases can distinguish repo-wide guardrails from feature-specific intent.
- **`/workflows:work`** -- Execution now reads constitution guardrails, threads them into task prompts, and validates constitution compliance alongside user-story delivery.
- **`/workflows:review`** -- Review now loads constitution context and treats unwaived constitution violations as blocking findings.
- **Workflow subagent dispatching** -- Orchestrating workflow commands now explicitly tell operators to load named agent templates from bundled `agents/` definitions or OpenViking global context before every specialist Task dispatch, instead of dispatching named agents by name alone.
- **OpenCode path rewriting** -- OpenCode conversion now applies explicit Claude-to-OpenCode path replacements for `agents/`, `commands/`, `skills/`, and `plugins/` prefixes, including copied SKILL.md bodies, so hardcoded Claude paths do not leak into generated OpenCode bundles.
- **`ideate` skill and brainstorm docs** -- Ideation now scores ideas for constitution fit, brainstorm explicitly works within project-level baselines, and the brainstorming skill now refers to the brainstorm artifact as a feature-level spec/handoff contract rather than the constitution.
- Command count bumped from 24 to 25 in generated metadata and README surfaces.

## [4.2.0] - 2026-03-21

### Added

- **Execution agent prompt template** (`commands/workflows/references/execution-agent-prompt.md`) -- Standardized 4-phase protocol for all execution subagents: understand (question/assumption phase), implement (standard or TDD), self-review (completeness, quality, discipline, testing, evidence), structured report. Inspired by superpowers plugin's implementer-prompt pattern, adapted for compound engineering's learnings-based methodology.
- **Spec compliance review prompt** (`commands/workflows/references/spec-review-prompt.md`) -- Lightweight per-task spec compliance check for inline review mode. Verifies implementation matches specification by reading actual code, not trusting implementer reports.
- **Code quality review prompt** (`commands/workflows/references/quality-review-prompt.md`) -- Lightweight per-task quality check for inline review mode. Dispatched only after spec compliance passes. Checks code quality, testing, architecture, security, and performance basics.
- **`systematic-debugging` skill** -- Structured 4-phase debugging methodology (observe, hypothesize, test, fix) for diagnosing unexpected errors during implementation. Prevents trial-and-error guessing. Complements existing `bug-reproduction-validator` agent (which validates reported bugs).
- **`finishing-branch` skill** -- Structured branch completion workflow: final verification (tests + lint), completion options (merge/PR/keep/discard), worktree cleanup, plan status updates. Referenced by `workflows:work` Phase 4.

### Changed

- **`workflows:work`** -- Added `--review-mode bulk|inline|both` argument (default: `bulk`). Subagent prompts now reference execution agent template for standardized 4-phase protocol. When `inline` or `both` mode is active, two-stage review (spec compliance then code quality) runs after each task. Added `finishing-branch` skill reference to Phase 4. Added `systematic-debugging` reference to failure handling principles.
- Skill count bumped from 16 to 18 in plugin.json, marketplace.json, and README.md

## [4.0.0] - 2026-03-03

### Changed
- Generalized entire plugin from BrainPOP-specific to industry best practices
- Revamped architecture-strategist, performance-oracle, code-simplicity-reviewer, and security-sentinel agents to world-class specialists
- Generalized rabak-laravel-reviewer to modern Laravel 11+ best practices
- Generalized rabak-vue-reviewer to Vue 3 / Nuxt 3 best practices
- Generalized all skills (laravel-conventions, setup, frontend-design, resolve-pr-parallel)
- Updated all commands and workflows to be framework-agnostic
- Docs directory convention: all workflows write to {project_root}/docs/

### Added
- rabak-nest-reviewer: Specialized NestJS review agent (simplicity, performance, security)

### Removed
- All BrainPOP-specific conventions and references
- publishing-debug skill (BrainPOP CMS-specific)

### Fixed
- Dual MIT license (original Every + The Rabak)
- Updated all URLs and metadata to The-Rabak/compound-engineering-plugin

## [3.2.0] - 2026-02-21

### Added

- **`rabak-rust-reviewer` agent** — Super senior Rust code review agent covering ownership & borrowing correctness, lifetime management, unsafe code auditing (zero tolerance without SAFETY justification), error handling discipline (thiserror for libraries, anyhow for binaries), trait design (composable over god traits), concurrency safety (mutex-across-await detection, Send/Sync verification), typestate patterns, zero-cost abstraction enforcement, dependency hygiene, clippy pedantic compliance, and rustdoc contract verification. 16 detailed review principles with code examples for each.
- **Plan file input support in `/workflows:plan`** — The plan workflow now accepts existing `.md` plan/spec files as input. Pass a file path as the argument (e.g., `/workflows:plan docs/specs/my-plan.md`) to use it as foundation, or provide paths during the "Gather Project Inputs" step. The workflow reads the file, preserves well-defined sections, and enriches gaps with research findings, execution-readiness fields, and SpecFlow analysis. Source plan paths are tracked in `source_docs.plans` frontmatter.

### Changed

- Agent count bumped from 24 to 25 in plugin.json, README.md

## [3.1.0] - 2026-02-19

### Major: Subagent Orchestration Model for `/workflows:work`

Rewrites the execution phase of `/workflows:work` from inline task execution to a subagent orchestration model with execution session files, learnings accumulation, and failure escalation.

### Added

- **Subagent-per-task orchestration** in `/workflows:work` — Each plan chunk is delegated to a focused subagent with scoped context (task description, success criteria, learnings brief, conventions). Subagents implement, test, and retry independently (up to 3 attempts).
- **Execution session files** — `docs/execution-sessions/work-{timestamp}/` directory with per-task session files recording problems encountered, how they were fixed, and patterns discovered. Accumulated learnings compound across tasks.
- **STATE.md** — Persistent orchestrator state file tracking task status, attempt counts, and a running learnings brief. Enables session resumability after crashes.
- **Learnings brief** — Domain-tagged, deduplicated summary of execution learnings passed to each subsequent subagent. Filtered by relevance (backend learnings for backend tasks, etc.) to avoid context pollution.
- **Regression guard** — After each task completes, test commands from ALL previously completed tasks are re-run. Regressions are caught and fixed before proceeding.
- **Failure escalation path** — When a subagent fails: reframe (smaller scope), ask user, skip and continue, or stop pipeline. No infinite loops.
- **Session resumability** — Checks for existing incomplete sessions for the same plan. Can resume from `current_task` with accumulated learnings.
- **Parallel task execution** — Tasks with non-overlapping file sets can run as parallel subagents.
- **Execution Session Analyzer** in `/workflows:compound` — New 6th parallel subagent that searches `docs/execution-sessions/` for session files, extracts recurring patterns, and feeds execution context into documentation.
- **Execution Readiness validation** in `/deepen-plan` — Scores plan tasks for completeness (Files, Depends on, Success criteria, Test command) and auto-decomposes vague phases when below 50%.
- **Structured task format** in `/workflows:plan` — MORE and A LOT templates now output per-task execution chunks with Files, Depends on, Success criteria, and Test command fields.

### Changed

- **`/workflows:work` Phase 2** — Complete rewrite from inline TodoWrite loop to orchestrated subagent delegation model
- **`/workflows:plan` templates** — Added Implementation Phases with structured task format to MORE and A LOT detail levels
- **`/workflows:plan` section 2** — Added Execution Readiness guidance block
- **`/workflows:compound` feedback loop** — Updated to include execution session files in the compounding cycle
- **`/deepen-plan` quality checks** — Added execution-ready structure validation checkbox

## [3.0.0] - 2026-02-17

### Major: BrainPOP Adaptation

Complete adaptation of the compound-engineering plugin from Every Inc (Rails/Ruby) to BrainPOP (Laravel 12 + Vue.js 2 + Nuxt 2).

### Added

- **`rabak-laravel-reviewer` agent** — Laravel code reviewer enforcing BrainPOP conventions (EntryID, snake_case, init() pattern, standard Laravel structure) as Priority 1 before industry best practices
- **`rabak-vue-reviewer` agent** — Vue.js 2 + Nuxt 2 code reviewer enforcing BrainPOP frontend conventions (component structure order, naming, translations, SCSS patterns) as Priority 1
- **`laravel-conventions` skill** — BrainPOP's Laravel coding standards reference
- **`publishing-debug` skill** — Content publishing debugging workflow (CMS → DB → Redis → Queue → Callback)
- **Ralph Wiggum Loop** — Full hooks-based implementation:
  - `hooks/hooks.json` — Stop hook configuration
  - `hooks/stop-hook.sh` — Loop iteration management via stop hook
  - `scripts/setup-ralph-loop.sh` — Loop state file creation
  - `/ralph-loop` command — Start self-referential loops
  - `/cancel-ralph` command — Cancel active loops
- **Structured project inputs in `/workflows:plan`** — New Step 0.5 gathers Jira tickets, Confluence docs, and Figma designs via AskUserQuestion, launches parallel subagents to fetch/summarize, stores source URLs in plan frontmatter
- **Source doc re-fetching in `/deepen-plan`** — New Step 1.5 re-reads source documents from plan frontmatter for deeper analysis

### Changed

- **All `kieran-*` agents renamed to `rabak-*`** — `kieran-python-reviewer` → `rabak-python-reviewer`, `kieran-typescript-reviewer` → `rabak-typescript-reviewer`
- **`performance-oracle` agent** — Now references Laravel/Eloquent ORM, Redis caching patterns, Horizon queue performance, Vue.js 2 frontend patterns
- **`security-sentinel` agent** — Now uses FormRequest validation, Laravel Gates/middleware, `$fillable`/`$guarded` checks instead of Rails strong parameters
- **`data-integrity-guardian` agent** — Added BrainPOP migration convention checks (EntryID, separate files, constraint naming)
- **`data-migration-expert` agent** — Updated to Laravel migration syntax, added `php artisan migrate:rollback`, BrainPOP file naming conventions
- **`deployment-verification-agent` agent** — Updated to Laravel artisan, Horizon, Supervisord; added BrainPOP environment URLs and queue config
- **`/workflows:plan` command** — Plan templates use PHP/Laravel examples; post-generation options reference Rabak reviewers; source_docs in frontmatter
- **`/workflows:review` command** — Uses `rabak-laravel-reviewer`/`rabak-vue-reviewer`; migration detection uses `database/migrations/*.php`; removed Xcode testing option
- **`/workflows:work` command** — Updated test/lint commands for Docker/phpunit/pint; badge URL points to BrainPOP repo
- **`/deepen-plan` command** — References Laravel instead of Rails; example spawns use `laravel-conventions` skill
- **`/lrj` and `/slrj` commands** (renamed from `/lfg`/`/slfg`) — Ralph loop reference updated to `compound-engineering:ralph-loop`
- **`/test-browser` command** — Route mapping for Laravel controllers, Nuxt pages, Vue apps; URLs use `local.brainpop.com`
- **`setup` skill** — Detects Laravel and Vue.js/Nuxt projects; BrainPOP defaults: `[rabak-laravel-reviewer, rabak-vue-reviewer, code-simplicity-reviewer, security-sentinel, performance-oracle]`
- **`frontend-design` skill** — Added Vue.js 2 + Bootstrap Vue patterns section
- **`orchestrating-swarms` skill** — Agent references updated to rabak-*
- **`compound` command** — Agent references updated to rabak-*
- **Plugin metadata** — Updated author, homepage, repository, keywords (removed rails/ruby, added laravel/vue/nuxt/brainpop)

### Removed

- **`kieran-rails-reviewer` agent** — Replaced by `rabak-laravel-reviewer`
- **`dhh-rails-reviewer` agent** — Rails/DHH philosophy not applicable
- **`julik-frontend-races-reviewer` agent** — Stimulus/Hotwire race conditions not applicable
- **`schema-drift-detector` agent** — Rails `schema.rb` drift detection not applicable
- **`ankane-readme-writer` agent** — Ruby gem README style not applicable
- **`lint` agent** — Used Ruby tools (standardrb, erblint, brakeman)
- **`every-style-editor` agent** — Every Inc's editorial style guide
- **`andrew-kane-gem-writer` skill** — Ruby gems
- **`dhh-rails-style` skill** — Rails/DHH conventions
- **`dspy-ruby` skill** — Ruby DSPy library
- **`every-style-editor` skill** — Every Inc's style guide
- **`/test-xcode` command** — No iOS at BrainPOP
- **`/agent-native-audit` command** — Every-specific agent-native audit

### Component Counts

| Component | Before | Pruned | Added | Final |
|-----------|--------|--------|-------|-------|
| Agents | 29 | -7 | +2 | **24** |
| Commands | 22 | -2 | +2 | **22** |
| Skills | 19 | -4 | +2 | **17** |
| Hooks | 0 | 0 | +1 | **1** |
| MCP Servers | 1 | 0 | 0 | **1** |

---

## [2.34.0] - 2026-02-14

### Added

- **Gemini CLI target** — New converter target for [Gemini CLI](https://github.com/google-gemini/gemini-cli). Install with `--to gemini` to convert agents to `.gemini/skills/*/SKILL.md`, commands to `.gemini/commands/*.toml` (TOML format with `description` + `prompt`), and MCP servers to `.gemini/settings.json`. Skills pass through unchanged (identical SKILL.md standard). Namespaced commands create directory structure (`workflows:plan` → `commands/workflows/plan.toml`). 29 new tests. ([#190](https://github.com/EveryInc/compound-engineering-plugin/pull/190))

---

## [2.33.1] - 2026-02-13

### Changed

- **`/workflows:plan` command** - All plan templates now include `status: active` in YAML frontmatter. Plans are created with `status: active` and marked `status: completed` when work finishes.
- **`/workflows:work` command** - Phase 4 now updates plan frontmatter from `status: active` to `status: completed` after shipping. Agents can grep for status to distinguish current vs historical plans.

---

## [2.33.0] - 2026-02-12

### Added

- **`setup` skill** — Interactive configurator for review agents
  - Auto-detects project type (Rails, Python, TypeScript, etc.)
  - Two paths: "Auto-configure" (one click) or "Customize" (pick stack, focus areas, depth)
  - Writes `compound-engineering.local.md` in project root (tool-agnostic — works for Claude, Codex, OpenCode)
  - Invoked automatically by `/workflows:review` when no settings file exists
- **`learnings-researcher` in `/workflows:review`** — Always-run agent that searches `docs/solutions/` for past issues related to the PR
- **`schema-drift-detector` wired into `/workflows:review`** — Conditional agent for PRs with migrations

### Changed

- **`/workflows:review`** — Now reads review agents from `compound-engineering.local.md` settings file. Falls back to invoking setup skill if no file exists.
- **`/workflows:work`** — Review agents now configurable via settings file
- **`/release-docs` command** — Moved from plugin to local `.claude/commands/` (repo maintenance, not distributed)

### Removed

- **Legacy technical-review command** — Superseded by configurable review agents

---

## [2.32.0] - 2026-02-11

### Added

- **Factory Droid target** — New converter target for [Factory Droid](https://docs.factory.ai). Install with `--to droid` to output agents, commands, and skills to `~/.factory/`. Includes tool name mapping (Claude → Factory), namespace prefix stripping, Task syntax conversion, and agent reference rewriting. 13 new tests (9 converter + 4 writer). ([#174](https://github.com/EveryInc/compound-engineering-plugin/pull/174))

---

## [2.31.1] - 2026-02-09

### Changed

- **`dspy-ruby` skill** — Complete rewrite to DSPy.rb v0.34.3 API: `.call()` / `result.field` patterns, `T::Enum` classes, `DSPy::Tools::Base` / `Toolset`. Added events system, lifecycle callbacks, fiber-local LM context, GEPA optimization, evaluation framework, typed context pattern, BAML/TOON schema formats, storage system, score reporting, RubyLLM adapter. 5 reference files (2 new: toolsets, observability), 3 asset templates rewritten.

## [2.31.0] - 2026-02-08

### Added

- **`document-review` skill** — Brainstorm and plan refinement through structured review ([@Trevin Chow](https://github.com/trevin))
- **`/sync` command** — Sync Claude Code personal config across machines ([@Terry Li](https://github.com/terryli))

### Changed

- **Context token optimization (79% reduction)** — Plugin was consuming 316% of the context description budget, causing Claude Code to silently exclude components. Now at 65% with room to grow:
  - All 29 agent descriptions trimmed from ~1,400 to ~180 chars avg (examples moved to agent body)
  - 18 manual commands marked `disable-model-invocation: true` (side-effect commands like `/lfg`, `/deploy-docs`, `/triage`, etc.)
  - 6 manual skills marked `disable-model-invocation: true` (`orchestrating-swarms`, `git-worktree`, `skill-creator`, `compound-docs`, `file-todos`, `resolve-pr-parallel`)
- **git-worktree**: Remove confirmation prompt for worktree creation ([@Sam Xie](https://github.com/samxie))
- **Prevent subagents from writing intermediary files** in compound workflow ([@Trevin Chow](https://github.com/trevin))

### Fixed

- Fix crash when hook entries have no matcher ([@Roberto Mello](https://github.com/robertomello))
- Fix git-worktree detection where `.git` is a file, not a directory ([@David Alley](https://github.com/davidalley))
- Backup existing config files before overwriting in sync ([@Zac Williams](https://github.com/zacwilliams))
- Note new repository URL ([@Aarni Koskela](https://github.com/aarnikoskela))
- Plugin component counts corrected: 29 agents, 24 commands, 18 skills

---

## [2.30.0] - 2026-02-05

### Added

- **`orchestrating-swarms` skill** - Comprehensive guide to multi-agent orchestration
  - Covers primitives: Agent, Team, Teammate, Leader, Task, Inbox, Message, Backend
  - Documents two spawning methods: subagents vs teammates
  - Explains all 13 TeammateTool operations
  - Includes orchestration patterns: Parallel Specialists, Pipeline, Self-Organizing Swarm
  - Details spawn backends: in-process, tmux, iterm2
  - Provides complete workflow examples
- **`/slfg` command** - Swarm-enabled variant of `/lfg` that uses swarm mode for parallel execution

### Changed

- **`/workflows:work` command** - Added optional Swarm Mode section for parallel execution with coordinated agents

---

## [2.29.0] - 2026-02-04

### Added

- **`schema-drift-detector` agent** - Detects unrelated schema.rb changes in PRs
  - Compares schema.rb diff against migrations in the PR
  - Catches columns, indexes, and tables from other branches
  - Prevents accidental inclusion of local database state
  - Provides clear fix instructions (checkout + migrate)
  - Essential pre-merge check for any PR with database changes

---

## [2.28.0] - 2026-01-21

### Added

- **`/workflows:brainstorm` command** - Guided ideation flow to expand options quickly (#101)

### Changed

- **`/workflows:plan` command** - Smarter research decision logic before deep dives (#100)
- **Research checks** - Mandatory API deprecation validation in research flows (#102)
- **Docs** - Call out experimental OpenCode/Codex providers and install defaults
- **CLI defaults** - `install` pulls from GitHub by default and writes OpenCode/Codex output to global locations

### Merged PRs

- [#102](https://github.com/EveryInc/compound-engineering-plugin/pull/102) feat(research): add mandatory API deprecation validation
- [#101](https://github.com/EveryInc/compound-engineering-plugin/pull/101) feat: Add /workflows:brainstorm command and skill
- [#100](https://github.com/EveryInc/compound-engineering-plugin/pull/100) feat(workflows:plan): Add smart research decision logic

### Contributors

Huge thanks to the community contributors who made this release possible! 🙌

- **[@tmchow](https://github.com/tmchow)** - Brainstorm workflow, research decision logic (2 PRs)
- **[@jaredmorgenstern](https://github.com/jaredmorgenstern)** - API deprecation validation

---

## [2.27.0] - 2026-01-20

### Added

- **`/workflows:plan` command** - Interactive Q&A refinement phase (#88)
  - After generating initial plan, now offers to refine with targeted questions
  - Asks up to 5 questions about ambiguous requirements, edge cases, or technical decisions
  - Incorporates answers to strengthen the plan before finalization

### Changed

- **`/workflows:work` command** - Incremental commits and branch safety (#93)
  - Now commits after each completed task instead of batching at end
  - Added branch protection checks before starting work
  - Better progress tracking with per-task commits

### Fixed

- **`dhh-rails-style` skill** - Fixed broken markdown table formatting (#96)
- **Documentation** - Updated hardcoded year references from 2025 to 2026 (#86, #91)

### Contributors

Huge thanks to the community contributors who made this release possible! 🙌

- **[@tmchow](https://github.com/tmchow)** - Interactive Q&A for plans, incremental commits, year updates (3 PRs!)
- **[@ashwin47](https://github.com/ashwin47)** - Markdown table fix
- **[@rbouschery](https://github.com/rbouschery)** - Documentation year update

### Summary

- 27 agents, 23 commands, 14 skills, 1 MCP server

---

## [2.26.5] - 2026-01-18

### Changed

- **`/workflows:work` command** - Now marks off checkboxes in plan document as tasks complete
  - Added step to update original plan file (`[ ]` → `[x]`) after each task
  - Ensures no checkboxes are left unchecked when work is done
  - Keeps plan as living document showing progress

---

## [2.26.4] - 2026-01-15

### Changed

- **`/workflows:work` command** - PRs now include Compound Engineered badge
  - Updated PR template to include badge at bottom linking to plugin repo
  - Added badge requirement to quality checklist
  - Badge provides attribution and link to the plugin that created the PR

---

## [2.26.3] - 2026-01-14

### Changed

- **`design-iterator` agent** - Now auto-loads design skills at start of iterations
  - Added "Step 0: Discover and Load Design Skills (MANDATORY)" section
  - Discovers skills from ~/.claude/skills/, .claude/skills/, and plugin cache
  - Maps user context to relevant skills (Swiss design → swiss-design skill, etc.)
  - Reads SKILL.md files to load principles into context before iterating
  - Extracts key principles: grid specs, typography rules, color philosophy, layout principles
  - Skills are applied throughout ALL iterations for consistent design language

---

## [2.26.2] - 2026-01-14

### Changed

- **`/test-browser` command** - Clarified to use agent-browser CLI exclusively
  - Added explicit "CRITICAL: Use agent-browser CLI Only" section
  - Added warning: "DO NOT use Chrome MCP tools (mcp__claude-in-chrome__*)"
  - Added Step 0: Verify agent-browser installation before testing
  - Added full CLI reference section at bottom
  - Added Next.js route mapping patterns

---

## [2.26.1] - 2026-01-14

### Changed

- **`best-practices-researcher` agent** - Now checks skills before going online
  - Phase 1: Discovers and reads relevant SKILL.md files from plugin, global, and project directories
  - Phase 2: Only goes online for additional best practices if skills don't provide enough coverage
  - Phase 3: Synthesizes all findings with clear source attribution (skill-based > official docs > community)
  - Skill mappings: Rails → dhh-rails-style, Frontend → frontend-design, AI → agent-native-architecture, etc.
  - Prioritizes curated skill knowledge over external sources for trivial/common patterns

---

## [2.26.0] - 2026-01-14

### Added

- **`/lfg` command** - Full autonomous engineering workflow
  - Orchestrates complete feature development from plan to PR
  - Runs: plan → deepen-plan → work → review → resolve todos → test-browser → feature-video
  - Uses ralph-loop for autonomous completion
  - Migrated from local command, updated to use `/test-browser` instead of `/playwright-test`

### Summary

- 27 agents, 21 commands, 14 skills, 1 MCP server

---

## [2.25.0] - 2026-01-14

### Added

- **`agent-browser` skill** - Browser automation using Vercel's agent-browser CLI
  - Navigate, click, fill forms, take screenshots
  - Uses ref-based element selection (simpler than Playwright)
  - Works in headed or headless mode

### Changed

- **Replaced Playwright MCP with agent-browser** - Simpler browser automation across all browser-related features:
  - `/test-browser` command - Now uses agent-browser CLI with headed/headless mode option
  - `/feature-video` command - Uses agent-browser for screenshots
  - `design-iterator` agent - Browser automation via agent-browser
  - `design-implementation-reviewer` agent - Screenshot comparison
  - `figma-design-sync` agent - Design verification
  - `bug-reproduction-validator` agent - Bug reproduction
  - `/review` workflow - Screenshot capabilities
  - `/work` workflow - Browser testing

- **`/test-browser` command** - Added "Step 0" to ask user if they want headed (visible) or headless browser mode

### Removed

- **Playwright MCP server** - Replaced by agent-browser CLI (simpler, no MCP overhead)
- **`/playwright-test` command** - Renamed to `/test-browser`

### Summary

- 27 agents, 20 commands, 14 skills, 1 MCP server

---

## [2.23.2] - 2026-01-09

### Changed

- **`/reproduce-bug` command** - Enhanced with Playwright visual reproduction:
  - Added Phase 2 for visual bug reproduction using browser automation
  - Step-by-step guide for navigating to affected areas
  - Screenshot capture at each reproduction step
  - Console error checking
  - User flow reproduction with clicks, typing, and snapshots
  - Better documentation structure with 4 clear phases

### Summary

- 27 agents, 21 commands, 13 skills, 2 MCP servers

---

## [2.23.1] - 2026-01-08

### Changed

- **Agent model inheritance** - All 26 agents now use `model: inherit` so they match the user's configured model. Only `lint` keeps `model: haiku` for cost efficiency. (fixes #69)

### Summary

- 27 agents, 21 commands, 13 skills, 2 MCP servers

---

## [2.23.0] - 2026-01-08

### Added

- **`/agent-native-audit` command** - Comprehensive agent-native architecture review
  - Launches 8 parallel sub-agents, one per core principle
  - Principles: Action Parity, Tools as Primitives, Context Injection, Shared Workspace, CRUD Completeness, UI Integration, Capability Discovery, Prompt-Native Features
  - Each agent produces specific score (X/Y format with percentage)
  - Generates summary report with overall score and top 10 recommendations
  - Supports single principle audit via argument

### Summary

- 27 agents, 21 commands, 13 skills, 2 MCP servers

---

## [2.22.0] - 2026-01-05

### Added

- **`rclone` skill** - Upload files to S3, Cloudflare R2, Backblaze B2, and other cloud storage providers

### Changed

- **`/feature-video` command** - Enhanced with:
  - Better ffmpeg commands for video/GIF creation (proper scaling, framerate control)
  - rclone integration for cloud uploads
  - Screenshot copying to project folder
  - Improved upload options workflow

### Summary

- 27 agents, 20 commands, 13 skills, 2 MCP servers

---

## [2.21.0] - 2026-01-05

### Fixed

- Version history cleanup after merge conflict resolution

### Summary

This release consolidates all recent work:
- `/feature-video` command for recording PR demos
- `/deepen-plan` command for enhanced planning
- `create-agent-skills` skill rewrite (official spec compliance)
- `agent-native-architecture` skill major expansion
- `dhh-rails-style` skill consolidation (merged dhh-ruby-style)
- 27 agents, 20 commands, 12 skills, 2 MCP servers

---

## [2.20.0] - 2026-01-05

### Added

- **`/feature-video` command** - Record video walkthroughs of features using Playwright

### Changed

- **`create-agent-skills` skill** - Complete rewrite to match Anthropic's official skill specification

### Removed

- **`dhh-ruby-style` skill** - Merged into `dhh-rails-style` skill

---

## [2.19.0] - 2025-12-31

### Added

- **`/deepen-plan` command** - Power enhancement for plans. Takes an existing plan and runs parallel research sub-agents for each major section to add:
  - Best practices and industry patterns
  - Performance optimizations
  - UI/UX improvements (if applicable)
  - Quality enhancements and edge cases
  - Real-world implementation examples

  The result is a deeply grounded, production-ready plan with concrete implementation details.

### Changed

- **`/workflows:plan` command** - Added `/deepen-plan` as option 2 in post-generation menu. Added note: if running with ultrathink enabled, automatically run deepen-plan for maximum depth.

## [2.18.0] - 2025-12-25

### Added

- **`agent-native-architecture` skill** - Added **Dynamic Capability Discovery** pattern and **Architecture Review Checklist**:

  **New Patterns in mcp-tool-design.md:**
  - **Dynamic Capability Discovery** - For external APIs (HealthKit, HomeKit, GraphQL), build a discovery tool (`list_*`) that returns available capabilities at runtime, plus a generic access tool that takes strings (not enums). The API validates, not your code. This means agents can use new API capabilities without code changes.
  - **CRUD Completeness** - Every entity the agent can create must also be readable, updatable, and deletable. Incomplete CRUD = broken action parity.

  **New in SKILL.md:**
  - **Architecture Review Checklist** - Pushes reviewer findings earlier into the design phase. Covers tool design (dynamic vs static, CRUD completeness), action parity (capability map, edit/delete), UI integration (agent → UI communication), and context injection.
  - **Option 11: API Integration** - New intake option for connecting to external APIs like HealthKit, HomeKit, GraphQL
  - **New anti-patterns:** Static Tool Mapping (building individual tools for each API endpoint), Incomplete CRUD (create-only tools)
  - **Tool Design Criteria** section added to success criteria checklist

  **New in shared-workspace-architecture.md:**
  - **iCloud File Storage for Multi-Device Sync** - Use iCloud Documents for your shared workspace to get free, automatic multi-device sync without building a sync layer. Includes implementation pattern, conflict handling, entitlements, and when NOT to use it.

### Philosophy

This update codifies a key insight for **agent-native apps**: when integrating with external APIs where the agent should have the same access as the user, use **Dynamic Capability Discovery** instead of static tool mapping. Instead of building `read_steps`, `read_heart_rate`, `read_sleep`... build `list_health_types` + `read_health_data(dataType: string)`. The agent discovers what's available, the API validates the type.

Note: This pattern is specifically for agent-native apps following the "whatever the user can do, the agent can do" philosophy. For constrained agents with intentionally limited capabilities, static tool mapping may be appropriate.

---

## [2.17.0] - 2025-12-25

### Enhanced

- **`agent-native-architecture` skill** - Major expansion based on real-world learnings from building the Every Reader iOS app. Added 5 new reference documents and expanded existing ones:

  **New References:**
  - **dynamic-context-injection.md** - How to inject runtime app state into agent system prompts. Covers context injection patterns, what context to inject (resources, activity, capabilities, vocabulary), implementation patterns for Swift/iOS and TypeScript, and context freshness.
  - **action-parity-discipline.md** - Workflow for ensuring agents can do everything users can do. Includes capability mapping templates, parity audit process, PR checklists, tool design for parity, and context parity guidelines.
  - **shared-workspace-architecture.md** - Patterns for agents and users working in the same data space. Covers directory structure, file tools, UI integration (file watching, shared stores), agent-user collaboration patterns, and security considerations.
  - **agent-native-testing.md** - Testing patterns for agent-native apps. Includes "Can Agent Do It?" tests, the Surprise Test, automated parity testing, integration testing, and CI/CD integration.
  - **mobile-patterns.md** - Mobile-specific patterns for iOS/Android. Covers background execution (checkpoint/resume), permission handling, cost-aware design (model tiers, token budgets, network awareness), offline handling, and battery awareness.

  **Updated References:**
  - **architecture-patterns.md** - Added 3 new patterns: Unified Agent Architecture (one orchestrator, many agent types), Agent-to-UI Communication (shared data store, file watching, event bus), and Model Tier Selection (fast/balanced/powerful).

  **Updated Skill Root:**
  - **SKILL.md** - Expanded intake menu (now 10 options including context injection, action parity, shared workspace, testing, mobile patterns). Added 5 new agent-native anti-patterns (Context Starvation, Orphan Features, Sandbox Isolation, Silent Actions, Capability Hiding). Expanded success criteria with agent-native and mobile-specific checklists.

- **`agent-native-reviewer` agent** - Significantly enhanced with comprehensive review process covering all new patterns. Now checks for action parity, context parity, shared workspace, tool design (primitives vs workflows), dynamic context injection, and mobile-specific concerns. Includes detailed anti-patterns, output format template, quick checks ("Write to Location" test, Surprise test), and mobile-specific verification.

### Philosophy

These updates operationalize a key insight from building agent-native mobile apps: **"The agent should be able to do anything the user can do, through tools that mirror UI capabilities, with full context about the app state."** The failure case that prompted these changes: an agent asked "what reading feed?" when a user said "write something in my reading feed"—because it had no `publish_to_feed` tool and no context about what "feed" meant.

## [2.16.0] - 2025-12-21

### Enhanced

- **`dhh-rails-style` skill** - Massively expanded reference documentation incorporating patterns from Marc Köhlbrugge's Unofficial 37signals Coding Style Guide:
  - **controllers.md** - Added authorization patterns, rate limiting, Sec-Fetch-Site CSRF protection, request context concerns
  - **models.md** - Added validation philosophy, let it crash philosophy (bang methods), default values with lambdas, Rails 7.1+ patterns (normalizes, delegated types, store accessor), concern guidelines with touch chains
  - **frontend.md** - Added Turbo morphing best practices, Turbo frames patterns, 6 new Stimulus controllers (auto-submit, dialog, local-time, etc.), Stimulus best practices, view helpers, caching with personalization, broadcasting patterns
  - **architecture.md** - Added path-based multi-tenancy, database patterns (UUIDs, state as records, hard deletes, counter caches), background job patterns (transaction safety, error handling, batch processing), email patterns, security patterns (XSS, SSRF, CSP), Active Storage patterns
  - **gems.md** - Added expanded what-they-avoid section (service objects, form objects, decorators, CSS preprocessors, React/Vue), testing philosophy with Minitest/fixtures patterns

### Credits

- Reference patterns derived from [Marc Köhlbrugge's Unofficial 37signals Coding Style Guide](https://github.com/marckohlbrugge/unofficial-37signals-coding-style-guide)

## [2.15.2] - 2025-12-21

### Fixed

- **All skills** - Fixed spec compliance issues across 12 skills:
  - Reference files now use proper markdown links (`[file.md](./references/file.md)`) instead of backtick text
  - Descriptions now use third person ("This skill should be used when...") per skill-creator spec
  - Affected skills: agent-native-architecture, andrew-kane-gem-writer, compound-docs, create-agent-skills, dhh-rails-style, dspy-ruby, every-style-editor, file-todos, frontend-design, gemini-imagegen

### Added

- **CLAUDE.md** - Added Skill Compliance Checklist with validation commands for ensuring new skills meet spec requirements

## [2.15.1] - 2025-12-18

### Changed

- **`/workflows:review` command** - Section 7 now detects project type (Web, iOS, or Hybrid) and offers appropriate testing. Web projects get `/playwright-test`, iOS projects get `/xcode-test`, hybrid projects can run both.

## [2.15.0] - 2025-12-18

### Added

- **`/xcode-test` command** - Build and test iOS apps on simulator using XcodeBuildMCP. Automatically detects Xcode project, builds app, launches simulator, and runs test suite. Includes retries for flaky tests.

- **`/playwright-test` command** - Run Playwright browser tests on pages affected by current PR or branch. Detects changed files, maps to affected routes, generates/runs targeted tests, and reports results with screenshots.
