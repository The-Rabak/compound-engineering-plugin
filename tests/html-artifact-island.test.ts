import { describe, expect, test } from "bun:test"

/**
 * Canonical reference implementation of the `html-artifacts` island contract
 * (schema v1) -- see
 * `portable/compound-engineering/commands/workflows/references/html-artifacts/island-contract.md`.
 *
 * This file is the SPEC. `island-contract.md`'s prose must describe exactly
 * what the functions below do -- spec/impl drift here is a contract lie.
 *
 * Placement note (resolves the ticket's "where does the reference impl
 * live" unknown): everything below lives inside this test file, not in a
 * `src/` module. `src/` is this repo's published npm package surface
 * (`package.json` `bin`/`publishConfig`); a `src/` util is technically
 * importable by any future `src/` code even if nothing imports it *today*.
 * A test file can never be imported by a shipped artifact -- it is the
 * simplest option that is un-shippable by construction, not by discipline.
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
interface PlanArtifactIsland {
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
function serialize(value: unknown): string {
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
function extract(scriptText: string): unknown {
  return JSON.parse(scriptText)
}

type IslandExtractionErrorCode =
  | "MISSING_ISLAND"
  | "EMPTY_ISLAND"
  | "INVALID_JSON"
  | "MISSING_REQUIRED_FIELD"

type IslandExtractionResult =
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
function readArtifactDataScriptText(html: string): string | null {
  const pattern = /<script\b[^>]*\bid=["']artifact-data["'][^>]*>([\s\S]*?)<\/script\s*>/i
  const match = pattern.exec(html)
  return match ? match[1] : null
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
function extractIslandData(html: string): IslandExtractionResult {
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
  const missingKey = REQUIRED_FIXED_CORE_KEYS.find((key) => !(key in data))
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
function buildValidIslandFixture(overrides: Partial<PlanArtifactIsland> = {}): PlanArtifactIsland {
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

const REQUIRED_FIXED_CORE_KEYS = [
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
 * Embeds a pre-serialized JSON string inside a full HTML document's
 * `<script type="application/json" id="artifact-data">` island, with
 * surrounding markup on both sides -- so extraction tests prove the
 * script-tag lookup, not a lucky whole-string match.
 */
function embedIslandInHtmlDocument(serializedJson: string): string {
  return (
    `<!doctype html><html><head><title>Plan</title></head>` +
    `<body><h1>Plan</h1><script type="application/json" id="artifact-data">` +
    `${serializedJson}</script></body></html>`
  )
}

const HOSTILE_PAYLOADS = [
  "</script>",
  "</SCRIPT >",
  "<!--",
  "&",
  "it's a single-quote payload",
  '"a double-quote payload"',
  "line separated",
  "paragraph separated",
]

// ---------------------------------------------------------------------------
// Field-coverage map (L2) -- the authored 4-tier map. Read
// island-contract.md alongside this: the map here IS the map documented
// there, expressed as data so it can be asserted against.
// ---------------------------------------------------------------------------

type IslandTier = 1 | 2 | 3 | 4

interface FieldCoverageEntry {
  legacyElement: string
  islandHome: string
  tier: IslandTier
  note?: string
}

const FIELD_COVERAGE_MAP: FieldCoverageEntry[] = [
  // Tier 1 -- envelope
  { legacyElement: "frontmatter.title", islandHome: "title", tier: 1 },
  { legacyElement: "frontmatter.type", islandHome: "type", tier: 1 },
  { legacyElement: "frontmatter.status", islandHome: "status", tier: 1 },
  { legacyElement: "frontmatter.date", islandHome: "date", tier: 1 },
  {
    legacyElement: "frontmatter.constitution_version",
    islandHome: "constitution.version",
    tier: 2,
    note: "legitimate per-kind absence: null when no docs/constitution.md exists",
  },
  { legacyElement: "frontmatter.constitution_waivers", islandHome: "constitution.waivers", tier: 2 },
  { legacyElement: "frontmatter.brainstorm_ref", islandHome: "refs.brainstorm_ref", tier: 1 },
  { legacyElement: "frontmatter.architecture_ref", islandHome: "refs.architecture_ref", tier: 1 },
  {
    legacyElement: "frontmatter.tickets_ref",
    islandHome: "refs.tickets_ref",
    tier: 1,
    note: "legitimate per-kind absence: null before ticketization",
  },
  { legacyElement: "frontmatter.source_docs.tickets", islandHome: "refs.source_docs.tickets", tier: 1 },
  { legacyElement: "frontmatter.source_docs.docs", islandHome: "refs.source_docs.docs", tier: 1 },
  {
    legacyElement: "frontmatter.source_docs.figma",
    islandHome: "refs.source_docs.figma",
    tier: 1,
    note: "legitimate per-kind absence: [] when no Figma refs apply",
  },
  { legacyElement: "frontmatter.source_docs.plans", islandHome: "refs.source_docs.plans", tier: 1 },
  { legacyElement: "frontmatter.handoff.problem_narrative", islandHome: "handoff.problem_narrative", tier: 2 },
  { legacyElement: "frontmatter.handoff.user_story", islandHome: "handoff.user_story", tier: 2 },
  {
    legacyElement: "frontmatter.handoff.architectural_context",
    islandHome: "handoff.architectural_context",
    tier: 2,
  },
  { legacyElement: "frontmatter.handoff.success_criteria", islandHome: "handoff.success_criteria", tier: 2 },
  { legacyElement: "frontmatter.tdd.precedence", islandHome: "tdd.precedence", tier: 2 },
  { legacyElement: "frontmatter.tdd.mode", islandHome: "tdd.mode", tier: 2 },
  { legacyElement: "frontmatter.tdd.loop", islandHome: "tdd.loop", tier: 2 },
  { legacyElement: "frontmatter.tdd.evidence.unit", islandHome: "tdd.evidence.unit", tier: 2 },
  { legacyElement: "frontmatter.tdd.evidence.e2e", islandHome: "tdd.evidence.e2e", tier: 2 },
  {
    legacyElement: "frontmatter.tdd.exceptions",
    islandHome: "tdd.exceptions",
    tier: 2,
    note: "legitimate per-kind absence: [] when no exceptions apply",
  },
  { legacyElement: "frontmatter.execution_shape.mode", islandHome: "execution_shape.mode", tier: 2 },
  { legacyElement: "frontmatter.execution_shape.rationale", islandHome: "execution_shape.rationale", tier: 2 },
  { legacyElement: "frontmatter.runtime_stack.local", islandHome: "runtime_stack.local", tier: 2 },
  { legacyElement: "frontmatter.runtime_stack.qa", islandHome: "runtime_stack.qa", tier: 2 },
  { legacyElement: "frontmatter.runtime_stack.prod", islandHome: "runtime_stack.prod", tier: 2 },
  { legacyElement: "frontmatter.runtime_stack.e2e_surface", islandHome: "runtime_stack.e2e_surface", tier: 2 },

  // Tier 3 -- rendered prose sections (never machine-parsed downstream)
  { legacyElement: "section.Problem Narrative", islandHome: "problem_narrative", tier: 3 },
  { legacyElement: "section.User Story", islandHome: "user_story", tier: 3 },
  { legacyElement: "section.Architectural Context", islandHome: "architectural_context", tier: 3 },
  { legacyElement: "section.Specified Scope Contract", islandHome: "specified_scope_contract", tier: 3 },
  { legacyElement: "section.References", islandHome: "references", tier: 3 },

  // Tier 2 -- sections downstream *acts* on. Each one's frontmatter twin
  // already carries the structured facts; the legacy body section is a
  // human-readable restatement that the island collapses into one field.
  { legacyElement: "section.Success Criteria", islandHome: "success_criteria[]", tier: 2 },
  {
    legacyElement: "section.TDD & Evidence Contract",
    islandHome: "tdd",
    tier: 2,
    note: "restates frontmatter tdd.* in prose; island keeps one structured copy",
  },
  { legacyElement: "section.Suggested E2E Suite", islandHome: "suggested_e2e_suite[]", tier: 2 },
  {
    legacyElement: "section.Execution Shape",
    islandHome: "execution_shape",
    tier: 2,
    note: "restates frontmatter execution_shape.* in prose; island keeps one structured copy",
  },
  {
    legacyElement: "section.Constitution Alignment",
    islandHome: "constitution",
    tier: 2,
    note: "restates frontmatter constitution_version/constitution_waivers in prose; island keeps one structured copy",
  },

  // Tier 2 -- execution packets, one entry per packet field
  { legacyElement: "packet.id", islandHome: "slices[].id", tier: 2 },
  { legacyElement: "packet.feature_home", islandHome: "slices[].feature_home", tier: 2 },
  { legacyElement: "packet.scope", islandHome: "slices[].scope", tier: 2 },
  { legacyElement: "packet.scope_fence", islandHome: "slices[].scope_fence", tier: 2 },
  { legacyElement: "packet.files", islandHome: "slices[].files", tier: 2 },
  { legacyElement: "packet.depends_on", islandHome: "slices[].depends_on", tier: 2 },
  { legacyElement: "packet.dependency_type", islandHome: "slices[].dependency_type", tier: 2 },
  { legacyElement: "packet.acceptance_criteria", islandHome: "slices[].acceptance_criteria", tier: 2 },
  { legacyElement: "packet.test_command", islandHome: "slices[].test_command", tier: 2 },
]

/**
 * The authoritative legacy-artifact ground truth this unit proves coverage
 * against: every `plan.md` frontmatter key, every semantic section
 * downstream consumes, every execution-packet field, and references.
 * Authored independently of `FIELD_COVERAGE_MAP` (grounded directly in
 * `docs/plans/2026-07-09-feat-rich-html-artifacts-v1-plan.md` and the T01
 * ticket's enumerated list) so the L2 test is a real check, not a tautology.
 */
const LEGACY_PLAN_CONTRACT_ELEMENTS = [
  "frontmatter.title",
  "frontmatter.type",
  "frontmatter.status",
  "frontmatter.date",
  "frontmatter.constitution_version",
  "frontmatter.constitution_waivers",
  "frontmatter.brainstorm_ref",
  "frontmatter.architecture_ref",
  "frontmatter.tickets_ref",
  "frontmatter.source_docs.tickets",
  "frontmatter.source_docs.docs",
  "frontmatter.source_docs.figma",
  "frontmatter.source_docs.plans",
  "frontmatter.handoff.problem_narrative",
  "frontmatter.handoff.user_story",
  "frontmatter.handoff.architectural_context",
  "frontmatter.handoff.success_criteria",
  "frontmatter.tdd.precedence",
  "frontmatter.tdd.mode",
  "frontmatter.tdd.loop",
  "frontmatter.tdd.evidence.unit",
  "frontmatter.tdd.evidence.e2e",
  "frontmatter.tdd.exceptions",
  "frontmatter.execution_shape.mode",
  "frontmatter.execution_shape.rationale",
  "frontmatter.runtime_stack.local",
  "frontmatter.runtime_stack.qa",
  "frontmatter.runtime_stack.prod",
  "frontmatter.runtime_stack.e2e_surface",
  "section.Problem Narrative",
  "section.User Story",
  "section.Architectural Context",
  "section.Success Criteria",
  "section.Specified Scope Contract",
  "section.TDD & Evidence Contract",
  "section.Suggested E2E Suite",
  "section.Execution Shape",
  "section.Constitution Alignment",
  "section.References",
  "packet.id",
  "packet.feature_home",
  "packet.scope",
  "packet.scope_fence",
  "packet.files",
  "packet.depends_on",
  "packet.dependency_type",
  "packet.acceptance_criteria",
  "packet.test_command",
]

describe("island serialization primitive (Gate L1)", () => {
  test("round-trips a representative valid island byte-for-byte", () => {
    const fixture = buildValidIslandFixture()
    const html = embedIslandInHtmlDocument(serialize(fixture))
    const result = extractIslandData(html)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data).toEqual(fixture)
    }
  })

  for (const payload of HOSTILE_PAYLOADS) {
    test(`round-trips a top-level Tier-1 string field containing ${JSON.stringify(payload)}`, () => {
      const fixture = buildValidIslandFixture({ title: payload })
      const html = embedIslandInHtmlDocument(serialize(fixture))
      const result = extractIslandData(html)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.title).toBe(payload)
      }
    })

    test(`round-trips a Tier-3 prose field containing ${JSON.stringify(payload)}`, () => {
      const fixture = buildValidIslandFixture({ problem_narrative: payload })
      const html = embedIslandInHtmlDocument(serialize(fixture))
      const result = extractIslandData(html)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.problem_narrative).toBe(payload)
      }
    })

    test(`round-trips a nested Tier-2 packet field containing ${JSON.stringify(payload)}`, () => {
      const fixture = buildValidIslandFixture({
        slices: [
          {
            id: "T01",
            feature_home: "portable/compound-engineering/commands/workflows/references/html-artifacts/",
            scope: payload,
            scope_fence: "n/a",
            files: [],
            depends_on: [],
            dependency_type: "none",
            acceptance_criteria: "n/a",
            test_command: "bun test tests/html-artifact-island.test.ts",
          },
        ],
      })
      const html = embedIslandInHtmlDocument(serialize(fixture))
      const result = extractIslandData(html)

      expect(result.ok).toBe(true)
      if (result.ok) {
        const slices = result.data.slices as Array<{ scope: string }>
        expect(slices[0].scope).toBe(payload)
      }
    })
  }

  test("the bare extract() primitive is a plain JSON.parse with no unescape step", () => {
    const fixture = buildValidIslandFixture({ title: "</script><!--&'\"" })
    const serialized = serialize(fixture)
    expect(extract(serialized)).toEqual(fixture)
  })
})

describe("malformed-island negatives fail loud (Gate L1)", () => {
  test("fails loud when no id=\"artifact-data\" script is present", () => {
    const html = "<!doctype html><html><body><p>no island here</p></body></html>"
    const result = extractIslandData(html)

    expect(result).not.toBeNull()
    expect(result).not.toBeUndefined()
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe("MISSING_ISLAND")
    }
  })

  test("fails loud when the island is empty or whitespace-only", () => {
    const html = embedIslandInHtmlDocument("   \n  ")
    const result = extractIslandData(html)

    expect(result).not.toBeNull()
    expect(result).not.toBeUndefined()
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe("EMPTY_ISLAND")
    }
  })

  test("fails loud when the island JSON is truncated / unparseable", () => {
    const fullySerialized = serialize(buildValidIslandFixture())
    const truncated = fullySerialized.slice(0, Math.floor(fullySerialized.length / 2))
    const html = embedIslandInHtmlDocument(truncated)
    const result = extractIslandData(html)

    expect(result).not.toBeNull()
    expect(result).not.toBeUndefined()
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe("INVALID_JSON")
    }
  })

  test("fails loud when valid JSON is missing a required fixed-core key", () => {
    // Widen to Record<string, unknown> deliberately: PlanArtifactIsland's
    // fixed-core fields are non-optional by design, so this cast is the
    // honest way to construct an invalid fixture for a negative test.
    const fixture: Record<string, unknown> = buildValidIslandFixture()
    delete fixture.execution_shape
    const html = embedIslandInHtmlDocument(serialize(fixture))
    const result = extractIslandData(html)

    expect(result).not.toBeNull()
    expect(result).not.toBeUndefined()
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe("MISSING_REQUIRED_FIELD")
      expect(result.message).toContain("execution_shape")
    }
  })

  test("every required fixed-core key is actually asserted", () => {
    for (const key of REQUIRED_FIXED_CORE_KEYS) {
      const fixture: Record<string, unknown> = buildValidIslandFixture()
      delete fixture[key]
      const html = embedIslandInHtmlDocument(serialize(fixture))
      const result = extractIslandData(html)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBe("MISSING_REQUIRED_FIELD")
        expect(result.message).toContain(key)
      }
    }
  })
})

describe("field-coverage map (Gate L2)", () => {
  test("every legacy plan contract element has a named island home", () => {
    const coveredElements = new Set(FIELD_COVERAGE_MAP.map((entry) => entry.legacyElement))
    const missing = LEGACY_PLAN_CONTRACT_ELEMENTS.filter((element) => !coveredElements.has(element))

    expect(missing).toEqual([])
  })

  test("the field-coverage map has no duplicate legacy-element entries", () => {
    const seen = new Set<string>()
    const duplicates = FIELD_COVERAGE_MAP.filter((entry) => {
      if (seen.has(entry.legacyElement)) return true
      seen.add(entry.legacyElement)
      return false
    })

    expect(duplicates).toEqual([])
  })

  test("every coverage entry declares a valid tier (1-4)", () => {
    const invalidTiers = FIELD_COVERAGE_MAP.filter((entry) => ![1, 2, 3, 4].includes(entry.tier))
    expect(invalidTiers).toEqual([])
  })
})
