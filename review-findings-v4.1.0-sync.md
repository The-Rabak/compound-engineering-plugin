# Code Review Findings: v4.1.0 Upstream Sync

**Branch:** `feat/sync-upstream-v4.1.0`
**Date:** 2026-03-11
**Scope:** 21 modified + 5 new files | 2,277 additions, 562 deletions
**Review Agents Used:** 11 (architecture-strategist, code-simplicity-reviewer, security-sentinel, performance-oracle, rabak-laravel-reviewer, rabak-vue-reviewer, data-integrity-guardian, data-migration-expert, deployment-verification-agent, agent-native-reviewer, pattern-recognition-specialist)

---

## Summary

| Severity | Count | Description |
|----------|-------|-------------|
| P1 Critical | 8 | Consistency issues, missing conventions, broken references |
| P2 Important | 18 | Self-review gaps, YAGNI, structural improvements |
| P3 Nice-to-have | 30+ | Deep self-improvement suggestions per agent |

---

## P1 -- Critical Findings

### P1-1: `rabak-nest-reviewer` not wired into setup auto-config defaults

**Found by:** agent-native-reviewer
**File:** `plugins/compound-engineering/skills/setup/SKILL.md`
**Lines:** Step 2 auto-configure defaults, Step 4 stack-specific agents

**Problem:** When a NestJS project is detected (via `nest-cli.json` or `@nestjs/core` in package.json), the auto-configured agent list is `[rabak-typescript-reviewer, code-simplicity-reviewer, security-sentinel, performance-oracle]`. The `rabak-nest-reviewer` agent is never included in any preset. A user or agent running `/setup` on a NestJS project will never get NestJS-specific review coverage unless they manually customize.

**Impact:** The agent exists (361 lines of NestJS-specific review coverage) but is effectively invisible to the automated setup workflow. Users who rely on auto-configuration will miss NestJS-specific checks.

**Fix:**
- In Step 2 auto-configure defaults, change NestJS preset from `[rabak-typescript-reviewer, code-simplicity-reviewer, security-sentinel, performance-oracle]` to `[rabak-nest-reviewer, rabak-typescript-reviewer, code-simplicity-reviewer, security-sentinel, performance-oracle]`
- In Step 4 stack-specific agents mapping, add: `NestJS -> rabak-nest-reviewer, rabak-typescript-reviewer`

---

### P1-2: Severity label inconsistency in `rabak-vue-reviewer`

**Found by:** pattern-recognition-specialist
**File:** `plugins/compound-engineering/agents/review/rabak-vue-reviewer.md`
**Lines:** Severity classification section (around lines 32-34)

**Problem:** Uses "P1 - Critical" / "P2 - Important" / "P3 - Suggestion" while all other 8 modified review agents use "P1 (Blocker)" / "P2 (Important)" / "P3 (Nice-to-have)". When `/workflows:review` runs multiple agents in parallel, the Vue reviewer will produce findings with different severity labels than every other agent, making synthesis and prioritization harder.

**Cross-reference:** All other agents use this format:
- architecture-strategist: P1 Blocker, P2 Important, P3 Nice-to-Have
- security-sentinel: P1 (Blocker), P2 (Important), P3 (Nice-to-have)
- performance-oracle: P1 (Blocker), P2 (Important), P3 (Nice-to-have)
- code-simplicity-reviewer: P1 (Blocker), P2 (Important), P3 (Nice-to-have)
- rabak-laravel-reviewer: P1 Blocker, P2 Important, P3 Nice-to-have
- rabak-nest-reviewer: P1 (Blocker), P2 (Important), P3 (Nice-to-have)

**Fix:** Change severity labels to match the standard: `P1 (Blocker)`, `P2 (Important)`, `P3 (Nice-to-have)`.

---

### P1-3: Em-dash inconsistency in new `rabak-nest-reviewer`

**Found by:** pattern-recognition-specialist
**File:** `plugins/compound-engineering/agents/review/rabak-nest-reviewer.md`
**Lines:** Throughout (62 occurrences)

**Problem:** Uses Unicode em-dashes throughout while this branch systematically converted all other modified files from Unicode em-dashes to ASCII double-dashes `--`. The new file contradicts the convention the branch itself establishes.

**Evidence:** All modified files in this branch use `--` (double-dash). The new `rabak-nest-reviewer.md` is the only file using the Unicode character.

**Fix:** Replace all 62 Unicode em-dash occurrences with `--` (double-dash) throughout the file.

---

### ~~P1-4: Phantom `bug-reproduction-validator` agent reference~~ (FALSE POSITIVE)

**Found by:** agent-native-reviewer
**File:** `plugins/compound-engineering/skills/systematic-debugging/SKILL.md`
**Status:** FALSE POSITIVE -- the agent exists at `agents/workflow/bug-reproduction-validator.md`. No fix needed.

---

### P1-5: Missing Model `$primaryKey = 'EntryID'` check in laravel-reviewer

**Found by:** rabak-laravel-reviewer (self-review)
**File:** `plugins/compound-engineering/agents/review/rabak-laravel-reviewer.md`
**Lines:** P1 BrainPOP Company Conventions section (around lines 68-72)

**Problem:** The reviewer flags `EntryID` usage in migrations (`$table->increments('EntryID')`) but never checks that Eloquent Models override `$primaryKey` to `'EntryID'`. Since Laravel defaults to `$primaryKey = 'id'`, every BrainPOP Model MUST set `protected $primaryKey = 'EntryID'` -- otherwise route model binding, `find()`, `findOrFail()`, and relationship queries all break silently.

**Impact:** This is as critical as the migration check. A Model without `$primaryKey = 'EntryID'` will appear to work in simple cases but fail when using Eloquent's standard query methods.

**Fix:** Add to the P1 BrainPOP conventions section:
```
- Every Model MUST set `protected $primaryKey = 'EntryID'`
- Flag any Model missing this override as P1 -- silent query failures
- Also verify `getRouteKeyName()` returns `'EntryID'` for route model binding
```

Also add these related checks that the self-review identified:
- Array syntax for FormRequest validation rules: `['required', 'string']` not `'required|string'`
- Boolean method prefix: all boolean-returning methods must use `is` prefix
- Services must not accept Request/Response objects directly

---

### P1-6: Missing Vue 2 reactivity caveats (`$set`/`$delete`)

**Found by:** rabak-vue-reviewer (self-review)
**File:** `plugins/compound-engineering/agents/review/rabak-vue-reviewer.md`
**Lines:** P1 BrainPOP Vue 2 Conventions section

**Problem:** Vue 2 cannot detect:
- Adding new properties to an object after creation (must use `Vue.set()` or `this.$set()`)
- Deleting properties (must use `Vue.delete()` or `this.$delete()`)
- Setting array items by index (must use `Vue.set()` or `splice()`)
- Modifying array length directly

These cause silent bugs where the UI does not update. This is the single most impactful Vue 2 gotcha and is completely absent from the reviewer. The performance-oracle mentions `Vue.set()` but the Vue reviewer itself does not.

**Impact:** Silent production bugs where data changes but the UI does not reflect them.

**Fix:** Add a "Vue 2 Reactivity Caveats (P1)" subsection:
```
### Vue 2 Reactivity Caveats (P1)
- Flag `this.object.newProp = value` -- must use `this.$set(this.object, 'newProp', value)`
- Flag `delete this.object.prop` -- must use `this.$delete(this.object, 'prop')`
- Flag `this.array[index] = value` -- must use `this.$set(this.array, index, value)`
- Flag `this.array.length = newLength` -- must use `this.array.splice(newLength)`
```

---

### P1-7: Severity labels in `quality-review-prompt.md` don't match agent system

**Found by:** pattern-recognition-specialist
**File:** `plugins/compound-engineering/commands/workflows/references/quality-review-prompt.md`
**Lines:** Severity definitions section (around lines 72, 86-88)

**Problem:** Uses "Critical/Important/Minor" without P-prefixes, diverging from the P1/P2/P3 system all review agents use. When `workflows:work` uses inline review mode, the quality reviewer will produce findings labeled differently than the agents invoked by `workflows:review`, making cross-referencing and deduplication harder.

**Fix:** Align severity labels to match the agent standard:
- "Critical" -> "P1 (Blocker)"
- "Important" -> "P2 (Important)"
- "Minor" -> "P3 (Nice-to-have)"

---

### P1-8: Incomplete component structure order in `frontend-design/SKILL.md`

**Found by:** rabak-vue-reviewer
**File:** `plugins/compound-engineering/skills/frontend-design/SKILL.md`
**Lines:** Component structure order (around line 36)

**Problem:** Lists a 7-item abbreviated order: `name -> props -> data -> computed -> watch -> methods -> lifecycle`. This is missing 5 entries from the mandatory BrainPOP order defined in `rabak-vue-reviewer.md`:
1. `name`
2. `inject`
3. `emits`
4. `mixins`
5. `components`
6. `props`
7. `data`
8. `provide`
9. `computed`
10. `watch`
11. `methods`
12. Lifecycle hooks

**Impact:** Developers using the frontend-design skill for code generation could produce components with incorrect option ordering that the vue-reviewer would then flag.

**Fix:** Replace the abbreviated 7-item list with the full 12-item canonical order, or add a note: "Full order defined in `rabak-vue-reviewer` agent."

---

## P2 -- Important Findings

### Structural / Cross-Cutting

#### P2-1: `code-simplicity-reviewer` lacks dedicated `## Priority 1` section
**Found by:** pattern-recognition-specialist
**File:** `plugins/compound-engineering/agents/review/code-simplicity-reviewer.md`
**Problem:** BrainPOP content is dispersed inline (naming in section 3, architecture note in section 4, @codeCoverageIgnore in section 7) rather than elevated to a top-level `## Priority 1: BrainPOP Simplicity Conventions` section like the other 8 modified agents.
**Fix:** Lift BrainPOP references into a dedicated P1 section at the top.

#### P2-2: Heading format inconsistency for Priority 1
**Found by:** pattern-recognition-specialist
**Files:** `data-integrity-guardian.md`, `data-migration-expert.md`, `deployment-verification-agent.md`
**Problem:** Use parenthetical format `(Priority 1)` while 5 other agents use prefix format `## Priority 1:`.
**Fix:** Standardize all to `## Priority 1: BrainPOP [Domain] Conventions`.

#### P2-3: `ServiceClass::init()` vs `ClassName::init()` terminology split
**Found by:** pattern-recognition-specialist
**Files:** rabak-laravel-reviewer (both forms), performance-oracle (`ClassName::init()`), code-simplicity-reviewer (`ClassName::init()`), architecture-strategist (`ServiceClass::init()`), quality-review-prompt (`ServiceClass::init()`)
**Fix:** Standardize on `ServiceClass::init()` -- it better communicates the BrainPOP context.

#### P2-4: `finishing-branch` skill stalls autonomous agents
**Found by:** agent-native-reviewer
**File:** `plugins/compound-engineering/skills/finishing-branch/SKILL.md`
**Problem:** Step 3 presents 4 options and says "Ask the user which option they prefer. Do not assume." When invoked by an orchestrator subagent, this stalls.
**Fix:** Add default behavior: "When invoked by an orchestrator without user interaction, default to Option A (Create PR)."

#### P2-5: Setup skill doesn't expose `tdd_enabled`/`review_mode` during customize flow
**Found by:** agent-native-reviewer
**File:** `plugins/compound-engineering/skills/setup/SKILL.md`
**Problem:** Step 3 "Customize" asks 3 questions but never asks about `tdd_enabled` or `review_mode`. These are silently written as defaults.
**Fix:** Add Step 3c/3d for these new config options.

### YAGNI / Over-Engineering

#### P2-6: Kubernetes/Canary sections in deployment-verification-agent
**Found by:** code-simplicity-reviewer, deployment-verification-agent (self-review)
**File:** `plugins/compound-engineering/agents/review/deployment-verification-agent.md`
**Problem:** BrainPOP uses Docker + Supervisord + Horizon, not Kubernetes. `kubectl`, canary deployment, CDN cache invalidation sections are inapplicable. Also uses `your-app.example.com` placeholder URLs.
**Fix:** Remove or gate behind "If applicable to your deployment infrastructure."

#### P2-7: DDD/CQRS/Event Sourcing/Hexagonal in architecture-strategist
**Found by:** code-simplicity-reviewer, architecture-strategist (self-review)
**File:** `plugins/compound-engineering/agents/review/architecture-strategist.md`
**Problem:** BrainPOP is a layered Laravel monolith. Steps 5 (DDD), parts of Step 8 (Event Sourcing, CQRS, Hexagonal) are rarely applicable. ~100 lines removable.
**Fix:** Trim to brief mentions or gate with "Identify which pattern is in use, evaluate ONLY against that pattern."

#### P2-8: Generic CWV/Font Loading/Image Optimization in performance-oracle
**Found by:** code-simplicity-reviewer
**File:** `plugins/compound-engineering/agents/review/performance-oracle.md`
**Problem:** Core Web Vitals, Font Loading, Image Optimization, HTTP/2 multiplexing sections are generic web knowledge. ~60-80 lines of textbook content.
**Fix:** Trim to brief bullet points. Keep the BrainPOP P1 section (which is excellent).

#### P2-9: Generic placeholder URLs in deployment-verification-agent
**Found by:** deployment-verification-agent (self-review)
**File:** `plugins/compound-engineering/agents/review/deployment-verification-agent.md`
**Problem:** Health Check, Infrastructure Validation, and Container Orchestration sections use `your-app.example.com` placeholders alongside BrainPOP-specific URLs.
**Fix:** Replace with BrainPOP URLs or remove generic sections.

### Self-Review Gaps (Top Per Agent)

#### P2-10: security-sentinel -- Missing AI/LLM security
**Found by:** security-sentinel (self-review)
**File:** `plugins/compound-engineering/agents/review/security-sentinel.md`
**Problem:** BrainPOP has an `ai-interactions` package. Zero coverage for prompt injection, LLM output validation, data leakage to AI providers, OWASP Top 10 for LLM Applications. Also, A10 is labeled "Insufficient Attack Protection" which is not an actual OWASP 2025 category.
**Fix:** Add AI/LLM security section; correct A10 label.

#### P2-11: performance-oracle -- Missing observability/profiling, `preventLazyLoading()` not in P1
**Found by:** performance-oracle (self-review)
**File:** `plugins/compound-engineering/agents/review/performance-oracle.md`
**Problem:** No structured observability section (APM, distributed tracing, profiling tools). `preventLazyLoading()` is recommended by rabak-laravel-reviewer but not by the performance oracle despite N+1 being "the single most common performance issue." Also missing concurrency/locking section.
**Fix:** Add observability section; add `preventLazyLoading()` to P1; add concurrency/locking section.

#### P2-12: architecture-strategist -- Missing publishing system, custom packages, frontend architecture
**Found by:** architecture-strategist (self-review)
**File:** `plugins/compound-engineering/agents/review/architecture-strategist.md`
**Problem:** P1 section covers backend layered architecture but nothing about the publishing pipeline (Directus -> cms-service -> DigestService -> Redis), custom Composer packages dependency direction, or Nuxt 2 frontend architecture boundaries. Steps 4 and 5 (Clean Architecture and DDD) overlap significantly.
**Fix:** Add publishing system and custom package awareness to P1; merge/scope Steps 4 and 5.

#### P2-13: data-integrity-guardian -- Missing zero-downtime tooling, JSON/enum column safety
**Found by:** data-integrity-guardian (self-review)
**File:** `plugins/compound-engineering/agents/review/data-integrity-guardian.md`
**Problem:** No mention of pt-online-schema-change or gh-ost for large table DDL. No JSON column validation guidance. No enum column safety checks. Missing "Never modify existing migrations" rule (present in rabak-laravel-reviewer but absent here). Zero-downtime section is 5 bullet points when it should be a major section.
**Fix:** Expand zero-downtime with MySQL 8.0 specifics; add JSON and enum sections; add "never modify existing migrations" rule.

#### P2-14: data-migration-expert -- Missing enum/ID type/column type change checklists
**Found by:** data-migration-expert (self-review)
**File:** `plugins/compound-engineering/agents/review/data-migration-expert.md`
**Problem:** Enum migrations, ID type changes, column type changes, and table renames are high-risk migration types with zero specific guidance. Dual-write lifecycle only partially covered. Missing feature flag-gated migration guidance and MySQL-specific DDL considerations.
**Fix:** Add dedicated checklists for enum migrations, column/ID type changes, table renames.

#### P2-15: deployment-verification -- Missing CMS service verification, cache commands
**Found by:** deployment-verification-agent (self-review)
**File:** `plugins/compound-engineering/agents/review/deployment-verification-agent.md`
**Problem:** References `cms-service.brainpop.com` in environment URL table but has zero CMS-specific verification commands. No cache verification commands (present in performance-oracle but not here). No content API smoke test. No queue depth monitoring.
**Fix:** Add CMS service queue:failed check, cache:manipulate commands, content API smoke test.

#### P2-16: code-simplicity-reviewer -- Missing error handling complexity, file length thresholds
**Found by:** code-simplicity-reviewer (self-review)
**File:** `plugins/compound-engineering/agents/review/code-simplicity-reviewer.md`
**Problem:** No section on error handling complexity (nested try-catch, symptom masking, defensive null-checking). No file length thresholds. No god constructor detection (>8 dependencies). No public API surface area limits. Missing MessageTypes enum exemption.
**Fix:** Add error handling complexity section; add file/class thresholds; add MessageTypes exemption.

#### P2-17: rabak-laravel-reviewer -- Missing 4 BrainPOP convention checks + SKILL.md inconsistencies
**Found by:** rabak-laravel-reviewer (self-review)
**File:** `plugins/compound-engineering/agents/review/rabak-laravel-reviewer.md`
**Problem:** Missing: (a) array syntax for validation rules `['required', 'string']`, (b) boolean `is` prefix on boolean methods, (c) Services must not accept Request/Response objects, (d) route model binding needs `getRouteKeyName()` override. Also 7 inconsistencies with laravel-conventions/SKILL.md (Actions, DTOs, shouldBeStrict, Pint, abort_if/unless, renderable exceptions, PSR-12 braces).
**Fix:** Add the 4 missing P1 checks; resolve SKILL.md inconsistencies.

#### P2-18: rabak-vue-reviewer -- Missing 16 capability gaps + 4 SKILL.md inconsistencies
**Found by:** rabak-vue-reviewer (self-review)
**File:** `plugins/compound-engineering/agents/review/rabak-vue-reviewer.md`
**Problem:** Missing: Vuex namespaced modules, Nuxt 2 middleware/plugin guidance, template conventions (v-for key requirement), functional components, keep-alive, scoped slots, error handling depth (asyncData/fetch errors, Sentry), accessibility depth (skip nav, touch targets, reduced motion), security depth (CSP, target="_blank" rel), responsive design, i18n depth (RTL), testing depth (Vue Test Utils API, Vuex mocking), computed vs watch decision guide. Also 4 inconsistencies with frontend-design/SKILL.md (structure order, VueUse, error handling, Vuex depth).
**Fix:** Prioritized additions: (1) $set/$delete (P1-6), (2) v-for key requirement, (3) Vuex namespaced modules, (4) functional components, (5) testing specifics.

---

## P3 -- Nice-to-Have Findings

### Cross-Cutting

- Migration convention content duplicated across 4 files (structurally necessary but maintenance risk)
- Docker commands duplicated across 5+ files
- Environment URL tables duplicated in 2 files
- No cross-references between complementary agents (security-sentinel <-> data-integrity-guardian, data-migration-expert <-> deployment-verification-agent)
- `rabak-vue-reviewer` missing Docker test commands for frontend
- VueUse v4.x section in vue-reviewer is borderline YAGNI (single line would suffice)
- A03 Supply Chain / A04 Insecure Design in security-sentinel are aspirational, not actionable from code review context

### Per-Agent Deep Self-Review Suggestions (Summary)

**security-sentinel** (10 gaps):
- Missing API abuse patterns (parameter pollution, verb tampering, batch abuse)
- Missing client-side security (postMessage, localStorage, WebSocket)
- Missing infrastructure/container security (Dockerfile, Docker Compose)
- Missing DoS patterns (ReDoS, XML bombs, zip bombs)
- Missing privacy/compliance (COPPA, FERPA for student data)
- Missing BrainPOP P1 gaps ($hidden model attribute, middleware bypass, webhook verification, queue job validation, Redis security)
- Missing race condition depth (distributed locking, job idempotency)
- Missing scan commands/grep patterns (removed in restructure)

**performance-oracle** (12 gaps):
- Missing load testing / capacity planning methodology
- Missing serialization format comparison
- Missing PHP-specific runtime tuning (OPcache, FPM, preloading, JIT)
- Missing detailed query plan analysis (EXPLAIN ANALYZE)
- Missing Horizon worker tuning parameters
- Missing database query count enforcement methodology
- Missing streaming/chunked responses
- Missing cost optimization dimension
- Missing rate limiting / backpressure
- Missing cold start optimization
- Missing resource cleanup in long-running processes

**architecture-strategist** (21 gaps):
- Missing observability architecture
- Missing error handling architecture evaluation
- Missing configuration architecture
- Missing testing architecture
- Missing data flow architecture
- Missing evolutionary architecture / fitness functions
- Missing concurrency and state management architecture
- Steps 4 and 5 overlap significantly
- Step 8 should gate to identified pattern only
- Missing step prioritization by change type
- Missing stop-early heuristic
- Missing finding limits in output format
- Missing scope boundaries with other agents
- Missing shared utilities architecture (app/Lib/)
- Missing CMS Service and Alignment API architecture awareness

**data-integrity-guardian** (10 gaps):
- Missing soft delete patterns (unique constraints, cascading, orphaned records)
- Missing data encryption patterns (encrypted casts, blind indexes, key rotation)
- Missing PII handling and GDPR deletion (COPPA/FERPA for student data)
- Missing backup verification protocol
- Missing temporal data patterns (timezone, date ranges, DST)
- Missing polymorphic integrity enforcement depth (morphMap, type validation)
- Missing concurrent access patterns (optimistic/pessimistic locking, advisory locks)
- Missing data consistency across distributed systems (saga, outbox patterns)

**data-migration-expert** (15 gaps):
- Missing dual-write lifecycle validation
- Missing feature flag-gated migration guidance
- Missing table rename checklist
- Missing cross-database migration checks (app_content)
- Missing ETL/data warehouse downstream impact
- Missing backfill error handling and monitoring
- Missing rollback data fidelity and RTO
- Missing soft delete awareness in migrations
- Missing MySQL-specific DDL considerations (ALGORITHM=INSTANT, pt-osc)
- Missing concurrent migration safety depth
- Missing post-migration data reconciliation plan
- 15 additional anti-patterns not currently caught

**deployment-verification-agent** (12 gaps):
- Missing content API smoke test
- Missing pre-deploy backup verification
- Missing queue depth monitoring
- Missing GitLab CI/CD pipeline verification
- Missing Alignment API and Nuxt frontend verification
- Missing feature flag integration with BrainPOP system
- Missing load/traffic baseline comparison
- Missing rollback time estimates
- Duplicate Horizon/queue command blocks
- Output template missing BrainPOP-specific items
- No "When NOT to use" scope guidance

**code-simplicity-reviewer** (9 gaps):
- Missing configuration complexity
- Missing test complexity
- Missing import/dependency complexity
- Missing conditional complexity beyond nesting (ternary chains, null coalescing chains)
- Missing data structure simplification
- Missing API surface area thresholds (>20 public methods)
- Missing magic numbers and strings
- Missing anti-patterns: primitive obsession, temporal coupling, hidden side effects, long-param-to-array, indirection without abstraction, return type complexity
- Sections 4 and 9 overlap (single-implementation patterns)

**rabak-laravel-reviewer** (15 gaps):
- Missing test file naming convention specification
- Missing mocking patterns depth (Mockery, facades, config)
- Missing feature test conventions
- Missing data providers (@dataProvider)
- Missing test isolation guidance
- Missing middleware section
- Missing Events/Listeners implementation detail checks
- Missing API versioning check
- Missing Laravel Pint reference
- Missing Model $table property awareness
- Missing seeder/factory coverage checks
- Missing query optimization details (compound indexes, selectivity)
- Missing database-level enum column consistency checks
- Missing `env()` outside config emphasis
- Duplicate $fillable/$guarded mentions across P1 and P2

**rabak-vue-reviewer** (16 gaps):
- Missing Nuxt 2 middleware convention (route vs global, server vs client)
- Missing Nuxt 2 plugin registration (client-only, injection, ordering)
- Missing template conventions (self-closing tags, attribute order, multi-line formatting)
- Missing file/directory structure convention
- Missing keep-alive performance pattern
- Missing scoped slots as mixin alternative
- Missing error handling depth (Sentry, asyncData errors, loading/error/data pattern)
- Missing accessibility depth (skip nav, heading hierarchy, touch targets, tabindex, aria-expanded, language attribute, reduced motion)
- Missing security depth (DOMPurify specifics, CSP, cookie flags, CORS, target="_blank" rel)
- Missing responsive design guidance beyond mq.scss
- Missing i18n depth (structure, pluralization, RTL)
- Missing testing depth (Vue Test Utils API, Vuex mocking, route mocking, async patterns, emitted events, slots)
- Missing computed vs watch decision guide

---

## Appendix: Agent Self-Review Statistics

| Agent | Current Lines | Gaps Found | P1 Gaps | P2 Gaps | P3 Gaps |
|-------|--------------|------------|---------|---------|---------|
| architecture-strategist | 330 | 21 | 2 | 10 | 9 |
| code-simplicity-reviewer | 275 | 9 | 0 | 4 | 5 |
| security-sentinel | 237 | 10 | 1 | 5 | 4 |
| performance-oracle | 276 | 12 | 1 | 5 | 6 |
| rabak-laravel-reviewer | 368 | 15 | 5 | 7 | 3 |
| rabak-vue-reviewer | ~250 | 16 | 1 | 8 | 7 |
| data-integrity-guardian | ~150 | 10 | 0 | 5 | 5 |
| data-migration-expert | ~130 | 15 | 3 | 5 | 7 |
| deployment-verification-agent | ~200 | 12 | 2 | 5 | 5 |
| **Total** | **~2,216** | **120** | **15** | **54** | **51** |
