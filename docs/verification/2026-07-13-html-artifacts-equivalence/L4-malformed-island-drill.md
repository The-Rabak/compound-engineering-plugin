# L4 malformed-island drill -- fail-loud extraction verification (v1 L4 gate, todo 021)

**Contract under test:** `portable/compound-engineering/commands/workflows/references/html-artifacts/island-extraction-helper.md`,
"Fail-loud extraction" section + its four-code taxonomy (`MISSING_ISLAND` /
`EMPTY_ISLAND` / `INVALID_JSON` / `MISSING_REQUIRED_FIELD`).

**Reference reader exercised:** `extractIslandData()` in `tests/support/island-spec.ts`
(the sanctioned, unit-tested reader the helper's taxonomy is defined to mirror
"exactly").

**Source fixture (never modified):** `tests/fixtures/html-artifacts/representative-plan.html`.
Confirmed via `git status`/`git diff` at the end of this drill: zero diff against
the committed fixture. All corrupted copies live under this scratch directory
(`docs/verification/2026-07-13-html-artifacts-equivalence/`), which is untracked
and will not be committed.

**Scripts used (scratch-only, not committed):**
- `make-corruptions.ts` -- builds the four corrupted copies, corrupting only
  the `#artifact-data` island's inner text via the same tag-matching regex
  `island-spec.ts` itself uses (`readArtifactDataScriptText`/serialize
  helpers imported directly from the reference module -- no reimplementation).
- `run-extraction.ts` -- imports `extractIslandData` from `tests/support/island-spec.ts`
  and runs it against each copy's raw HTML text, printing the literal
  discriminated result. No assertions, no hardcoded pass -- this is a
  capture, not a test.

Run via `bun run docs/verification/2026-07-13-html-artifacts-equivalence/run-extraction.ts`.

---

## Case 1 -- `L4-corrupted-plan.html` -- truncated JSON

**Corruption applied:** Copied the fixture, located the `#artifact-data`
island's inner text (4942 chars), and truncated it to its first 2471
characters (cut exactly in half), landing inside the `S02` slice's
`depends_on` array construction mid-string. Nothing else in the document was
touched -- the truncated island's tail confirmed by direct byte inspection:

```
...\"src\\u002Freporting\\u002Fapi\\u002FexportRoute.test.ts\"],\"depends_on\":[\"S01\"],\"depend
```
(the string cuts off mid-token, well before any closing braces/brackets --
guaranteed unparseable).

**LITERAL captured result:**
```json
{
  "ok": false,
  "error": "INVALID_JSON",
  "message": "The artifact-data island is not valid JSON: JSON Parse error: Unterminated string"
}
```
**Artifact path reported alongside this message (by the driver, standing in
for the consumer):** `docs/verification/2026-07-13-html-artifacts-equivalence/L4-corrupted-plan.html`

**Verdict: PASS.** Error code is exactly `INVALID_JSON` per the taxonomy row
("The island's text is truncated, malformed, or otherwise fails `JSON.parse`").
The message carries the literal `JSON.parse` failure (bun/JavaScriptCore's
`"JSON Parse error: Unterminated string"` -- the engine-native error text,
which is exactly what `extractIslandData`'s `INVALID_JSON` branch is specified
to forward verbatim, not a paraphrase). Combined with the artifact path, this
satisfies "the artifact path, and the `JSON.parse` error message." No partial
data was returned; `ok: false` in all cases -- the reader stops, it does not
proceed.

---

## Case 2 -- `L4-missing-island-plan.html` -- island removed

**Corruption applied:** Copied the fixture and deleted the entire
`<script type="application/json" id="artifact-data">...</script>` element
(regex match on the exact opening tag through its closing `</script>`,
verified by direct inspection: the reader's own island-locating regex
(`readArtifactDataScriptText`) returns `null` against this file -- confirmed
independently before running `extractIslandData`). No other markup or script
element was touched.

**LITERAL captured result:**
```json
{
  "ok": false,
  "error": "MISSING_ISLAND",
  "message": "No <script id=\"artifact-data\"> element found in the artifact."
}
```
**Artifact path reported alongside this message:**
`docs/verification/2026-07-13-html-artifacts-equivalence/L4-missing-island-plan.html`

**Verdict: PASS.** Error code is exactly `MISSING_ISLAND` per the taxonomy
row ("No `id=\"artifact-data\"` script element found in the artifact").
Message states no island was found, satisfying "the artifact path, and that
no `#artifact-data` island exists in it" (path supplied alongside). No
fallback to HTML scraping or a `.md` file occurred or was attempted.

---

## Case 3 -- `L4-empty-island-plan.html` -- whitespace-only island

**Corruption applied:** Copied the fixture and replaced the `#artifact-data`
island's inner text with `"   \n  \t  "` (9 whitespace characters: spaces,
one newline, one tab). Direct inspection confirmed the island element itself
is still present (`readArtifactDataScriptText` finds it) and its `.trim()`
result is the empty string.

**LITERAL captured result:**
```json
{
  "ok": false,
  "error": "EMPTY_ISLAND",
  "message": "The artifact-data island is empty or whitespace-only."
}
```
**Artifact path reported alongside this message:**
`docs/verification/2026-07-13-html-artifacts-equivalence/L4-empty-island-plan.html`

**Verdict: PASS.** Error code is exactly `EMPTY_ISLAND` per the taxonomy row
("The island's inner text is empty or whitespace-only"). Message matches
"the artifact path, and that the island is present but empty" (path supplied
alongside). Ran even though the task flagged this case as optional, since it
was quick -- full four-code taxonomy is covered by this drill, not three of
four.

---

## Case 4 -- `L4-missing-field-plan.html` -- valid JSON, missing a required key

**Corruption applied:** Copied the fixture, parsed the island's JSON, deleted
the `handoff` key (a Tier-1 envelope / required fixed-core key present in
`REQUIRED_FIXED_CORE_KEYS` for `kind: "plan"`), and re-serialized with the
reference module's own `serialize()` (same escaping the composer uses) before
writing it back into the island. Direct inspection confirmed the resulting
island is valid, parseable JSON (4834 chars, well-formed head/tail) with zero
occurrences of the string `"handoff"` anywhere in the file.

**LITERAL captured result:**
```json
{
  "ok": false,
  "error": "MISSING_REQUIRED_FIELD",
  "message": "The artifact-data island is missing required fixed-core key \"handoff\"."
}
```
**Artifact path reported alongside this message:**
`docs/verification/2026-07-13-html-artifacts-equivalence/L4-missing-field-plan.html`

**Verdict: PASS.** Error code is exactly `MISSING_REQUIRED_FIELD` per the
taxonomy row ("The island parses to valid JSON but is missing a required
fixed-core key ... " ), and the message names the exact missing key
(`"handoff"`), satisfying "the artifact path, and the exact missing key name"
(path supplied alongside). Ran even though the task flagged this case as
optional -- full four-code taxonomy is covered.

---

## Which cases were run vs. cited

All four taxonomy cases were actually run against real corrupted fixture
copies with `extractIslandData` (none were merely cited from the helper's
table): `INVALID_JSON` (Case 1, mandatory), `MISSING_ISLAND` (Case 2,
mandatory), `EMPTY_ISLAND` (Case 3, optional per the task but executed), and
`MISSING_REQUIRED_FIELD` (Case 4, optional per the task but executed). No
case was skipped or only cited from the helper's table.

## Product-rationale confirmation (no `.md` mirror exists)

Per the helper's "Fail-loud extraction" section: *"There is no `.md` mirror
for an `.html` artifact -- the sidecar model was rejected (see the
architecture's Design-It-Twice)."* Confirmed by inspection of this drill's
own fixture directory and the wider `tests/fixtures/html-artifacts/` tree:
there is no `representative-plan.md` (or any `.md` counterpart) sitting next
to `representative-plan.html`, and none was created for any of the four
corrupted copies either. This means a real consumer hitting any of the four
codes above has no `.md` file to fall back to even if it wanted to -- fail-loud
(stop, report path + code/message, wait for repair or user direction) is not
merely the preferred behavior, it is the *only* behavior a contract-consistent
consumer can execute, because there is nothing else in the filesystem to read.
`extractIslandData`'s behavior in all four cases above (always `ok: false`,
never a null/undefined/empty-object silent return, never partial data) is
exactly the discriminated stop-signal every downstream consumer (`to-issues`,
`work`, `review`, `workflow-next-step`, `architecture`, `deepen-plan`,
`document-review`, `session-history`) is contractually required to check and
halt on.

## Overall verdict

**PASS.** All four corrupted-island cases produced the exact taxonomy error
code specified by the helper's table, each with the artifact path (available
to the reporting consumer) and a message meeting the helper's "stop
diagnostic must state" requirement for that code. In no case did the reader
return `ok: true`, partial data, a null/empty fallback, or any signal a
consumer could misread as "proceed." No `.md` mirror exists for this or any
`.html` artifact, so fail-loud is confirmed as the only contract-consistent
consumer behavior on a malformed island -- not merely the recommended one.

The committed fixture `tests/fixtures/html-artifacts/representative-plan.html`
was never modified (verified via `git status`/`git diff`: no diff). All
corruption was performed on scratch copies under this directory, which is
untracked and was not committed.
