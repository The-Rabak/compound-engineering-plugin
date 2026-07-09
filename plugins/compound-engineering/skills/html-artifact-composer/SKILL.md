---
name: html-artifact-composer
description: "Composes a self-contained, interactive HTML artifact (island-first, single file, token-layer themed, injection-safe) from a workflow command's structured plan payload. Invoked by a workflow command at its artifact-write step -- currently `/workflows:plan` -- never by the user directly."
---

# HTML Artifact Composer

The **create** capability of the `html-artifacts` subsystem (`CONTEXT.md` → **Composer skill**). A workflow command invokes this skill at its artifact-write step with a structured payload; this skill turns that payload into one self-contained `.html` file and returns its path. It never talks to the user directly and never asks for design input.

## Required contract

Before composing anything, load:

- `commands/workflows/references/html-artifacts/island-contract.md` — the fixed-core schema (Tier 1 envelope + Tier 2 `plan` contract core), Tier 3/4, the serialization primitive, and the field-coverage map. The island this skill writes MUST conform to it exactly.
- `commands/workflows/references/html-artifacts/primitives-catalog.md` — the invariant design DNA (token layer, TOC, tabs, accordion, exporters, injection-safe rendering, etc.) every artifact is built from.
- `commands/workflows/references/html-artifacts/gallery-manifest.md` — the one-line-per-entry archetype/recipe index. This is the **only** gallery file read on every generation.

If any of these three cannot be loaded, stop and report the contract as unavailable instead of inventing a schema or a design.

## Input contract

The caller (a workflow command) supplies:

- `target_path` — where to write the artifact, e.g. `docs/plans/2026-07-09-feat-csv-export-plan.html`.
- `payload` — an object covering every Tier 1 envelope field and every Tier 2 `plan` contract-core field required by `island-contract.md`'s `REQUIRED_FIXED_CORE_KEYS`, plus the Tier 3 prose fields and any Tier 4 `ext{}` content the command has already gathered. The caller is responsible for gathering this content (WHY anchor, execution slices, TDD/evidence contract, etc.); this skill is responsible only for turning it into a conformant island and a faithful HTML projection — it does not invent missing facts.

If the payload is missing a required fixed-core field, stop and report exactly which field is missing rather than fabricating a placeholder value.

## Workflow: classify → select/compose → draft-bespoke → project

### 1. Classify

Assign the artifact a primary `type` (already present on the payload, e.g. `plan`) and a small set of tags describing what it actually contains: does it have execution slices (`vertical-slices` tag), a pipeline/architecture diagram worth drawing, exception/waiver arrays worth a risk table, a milestone sequence worth a timeline? Classification is grounded in what the **payload** actually carries — never tag for an archetype the payload has no data to back.

### 2. Select / compose

Read `gallery-manifest.md` (and only that file) and match rows by `type`/`tags[]`. A `plan` payload with execution slices, at least one TDD exception or constitution waiver, and more than one slice typically matches:

- `implementation-plan` (always, for a `plan`-kind payload — it is the anchor archetype for this document family)
- `milestone-grid` when `slices[]` has more than one entry with meaningful `depends_on` chains
- `risk-table` when `tdd.exceptions[]` or `constitution.waivers` is non-empty
- `flowchart` only when the payload's `ext{}` content includes an actual pipeline/architecture graph to draw

Load **only** the matched exemplar/recipe file(s) from `archetypes/`/`recipes/` — never the whole gallery. Compose their primitives into one document; do not literally copy an exemplar's sample content, only its structural pattern.

### 3. Draft bespoke (when nothing fits)

If no manifest row's `type`/`tags[]` combination fits the payload, draft a throwaway template directly from `primitives-catalog.md`'s primitives, following the nearest recipe sheet's "Bespoke-drafting note" as a blueprint for structure. A bespoke template still obeys every invariant below — bespoke means "no pre-built archetype," not "invariants optional."

### 4. Project (island-first, always)

Generation order is fixed, in this order, every time:

1. **Author the island first.** Build the complete JSON object matching `island-contract.md` exactly: every Tier 1 + Tier 2 required field from the payload, the Tier 3 prose fields verbatim, any Tier 4 `ext{}` content the bespoke/bespoke-bridging sections need, and `render_meta` (see below). Do this before writing a single line of visible HTML.
2. **Serialize it with the T01 primitive.** `JSON.stringify(island)`, then replace `<` → `<`, `>` → `>`, `/` → `/`, U+2028 → ` `, U+2029 → ` `. Do **not** use HTML-entity escaping (`&lt;`) for the island — it is not reversible inside a `<script type="application/json">` element (see `island-contract.md`'s "Serialization primitive" section for why). Embed the result verbatim in `<script type="application/json" id="artifact-data">…</script>`.
3. **Project the visible HTML from the island you just wrote**, using the composed primitives. Every decision-bearing fact that appears in the visible HTML must be read from the island object built in step 1 — never introduced fresh while writing HTML. This is **the one hard rule**: facts flow island → HTML only; the HTML may add unlimited presentation (layout, color, SVG, animation, novel sections) but never a fact the island doesn't carry.
4. **Escape every prose fact for display.** Any island text rendered as visible HTML must be HTML-entity-escaped (`&`, `<`, `>`) at render time — this is what keeps a hostile payload (`</script>`, `<img onerror=...>`) inert in the visible view even though it is preserved verbatim (and safely) inside the island.
5. **Mold-breaking content goes in `ext{}`, never as HTML-only prose.** If the composed layout wants to show something no Tier 1/2/3 field carries, add it to the island's `ext{}` region first, then render it from there. An HTML section with no corresponding island field anywhere (fixed-core or `ext`) is a contract violation, not creative freedom.
6. **Wire the three exporters** against the same island script tag (`primitives-catalog.md` → "The three exporters"). Copy-as-JSON must read the island script's raw `textContent` and copy it verbatim — never re-`JSON.stringify` the parsed object, which would not guarantee byte-identity with what was written.
7. **Populate `render_meta`** with every archetype id actually composed (in the order composed) and a stable `design_seed` string (e.g. `html-artifact-composer-v1-<date>`). This is writer-only in v1 — no reader consumes it yet, but future re-projection needs it.

## Invariants enforced on every artifact, no exceptions

- **Single self-contained file.** No external `http(s)` `src`/`href`/`@import`/`url()`; no `<link>` tag; one `<style>` block; the JSON island plus one component/exporter `<script>` block.
- **Token layer.** Every color/spacing/radius decision flows from a `:root` custom-property block with a light/dark override — never a hardcoded design choice. This is what makes the output consistent and effortless for the user (SC5): the composer never asks the user for a design decision.
- **JSON island via the T01 primitive**, exactly as described above.
- **The three exporters**, always present, always wired to the same island.
- **Responsive.** At least one `@media` breakpoint; navigation collapses gracefully on narrow viewports.
- **Accessible.** Real ARIA roles/labels on tabs/accordion/toggle; semantic elements preferred over div soup.
- **Injection-safe.** Verified by the composer itself before finishing: does a hostile payload embedded anywhere in the payload survive as literal, executable markup anywhere in the output? If yes, fix the escaping before returning — do not ship and hope a downstream test catches it.

## Self-check before returning

1. Re-read the projected HTML section by section. For every decision-bearing fact, can you point to the exact island field it came from? If not, either add the fact to the island (with `ext{}` backing if no fixed-core field fits) or remove it from the HTML.
2. Confirm the file has no external dependency of any kind.
3. Confirm the exporters are wired and copy-as-JSON reads the island's raw `textContent`.
4. Confirm `render_meta.archetypes` lists exactly the archetypes actually composed, and `render_meta.design_seed` is set.
5. Write the file to `target_path` and return that path to the caller. Do not print the full HTML into the conversation — the caller only needs the path.

## Guardrails

- Never ask the user a design question (color, font, layout preference). Zero user design input is a success criterion (SC5), not a fallback for when the composer is unsure.
- Never load the gallery wholesale — classify against `gallery-manifest.md` first, then load only the matched files.
- Never build or invoke a runnable `serialize`/`extract` module. The escaping primitive is authored directly into the artifact's inline `<script>` each time (per `primitives-catalog.md`); the only place a reusable JS implementation of it is allowed to live is `tests/html-artifact-island.test.ts`, which this skill never imports.
- Never mutate an existing artifact's island in place — that is the (v2, not yet built) island-mutation skill's job, not this skill's.
- Never write a fact into the HTML that required guessing; if the payload is missing something the projection needs, stop and report the missing field to the caller instead of inventing it.
