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
 * Kind-aware required-key lookup (the T03 fix): `extractIslandData`'s
 * fail-loud required-field check used to hard-code the `plan` kind's 16
 * keys for every artifact, which would wrongly throw `MISSING_REQUIRED_FIELD`
 * on a legitimate `brainstorm` island (it has no `slices`/`tdd`/etc.). Each
 * entry here is already the FULL required set for that kind (envelope +
 * that kind's Tier-2 core), so a lookup miss (missing/unrecognized `kind`)
 * falls back to `REQUIRED_FIXED_CORE_KEYS` -- preserving today's exact
 * behavior for `plan` and for every kind this repository could produce
 * before this ticket. This is intentionally a plain keyed lookup, not a
 * general multi-kind registry: a future kind (e.g. `architecture`, T04)
 * registers one more entry here, nothing else.
 */
export const REQUIRED_KEYS_BY_KIND: Record<string, readonly string[]> = {
  plan: REQUIRED_FIXED_CORE_KEYS,
  brainstorm: REQUIRED_BRAINSTORM_FIXED_CORE_KEYS,
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
