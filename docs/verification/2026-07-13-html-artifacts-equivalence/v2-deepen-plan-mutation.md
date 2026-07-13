# v2 deepen-plan mutation — step 1 (deterministic island mutation + re-serialization)

**Working file:** `docs/verification/2026-07-13-html-artifacts-equivalence/reprojected-plan-after-mutation.html`
(copied from `tests/fixtures/html-artifacts/representative-plan.html`; the committed fixture was never touched)

**Tooling:** `tests/support/island-spec.ts`'s `extractIslandData` / `serialize` / `replaceArtifactDataScriptText`
via `bun run` (the one sanctioned reference impl per `island-contract.md` + `html-artifact-mutator/SKILL.md`).
No `\uXXXX` was ever hand-typed into an Edit/Write parameter — the `serialize()` primitive produced every
escape sequence programmatically.

This document covers **step 1 only** (deterministic mutation). Re-projection of the Architectural Context
section is intentionally NOT performed here — that is the fresh subagent's job in step 2.

## The three mutations

### 1. CONTENT class — `architectural_context` (Tier-3 prose)

Shallow-merge: appended the required clause to the existing value.

- **Before:** `"Lives in the existing reporting module; the serializer is a pure function reused by both the new export route and, later, a scheduled-export job."`
- **After:** `"Lives in the existing reporting module; the serializer is a pure function reused by both the new export route and, later, a scheduled-export job.; dual-read keeps this contract identical whether the plan ships as .md or .html (equivalence run 2026-07-13)."`

Island field updated and re-serialized. **`render_meta` carried forward byte-identical** (see self-check below).

**`needsReprojection: true`.** The rendered "Architectural Context" section was deliberately left STALE:

- Affected section: `<section id="architectural-context">` — heading "Architectural Context", anchor `#architectural-context` (also linked from the TOC at `nav.toc` → `<a href="#architectural-context">Architectural Context</a>`).
- Current (stale) rendered HTML still reads: `<p>Lives in the existing reporting module; the serializer is a pure function reused by both the new export route and, later, a scheduled-export job.</p>` — it does **not** yet contain the appended clause. Confirmed present verbatim in the working file at the time of this writing (no re-render was performed).
- The re-projection subagent must redraw this section's `<p>` (or richer markup, per its own composer judgment) from the **new** `architectural_context` island value quoted above, reusing the recorded `render_meta` (see below) — never reclassifying archetypes/design_seed.

### 2. SCALAR class — `status` → `"deepened"`

Island field updated (`status: "active"` → `status: "deepened"`). Single-element in-place badge patch attempted per the composer's badge invariant.

- **Match count:** exactly 1 (`<span class="badge">active</span>` appeared once in the header badges row, alongside `feat` and `2026-07-09` badges which are unrelated fields).
- **renderedInPlace: true**
- **Before:** `<span class="badge">active</span>`
- **After:** `<span class="badge">deepened</span>`

### 3. SCALAR class — `refs.tickets_ref` → `"docs/tickets/2026-07-13-csv-export/index.md"`

Island field updated (`refs.tickets_ref: null` → `"docs/tickets/2026-07-13-csv-export/index.md"`; every other `refs.*` leaf — `brainstorm_ref`, `architecture_ref`, `source_docs.*` — untouched).

- **Path taken: FALLBACK** (not in-place). Per the SKILL, the old value was `null`/absent — there is no existing rendered token to find at all (confirmed: no "Tickets"/`tickets_ref`/"Related Artifacts" string existed anywhere in the pre-mutation document). This is explicitly *not* a no-op case.
- Appended a rendered **"Related Artifacts"** section near the end of `<body>` (after the closing `</script>` of the behavior script, before `</body>`), backed by the same island field:

```html
<section id="related-artifacts">
  <h2>Related Artifacts</h2>
  <p>Tickets: <code>docs/tickets/2026-07-13-csv-export/index.md</code></p>
</section>
```

- Fallback logged: **fallbackRan = true**.

## Self-check results

| Check | Result |
|---|---|
| Re-parsed working file's island via T01 primitive (`extractIslandData`) | **PASS** — `ok: true`, valid JSON |
| All 16 `REQUIRED_FIXED_CORE_KEYS` present | **PASS** — `missing_required_keys: []` |
| `status` holds new value (`"deepened"`) | **PASS** |
| `refs.tickets_ref` holds new value | **PASS** |
| `architectural_context` holds new value (with appended clause) | **PASS** |
| `render_meta` byte-identical to original fixture's `render_meta` | **PASS** — `{"archetypes":["implementation-plan","milestone-grid","risk-table"],"design_seed":"html-artifact-composer-v1-2026-07-09"}` unchanged |
| Every other top-level island field byte-identical to original fixture (excluding the 3 mutated fields) | **PASS** — `other_top_level_field_diffs: []` |
| Every other `refs.*` leaf byte-identical (excluding `tickets_ref`) | **PASS** — `other_refs_field_diffs: []` |
| No `<script>`/`<style>`/external dependency added or removed | **PASS** — 2 `<script>` open + 2 close (artifact-data island + behavior script, unchanged), 1 `<style>` open + 1 close; no `src=`/external `href=` present (only in-page `#anchor` hrefs) |
| Byte-level escape hazard check (`/` etc. are literal 6-char escape sequences, not collapsed unicode or raw chars) | **PASS** — confirmed via direct byte inspection: `tickets_ref` renders as `docs/tickets/2026-07-13-csv-export/index.md` (literal backslash-u-002F sequences) |
| Architectural Context rendered section deliberately left stale (not re-rendered) | **CONFIRMED** — still shows pre-mutation text verbatim |

**Overall: no failures.** All self-checks pass; nothing papered over.

## `render_meta` (recorded, to be reused by re-projection — never regenerated)

```json
{
  "archetypes": ["implementation-plan", "milestone-grid", "risk-table"],
  "design_seed": "html-artifact-composer-v1-2026-07-09"
}
```

## Affected content section the re-projection (step 2) must redraw

- **Heading:** "Architectural Context"
- **Anchor / element id:** `#architectural-context` (`<section id="architectural-context">`)
- **New `architectural_context` value to render:**
  `"Lives in the existing reporting module; the serializer is a pure function reused by both the new export route and, later, a scheduled-export job.; dual-read keeps this contract identical whether the plan ships as .md or .html (equivalence run 2026-07-13)."`
- Nothing else should be touched by re-projection — the `status` badge and the `refs.tickets_ref` fallback section were already handled inline in this step (scalar class never re-projects).
