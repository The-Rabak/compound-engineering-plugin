import { describe, expect, test } from "bun:test"
import {
  buildValidIslandFixture,
  embedIslandInHtmlDocument,
  extract,
  extractIslandData,
  REQUIRED_FIXED_CORE_KEYS,
  serialize,
} from "./support/island-spec"

/**
 * Canonical reference-implementation *tests* for the `html-artifacts`
 * island contract (schema v1) -- see
 * `portable/compound-engineering/commands/workflows/references/html-artifacts/island-contract.md`.
 *
 * The reference implementation itself (`serialize`/`extract`/
 * `extractIslandData`/the schema types/the fixture builder) now lives in
 * `tests/support/island-spec.ts`, imported above. It moved there (out of
 * this file) so `tests/html-artifact-mutation.test.ts` (the
 * html-artifact-mutator unit) could import the exact same primitives
 * instead of a second hand-rolled copy -- a `.test.ts` file re-executes its
 * top-level `describe`/`test` blocks on import, so the primitives could not
 * stay here once a second suite needed them. `island-contract.md`'s prose
 * must describe exactly what those functions do -- spec/impl drift there is
 * a contract lie.
 *
 * `FIELD_COVERAGE_MAP`, `LEGACY_PLAN_CONTRACT_ELEMENTS`, and
 * `HOSTILE_PAYLOADS` below stay local to this file: nothing else needs
 * them, and they are this suite's own gate data, not shared reference-impl
 * primitives.
 */

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
