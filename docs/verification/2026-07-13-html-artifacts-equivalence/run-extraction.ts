// Scratch-only driver (not committed) that runs the sanctioned reference
// reader extractIslandData() from tests/support/island-spec.ts against each
// L4 corrupted-island fixture copy and prints the LITERAL discriminated
// result (ok/error/message) for evidence capture. No assertions here --
// this is observation, not a test; the .md drill records whatever comes out
// verbatim, pass or fail.
import { readFileSync } from "node:fs"
import { extractIslandData } from "../../../tests/support/island-spec.ts"

const DIR = "/Users/varon/compound-engineering-plugin/docs/verification/2026-07-13-html-artifacts-equivalence"

const cases = [
  { label: "L4-corrupted-plan.html (truncated JSON)", file: "L4-corrupted-plan.html", expected: "INVALID_JSON" },
  { label: "L4-missing-island-plan.html (script removed)", file: "L4-missing-island-plan.html", expected: "MISSING_ISLAND" },
  { label: "L4-empty-island-plan.html (whitespace-only)", file: "L4-empty-island-plan.html", expected: "EMPTY_ISLAND" },
  { label: "L4-missing-field-plan.html (handoff key deleted)", file: "L4-missing-field-plan.html", expected: "MISSING_REQUIRED_FIELD" },
]

for (const c of cases) {
  const html = readFileSync(`${DIR}/${c.file}`, "utf8")
  const result = extractIslandData(html)
  console.log("----------------------------------------------------------------")
  console.log("CASE:", c.label)
  console.log("artifact path (as passed to reader):", `${DIR}/${c.file}`)
  console.log("expected code:", c.expected)
  console.log("LITERAL RESULT:", JSON.stringify(result, null, 2))
}
