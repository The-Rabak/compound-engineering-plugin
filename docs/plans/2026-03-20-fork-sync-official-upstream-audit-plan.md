# 2026-03-20 Fork sync audit, model routing, and OV mirroring plan

## Problem

This fork has drifted from the official `EveryInc/compound-engineering-plugin` repository over roughly five weeks. The user wants a deliberate sync plan that:

- audits the official repository file-by-file
- maps official agents, skills, and workflows to local equivalents, even when names changed
- evaluates each upstream-only addition for this fork's actual stack: PHP, TypeScript/JavaScript (Node), Python, Rust, Laravel, React, and Vue
- decides which existing local files should be updated from upstream and which should remain fork-specific
- introduces explicit model routing so lighter work can use cheaper models in Claude Code and Copilot
- ensures every created or updated repo file is also mirrored into the general OpenViking namespace

This document is a planning artifact only. It does not implement the sync.

## Research summary

### Local repository shape

- Canonical source of truth: `portable/compound-engineering/`
- Generated Claude output: `plugins/compound-engineering/`
- Generated Copilot output: `.github/`
- Additional GPT-facing output present locally: `.github_gpt/`
- Generator/runtime code: `src/`
- Validation surface: `tests/`

### Verified local build and validation entrypoints

- Build generated outputs: `bun run build:platforms`
- Run tests: `bun test`

### Upstream repository shape

The official repository structure has diverged from this fork in meaningful ways.

- Upstream root includes `.claude/`, `.claude-plugin/`, `.cursor-plugin/`, `.github/`, `docs/`, `plugins/`, `scripts/`, `src/`, and `tests/`
- Upstream does **not** expose the portable authoring tree used by this fork
- Upstream plugin payload still lives under `plugins/compound-engineering/`
- Upstream appears to move user-facing Claude workflows into root `.claude/commands/`
- Upstream runtime/release machinery has expanded in `src/release/**`, `.github/workflows/release-*.yml`, and multiple new sync helpers

### Critical local-vs-upstream drift already confirmed

1. **Authoring model drift**
   This fork is portable-first; upstream is not. Content comparison must therefore distinguish between canonical local portable files and upstream plugin/runtime files.

2. **Workflow packaging drift**
   Local workflow surfaces live mostly in `portable/compound-engineering/commands/workflows/**` plus related commands and skills. Upstream has moved toward `ce:*` skills and root `.claude/commands/`.

3. **Provider/runtime drift**
   Local generator supports targets such as Cursor that do not appear in upstream's current target list, while upstream adds other targets such as `openclaw`, `qwen`, and `windsurf`. `src/**` must be cherry-picked selectively.

4. **Model-routing gap**
   Local parser/writer pipeline preserves `model` on agents and commands but not on skills. The named-model ask requires generator changes, not just content edits.

5. **OpenViking gap**
   OV provides explicit helpers for global agents and skills, and a generic resource-add function for arbitrary files, but the repository currently has no documented OV mirroring workflow.

## Scope of the audit

The implementation pass should account for every upstream file under these areas:

- root metadata and docs: `AGENTS.md`, `README.md`, `CHANGELOG.md`, `CLAUDE.md`, `LICENSE`, `PRIVACY.md`, `SECURITY.md`, `package.json`, `bun.lock`, `tsconfig.json`, `.gitignore`
- root Claude assets: `.claude/**`
- root GitHub automation: `.github/**`
- root release helpers: `scripts/**`
- runtime and generators: `src/**`
- tests: `tests/**`
- plugin-facing payload: `plugins/compound-engineering/**`
- supporting docs: `docs/**`

The local implementation pass should compare these against:

- `portable/compound-engineering/**` as the canonical local plugin definition
- `src/**`, `tests/**`, `package.json`, and top-level docs/runtime files
- generated outputs only after regeneration: `plugins/compound-engineering/**`, `.github/**`, `.github_gpt/**`, `.claude-plugin/**`

## Component mapping

### Agents

#### Exact or near-exact matches already present locally

These should be reviewed for prompt drift and incremental improvement, not treated as missing:

- `design-implementation-reviewer`
- `design-iterator`
- `figma-design-sync`
- `best-practices-researcher`
- `framework-docs-researcher`
- `git-history-analyzer`
- `learnings-researcher`
- `repo-research-analyst`
- `agent-native-reviewer`
- `architecture-strategist`
- `code-simplicity-reviewer`
- `data-integrity-guardian`
- `data-migration-expert`
- `deployment-verification-agent`
- `pattern-recognition-specialist`
- `performance-oracle`
- `security-sentinel`
- `bug-reproduction-validator`
- `pr-comment-resolver`
- `spec-flow-analyzer`

#### Persona or naming swaps

These should be compared by prompt body and review philosophy, not by filename alone:

- upstream `kieran-python-reviewer` vs local `rabak-python-reviewer`
- upstream `kieran-typescript-reviewer` vs local `rabak-typescript-reviewer`
- upstream Rails-focused personas vs local Laravel/Rust/Vue/Nest additions

Recommended posture:

- keep local Rabak personas and language coverage
- selectively cherry-pick prompt improvements from upstream where they genuinely improve quality
- do **not** replace Laravel/Nest/Rust/Vue reviewers with upstream Rails-leaning personas

#### Upstream-only agents worth considering

| Component | Recommendation | Why |
| --- | --- | --- |
| `issue-intelligence-analyst` | Strong consider | Useful for issue-driven ideation/planning and works across stacks |
| `schema-drift-detector` | Strong consider | Good fit for Laravel/database migration review safety |
| `julik-frontend-races-reviewer` | Consider with adaptation | Valuable for async UI/race-condition review, but prompt is Hotwire/Stimulus-heavy and should be rewritten for React/Vue |
| `lint` | Skip | Ruby/ERB-specific and not aligned with this fork's main stack |
| `ankane-readme-writer` | Skip | Ruby gem README specialization, low value here |
| `dhh-rails-reviewer` | Skip | Rails-specific |
| `kieran-rails-reviewer` | Skip | Rails-specific |

### Skills and workflows

#### Likely intent mappings

| Upstream | Local equivalent or nearest intent |
| --- | --- |
| `ce-brainstorm` | `workflows-brainstorm` plus `brainstorming` |
| `ce-plan` | `workflows-plan` |
| `ce-review` | `workflows-review` |
| `ce-work` | `workflows-work` |
| `ce-compound` | `workflows-compound` |
| `lfg` | local `lfg` command |
| `slfg` | local `slfg` command |
| `resolve-todo-parallel` | local `resolve_todo_parallel` command |
| `resolve_parallel` | local `resolve_parallel` command |
| `triage` | local `triage` command |
| `report-bug` | local `report-bug` command |
| `reproduce-bug` | local `reproduce-bug` command |
| `generate_command` | local `generate_command` command |
| `heal-skill` | local `heal-skill` command |
| `deploy-docs` | local `deploy-docs` command |
| `feature-video` | local `feature-video` command |
| `changelog` | local `changelog` command |
| `deepen-plan` | local `deepen-plan` command |

This means the sync cannot assume that upstream skills correspond to local skills one-to-one. Some local command content may need to inherit upstream skill improvements while preserving current public entrypoints.

#### Upstream-only skills worth considering

| Component | Recommendation | Why |
| --- | --- | --- |
| `agent-native-audit` | Strong consider | Useful extension of current agent-native architecture work |
| `ce-plan`, `ce-work`, `ce-review`, `ce-brainstorm`, `ce-compound` | Strong consider for content sync, not necessarily renaming | Core workflow improvements likely worth porting into existing local workflow interfaces |
| `ce-ideate` | Consider | Could add value if issue/idea shaping is needed before brainstorm |
| `ce-compound-refresh` | Consider | Could help upkeep of compounded docs if content is strong |
| `claude-permissions-optimizer` | Optional | Useful for heavy Claude Code users, but environment-specific |
| `proof` | Optional | Useful only if shared doc review via Proof is desired |
| `create-agent-skill` | Consider | Local repo currently has command only; upstream skill may improve authoring flow |
| `deepen-plan` | Consider content sync | Local command exists; upstream skill may have fresher guidance |

#### Upstream-only skills likely to skip

| Component | Recommendation | Why |
| --- | --- | --- |
| `andrew-kane-gem-writer` | Skip | Ruby-gem-specific |
| `dhh-rails-style` | Skip | Rails-specific |
| `dspy-ruby` | Skip | Ruby-specific |
| `test-xcode` | Skip | iOS/Xcode-specific |
| `every-style-editor` | Low priority / likely skip | Brand-specific editorial workflow, unclear value to local stack |

#### Local-only skills to preserve

These should be treated as fork strengths unless a better replacement emerges:

- `laravel-conventions`
- `systematic-debugging`
- `finishing-branch`
- `skill-creator`
- `brainstorming`

## Generator and runtime implications

The implementation work must split into two tracks.

### Track A: content sync

Portable/plugin content to compare and selectively update:

- agents
- commands
- skills
- top-level plugin docs and metadata

### Track B: runtime and infrastructure sync

Selective upstream runtime changes to review:

- `src/release/**` additions
- new sync helpers in `src/sync/**`
- new targets/types/converters for providers not in the fork
- new GitHub workflows such as `release-pr.yml` and `release-preview.yml`
- tests corresponding to any cherry-picked runtime behavior

Do **not** blindly copy upstream `src/**` because local provider support differs.

## Named model routing plan

### Goal

Allow the fork to assign lighter, cheaper models to search-oriented and document-analysis-oriented actions, while preserving stronger defaults for complex implementation and code review.

### Current state

- Agents support `model`
- Commands support `model`
- Skills do **not** currently preserve `model` through the portable parser/types/writers
- Local content already uses aliases like `haiku` and `inherit`
- Copilot-generated agents already emit `model` when present

### Required implementation work

1. Extend the portable internal model to support skill-level `model`
   - update `src/types/claude.ts`
   - update `src/parsers/portable.ts`
   - update Claude writer logic in `src/targets/claude.ts`
   - update any tests that validate parser/writer behavior

2. Add platform-specific model overrides
   - current parser only reads `platforms.claude.*`
   - add support for platform-specific overrides such as:
     - `platforms.claude.model`
     - `platforms.copilot.model`
   - decide whether plain `model` remains the shared fallback

3. Preserve Copilot-specific model names
   - ensure Copilot output can emit provider-native names such as `gpt-5.4-mini` or `claude-haiku-4.6`
   - do not force Copilot to reuse Claude alias-only values when a better provider-specific name exists

4. Validate Claude compatibility before broad rollout
   - local docs currently suggest Claude skill frontmatter expects `haiku`, `sonnet`, or `opus`
   - before writing fully qualified Claude model IDs everywhere, confirm whether named IDs are accepted or whether alias routing is still required for Claude plugin assets

5. Add regression tests
   - parser tests for skill-level `model`
   - parser tests for per-platform model overrides
   - converter/writer tests proving the correct model lands in Claude and Copilot outputs

### First-pass model targets

These are good candidates for cheaper models or explicit named models:

- `learnings-researcher`
- `issue-intelligence-analyst` if added
- basic document-analysis helpers and review-of-text workflows
- low-risk research/document summarization surfaces

These should likely stay on inherited or stronger defaults:

- code review specialists
- architecture/security/data review agents
- implementation workflows
- anything that edits code or makes release-affecting decisions

## OpenViking mirroring plan

### Constraint from the user

Every repo file created or updated during implementation must also be mirrored into the general OV namespace.

### Confirmed OV mechanisms

- `ov_register_global_agent <name> <source_file>`
- `ov_register_global_skill <name> <source_file>`
- generic `_ov_add_resource <file> --parent <uri> --wait`

### Planned mirroring policy

1. **Agents**
   - When a global OV agent representation is intended, register with `ov_register_global_agent`
   - For repo-only agent prompt files that still need discoverability in OV, also add the file as a generic resource if needed

2. **Skills**
   - When mirroring standalone skill definitions, register with `ov_register_global_skill`
   - For multi-file skill directories, mirror `SKILL.md` plus supporting references/scripts as generic OV resources under a stable namespace

3. **Non-agent/non-skill repo files**
   - Mirror changed docs, plans, metadata, generator files, and tests using `_ov_add_resource`
   - Decide on a consistent URI layout, for example mirroring relative repo paths under a dedicated global subtree for this fork

4. **Implementation hygiene**
   - Add an explicit post-edit OV mirroring checklist item to every execution phase
   - If implementation introduces helper scripts, consider creating a reusable local command/script for OV mirroring to avoid manual omissions

### OV open question to resolve during implementation

Define the exact global URI/path convention for arbitrary repo files so repeated syncs land in predictable locations. The helper exists; the namespace convention still needs to be chosen.

## Execution plan

### Phase 1: build the comparison ledger

1. Create a structured local/upstream inventory table for:
   - root metadata/docs
   - runtime/generator files
   - tests
   - plugin agents
   - plugin skills
   - workflow/command content
2. Record for each upstream file:
   - local equivalent path, if any
   - equivalent by intent, if renamed
   - disposition: adopt, adapt, skip, or keep local
3. Keep generated outputs out of the primary comparison ledger until after portable/runtime decisions are made

### Phase 2: compare plugin content deeply

1. Diff exact-match agents and skills for prompt-quality improvements
2. Diff persona-swapped reviewers by body, not filename
3. Compare upstream `ce:*` workflow skills against local workflow commands/skills
4. Decide which local command/skill surfaces keep their names and which should gain upstream content

### Phase 3: decide adoption set

Strong candidates to add or adapt:

- `issue-intelligence-analyst`
- `schema-drift-detector`
- `agent-native-audit`
- selected `ce:*` workflow improvements
- possibly `julik-frontend-races-reviewer`, rewritten for React/Vue

Likely skips:

- Ruby/Rails-specific agents and skills
- Xcode-specific skill
- Ruby-gem README/doc writers

### Phase 4: implement model-routing support

1. Extend schema/types/parsers/writers/converters for skill `model`
2. Add platform-specific model override support
3. Update selected local agents/skills/workflows with explicit model definitions
4. Regenerate Claude/Copilot outputs
5. Validate with tests

### Phase 5: OV mirroring rollout

1. Mirror every changed repo file into OV as part of the implementation flow
2. Register or refresh global OV agents/skills where applicable
3. Mirror non-agent/non-skill resources via `_ov_add_resource`
4. Document the exact mirroring commands used so future syncs follow the same process

### Phase 6: regenerate and validate

1. Run `bun run build:platforms`
2. Run `bun test`
3. Spot-check generated outputs:
   - `plugins/compound-engineering/**`
   - `.github/**`
   - `.github_gpt/**` if it remains part of local deliverables
4. Verify docs/metadata counts and descriptions remain consistent
5. Mirror the final touched files to OV

## SQL-backed execution todos

Execution should follow this order:

1. inventory upstream files
2. map local components
3. compare agents/skills/workflows by intent
4. evaluate upstream additions and update quality
5. implement named model routing support
6. define and apply OV mirroring workflow
7. regenerate, test, and validate outputs

## Notes

- One earlier background repo-research agent became orphaned; a narrower rerun completed successfully and should be treated as authoritative.
- The implementation should be done on a feature branch.
- Because this fork has its own stack specialization, the goal is **selective synchronization**, not upstream parity for its own sake.
