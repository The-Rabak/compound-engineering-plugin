/**
 * Canonical reference implementation of the `html-artifacts` island contract
 * (schema v1) -- see
 * `portable/compound-engineering/commands/workflows/references/html-artifacts/island-contract.md`.
 *
 * This module is the SPEC. `island-contract.md`'s prose must describe
 * exactly what the functions below do -- spec/impl drift here is a contract
 * lie.
 *
 * Placement note (resolves the "where does the reference impl live"
 * unknown, carried forward from T01 and re-confirmed for T02/the
 * html-artifact-mutator unit): everything below lives inside `tests/`, not
 * in a `src/` module. `src/` is this repo's published npm package surface
 * (`package.json` `bin`/`publishConfig`); a `src/` util is technically
 * importable by any future `src/` code even if nothing imports it *today*.
 * A file under `tests/` can never be imported by a shipped artifact -- it
 * is un-shippable by construction, not by discipline, which is the
 * strongest and simplest guarantee available. No npm/runtime dependency was
 * added to produce it.
 *
 * This file itself declares no `describe`/`test` blocks -- it is imported
 * (not re-executed) by both `tests/html-artifact-island.test.ts` (T01, the
 * original owner of this reference impl) and `tests/html-artifact-mutation.test.ts`
 * (T02, the html-artifact-mutator unit), so both suites exercise the exact
 * same serialize/extract/extractIslandData behavior instead of two
 * independently-drifting copies.
 */

/**
 * Fixed-core island schema v1, `kind: "plan"`.
 *
 * Tier 1 (envelope, shared across every kind) + Tier 2 (the `plan` contract
 * core downstream *acts* on) together form the "fixed core" -- the set
 * `extractIslandData()` treats as required (`REQUIRED_FIXED_CORE_KEYS`
 * below). Tier 3 (rendered prose, never machine-parsed) and Tier 4 (open
 * extension) are part of the schema but intentionally NOT enforced as
 * required -- see `island-contract.md` for the full tier rationale.
 *
 * v1 discipline: only the envelope + the `plan` kind are fully defined here.
 * `kind`/`schema_version` are reserved for v2 kinds; no multi-kind registry
 * is built in this unit.
 */
export interface PlanArtifactIsland {
  /**
   * Index signature: the island is fundamentally a JSON object read back
   * as `Record<string, unknown>` by `extractIslandData()`. Declaring it
   * here lets test code treat a fixture as that same generic record (e.g.
   * to `delete` a fixed-core key for a negative test) without a cast,
   * while the named properties below still give every known field its
   * real type.
   */
  [key: string]: unknown
  // Tier 1 -- envelope
  schema_version: 1
  kind: "plan"
  title: string
  type: string
  date: string
  status: string
  refs: {
    brainstorm_ref: string | null
    architecture_ref: string | null
    tickets_ref: string | null
    source_docs: {
      tickets: string[]
      docs: string[]
      figma: string[]
      plans: string[]
    }
  }
  /** Writer-only projection recipe (`CONTEXT.md`); reader deferred to v2. */
  render_meta: {
    archetypes: string[]
    design_seed: string
    [additiveField: string]: unknown
  }
  // Tier 2 -- `plan`-kind contract core
  execution_shape: { mode: string; rationale: string }
  tdd: {
    precedence: string
    mode: string
    loop: string
    evidence: { unit: string; e2e: string }
    exceptions: Array<{ scope: string; reason: string; replacement_evidence: string }>
  }
  runtime_stack: { local: string; qa: string; prod: string; e2e_surface: boolean }
  constitution: { version: string | null; waivers: string[] }
  handoff: {
    problem_narrative: boolean
    user_story: boolean
    architectural_context: boolean
    success_criteria: boolean
  }
  slices: Array<{
    id: string
    feature_home: string
    scope: string
    scope_fence: string
    files: string[]
    depends_on: string[]
    dependency_type: string
    acceptance_criteria: string
    test_command: string
  }>
  success_criteria: Array<{ id: string; statement: string; verification: string }>
  /** Semi-structured, per-scenario -- load-bearing for the L3/L4 gates. */
  suggested_e2e_suite: Array<{ id: string } & Record<string, unknown>>
  // Tier 3 -- rendered prose (never machine-parsed)
  problem_narrative: string
  user_story: string
  architectural_context: string
  specified_scope_contract: string
  references: string
  // Tier 4 -- open extension (machine-ignored)
  ext: Record<string, unknown>
}

/**
 * Fixed-core island schema v1, `kind: "brainstorm"` (added T03).
 *
 * Tier 1 (envelope) is byte-identical in shape to `PlanArtifactIsland`'s --
 * the envelope is shared across every kind by contract, never widened
 * per-kind. Tier 2 (this kind's contract core) is different from `plan`'s:
 * `/workflows:plan`'s brainstorm-input dual-read and `grill-with-docs`'
 * content-class mutation are the two downstream consumers that *act* on
 * these fields, so they are the brainstorm kind's required, machine-read
 * core -- not Tier-3 rendered prose, even though the same-named fields
 * (`problem_narrative`, `user_story`, `architectural_context`) are Tier-3
 * prose for the `plan` kind. A discriminated union is allowed to assign a
 * field a different tier per kind; nothing requires the tiering to line up
 * across kinds (see `island-contract.md`'s brainstorm Tier-2 section for the
 * full rationale, including the surfaced `chosen_approach`/`open_questions`
 * classification call).
 */
export interface BrainstormArtifactIsland {
  [key: string]: unknown
  // Tier 1 -- envelope (shared, identical shape to PlanArtifactIsland)
  schema_version: 1
  kind: "brainstorm"
  title: string
  type: string
  date: string
  status: string
  refs: {
    brainstorm_ref: string | null
    architecture_ref: string | null
    tickets_ref: string | null
    source_docs: {
      tickets: string[]
      docs: string[]
      figma: string[]
      plans: string[]
    }
  }
  render_meta: {
    archetypes: string[]
    design_seed: string
    [additiveField: string]: unknown
  }
  // Tier 2 -- `brainstorm`-kind contract core (strict machine-consumed core
  // per island-contract.md: present as a key on every brainstorm island;
  // `chosen_approach`/`resolved_questions`/`open_questions` may legitimately
  // hold an empty value -- same "required key, legitimately empty value"
  // discipline the `plan` kind already uses for `tdd.exceptions`/`refs.tickets_ref`)
  problem_narrative: string
  user_story: string
  architectural_context: string
  success_criteria: string[]
  chosen_approach: string
  key_decisions: Array<{ decision: string; rationale: string }>
  resolved_questions: Array<{ question: string; answer: string }>
  /** Legitimately `[]` -- brainstorm.md's Phase 3 requires open questions to be resolved (moved to `resolved_questions`) before the artifact is finalized. */
  open_questions: string[]
  handoff: {
    problem_narrative: boolean
    user_story: boolean
    architectural_context: boolean
    success_criteria: boolean
  }
  // Tier 3 -- rendered prose (never machine-parsed) for the brainstorm kind
  scope_boundary: string
  non_goals: string
  constitution_alignment: string
  approaches_considered: string
  stakeholder_impact: string
  // Tier 4 -- open extension (machine-ignored)
  ext: Record<string, unknown>
}

/**
 * Fixed-core island schema v1, `kind: "architecture"` (added T04).
 *
 * Tier 1 (envelope) is byte-identical in shape to `PlanArtifactIsland`'s --
 * shared across every kind, never widened per-kind. Tier 2 (this kind's
 * contract core) is the nine-field set `/deepen-plan`, `/workflows:review`,
 * and `/workflows:work` each read verbatim from the architecture artifact:
 * Feature Homes and Ownership, Shared/Global Decisions, Deepening
 * Candidates, Context Tiers, Deletion Test, Interfaces as Test Surfaces,
 * Seams/Adapters/Contracts, Drift Checks, and Recommendations (folded into
 * one `recommendations` object keyed by consumer instead of three separate
 * prose sections). `docs/architecture/2026-07-09-rich-html-artifacts-architecture.md`
 * is the reference document this schema is grounded in -- see
 * `island-contract.md`'s architecture Tier-2 section for the full
 * field-by-field rationale, including which fields the T04 E2E floor gates
 * non-empty and which are required keys outside that floor.
 */
export interface ArchitectureArtifactIsland {
  [key: string]: unknown
  // Tier 1 -- envelope (shared, identical shape to PlanArtifactIsland)
  schema_version: 1
  kind: "architecture"
  title: string
  type: string
  date: string
  status: string
  refs: {
    brainstorm_ref: string | null
    architecture_ref: string | null
    tickets_ref: string | null
    source_docs: {
      tickets: string[]
      docs: string[]
      figma: string[]
      plans: string[]
    }
  }
  render_meta: {
    archetypes: string[]
    design_seed: string
    [additiveField: string]: unknown
  }
  // Tier 2 -- `architecture`-kind contract core
  /**
   * The parent plan this architecture artifact was produced from. Not read
   * by the three downstream consumers -- they arrive at the architecture
   * artifact via the *plan's* `architecture_ref`, not the reverse -- kept
   * for provenance and so `frontmatter.plan_ref` has a field-coverage-map
   * home.
   */
  plan_ref: string | null
  feature_homes: Array<{ feature_home: string; owns: string; notes: string }>
  shared_global_decisions: Array<{ candidate: string; decision: string; rationale: string }>
  deepening_candidates: string[]
  /** Required key; NOT gated non-empty by the T04 E2E floor -- see island-contract.md's "Surfaced classification" note. */
  context_tiers: { global: string; on_demand: string; ticket_local: string }
  deletion_test: Array<{ candidate: string; decision: string; rationale: string }>
  interfaces_as_test_surfaces: Array<{
    interface: string
    callers_rely_on: string
    must_not_leak: string
    evidence_needed: string
  }>
  seams_adapters_contracts: Array<{ seam: string; adapter: string; contract: string; stability_class: string }>
  drift_checks: string[]
  /** One field replaces the reference doc's three separate "Recommendations for /x" sections. */
  recommendations: { deepen_plan: string[]; work: string[]; review: string[] }
  /** A different shape from the `plan`/`brainstorm` kinds' `handoff` -- matches the real architecture artifact's own frontmatter exactly. */
  handoff: { deepen_plan: boolean; work: boolean; review: boolean }
  // Tier 3 -- rendered prose (never machine-parsed) for the architecture kind
  purpose_linkage: string
  module_blueprint: string
  design_it_twice: string
  review_depth: string
  open_questions: string
  // Tier 4 -- open extension (machine-ignored)
  ext: Record<string, unknown>
}

/**
 * Serializes an island payload into a breakout-safe JSON string suitable
 * for embedding inside `<script type="application/json" id="artifact-data">`.
 *
 * Primitive: `JSON.stringify(value)`, then inside that JSON string replace
 * the five characters that could break out of (or otherwise corrupt) the
 * `<script>` raw-text content model with their `\uXXXX` escapes: `<` `>`
 * `/` U+2028 U+2029. `&` is deliberately NOT escaped -- `<script
 * type="application/json">` is an HTML raw-text element, so entities are
 * never decoded there; `&` needs no defense and round-trips as a literal
 * character via `JSON.stringify`/`JSON.parse` alone.
 *
 * The `<` escape is load-bearing: it alone defuses `</script`,
 * `</SCRIPT >`, and `<!--` regardless of where they occur in the payload,
 * because it removes every literal `<` from the emitted text. The other
 * four are defense-in-depth (line/paragraph separators that some
 * non-browser JS contexts mishandle; `/` in case a consumer's tag-matching
 * is looser than the HTML spec's raw-text rule).
 */
export function serialize(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003C")
    .replace(/>/g, "\\u003E")
    .replace(/\//g, "\\u002F")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")
}

/**
 * extract(scriptText) = JSON.parse(scriptText), with NO unescape step.
 * This is the exact inverse of `serialize()`: `JSON.parse` natively
 * interprets the `\uXXXX` escapes `serialize()` wrote back into their
 * original characters, so no separate unescape pass exists or is needed.
 * Malformed/truncated JSON fails loud by letting `JSON.parse` throw its
 * native `SyntaxError` -- callers that need a discriminated result instead
 * of a throw use `extractIslandData()` below, which wraps this primitive.
 */
export function extract(scriptText: string): unknown {
  return JSON.parse(scriptText)
}

export type IslandExtractionErrorCode =
  | "MISSING_ISLAND"
  | "EMPTY_ISLAND"
  | "INVALID_JSON"
  | "MISSING_REQUIRED_FIELD"

export type IslandExtractionResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; error: IslandExtractionErrorCode; message: string }

/**
 * Locates the `<script type="application/json" id="artifact-data">` island
 * in a raw HTML document string and returns its inner text -- the
 * string-level equivalent of reading `.textContent` in a real DOM. Returns
 * `null` when no such script tag is present.
 *
 * Reference-impl simplification: because `serialize()` escapes every
 * literal `<` out of the payload, the closing `</script>` delimiter can
 * never occur inside legitimately-serialized content, so a single
 * non-greedy, case-insensitive regex capture (tolerating whitespace before
 * the closing `>`, e.g. `</SCRIPT >`) is a faithful stand-in for the
 * browser's raw-text tokenizer for the purposes of this contract.
 */
export function readArtifactDataScriptText(html: string): string | null {
  const pattern = /<script\b[^>]*\bid=["']artifact-data["'][^>]*>([\s\S]*?)<\/script\s*>/i
  const match = pattern.exec(html)
  return match ? match[1] : null
}

/**
 * Replaces the inner text of the `<script id="artifact-data">` island in
 * place, leaving the opening/closing tags and every other byte of the
 * surrounding document untouched. This is the write-side counterpart of
 * `readArtifactDataScriptText()` -- the mutator (T02) is the first
 * consumer that needs to *write* the island back, not just read it, so
 * this helper lives alongside the read-side lookup it reuses the exact
 * same tag-matching regex from (kept in lockstep on purpose: a mutator
 * that located the tag with one pattern and replaced it with a looser or
 * stricter one could silently corrupt or fail to match a valid document).
 *
 * Throws if no `#artifact-data` script tag is present -- callers that need
 * a discriminated result instead of a throw must call `extractIslandData()`
 * first (as every mutation function in this module does) so a missing
 * island is reported via `MISSING_ISLAND` before this function ever runs.
 */
export function replaceArtifactDataScriptText(html: string, newScriptText: string): string {
  const pattern = /(<script\b[^>]*\bid=["']artifact-data["'][^>]*>)([\s\S]*?)(<\/script\s*>)/i
  if (!pattern.test(html)) {
    throw new Error('No <script id="artifact-data"> element found to replace.')
  }
  return html.replace(pattern, (_match, openTag: string, _oldContent: string, closeTag: string) => `${openTag}${newScriptText}${closeTag}`)
}

/**
 * The fail-loud island reader every downstream consumer is built on. Locates
 * the `#artifact-data` script, takes its raw text, and hands it to
 * `extract()` -- never scraping rendered HTML and never silently returning
 * `null`/`undefined`/an empty object on failure. Guards the two cases
 * `extract()` alone cannot: a missing island (nothing to parse) and a
 * syntactically valid island missing a required fixed-core key. Truncated
 * or empty JSON is caught by letting `extract()`'s native `JSON.parse`
 * throw, which this function converts into the same discriminated shape.
 */
export function extractIslandData(html: string): IslandExtractionResult {
  const scriptText = readArtifactDataScriptText(html)
  if (scriptText === null) {
    return {
      ok: false,
      error: "MISSING_ISLAND",
      message: 'No <script id="artifact-data"> element found in the artifact.',
    }
  }

  if (scriptText.trim().length === 0) {
    return {
      ok: false,
      error: "EMPTY_ISLAND",
      message: "The artifact-data island is empty or whitespace-only.",
    }
  }

  let parsed: unknown
  try {
    parsed = extract(scriptText)
  } catch (cause) {
    return {
      ok: false,
      error: "INVALID_JSON",
      message: `The artifact-data island is not valid JSON: ${(cause as Error).message}`,
    }
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return {
      ok: false,
      error: "MISSING_REQUIRED_FIELD",
      message: "The artifact-data island did not parse to a JSON object.",
    }
  }

  const data = parsed as Record<string, unknown>
  // Kind-aware required set (T03): look up the required keys for this
  // island's own `kind` instead of hard-coding the `plan` kind's list for
  // every artifact. A missing/unrecognized `kind` falls back to
  // `REQUIRED_FIXED_CORE_KEYS`, which preserves the exact prior behavior
  // for `plan` (and correctly still reports "kind" itself as missing when
  // absent, since that key is present in every kind's required set).
  const kind = typeof data.kind === "string" ? data.kind : undefined
  const requiredKeys = (kind !== undefined && REQUIRED_KEYS_BY_KIND[kind]) || REQUIRED_FIXED_CORE_KEYS
  const missingKey = requiredKeys.find((key) => !(key in data))
  if (missingKey) {
    return {
      ok: false,
      error: "MISSING_REQUIRED_FIELD",
      message: `The artifact-data island is missing required fixed-core key "${missingKey}".`,
    }
  }

  return { ok: true, data }
}

/**
 * Builds a complete, schema-valid `PlanArtifactIsland` fixture for tests.
 * `overrides` shallow-merges over the defaults -- pass a hostile payload as
 * e.g. `{ title: "</script>" }` to exercise one field at a time.
 */
export function buildValidIslandFixture(overrides: Partial<PlanArtifactIsland> = {}): PlanArtifactIsland {
  const fixture: PlanArtifactIsland = {
    schema_version: 1,
    kind: "plan",
    title: "Rich Interactive HTML Artifacts — v1 Pilot",
    type: "feat",
    date: "2026-07-09",
    status: "active",
    refs: {
      brainstorm_ref: "docs/brainstorms/2026-07-09-rich-html-artifacts-brainstorm.md",
      architecture_ref: "docs/architecture/2026-07-09-rich-html-artifacts-architecture.md",
      tickets_ref: "docs/tickets/2026-07-09-rich-html-artifacts-v1/index.md",
      source_docs: {
        tickets: [],
        docs: ["CONTEXT.md"],
        figma: [],
        plans: ["docs/plans/2026-07-09-feat-rich-html-artifacts-v2-plan.md"],
      },
    },
    render_meta: {
      archetypes: ["implementation-plan"],
      design_seed: "island-contract-v1",
    },
    execution_shape: {
      mode: "vertical-slices",
      rationale: "Dominantly vertical: create -> read -> proven-equivalent.",
    },
    tdd: {
      precedence: "plan_overrides_local",
      mode: "red-green-refactor",
      loop: "failing-tests-first",
      evidence: { unit: "required", e2e: "required" },
      exceptions: [],
    },
    runtime_stack: {
      local: "Developer machine running Claude Code with the plugin installed.",
      qa: "No hosted QA env; CI runs bun test + build/verify.",
      prod: "The published plugin marketplace.",
      e2e_surface: true,
    },
    constitution: {
      version: null,
      waivers: [],
    },
    handoff: {
      problem_narrative: true,
      user_story: true,
      architectural_context: true,
      success_criteria: true,
    },
    slices: [
      {
        id: "T01",
        feature_home: "portable/compound-engineering/commands/workflows/references/html-artifacts/",
        scope: "Author the island contract + field-coverage map + reference tests.",
        scope_fence: "Do not write the composer, HTML rendering, or downstream wiring.",
        files: ["island-contract.md", "tests/html-artifact-island.test.ts"],
        depends_on: [],
        dependency_type: "none",
        acceptance_criteria: "L1 round-trip + malformed negatives + L2 field-coverage all pass.",
        test_command: "bun test tests/html-artifact-island.test.ts",
      },
    ],
    success_criteria: [
      {
        id: "SC3",
        statement: "Zero contract loss versus legacy Markdown frontmatter + sections.",
        verification: "Verification Gate L2 assertion + L3 equivalence.",
      },
    ],
    suggested_e2e_suite: [
      {
        id: "L1",
        title: "Deterministic primitive round-trip + fail-loud negatives",
        environment: "local + CI",
      },
    ],
    problem_narrative: "Plans are tiring walls of Markdown that get skimmed, not read.",
    user_story: "As a developer... I need the plan artifact delivered as rich, interactive HTML...",
    architectural_context: "A new html-artifacts subsystem; the island is the single source of truth.",
    specified_scope_contract: "v1 delivers create + read for the plan command only.",
    references: "Brainstorm, architecture, and v2 roadmap docs.",
    ext: {},
  }

  return { ...fixture, ...overrides }
}

/**
 * Builds a complete, schema-valid `BrainstormArtifactIsland` fixture for
 * tests (added T03). `overrides` shallow-merges over the defaults -- pass a
 * hostile payload as e.g. `{ problem_narrative: "</script>" }` to exercise
 * one field at a time, mirroring `buildValidIslandFixture` above.
 *
 * Content mirrors the CSV-export brainstorm that precedes
 * `buildValidIslandFixture`'s CSV-export plan fixture, so the two fixture
 * families tell one coherent story instead of two unrelated ones.
 */
export function buildValidBrainstormIslandFixture(
  overrides: Partial<BrainstormArtifactIsland> = {},
): BrainstormArtifactIsland {
  const fixture: BrainstormArtifactIsland = {
    schema_version: 1,
    kind: "brainstorm",
    title: "Add CSV Export to the Reporting Dashboard",
    type: "feat",
    date: "2026-07-09",
    status: "complete",
    refs: {
      brainstorm_ref: null,
      architecture_ref: null,
      tickets_ref: null,
      source_docs: {
        tickets: [],
        // Legitimately empty: brainstorm.md's legacy frontmatter template
        // never captured `source_docs` at all -- doc gathering happens in
        // `/workflows:plan`'s own step 1.5, not at brainstorm time.
        docs: [],
        figma: [],
        plans: [],
      },
    },
    render_meta: {
      archetypes: ["brainstorm-narrative"],
      design_seed: "brainstorm-csv-export-2026-07-09-a1",
    },
    problem_narrative:
      "Analysts currently screenshot report tables to share them, losing precision and making downstream re-analysis impossible.",
    user_story:
      "As an analyst, I need to export any report I can view as a CSV file, so that I can re-analyze the underlying numbers in my own tools instead of retyping them from a screenshot.",
    architectural_context:
      "Lives in the existing reporting module; the serializer is a pure function reused by both the new export route and, later, a scheduled-export job.",
    success_criteria: [
      "A user can export any report they can view as a CSV file.",
      "Exported CSV opens correctly in Excel and Google Sheets without column misalignment.",
    ],
    chosen_approach:
      "Add a pure toCsv() serializer reused by a new export API route and a UI button, rather than a client-side-only export or a background export job, because it fully satisfies both success criteria with the least moving parts.",
    key_decisions: [
      {
        decision: "Stream the export instead of buffering the whole CSV in memory",
        rationale: "Some reports have 100k+ rows; buffering risks OOM on the API pod.",
      },
      {
        decision: "Reuse the existing report-read permission for the export endpoint instead of a new scope",
        rationale: "Export is the same data the user can already view; a new scope would be needless complexity.",
      },
    ],
    resolved_questions: [
      {
        question: "Should exports support XLSX as well as CSV?",
        answer: "No -- deferred; CSV alone satisfies both success criteria and the user's stated workflow.",
      },
    ],
    open_questions: [],
    handoff: {
      problem_narrative: true,
      user_story: true,
      architectural_context: true,
      success_criteria: true,
    },
    scope_boundary:
      "Explicitly included: serializer, export route, UI button. Deferred: scheduled/recurring exports, XLSX format.",
    non_goals: "Scheduled/recurring exports. XLSX format.",
    constitution_alignment: "No constitution version is recorded for this repository; no waivers apply.",
    approaches_considered:
      "A client-side-only export was rejected because large reports would freeze the browser tab. A background export job was rejected as premature -- no user has asked for exports larger than an interactive request can serve.",
    stakeholder_impact:
      "Analysts get a direct export path. Engineering gains a reusable serializer for a later scheduled-export feature. No operations or business impact beyond normal feature rollout.",
    ext: {},
  }

  return { ...fixture, ...overrides }
}

/**
 * Builds a complete, schema-valid `ArchitectureArtifactIsland` fixture for
 * tests (added T04). `overrides` shallow-merges over the defaults -- pass a
 * hostile payload as e.g. `{ purpose_linkage: "</script>" }` to exercise one
 * field at a time, mirroring `buildValidBrainstormIslandFixture` above.
 *
 * Continues the CSV-export reporting-dashboard narrative
 * `buildValidIslandFixture` and `buildValidBrainstormIslandFixture` already
 * tell, so all three fixture families describe one coherent feature instead
 * of three unrelated ones.
 */
export function buildValidArchitectureIslandFixture(
  overrides: Partial<ArchitectureArtifactIsland> = {},
): ArchitectureArtifactIsland {
  const fixture: ArchitectureArtifactIsland = {
    schema_version: 1,
    kind: "architecture",
    title: "Add CSV Export to the Reporting Dashboard — Architecture",
    type: "feat",
    date: "2026-07-09",
    status: "complete",
    refs: {
      brainstorm_ref: "docs/brainstorms/2026-07-09-rich-html-artifacts-brainstorm.md",
      architecture_ref: null,
      tickets_ref: null,
      source_docs: {
        tickets: [],
        docs: [],
        figma: [],
        plans: ["docs/plans/2026-07-09-feat-csv-export-plan.md"],
      },
    },
    render_meta: {
      archetypes: ["architecture-blueprint"],
      design_seed: "architecture-csv-export-2026-07-09-a1",
    },
    plan_ref: "docs/plans/2026-07-09-feat-csv-export-plan.md",
    feature_homes: [
      {
        feature_home: "src/reporting/export/",
        owns: "The toCsv() serializer, the export API route, and the UI export button.",
        notes: "New feature home; nothing else in the reporting module currently owns export formatting.",
      },
      {
        feature_home: "src/reporting/ (existing)",
        owns: "The report query result the exporter reads; unchanged by this feature.",
        notes: "Read-only dependency, not a new owner.",
      },
    ],
    shared_global_decisions: [
      {
        candidate: "toCsv() serializer",
        decision: "feature-local",
        rationale:
          "Only one consumer (the export route) exists today; promote to shared only when the scheduled-export job needs it.",
      },
      {
        candidate: "Report-read permission check",
        decision: "reuse existing shared permission model",
        rationale:
          "Export reads the same data the viewer already authorizes; a new scope would duplicate an existing shared decision.",
      },
    ],
    deepening_candidates: [
      "Confirm the streaming-export approach handles 100k+ row reports without exceeding the API pod's memory limits.",
      "Decide whether the CSV UTF-8 BOM is always emitted or only for locales where Excel needs it.",
    ],
    context_tiers: {
      global:
        "Dependency-free single-file HTML is a hard invariant for any generated artifact; the existing report-read permission model applies to every export surface.",
      on_demand: "This architecture artifact; the CSV-export brainstorm; the reporting module's existing query-layer docs.",
      ticket_local:
        "The exporter's feature home, the exact files, the scope fence, and the one acceptance criterion each execution slice owns.",
    },
    deletion_test: [
      {
        candidate: "Scheduled/recurring export job",
        decision: "delay",
        rationale: "No user has asked for exports larger than an interactive request can serve; building it now is unused structure.",
      },
      {
        candidate: "Streaming CSV serializer",
        decision: "keep",
        rationale: "Survives the deletion test: without it, the 100k+ row success criterion cannot be met without risking OOM.",
      },
    ],
    interfaces_as_test_surfaces: [
      {
        interface: "toCsv() serializer",
        callers_rely_on: "A pure function that streams rows to a writable without buffering the full result set.",
        must_not_leak: "Report-viewer rendering details; the serializer must not import UI code.",
        evidence_needed: "Unit test streaming a 100k+ row fixture without exceeding a fixed memory ceiling.",
      },
    ],
    seams_adapters_contracts: [
      {
        seam: "Export route to serializer",
        adapter: "toCsv() called with the same query result the viewer already fetched",
        contract: "The export route never re-queries the data; it reuses the viewer's already-authorized result.",
        stability_class: "permanent",
      },
    ],
    drift_checks: [
      "A new export format is added without reusing the existing report-read permission check.",
      "The serializer buffers the full result set in memory instead of streaming.",
    ],
    recommendations: {
      deepen_plan: ["Confirm the streaming approach's memory ceiling before execution hardening."],
      work: ["Keep the serializer feature-local; do not promote it to shared until a second consumer exists."],
      review: ["Verify the export route reuses the existing permission check rather than introducing a new scope."],
    },
    handoff: {
      deepen_plan: true,
      work: true,
      review: true,
    },
    purpose_linkage:
      "Canonical WHY source: the CSV-export brainstorm. Local intent: keep the serializer feature-local and streaming-safe. Success-criteria focus: both brainstorm success criteria. Architectural scope: the reporting module's export surface only.",
    module_blueprint:
      "| Module | Feature home | Contains | Why this arrangement |\n|---|---|---|---|\n| Export serializer | src/reporting/export/ | toCsv(), the export route, the UI button | Groups the new export surface in one place, reusing the existing report-read permission model. |",
    design_it_twice: "",
    review_depth:
      "lightweight — the change is a small, well-understood addition to an existing module with no disputed boundaries.",
    open_questions: "",
    ext: {},
  }

  return { ...fixture, ...overrides }
}

export const REQUIRED_FIXED_CORE_KEYS = [
  // Tier 1 -- envelope (shared across every kind)
  "schema_version",
  "kind",
  "title",
  "type",
  "date",
  "status",
  "refs",
  "render_meta",
  // Tier 2 -- contract core for kind "plan"
  "execution_shape",
  "tdd",
  "runtime_stack",
  "constitution",
  "handoff",
  "slices",
  "success_criteria",
  "suggested_e2e_suite",
] as const

/**
 * Tier-2 contract-core keys for `kind: "brainstorm"` (added T03), expressed
 * as the FULL required-key set for the kind (Tier-1 envelope + this kind's
 * Tier-2 core) -- the same "full set, not a delta" shape
 * `REQUIRED_FIXED_CORE_KEYS` already uses for `plan`. See
 * `island-contract.md`'s brainstorm Tier-2 section for the field-by-field
 * rationale, including why `problem_narrative`/`user_story`/
 * `architectural_context` are required core here despite being Tier-3
 * prose for the `plan` kind.
 */
export const REQUIRED_BRAINSTORM_FIXED_CORE_KEYS = [
  // Tier 1 -- envelope (shared across every kind)
  "schema_version",
  "kind",
  "title",
  "type",
  "date",
  "status",
  "refs",
  "render_meta",
  // Tier 2 -- contract core for kind "brainstorm"
  "problem_narrative",
  "user_story",
  "architectural_context",
  "success_criteria",
  "chosen_approach",
  "key_decisions",
  "resolved_questions",
  "open_questions",
  "handoff",
] as const

/**
 * Tier-2 contract-core keys for `kind: "architecture"` (added T04),
 * expressed as the FULL required-key set for the kind (Tier-1 envelope +
 * this kind's Tier-2 core) -- the same "full set, not a delta" shape
 * `REQUIRED_FIXED_CORE_KEYS`/`REQUIRED_BRAINSTORM_FIXED_CORE_KEYS` already
 * use. See `island-contract.md`'s architecture Tier-2 section for the
 * field-by-field rationale.
 */
export const REQUIRED_ARCHITECTURE_FIXED_CORE_KEYS = [
  // Tier 1 -- envelope (shared across every kind)
  "schema_version",
  "kind",
  "title",
  "type",
  "date",
  "status",
  "refs",
  "render_meta",
  // Tier 2 -- contract core for kind "architecture"
  "plan_ref",
  "feature_homes",
  "shared_global_decisions",
  "deepening_candidates",
  "context_tiers",
  "deletion_test",
  "interfaces_as_test_surfaces",
  "seams_adapters_contracts",
  "drift_checks",
  "recommendations",
  "handoff",
] as const

/**
 * Kind-aware required-key lookup (the T03 fix, extended at T04):
 * `extractIslandData`'s fail-loud required-field check used to hard-code
 * the `plan` kind's 16 keys for every artifact, which would wrongly throw
 * `MISSING_REQUIRED_FIELD` on a legitimate `brainstorm` or `architecture`
 * island (neither has `slices`/`tdd`/etc.). Each entry here is already the
 * FULL required set for that kind (envelope + that kind's Tier-2 core), so
 * a lookup miss (missing/unrecognized `kind`) falls back to
 * `REQUIRED_FIXED_CORE_KEYS` -- preserving today's exact behavior for
 * `plan` and for every kind this repository could produce before T03. This
 * is intentionally a plain keyed lookup, not a general multi-kind registry:
 * a future kind (e.g. `deepen-plan`) registers one more entry here, nothing
 * else.
 */
export const REQUIRED_KEYS_BY_KIND: Record<string, readonly string[]> = {
  plan: REQUIRED_FIXED_CORE_KEYS,
  brainstorm: REQUIRED_BRAINSTORM_FIXED_CORE_KEYS,
  architecture: REQUIRED_ARCHITECTURE_FIXED_CORE_KEYS,
}

/**
 * Embeds a pre-serialized JSON string inside a full HTML document's
 * `<script type="application/json" id="artifact-data">` island, with
 * surrounding markup on both sides -- so extraction tests prove the
 * script-tag lookup, not a lucky whole-string match.
 */
export function embedIslandInHtmlDocument(serializedJson: string): string {
  return (
    `<!doctype html><html><head><title>Plan</title></head>` +
    `<body><h1>Plan</h1><script type="application/json" id="artifact-data">` +
    `${serializedJson}</script></body></html>`
  )
}
