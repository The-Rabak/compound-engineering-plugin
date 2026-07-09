# Island-Extraction Helper

The one authorized reader every downstream consumer of an `html-artifacts` `.html` artifact includes. It is **prose, not a runnable module** — downstream agents `Read` files and cannot execute JS, so a shipped helper function would be uninvokable. Any command or skill that reads an `.html` artifact from this subsystem (`to-issues`, `work`, `review`, `workflow-next-step`) follows this contract instead of inventing its own parsing.

This document is the reader-side companion to `references/html-artifacts/island-contract.md`, which is the schema spec. Read that document first for the fixed-core field list; this document only covers *how to read* it safely.

## How to read the island

1. **Locate the island.** Find the `<script type="application/json" id="artifact-data">` element in the artifact — this is the JSON island, the artifact's single source of truth (per `CONTEXT.md`).
2. **Take its raw inner text as the JSON contract.** Read the script element's `textContent` (or the equivalent raw-text read for the platform's file tool) — never its rendered/interpreted form.
3. **Parse with plain `JSON.parse`. No HTML-entity unescape step.** The island's serializer (`tests/html-artifact-island.test.ts`) escapes `<`, `>`, `/`, and the two line/paragraph separators as JSON-level `\uXXXX` unicode escapes, not as HTML entities. `JSON.parse` natively resolves those escapes back to their original characters — there is nothing else to unescape. Do not run an HTML-entity-decode pass (`&lt;` → `<`, etc.) before or after parsing; the island was never entity-encoded, and adding that step corrupts a byte-exact contract that was already fine as-is.
4. **Read only the fixed-core fields.** The parsed object's Tier 1 envelope + Tier 2 `plan` contract-core fields (the `REQUIRED_FIXED_CORE_KEYS` set in `island-contract.md`) are the load-bearing facts: `title`, `type`, `date`, `status`, `refs.*`, `execution_shape`, `tdd`, `runtime_stack`, `constitution`, `handoff`, `slices[]`, `success_criteria[]`, `suggested_e2e_suite[]`, plus the Tier 3 prose fields (`problem_narrative`, `user_story`, `architectural_context`, `specified_scope_contract`, `references`) when the legacy `.md` path would have read the matching section. Use `island-contract.md`'s field-coverage map to translate a legacy frontmatter key or section name into its island home.
5. **Never scrape rendered HTML.** The surrounding markup, CSS, and JS in the artifact are a *projection* of the island for human viewing — presentation may vary without limit, and no downstream consumer may read a fact from rendered text, a `<table>` cell, a tab panel, or any other visual element. If a fact is not in the island, it does not exist for machine purposes, even if it is visibly rendered on the page.

## Fail-loud extraction (mandatory, no exceptions)

There is no `.md` mirror for an `.html` artifact — the sidecar model was rejected (see the architecture's Design-It-Twice). This makes fail-loud the only contract-consistent behavior on a malformed island: **the consumer stops immediately with a diagnostic naming the artifact path and the exact failure.** It must never proceed on partial data, never scrape the rendered HTML as a substitute, and never fall back to reading a `.md` file that does not exist for this artifact. This is the same discipline as the "stop and report the missing template instead of improvising" pattern used for reference-template loading (`commands/workflows/references/orchestration-protocol.md`, Reference Template Loading step 4) — a missing or broken contract input is always reported, never improvised around.

The failure taxonomy mirrors `extractIslandData`'s discriminated-error shape in `tests/html-artifact-island.test.ts` exactly — reuse these four codes and report them verbatim in the stop diagnostic:

| Case | Error code | Stop diagnostic must state |
|---|---|---|
| No `id="artifact-data"` script element found in the artifact | `MISSING_ISLAND` | The artifact path, and that no `#artifact-data` island exists in it. |
| The island's inner text is empty or whitespace-only | `EMPTY_ISLAND` | The artifact path, and that the island is present but empty. |
| The island's text is truncated, malformed, or otherwise fails `JSON.parse` | `INVALID_JSON` | The artifact path, and the `JSON.parse` error message. |
| The island parses to valid JSON but is missing a required fixed-core key (or the parsed value is not a JSON object) | `MISSING_REQUIRED_FIELD` | The artifact path, and the exact missing key name. |

On any of the four cases: **stop the current workflow step, report the artifact path and the exact failure code/message above, and wait for the artifact to be repaired or for the user's direction.** Do not:

- proceed using whatever fields did successfully parse ("partial data proceed"),
- read the rendered HTML to reconstruct the missing fact ("HTML scrape"), or
- look for or generate a same-named `.md` file as a substitute ("`.md` fallback").

Every consumer of this helper inherits this exact branch verbatim. Do not restate a weaker or differently-worded version of it per consumer.
