import { describe, expect, test } from "bun:test"
import { promises as fs } from "fs"
import path from "path"
import {
  buildValidIslandFixture,
  embedIslandInHtmlDocument,
  extractIslandData,
  replaceArtifactDataScriptText,
  REQUIRED_FIXED_CORE_KEYS,
  serialize,
  type IslandExtractionErrorCode,
  type PlanArtifactIsland,
} from "./support/island-spec"

/**
 * Reference-implementation tests for the `html-artifact-mutator` skill --
 * the shared, single-owner "update" capability for HTML artifacts (see
 * `portable/compound-engineering/skills/html-artifact-mutator/SKILL.md` and
 * the mutation contract in
 * `portable/compound-engineering/commands/workflows/references/html-artifacts/island-contract.md`).
 *
 * The mutator's pipeline is read -> parse (via the imported T01
 * `extractIslandData`) -> mutate -> re-serialize (via the imported T01
 * `serialize`) -> re-project the affected view when content changed. Two
 * mutation classes, each with an explicit mutable-region policy authored
 * here and mirrored in `island-contract.md`:
 *
 *   - SCALAR / contract-field class: Tier-1 envelope `status`/`refs.*`
 *     only. Patches the island field in place, never re-projects. An
 *     "optional single-element rendered update" is light enough to run
 *     inline (no subagent dispatch): if the old value is rendered as
 *     exactly one `<span class="badge">` element (the composer's own
 *     convention for `type`/`status`/`date`), that element is patched in
 *     place; otherwise a "Related Artifacts" fallback section is appended
 *     and the fallback is logged instead of risking an ambiguous rewrite.
 *
 *   - CONTENT class: Tier-2 contract-core / Tier-3 prose / Tier-4 `ext{}`.
 *     Patches the island, categorically rejects any Tier-1 envelope key
 *     (including `render_meta`, which must be *reused*, never
 *     regenerated -- this is what keeps re-projection stable across
 *     edits), and always requires a re-projection pass.
 *
 * Real re-projection for the content class is dispatched to a fresh
 * subagent by the real skill (the same delegation pattern the composer
 * uses) -- an LLM call has no deterministic unit surface. Per this
 * ticket's TDD contract, the approved `replacement_evidence` for that
 * subagent dispatch is exactly this suite's round-trip + field-coverage +
 * render_meta-stability + malformed-island assertions; this reference impl
 * therefore returns `needsReprojection: true` and stops there rather than
 * hand-building a deterministic HTML re-renderer, which the architecture
 * handoff explicitly rejected ("no Approach-B deterministic renderer").
 * The mechanical mutation this test file proves is real and complete; the
 * creative re-render step is real too, just not something a `bun test`
 * process can invoke.
 */

const fixturePath = path.join(import.meta.dir, "fixtures", "html-artifacts", "representative-plan.html")

// ---------------------------------------------------------------------------
// Mutable-region policy (authored here for T02; mirrored in
// island-contract.md's new "Mutable-region policy" section)
// ---------------------------------------------------------------------------

/**
 * The exact set of dotted field paths the SCALAR mutation class may touch:
 * Tier-1 envelope `status` plus every `refs.*` leaf. `title`/`type`/`date`/
 * `kind`/`schema_version` are Tier-1 too but are identity/classification
 * fields the mutator never rewrites post-creation; `render_meta` is
 * writer-only and is never mutated by either class.
 */
const MUTABLE_SCALAR_FIELD_PATHS = new Set<string>([
  "status",
  "refs.brainstorm_ref",
  "refs.architecture_ref",
  "refs.tickets_ref",
  "refs.source_docs.tickets",
  "refs.source_docs.docs",
  "refs.source_docs.figma",
  "refs.source_docs.plans",
])

/** Tier-1 envelope keys a CONTENT-class mutation patch must never contain. */
const TIER1_ENVELOPE_KEYS = new Set<string>([
  "schema_version",
  "kind",
  "title",
  "type",
  "date",
  "status",
  "refs",
  "render_meta",
])

// ---------------------------------------------------------------------------
// Small dotted-path helpers (only the depth the Tier-1 envelope actually
// uses -- up to 3 segments, e.g. "refs.source_docs.tickets")
// ---------------------------------------------------------------------------

function getPath(source: Record<string, unknown>, dottedPath: string): unknown {
  return dottedPath.split(".").reduce<unknown>((cursor, segment) => {
    if (cursor === null || typeof cursor !== "object") return undefined
    return (cursor as Record<string, unknown>)[segment]
  }, source)
}

function setPath(target: Record<string, unknown>, dottedPath: string, value: unknown): void {
  const segments = dottedPath.split(".")
  let cursor = target
  for (let i = 0; i < segments.length - 1; i++) {
    cursor = cursor[segments[i]] as Record<string, unknown>
  }
  cursor[segments[segments.length - 1]] = value
}

// ---------------------------------------------------------------------------
// Rendered-display escaping -- ordinary HTML-entity escaping for visible
// text, exactly as the composer already documents for prose display. This
// is NOT the island's JSON-level unicode escape (`serialize()` in
// `island-spec.ts`); the two are deliberately separate concerns.
// ---------------------------------------------------------------------------

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// ---------------------------------------------------------------------------
// Mutation result shapes
// ---------------------------------------------------------------------------

type MutationErrorCode = IslandExtractionErrorCode | "UNMUTABLE_FIELD"

interface ScalarMutationSuccess {
  ok: true
  html: string
  /** True when the single rendered badge element was safely patched in place. */
  renderedInPlace: boolean
  /** Non-empty exactly when the graceful fallback ran instead of an in-place rewrite. */
  log: string[]
}
type ScalarMutationResult = ScalarMutationSuccess | { ok: false; error: MutationErrorCode; message: string }

interface ContentMutationSuccess {
  ok: true
  html: string
  /**
   * Always true: content-class mutations always require a downstream
   * re-projection pass. The real skill dispatches a fresh subagent for it
   * (see the file-level doc comment); this reference impl stops here.
   */
  needsReprojection: true
}
type ContentMutationResult = ContentMutationSuccess | { ok: false; error: MutationErrorCode; message: string }

// ---------------------------------------------------------------------------
// Scalar / contract-field mutation class
// ---------------------------------------------------------------------------

/**
 * Attempts a single-element in-place rendered update for a scalar field
 * whose old value is rendered verbatim inside a `<span class="badge">`
 * element (the composer's own convention for `type`/`status`/`date`
 * badges). Patches the element's text in place ONLY when exactly one such
 * element exists in the document -- zero matches (nothing rendered) or
 * more than one (ambiguous) are both "unsafe" by this policy, and the
 * caller falls back to appending a rendered "Related Artifacts" section
 * instead of guessing at an ambiguous rewrite.
 */
function reprojectScalarBadge(
  html: string,
  oldValue: string,
  newValue: string,
): { html: string; renderedInPlace: boolean; log: string[] } {
  const badgePattern = new RegExp(
    `(<span\\b[^>]*\\bclass=["'][^"']*\\bbadge\\b[^"']*["'][^>]*>)${escapeRegExp(oldValue)}(</span>)`,
    "g",
  )
  const matches = html.match(badgePattern) ?? []

  if (matches.length === 1) {
    const patchedHtml = html.replace(
      badgePattern,
      (_match, openTag: string, closeTag: string) => `${openTag}${escapeHtml(newValue)}${closeTag}`,
    )
    return { html: patchedHtml, renderedInPlace: true, log: [] }
  }

  const fallbackSection =
    `\n<section id="related-artifacts-mutation-fallback" data-mutation-fallback="true">` +
    `<h2>Related Artifacts</h2>` +
    `<p>Updated value: ${escapeHtml(newValue)}</p>` +
    `</section>\n`

  const reason =
    matches.length === 0
      ? `No unique rendered badge element found for old value ${JSON.stringify(oldValue)}.`
      : `Ambiguous rendered match (${matches.length} elements) for old value ${JSON.stringify(oldValue)}.`

  return {
    html: html.replace(/<\/body>/i, `${fallbackSection}</body>`),
    renderedInPlace: false,
    log: [`${reason} Appended a Related Artifacts fallback section instead of an unsafe in-place rewrite.`],
  }
}

/**
 * Scalar / contract-field mutation class (`island-contract.md` -- Mutable
 * region: scalar). Patches exactly one Tier-1 envelope field (`status` or a
 * `refs.*` leaf) on the island in place -- never re-projects. If the old
 * value is uniquely rendered as a single badge element, that element is
 * patched in place too (light enough to run inline, no subagent needed);
 * otherwise a "Related Artifacts" fallback section is appended and the
 * fallback is logged rather than risking an ambiguous rewrite. Fails loud
 * (never a silent/partial write) for every `extractIslandData` malformed-
 * island case, plus a dedicated `UNMUTABLE_FIELD` code when `fieldPath`
 * falls outside the scalar mutable region.
 */
function mutateScalarField(html: string, fieldPath: string, newValue: string): ScalarMutationResult {
  if (!MUTABLE_SCALAR_FIELD_PATHS.has(fieldPath)) {
    return {
      ok: false,
      error: "UNMUTABLE_FIELD",
      message: `"${fieldPath}" is outside the scalar mutable region (Tier-1 envelope "status"/"refs.*" only).`,
    }
  }

  const extraction = extractIslandData(html)
  if (!extraction.ok) return extraction

  const island = structuredClone(extraction.data)
  const oldValue = getPath(island, fieldPath)
  setPath(island, fieldPath, newValue)

  const serialized = serialize(island)
  let mutatedHtml = replaceArtifactDataScriptText(html, serialized)

  let renderedInPlace = false
  let log: string[] = []
  if (typeof oldValue === "string") {
    const outcome = reprojectScalarBadge(mutatedHtml, oldValue, newValue)
    mutatedHtml = outcome.html
    renderedInPlace = outcome.renderedInPlace
    log = outcome.log
  }

  return { ok: true, html: mutatedHtml, renderedInPlace, log }
}

// ---------------------------------------------------------------------------
// Content mutation class
// ---------------------------------------------------------------------------

/**
 * Content mutation class (`island-contract.md` -- Mutable region: content).
 * Patches one or more Tier-2 contract-core / Tier-3 prose / Tier-4 `ext{}`
 * top-level fields on the island (each patch key's entire value is
 * replaced -- callers supply the complete new value for any field they
 * touch, e.g. the full `slices[]` array, not a deep partial diff).
 * `render_meta` (and every other Tier-1 envelope key) is categorically
 * rejected from `patch` -- content mutations reuse the recorded
 * `{ archetypes, design_seed }` rather than regenerating it, which is
 * exactly what keeps re-projection stable across edits. Returns
 * `needsReprojection: true`: see the file-level doc comment for why the
 * actual re-render is out of this deterministic reference impl's scope.
 */
function mutateContent(html: string, patch: Record<string, unknown>): ContentMutationResult {
  const forbiddenKeys = Object.keys(patch).filter((key) => TIER1_ENVELOPE_KEYS.has(key))
  if (forbiddenKeys.length > 0) {
    return {
      ok: false,
      error: "UNMUTABLE_FIELD",
      message: `Content mutation cannot touch Tier-1 envelope field(s): ${forbiddenKeys.join(", ")}.`,
    }
  }

  const extraction = extractIslandData(html)
  if (!extraction.ok) return extraction

  const island = { ...structuredClone(extraction.data), ...structuredClone(patch) }
  const serialized = serialize(island)
  const mutatedHtml = replaceArtifactDataScriptText(html, serialized)

  return { ok: true, html: mutatedHtml, needsReprojection: true }
}

// ---------------------------------------------------------------------------
// Shared malformed-island fixtures (mirrors T01's L1 negatives exactly)
// ---------------------------------------------------------------------------

function buildMalformedIslandCases(): Array<[string, IslandExtractionErrorCode]> {
  const noIslandHtml = "<!doctype html><html><body><p>no island here</p></body></html>"
  const emptyIslandHtml = embedIslandInHtmlDocument("   \n  ")
  const fullSerialized = serialize(buildValidIslandFixture())
  const truncatedHtml = embedIslandInHtmlDocument(fullSerialized.slice(0, Math.floor(fullSerialized.length / 2)))
  const missingKeyFixture: Record<string, unknown> = buildValidIslandFixture()
  delete missingKeyFixture.execution_shape
  const missingKeyHtml = embedIslandInHtmlDocument(serialize(missingKeyFixture))

  return [
    [noIslandHtml, "MISSING_ISLAND"],
    [emptyIslandHtml, "EMPTY_ISLAND"],
    [truncatedHtml, "INVALID_JSON"],
    [missingKeyHtml, "MISSING_REQUIRED_FIELD"],
  ]
}

describe("scalar mutation class (Tier-1 envelope status/refs only)", () => {
  test("patches status in place, preserves every other field byte-identically, and updates the rendered badge in place", async () => {
    const originalHtml = await fs.readFile(fixturePath, "utf8")
    const originalIsland = extractIslandData(originalHtml)
    if (!originalIsland.ok) throw new Error("fixture island failed to parse")

    const result = mutateScalarField(originalHtml, "status", "completed")
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const mutatedIsland = extractIslandData(result.html)
    expect(mutatedIsland.ok).toBe(true)
    if (!mutatedIsland.ok) return

    expect(mutatedIsland.data.status).toBe("completed")

    const { status: _originalStatus, ...restOriginal } = originalIsland.data
    const { status: _mutatedStatus, ...restMutated } = mutatedIsland.data
    expect(restMutated).toEqual(restOriginal)

    expect(result.renderedInPlace).toBe(true)
    expect(result.log).toEqual([])
    expect(result.html).toContain('<span class="badge">completed</span>')
    expect(result.html).not.toContain('<span class="badge">active</span>')
    expect(result.html).not.toContain('id="related-artifacts-mutation-fallback"')
  })

  test("falls back to a rendered Related Artifacts section + a log entry when no unique rendered element exists to patch safely", () => {
    const island = buildValidIslandFixture({ status: "active" })
    const html = embedIslandInHtmlDocument(serialize(island))

    const result = mutateScalarField(html, "status", "completed")
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.renderedInPlace).toBe(false)
    expect(result.log.length).toBeGreaterThan(0)
    expect(result.html).toContain('id="related-artifacts-mutation-fallback"')
    expect(result.html).toContain("Updated value: completed")

    const mutatedIsland = extractIslandData(result.html)
    expect(mutatedIsland.ok).toBe(true)
    if (mutatedIsland.ok) expect(mutatedIsland.data.status).toBe("completed")
  })

  test("rejects a field outside the scalar mutable region", async () => {
    const originalHtml = await fs.readFile(fixturePath, "utf8")

    for (const outOfPolicyField of ["title", "type", "date", "render_meta", "execution_shape.mode"]) {
      const result = mutateScalarField(originalHtml, outOfPolicyField, "anything")
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toBe("UNMUTABLE_FIELD")
    }
  })
})

describe("content mutation class (Tier-2 contract-core / Tier-3 prose / Tier-4 ext)", () => {
  test("rewrites a slice's scope, preserves every other field byte-identically, and still satisfies the field-coverage map", async () => {
    const originalHtml = await fs.readFile(fixturePath, "utf8")
    const originalIsland = extractIslandData(originalHtml)
    if (!originalIsland.ok) throw new Error("fixture island failed to parse")
    const originalSlices = originalIsland.data.slices as PlanArtifactIsland["slices"]

    const rewrittenScope = "Add a toCsv() serializer that also emits a UTF-8 BOM for Excel compatibility."
    const patchedSlices = originalSlices.map((slice, index) => (index === 0 ? { ...slice, scope: rewrittenScope } : slice))

    const result = mutateContent(originalHtml, { slices: patchedSlices })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.needsReprojection).toBe(true)

    const mutatedIsland = extractIslandData(result.html)
    expect(mutatedIsland.ok).toBe(true)
    if (!mutatedIsland.ok) return

    const mutatedSlices = mutatedIsland.data.slices as PlanArtifactIsland["slices"]
    expect(mutatedSlices[0].scope).toBe(rewrittenScope)
    expect(mutatedSlices[1]).toEqual(originalSlices[1])
    expect(mutatedSlices[2]).toEqual(originalSlices[2])

    const { slices: _originalSlices, ...restOriginal } = originalIsland.data
    const { slices: _mutatedSlices, ...restMutated } = mutatedIsland.data
    expect(restMutated).toEqual(restOriginal)

    for (const key of REQUIRED_FIXED_CORE_KEYS) {
      expect(mutatedIsland.data).toHaveProperty(key)
    }
  })

  test("re-projection stability: render_meta is reused verbatim across a content mutation, never regenerated", async () => {
    const originalHtml = await fs.readFile(fixturePath, "utf8")
    const originalIsland = extractIslandData(originalHtml)
    if (!originalIsland.ok) throw new Error("fixture island failed to parse")

    const result = mutateContent(originalHtml, { problem_narrative: "A rewritten problem narrative." })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const mutatedIsland = extractIslandData(result.html)
    expect(mutatedIsland.ok).toBe(true)
    if (!mutatedIsland.ok) return

    expect(mutatedIsland.data.render_meta).toEqual(originalIsland.data.render_meta)
    expect(mutatedIsland.data.problem_narrative).toBe("A rewritten problem narrative.")
  })

  test("rejects a patch that touches any Tier-1 envelope field, including an attempt to regenerate render_meta", async () => {
    const originalHtml = await fs.readFile(fixturePath, "utf8")

    const statusResult = mutateContent(originalHtml, { status: "completed" })
    expect(statusResult.ok).toBe(false)
    if (!statusResult.ok) expect(statusResult.error).toBe("UNMUTABLE_FIELD")

    const renderMetaResult = mutateContent(originalHtml, {
      render_meta: { archetypes: ["some-new-archetype"], design_seed: "re-classified-seed" },
    })
    expect(renderMetaResult.ok).toBe(false)
    if (!renderMetaResult.ok) expect(renderMetaResult.error).toBe("UNMUTABLE_FIELD")
  })
})

describe("malformed-island mutations fail loud (never a silent/partial write)", () => {
  test("mutateScalarField fails loud on every T01 malformed-island case", () => {
    for (const [html, expectedError] of buildMalformedIslandCases()) {
      const result = mutateScalarField(html, "status", "completed")
      expect(result).not.toBeNull()
      expect(result).not.toBeUndefined()
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toBe(expectedError)
    }
  })

  test("mutateContent fails loud on every T01 malformed-island case", () => {
    for (const [html, expectedError] of buildMalformedIslandCases()) {
      const result = mutateContent(html, { problem_narrative: "new text" })
      expect(result).not.toBeNull()
      expect(result).not.toBeUndefined()
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toBe(expectedError)
    }
  })

  test("every required fixed-core key triggers MISSING_REQUIRED_FIELD for both mutation functions", () => {
    for (const key of REQUIRED_FIXED_CORE_KEYS) {
      const fixture: Record<string, unknown> = buildValidIslandFixture()
      delete fixture[key]
      const html = embedIslandInHtmlDocument(serialize(fixture))

      const scalarResult = mutateScalarField(html, "status", "completed")
      expect(scalarResult.ok).toBe(false)
      if (!scalarResult.ok) expect(scalarResult.error).toBe("MISSING_REQUIRED_FIELD")

      const contentResult = mutateContent(html, { problem_narrative: "x" })
      expect(contentResult.ok).toBe(false)
      if (!contentResult.ok) expect(contentResult.error).toBe("MISSING_REQUIRED_FIELD")
    }
  })
})
