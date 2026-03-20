# 2026-03-20 Fork sync comparison matrix

## Purpose

This matrix is the working comparison sheet for syncing this fork against the official `EveryInc/compound-engineering-plugin` repository.

It is meant to help us decide what to:

- adopt directly
- adapt into fork-specific equivalents
- skip as upstream-specific
- preserve as fork-only value

## Important comparison rules

1. `portable/compound-engineering/**` is the canonical local source of truth.
2. `plugins/compound-engineering/**`, `.github/**`, `.github_gpt/**`, and `.claude-plugin/**` are downstream/generated or mixed-output surfaces and should be compared primarily **after** canonical/runtime decisions are made.
3. Upstream has structural drift from this fork:
   - upstream is not portable-first
   - upstream has root `.claude/commands/**`
   - local workflow behavior is split across portable commands, skills, and generated outputs
4. Initial recommendation is not a final decision. It is the current best recommendation based on the research already completed.

## Legend

### Match type

- `exact` - same or nearly same component exists locally
- `renamed` - intent matches, naming/package surface differs
- `upstream-only` - no local equivalent yet
- `local-only` - fork-specific addition
- `structural-drift` - same concern area, but file layout differs too much for direct path comparison

### Initial recommendation

- `adopt`
- `adapt`
- `preserve`
- `skip`
- `investigate`

## A. Repo-level and structural surfaces

| Upstream surface | Local comparison surface | Match type | Initial recommendation | Notes |
| --- | --- | --- | --- | --- |
| `AGENTS.md` | `AGENTS.md` | exact | adapt | Keep portable-first and fork-specific guidance while reviewing upstream process improvements. |
| `README.md` | `README.md` | exact | adapt | Review upstream wording, counts, and repo process changes; preserve fork branding and provider support. |
| `CHANGELOG.md` | `CHANGELOG.md` | exact | adapt | Useful for release process deltas; keep fork release history intact. |
| `CLAUDE.md` | `CLAUDE.md` | exact | adapt | Sync useful process guidance, preserve local portable/OpenViking instructions. |
| `LICENSE` | `LICENSE` | exact | investigate | Verify if any upstream text changed. |
| `PRIVACY.md` | no direct local counterpart | upstream-only | investigate | Decide whether the fork should add matching privacy docs. |
| `SECURITY.md` | no direct local counterpart | upstream-only | investigate | Likely worth adding if not already covered elsewhere. |
| `.gitignore` | local `.gitignore` | exact | investigate | Compare for new generated or release artifacts. |
| `.claude/commands/**` | `portable/compound-engineering/commands/**` and generated command/skill outputs | structural-drift | adapt | Upstream moved workflow surfaces here; compare by behavior, not path. |
| `.github/workflows/ci.yml` | `.github/workflows/ci.yml` | exact | adapt | Compare test/build workflow changes. |
| `.github/workflows/deploy-docs.yml` | `.github/workflows/deploy-docs.yml` | exact | adapt | Check the existing docs deployment path mismatch noted during research. |
| `.github/workflows/release-pr.yml` | no direct local counterpart | upstream-only | investigate | Potentially valuable if release automation is desired. |
| `.github/workflows/release-preview.yml` | no direct local counterpart | upstream-only | investigate | Potentially valuable if preview publishing is desired. |
| `.github/release-please-config.json` and `.github/.release-please-manifest.json` | no direct local counterpart | upstream-only | investigate | Useful only if adopting release-please style automation. |
| `scripts/release/**` | no direct local counterpart | upstream-only | investigate | Review only if release automation is worth bringing in. |
| `docs/**` | `docs/**` | structural-drift | adapt | Compare relevant specs/plans/solutions, but preserve local docs conventions and artifacts. |

## B. Runtime, generators, and tests

| Upstream surface | Local comparison surface | Match type | Initial recommendation | Notes |
| --- | --- | --- | --- | --- |
| `src/commands/convert.ts` | `src/commands/convert.ts` | exact | adapt | Compare provider support and CLI behavior. |
| `src/commands/install.ts` | `src/commands/install.ts` | exact | adapt | Compare install flow but preserve fork target support. |
| `src/commands/list.ts` | `src/commands/list.ts` | exact | adapt | Likely low-risk sync candidate. |
| `src/commands/sync.ts` | `src/commands/sync.ts` | exact | adapt | Compare sync improvements carefully because fork providers differ. |
| `src/parsers/claude.ts` and `src/parsers/claude-home.ts` | local same files | exact | adapt | Compare parsing changes and compatibility fixes. |
| upstream lacks `portable` parser | `src/parsers/portable.ts` | local-only | preserve | Core fork value; may still cherry-pick ideas from upstream parser/runtime changes. |
| `src/release/**` | no direct local counterpart | upstream-only | investigate | Strong candidate if it improves metadata/count/release generation. |
| `src/sync/commands.ts`, `src/sync/registry.ts`, `src/sync/skills.ts`, `src/sync/json-config.ts`, `src/sync/mcp-transports.ts` | local `src/sync/**` | upstream-only in part | investigate | Review for safe config-merging and registry improvements. |
| `src/targets/openclaw.ts`, `src/targets/qwen.ts`, `src/targets/windsurf.ts` | no direct local counterpart | upstream-only | skip | Not obviously aligned with current stated priorities. |
| local `src/targets/cursor.ts` | no current upstream counterpart found | local-only | preserve | Fork-specific provider support. |
| `src/utils/codex-content.ts`, `src/utils/detect-tools.ts`, `src/utils/resolve-output.ts`, `src/utils/secrets.ts` | no direct local counterpart | upstream-only | investigate | Could contain quality-of-life improvements worth cherry-picking. |
| `package.json` | `package.json` | exact | adapt | Compare scripts, dependency versions, and package metadata. |
| `bun.lock` | `bun.lock` | exact | investigate | Update only if runtime/dependency changes are intentionally adopted. |
| `tsconfig.json` | `tsconfig.json` | exact | investigate | Compare if upstream changed type-check posture. |
| `tests/**` | `tests/**` | structural-drift | adapt | Cherry-pick tests that cover adopted runtime/model-routing behavior. |

## C. Agents matrix

### Locked review direction

- Adapt general-file content separately, but for agents the bar is higher.
- For exact or near-exact agent matches, default posture is still `adapt`.
- Preserve local OpenViking-relevant instructions.
- Be extra careful with review agents: local variants have already been enhanced multiple times and may now exceed upstream quality.
- Do **not** accept upstream prompt changes if they weaken rigor, reduce stack fit, or remove useful local instructions.

### C1. Exact or near-exact equivalents

| Upstream component | Local equivalent | Match type | Initial recommendation | Notes |
| --- | --- | --- | --- | --- |
| `design-implementation-reviewer` | same | exact | adapt | Compare prompt/body updates. |
| `design-iterator` | same | exact | adapt | Compare iterative design loop improvements. |
| `figma-design-sync` | same | exact | adapt | Compare fidelity workflow updates. |
| `best-practices-researcher` | same | exact | adapt | Good candidate for prompt refresh. |
| `framework-docs-researcher` | same | exact | adapt | Good candidate for prompt refresh. |
| `git-history-analyzer` | same | exact | adapt | Good candidate for prompt refresh. |
| `learnings-researcher` | same | exact | adapt | Also a likely named-model target. |
| `repo-research-analyst` | same | exact | adapt | Good candidate for prompt refresh. |
| `agent-native-reviewer` | same | exact | adapt | Compare parity-check criteria. |
| `architecture-strategist` | same | exact | adapt | Compare review rubric updates. |
| `code-simplicity-reviewer` | same | exact | adapt | Compare review rubric updates. |
| `data-integrity-guardian` | same | exact | adapt | Compare review rubric updates. |
| `data-migration-expert` | same | exact | adapt | Compare migration-safety updates. |
| `deployment-verification-agent` | same | exact | adapt | Compare rollout checklist updates. |
| `pattern-recognition-specialist` | same | exact | adapt | Compare prompt improvements. |
| `performance-oracle` | same | exact | adapt | Compare performance review heuristics. |
| `security-sentinel` | same | exact | adapt | Compare security review updates. |
| `bug-reproduction-validator` | same | exact | adapt | Compare reproduction workflow updates. |
| `pr-comment-resolver` | same | exact | adapt | Compare comment-resolution workflow updates. |
| `spec-flow-analyzer` | same | exact | adapt | Compare requirement/flow analysis updates. |

### C2. Persona-swapped equivalents

| Upstream component | Local equivalent | Match type | Initial recommendation | Notes |
| --- | --- | --- | --- | --- |
| `kieran-python-reviewer` | `rabak-python-reviewer` | renamed | adapt | Compare body/rubric; keep local branding and stack fit. |
| `kieran-typescript-reviewer` | `rabak-typescript-reviewer` | renamed | adapt | Compare body/rubric; keep local branding and stack fit. |
| upstream Rails reviewers | `rabak-laravel-reviewer` | structural-drift | preserve | Keep Laravel specialization; cherry-pick only generally useful review heuristics. |

### C3. Upstream-only agents

| Upstream component | Local equivalent | Match type | Initial recommendation | Notes |
| --- | --- | --- | --- | --- |
| `issue-intelligence-analyst` | none | upstream-only | adopt | Locked: adopt. Strong fit for issue-driven ideation and planning. |
| `schema-drift-detector` | none | upstream-only | adopt | Locked: adopt. Strong fit for Laravel/database migration safety. |
| `julik-frontend-races-reviewer` | none | upstream-only | adapt | Locked: adapt, but change persona to a Rabak reviewer and rewrite for React/Vue async UI concerns instead of Stimulus-heavy assumptions. |
| `lint` | none | upstream-only | skip | Locked: skip. Ruby/ERB-specific. |
| `ankane-readme-writer` | none | upstream-only | skip | Locked: skip. Ruby gem documentation specialization. |
| `dhh-rails-reviewer` | none | upstream-only | skip | Locked: skip. Rails-specific. |
| `kieran-rails-reviewer` | none | upstream-only | skip | Locked: skip. Rails-specific. |

### C4. Local-only agents to preserve

| Local component | Reason to preserve |
| --- | --- |
| `rabak-laravel-reviewer` | Core local language/framework specialization. |
| `rabak-nest-reviewer` | Valuable local Node/Nest specialization not surfaced upstream. |
| `rabak-rust-reviewer` | Valuable local Rust specialization. |
| `rabak-vue-reviewer` | Valuable local Vue specialization. |

## D. Skills and workflows matrix

### D1. Intent mapping between upstream `ce:*` skills and local workflow surfaces

#### Locked review direction

- Adapt content from the core upstream `ce:*` workflow skills.
- Keep current local workflow names and local pathing rather than renaming everything to `ce:*`.
- Preserve local pathing conventions and OpenViking-specific instructions where applicable.

| Upstream component | Local equivalent | Match type | Initial recommendation | Notes |
| --- | --- | --- | --- | --- |
| `ce-brainstorm` | `workflows-brainstorm` plus `brainstorming` | renamed | adapt | Strong content-sync candidate without necessarily renaming local surface. |
| `ce-plan` | `workflows-plan` | renamed | adapt | Strong content-sync candidate. |
| `ce-review` | `workflows-review` | renamed | adapt | Strong content-sync candidate. |
| `ce-work` | `workflows-work` | renamed | adapt | Strong content-sync candidate. |
| `ce-compound` | `workflows-compound` | renamed | adapt | Strong content-sync candidate. |
| `ce-ideate` | no direct local equivalent | upstream-only | adopt | Locked: adopt. Could be valuable before brainstorm/planning. |
| `ce-compound-refresh` | no direct local equivalent | upstream-only | adopt | Locked: adopt. Could help maintain compounded docs quality. |
| `ce-plan-beta` | `workflows-plan` | upstream-only | investigate | Locked: investigate later. Compare before deciding whether it supersedes or complements current planning flow. |
| `deepen-plan-beta` | `deepen-plan` command | upstream-only | investigate | Locked: investigate later. Compare before adopting. |

### D2. Utility and command-like skills

#### Locked review direction

- For upstream utility skills that already map to local commands or equivalent surfaces, default posture is:
  - adapt the content
  - keep current local entrypoints
  - keep current local naming/pathing
  - preserve fork-specific instructions such as local pathing and OpenViking guidance

| Upstream component | Local equivalent | Match type | Initial recommendation | Notes |
| --- | --- | --- | --- | --- |
| `agent-native-audit` | none | upstream-only | adopt | Locked: adopt. Good fit with existing agent-native architecture work. |
| `proof` | none | upstream-only | skip | Locked: skip. Optional external collaboration workflow that is not currently wanted. |
| `claude-permissions-optimizer` | none | upstream-only | skip | Locked: skip. Environment-specific and not currently wanted. |
| `create-agent-skill` skill | local `create-agent-skill` command | renamed | adapt | Compare content and decide whether to keep command surface or also add skill surface. |
| `deepen-plan` skill | local `deepen-plan` command | renamed | adapt | Compare content; likely worth syncing. |
| `changelog` skill | local `changelog` command | renamed | adapt | Compare content; likely worth syncing. |
| `deploy-docs` skill | local `deploy-docs` command | renamed | adapt | Compare content; likely worth syncing. |
| `feature-video` skill | local `feature-video` command | renamed | adapt | Compare content; likely worth syncing. |
| `generate_command` skill | local `generate_command` command | renamed | adapt | Compare content; likely worth syncing. |
| `heal-skill` skill | local `heal-skill` command | renamed | adapt | Compare content; likely worth syncing. |
| `report-bug` skill | local `report-bug` command | renamed | adapt | Compare content; likely worth syncing. |
| `reproduce-bug` skill | local `reproduce-bug` command | renamed | adapt | Compare content; likely worth syncing. |
| `resolve_parallel` skill | local `resolve_parallel` command | renamed | adapt | Compare content; likely worth syncing. |
| `resolve-todo-parallel` skill | local `resolve_todo_parallel` command | renamed | adapt | Compare content; likely worth syncing. |
| `triage` skill | local `triage` command | renamed | adapt | Compare content; likely worth syncing. |
| `lfg` skill | local `lfg` command | renamed | adapt | Compare content; likely worth syncing. |
| `slfg` skill | local `slfg` command | renamed | adapt | Compare content; likely worth syncing. |

### D3. Upstream-only skills likely to skip

| Upstream component | Initial recommendation | Notes |
| --- | --- | --- |
| `andrew-kane-gem-writer` | skip | Ruby gem-specific. |
| `dhh-rails-style` | skip | Rails-specific. |
| `dspy-ruby` | skip | Ruby-specific. |
| `test-xcode` | skip | Xcode/iOS-specific. |
| `every-style-editor` | skip | Brand/editorial-specific and not clearly useful for this fork. |

### D4. Local-only skills to preserve

#### Locked review direction

- Preserve all current local-only skills unless a clearly superior upstream replacement is identified later.

| Local component | Reason to preserve |
| --- | --- |
| `laravel-conventions` | Strong fork-specific value. |
| `systematic-debugging` | Strong process value. |
| `finishing-branch` | Useful fork workflow not seen upstream. |
| `skill-creator` | Useful local authoring workflow. |
| `brainstorming` | Useful fork workflow companion to formal planning flow. |

## E. Named model routing implementation matrix

### Locked review direction

- Add first-class skill `model` support.
- Add `platforms.copilot.model` override support so Copilot can use provider-native named models independently of Claude.
- Investigate Claude model naming before locking whether generated Claude-facing assets should use aliases only or fully named model IDs.
- Default routing rule:
  - lower-cost models for `learnings-researcher`, `issue-intelligence-analyst`, and basic document-analysis workflows
  - stronger defaults for code review, security, architecture, and implementation-heavy agents

| Concern | Current local state | Initial recommendation | Notes |
| --- | --- | --- | --- |
| Agent `model` support | supported | preserve and extend | Already parsed and emitted. |
| Command `model` support | supported | preserve and extend | Already parsed and emitted. |
| Skill `model` support | not supported | adopt | Locked: adopt. Requires type, parser, writer, and test changes. |
| `platforms.claude.model` override | partially supported for agents/commands | preserve and extend | Keep as Claude-specific override path. |
| `platforms.copilot.model` override | not supported | adopt | Locked: adopt. Needed for provider-specific named models. |
| Claude alias handling (`haiku`, `sonnet`, `opus`, `inherit`) | partly established | investigate | Locked: investigate first. Confirm whether full named Claude model IDs are valid in all generated surfaces. |
| Copilot named models (`gpt-5.4-mini`, `claude-haiku-4.6`) | not explicitly modeled end-to-end | adopt | Needed for cheaper search/document-analysis surfaces. |

### Candidate first-pass lower-cost targets

| Component | Suggested direction | Notes |
| --- | --- | --- |
| `learnings-researcher` | lower-cost model | Locked default routing direction. Good fit for lighter document/repo knowledge retrieval. |
| `issue-intelligence-analyst` if added | lower-cost model | Locked default routing direction. Theme extraction is a strong cheap-model candidate. |
| basic document-analysis workflows | lower-cost model | Locked default routing direction. User explicitly requested this category. |
| code review/security/architecture agents | keep stronger defaults | Locked default routing direction. Higher reasoning bar. |

## F. OpenViking mirroring matrix

### Locked review direction

- Mirror every changed non-agent/non-skill repo file into OV using a generic resource path.
- Use `ov_register_global_agent` for agent prompt files, plus generic mirroring when the repo artifact itself also needs preserving.
- Use `ov_register_global_skill` for skill definitions, plus generic mirroring for support files such as references, templates, scripts, and assets.
- Use a stable repo-relative namespace for mirrored resources.
- Store reusable data/content in OV in a project-agnostic way.
- Only this base plugin repo keeps the full files as primary source artifacts.
- Downstream or consumer repos should generally use shim/pointer files that reference OV-stored canonical content rather than carrying full duplicated copies.

| Surface | OV mechanism | Initial recommendation | Notes |
| --- | --- | --- | --- |
| agent prompt files | `ov_register_global_agent` | adopt | Locked: use for globally useful agent definitions, plus generic mirroring when the repo artifact itself also needs preserving. |
| skill definitions | `ov_register_global_skill` plus generic resource add for support files | adopt | Locked: skill directories need both definition and supporting assets mirrored where relevant. |
| docs, plans, metadata, generator files, tests | `_ov_add_resource` | adopt | Locked: needed to satisfy the user's "every changed file" requirement. |
| arbitrary repo file namespace layout in OV | stable repo-relative namespace | adopt | Locked: use a stable repo-relative namespace, with project-agnostic content stored in OV and shim/pointer usage favored outside this base plugin repo. |

## G. Suggested implementation order

1. finish the file-by-file ledger using this matrix as the backbone
2. decide the adopt/adapt/skip set for upstream-only agents and skills
3. compare exact-match agent and workflow bodies for prompt-quality upgrades
4. implement named-model support for skills and per-platform model overrides
5. selectively cherry-pick runtime/generator changes from upstream
6. regenerate outputs with `bun run build:platforms`
7. validate with `bun test`
8. mirror every changed file into OV

## Open questions to resolve before implementation

1. Do we want to preserve current local public entrypoints even when upstream has renamed them into `ce:*` skills?
2. Should `.github_gpt/**` remain a first-class generated output that also receives model-routing updates?
3. What exact OV namespace convention should arbitrary repo files use?
4. Do we want `issue-intelligence-analyst` and `schema-drift-detector` in the first sync pass, or staged afterward?
