// Scratch-only helper (not committed) to build the four L4 corrupted-island
// fixture copies from tests/fixtures/html-artifacts/representative-plan.html,
// corrupting ONLY the #artifact-data island in each copy. Uses the sanctioned
// reference reader's own readArtifactDataScriptText/serialize helpers from
// tests/support/island-spec.ts so the corruption is applied precisely to the
// island's inner text and nothing else in the document is touched.
import { readFileSync, writeFileSync } from "node:fs"
import { readArtifactDataScriptText, serialize } from "../../../tests/support/island-spec.ts"

const SRC = "/Users/varon/compound-engineering-plugin/tests/fixtures/html-artifacts/representative-plan.html"
const DIR = "/Users/varon/compound-engineering-plugin/docs/verification/2026-07-13-html-artifacts-equivalence"

const original = readFileSync(SRC, "utf8")
const islandText = readArtifactDataScriptText(original)
if (islandText === null) {
  throw new Error("Fixture has no #artifact-data island -- cannot build corruption cases from it.")
}

function replaceIslandText(html: string, newInner: string): string {
  const pattern = /(<script\b[^>]*\bid=["']artifact-data["'][^>]*>)([\s\S]*?)(<\/script\s*>)/i
  if (!pattern.test(html)) throw new Error("No #artifact-data island found to replace.")
  return html.replace(pattern, (_m, open: string, _old: string, close: string) => `${open}${newInner}${close}`)
}

// --- Case 1: INVALID_JSON -- truncate the JSON mid-object -----------------
// Cut the island text partway through -- well past the opening "{" and
// squarely inside the middle of the object (inside the "slices" array),
// so JSON.parse fails with an "Unexpected end of JSON input" style error
// rather than accidentally landing on a spot that still parses.
const truncatedAt = Math.floor(islandText.length / 2)
const truncatedIsland = islandText.slice(0, truncatedAt)
const corruptedHtml = replaceIslandText(original, truncatedIsland)
writeFileSync(`${DIR}/L4-corrupted-plan.html`, corruptedHtml, "utf8")

// --- Case 2: MISSING_ISLAND -- remove the whole <script> element ----------
const missingIslandHtml = original.replace(
  /<script\b[^>]*\bid=["']artifact-data["'][^>]*>[\s\S]*?<\/script\s*>/i,
  "",
)
writeFileSync(`${DIR}/L4-missing-island-plan.html`, missingIslandHtml, "utf8")

// --- Case 3: EMPTY_ISLAND -- island present but whitespace-only -----------
const emptyIslandHtml = replaceIslandText(original, "   \n  \t  ")
writeFileSync(`${DIR}/L4-empty-island-plan.html`, emptyIslandHtml, "utf8")

// --- Case 4: MISSING_REQUIRED_FIELD -- valid JSON, missing a required key -
const parsed = JSON.parse(islandText) as Record<string, unknown>
delete parsed.handoff // required fixed-core key for kind "plan"
const missingFieldIsland = serialize(parsed)
const missingFieldHtml = replaceIslandText(original, missingFieldIsland)
writeFileSync(`${DIR}/L4-missing-field-plan.html`, missingFieldHtml, "utf8")

console.log("island text length:", islandText.length)
console.log("truncated at byte:", truncatedAt)
console.log("truncated tail context:", JSON.stringify(islandText.slice(truncatedAt - 40, truncatedAt)))
console.log("All four corrupted copies written.")
