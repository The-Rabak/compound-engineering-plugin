import { describe, expect, test } from "bun:test"
import { promises as fs } from "fs"
import path from "path"
import { extract, readArtifactDataScriptText, REQUIRED_FIXED_CORE_KEYS } from "./support/island-spec"

/**
 * Structural-assert suite for the `html-artifact-composer` skill (T03).
 *
 * The composer itself is model-instruction prose (`SKILL.md` + the
 * design-DNA reference library) -- there is no executable composer to unit
 * test directly. Per the ticket's Ralph/TDD contract, the approved
 * `replacement_evidence` is a set of deterministic structural asserts run
 * against a hand-authored, faithful representative of composer output:
 * `tests/fixtures/html-artifacts/representative-plan.html`.
 *
 * This suite proves the fixture (and therefore the composer contract it
 * stands in for) satisfies every T03 acceptance criterion:
 *   (a) a valid, JSON.parse-able island satisfying the 4-tier field-coverage map
 *   (b) single self-contained file, no external http(s) deps
 *   (c) TOC + tabs + single-open accordion + the three exporters
 *   (d) injection-safe rendering (island AND visible-HTML attack surfaces)
 *   (e) zero user design input (systematic token layer, not ad hoc styling)
 *   (f) `render_meta` recorded as `{ archetypes: string[], design_seed: string }`
 *
 * Parsing note: imports `readArtifactDataScriptText`, `extract`, and
 * `REQUIRED_FIXED_CORE_KEYS` from `tests/support/island-spec.ts` -- the
 * canonical, DOM-free, regex-based script-tag lookup + plain `JSON.parse`
 * (no unescape step) shared with `tests/html-artifact-island.test.ts` (T01)
 * and `tests/html-artifact-mutation.test.ts` (T02). Importing keeps this
 * suite coupled to the same parsing behavior and required-key contract as
 * the other island suites, instead of re-declaring a third, independently
 * drifting copy.
 */

const fixturePath = path.join(
  import.meta.dir,
  "fixtures",
  "html-artifacts",
  "representative-plan.html",
)

/**
 * Reads a dot/bracket path like `"tdd.evidence.unit"` or `"slices[].id"` off
 * a parsed island object. A `[]` segment checks the path exists on every
 * element of the array (and requires a non-empty array). Returns whether
 * the path is present -- used to assert per-tier field coverage on the
 * fixture instance without importing T01's `FIELD_COVERAGE_MAP`.
 */
function hasPath(value: unknown, dottedPath: string): boolean {
  const segments = dottedPath.split(".")
  let current: unknown = value

  for (const segment of segments) {
    const isArraySegment = segment.endsWith("[]")
    const key = isArraySegment ? segment.slice(0, -2) : segment

    if (current === null || typeof current !== "object") return false
    const record = current as Record<string, unknown>
    if (!(key in record)) return false
    current = record[key]

    if (isArraySegment) {
      if (!Array.isArray(current) || current.length === 0) return false
      // Descend into a representative element so subsequent path segments
      // check the element's shape, not the array object itself.
      current = current[0]
    }
  }

  return true
}

/**
 * One representative path per field-coverage-map tier the fixture must
 * satisfy (`island-contract.md`'s "Field-coverage map"). Not exhaustive of
 * every legacy element (that exhaustiveness is T01's job); this proves the
 * fixture instance actually populates the required shape at every tier,
 * including the nested Tier-2 packet fields and Tier-3 prose slots.
 */
const FIELD_COVERAGE_PATHS = [
  // Tier 1 -- envelope
  "title",
  "type",
  "date",
  "status",
  "refs.brainstorm_ref",
  "refs.architecture_ref",
  "refs.tickets_ref",
  "refs.source_docs.tickets",
  "refs.source_docs.docs",
  "refs.source_docs.figma",
  "refs.source_docs.plans",
  // Tier 2 -- contract core
  "constitution.version",
  "constitution.waivers",
  "handoff.problem_narrative",
  "handoff.user_story",
  "handoff.architectural_context",
  "handoff.success_criteria",
  "tdd.precedence",
  "tdd.mode",
  "tdd.loop",
  "tdd.evidence.unit",
  "tdd.evidence.e2e",
  "tdd.exceptions",
  "execution_shape.mode",
  "execution_shape.rationale",
  "runtime_stack.local",
  "runtime_stack.qa",
  "runtime_stack.prod",
  "runtime_stack.e2e_surface",
  "success_criteria[].id",
  "success_criteria[].statement",
  "success_criteria[].verification",
  "suggested_e2e_suite[].id",
  "slices[].id",
  "slices[].feature_home",
  "slices[].scope",
  "slices[].scope_fence",
  "slices[].files",
  "slices[].depends_on",
  "slices[].dependency_type",
  "slices[].acceptance_criteria",
  "slices[].test_command",
  // Tier 3 -- rendered prose
  "problem_narrative",
  "user_story",
  "architectural_context",
  "specified_scope_contract",
  "references",
]

const HOSTILE_SCRIPT_BREAKOUT = "</script>"
const HOSTILE_IMG_ONERROR = '<img src=x onerror="alert(1)">'

describe("html-artifact-composer representative fixture (structural asserts)", () => {
  test("the fixture file exists and is non-empty", async () => {
    const stat = await fs.stat(fixturePath).catch(() => null)
    expect(stat).not.toBeNull()
    expect(stat?.isFile()).toBe(true)
    expect((stat?.size ?? 0)).toBeGreaterThan(0)
  })

  describe("(a) valid island satisfying the 4-tier field-coverage map", () => {
    test("the artifact-data island is present and JSON.parse-able with no unescape step", async () => {
      const html = await fs.readFile(fixturePath, "utf8")
      const scriptText = readArtifactDataScriptText(html)

      expect(scriptText).not.toBeNull()
      expect(scriptText!.trim().length).toBeGreaterThan(0)
      expect(() => extract(scriptText!)).not.toThrow()
    })

    test("every required fixed-core key (Tier 1 envelope + Tier 2 contract core) is present", async () => {
      const html = await fs.readFile(fixturePath, "utf8")
      const data = extract(readArtifactDataScriptText(html)!)

      for (const key of REQUIRED_FIXED_CORE_KEYS) {
        expect(data).toHaveProperty(key)
      }
    })

    test("every field-coverage-map path resolves on the fixture instance", async () => {
      const html = await fs.readFile(fixturePath, "utf8")
      const data = extract(readArtifactDataScriptText(html)!)

      const missing = FIELD_COVERAGE_PATHS.filter((fieldPath) => !hasPath(data, fieldPath))
      expect(missing).toEqual([])
    })

    test("kind is \"plan\" and schema_version is 1 (v1 discipline)", async () => {
      const html = await fs.readFile(fixturePath, "utf8")
      const data = extract(readArtifactDataScriptText(html)!) as Record<string, unknown>

      expect(data.kind).toBe("plan")
      expect(data.schema_version).toBe(1)
    })
  })

  describe("(b) single self-contained file, no external dependencies", () => {
    test("no external http(s) src/href, @import, or url() reference exists anywhere in the file", async () => {
      const html = await fs.readFile(fixturePath, "utf8")

      expect(/(?:src|href)\s*=\s*["']https?:\/\//i.test(html)).toBe(false)
      expect(/@import/i.test(html)).toBe(false)
      expect(/url\(\s*["']?https?:/i.test(html)).toBe(false)
      expect(/<link\b/i.test(html)).toBe(false)
    })

    test("all styling and scripting is inline (one style block, exactly two script tags)", async () => {
      const html = await fs.readFile(fixturePath, "utf8")

      const styleOpenTags = html.match(/<style\b/gi) ?? []
      const scriptOpenTags = html.match(/<script\b/gi) ?? []

      expect(styleOpenTags.length).toBe(1)
      // Exactly the JSON island + the inline component/exporter script --
      // proves no third script tag was smuggled in via a hostile payload.
      expect(scriptOpenTags.length).toBe(2)
    })
  })

  describe("(c) TOC + tabs + single-open accordion + three exporters", () => {
    test("a table-of-contents nav links to every rendered section", async () => {
      const html = await fs.readFile(fixturePath, "utf8")

      expect(/<nav\b[^>]*class=["'][^"']*\btoc\b[^"']*["']/i.test(html)).toBe(true)
      const tocLinks = html.match(/<nav\b[^>]*\btoc\b[\s\S]*?<\/nav>/i)?.[0].match(/href=["']#[\w-]+["']/gi) ?? []
      expect(tocLinks.length).toBeGreaterThanOrEqual(8)
    })

    test("a [data-tabs] viewer renders one tab per execution slice", async () => {
      const html = await fs.readFile(fixturePath, "utf8")
      const data = extract(readArtifactDataScriptText(html)!) as Record<string, unknown>
      const slices = data.slices as Array<{ id: string }>

      expect(/<[a-z0-9-]+[^>]*\bdata-tabs\b/i.test(html)).toBe(true)

      // Count `role="tab"`/`role="tabpanel"` only on real HTML start tags --
      // a naive whole-file regex would also match the CSS selector text
      // `[role="tab"]` in the <style> block and the JS `querySelectorAll`
      // selector string, double-counting non-element occurrences.
      const openTags = html.match(/<[a-z][a-z0-9-]*\b[^>]*>/gi) ?? []
      const tabButtons = openTags.filter((tag) => /\brole=["']tab["']/i.test(tag))
      const tabPanels = openTags.filter((tag) => /\brole=["']tabpanel["']/i.test(tag))

      expect(tabButtons.length).toBe(slices.length)
      expect(tabPanels.length).toBe(slices.length)
    })

    test("a native single-open accordion groups at least two items under one shared name", async () => {
      const html = await fs.readFile(fixturePath, "utf8")
      const detailsNames = [...html.matchAll(/<details\b[^>]*\bname=["']([^"']+)["']/gi)].map((m) => m[1])

      expect(detailsNames.length).toBeGreaterThanOrEqual(2)
      expect(new Set(detailsNames).size).toBe(1)
    })

    test("the three exporters (copy-as-json, copy-as-prompt, copy-as-markdown) are present", async () => {
      const html = await fs.readFile(fixturePath, "utf8")

      expect(/id=["']export-json["']/i.test(html)).toBe(true)
      expect(/id=["']export-prompt["']/i.test(html)).toBe(true)
      expect(/id=["']export-markdown["']/i.test(html)).toBe(true)
    })

    test("copy-as-json is the symmetric inverse of the serializer (reads the island's raw textContent verbatim)", async () => {
      const html = await fs.readFile(fixturePath, "utf8")

      // Find the variable that captures the island's raw textContent once
      // (the byte-identical source copy-as-JSON must reuse verbatim).
      const islandRawAssignment = html.match(
        /(?:const|let|var)\s+(\w+)\s*=\s*document\.getElementById\(\s*["']artifact-data["']\s*\)\s*\.textContent\s*;/i,
      )
      expect(islandRawAssignment).not.toBeNull()
      const islandRawVariable = islandRawAssignment![1]

      // Bound the export-json handler's source by the *script-side*
      // getElementById reference (not the button's `id="..."` markup
      // attribute, which appears earlier and would bound an empty slice)
      // through the next exporter's getElementById reference. Robust
      // regardless of how many nested calls the handler body contains.
      const exportJsonIndex = html.indexOf('getElementById("export-json")')
      const exportPromptIndex = html.indexOf('getElementById("export-prompt")', exportJsonIndex)
      expect(exportJsonIndex).toBeGreaterThan(-1)
      expect(exportPromptIndex).toBeGreaterThan(exportJsonIndex)

      const handlerSource = html.slice(exportJsonIndex, exportPromptIndex)
      expect(handlerSource).toContain(islandRawVariable)
      // Passthrough, not re-derivation: the handler must not re-stringify --
      // it must copy exactly the bytes the island script tag already holds.
      expect(handlerSource).not.toContain("JSON.stringify")
    })
  })

  describe("(d) injection-safe rendering", () => {
    test("a hostile </script> + <img onerror> payload round-trips through the island exactly", async () => {
      const html = await fs.readFile(fixturePath, "utf8")
      const data = extract(readArtifactDataScriptText(html)!) as Record<string, unknown>

      expect(typeof data.problem_narrative).toBe("string")
      expect(data.problem_narrative as string).toContain(HOSTILE_SCRIPT_BREAKOUT)
      expect(data.problem_narrative as string).toContain(HOSTILE_IMG_ONERROR)
    })

    test("the hostile payload never appears as literal, executable markup anywhere in the file", async () => {
      const html = await fs.readFile(fixturePath, "utf8")

      // No live <img ... onerror=...> tag exists outside the escaped island
      // JSON text (which itself contains zero literal "<" characters) or
      // the HTML-entity-escaped prose rendering.
      expect(/<img\b[^>]*onerror\s*=/i.test(html)).toBe(false)

      // The exact number of real <script> open tags must match the
      // literal count of "</script" close-tag occurrences in the whole
      // file -- proving the hostile "</script>" substring embedded in the
      // island never survives as an unescaped literal that could add a
      // third, illegitimate closing delimiter.
      const scriptOpenCount = (html.match(/<script\b/gi) ?? []).length
      const scriptCloseCount = (html.match(/<\/script\s*>/gi) ?? []).length
      expect(scriptCloseCount).toBe(scriptOpenCount)
    })

    test("the visible HTML projection of the hostile prose field is entity-escaped, not raw", async () => {
      const html = await fs.readFile(fixturePath, "utf8")

      // Prove the fact actually reached the rendered view (not silently
      // dropped) by finding its HTML-entity-escaped form in the visible
      // markup outside the two <script> blocks.
      const visibleHtml = html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
      expect(/&lt;img[^&]*onerror/i.test(visibleHtml)).toBe(true)
      expect(/&lt;\/script&gt;/i.test(visibleHtml)).toBe(true)
    })
  })

  describe("(e) zero user design input (systematic token layer, not ad hoc styling)", () => {
    test("a :root token layer with a light/dark override drives the design, not one-off values", async () => {
      const html = await fs.readFile(fixturePath, "utf8")

      expect(/:root\s*{[^}]*--[a-z-]+\s*:/i.test(html)).toBe(true)
      expect(/data-theme=["']dark["']/i.test(html)).toBe(true)
      expect(/var\(--[a-z-]+\)/i.test(html)).toBe(true)
    })
  })

  describe("(f) render_meta recorded as writer-only projection recipe", () => {
    test("render_meta matches { archetypes: string[], design_seed: string }", async () => {
      const html = await fs.readFile(fixturePath, "utf8")
      const data = extract(readArtifactDataScriptText(html)!) as Record<string, unknown>
      const renderMeta = data.render_meta as { archetypes: unknown; design_seed: unknown }

      expect(Array.isArray(renderMeta.archetypes)).toBe(true)
      expect((renderMeta.archetypes as unknown[]).length).toBeGreaterThan(0)
      for (const archetype of renderMeta.archetypes as unknown[]) {
        expect(typeof archetype).toBe("string")
      }
      expect(typeof renderMeta.design_seed).toBe("string")
      expect((renderMeta.design_seed as string).length).toBeGreaterThan(0)
    })
  })

  describe("scope invariants (responsive + a11y, required by the composer's enforced invariants)", () => {
    test("at least one responsive breakpoint is defined", async () => {
      const html = await fs.readFile(fixturePath, "utf8")
      expect(/@media\s*\(/i.test(html)).toBe(true)
    })

    test("interactive primitives carry ARIA roles/labels", async () => {
      const html = await fs.readFile(fixturePath, "utf8")
      const ariaAttributes = html.match(/\baria-[a-z]+=/gi) ?? []
      expect(ariaAttributes.length).toBeGreaterThan(0)
    })
  })
})
