# Compound Engineering Plugin — Context

Canonical domain language for the compound-engineering plugin. This is a glossary, not a spec — it defines what terms *mean*, never how features are implemented.

## Language

### HTML Artifacts subsystem

**Artifact**:
A workflow's output document (from `brainstorm`, `plan`, `architecture`, `deepen-plan`). Moving from `.md` to a self-contained interactive `.html` file that is the **single source of truth** — the human-readable view and the machine contract are the same file.
_Avoid_: doc, output file, page (when precision matters)

**JSON island**:
The `<script type="application/json" id="artifact-data">` block embedded inside an HTML artifact. It is the machine contract — the authoritative structured data downstream commands read. Presentation (the surrounding HTML) is decoupled from and never authoritative over the island.
_Avoid_: metadata block, data blob, frontmatter (frontmatter is the legacy `.md` mechanism the island replaces)

**Island-extraction helper**:
The single shared skill/function every downstream command (`work`, `review`, `to-issues`, `deepen-plan`) uses to parse metadata and content out of an HTML artifact's JSON island. The one authorized reader of the contract.
_Avoid_: parser (too generic)

**Primitive**:
An invariant, reusable piece of artifact design DNA shared by every artifact (token layer, theme toggle, TOC, tabbed code viewer, accordion, diff-rows, stat-cards, timeline, exporters, the island itself). Catalogued in the primitives catalog.
_Avoid_: component, widget, element

**Archetype**:
A document template composed from primitives for a document family (implementation-plan, incident-postmortem, decision-brief, etc.), discoverable by **type + tags**. Stored as a hybrid: full HTML exemplars for anchor families plus compact recipe sheets for the long tail.
_Avoid_: template (reserve "bespoke template" for the composer-drafted throwaway case), layout

**Composer skill**:
The skill the workflow commands invoke at their artifact-write step (the **create** capability). It **classifies** an artifact (type + tags), **selects/composes** best-fit archetype(s) + primitives, or **drafts a bespoke throwaway template** when nothing fits, then **projects** the HTML from the island — always enforcing the invariants (single self-contained file, token layer, JSON island, exporters, responsive, a11y, injection-safe).
_Avoid_: generator, renderer (renderer names the scrapped MDX system)

**Island-mutation skill**:
The single shared skill every in-place editor of an existing artifact goes through (the **update** capability) — the four workflow commands, `to-issues`, `deepen-plan`, and `grill-with-docs`. It safely reads, parses, mutates, and re-serializes the island (via the escaping primitive), re-projecting the HTML view when *content* (not just a scalar field) changes.
_Avoid_: editor, patcher

**Projection recipe** (`render_meta`):
The island field recording how an artifact was rendered (archetype id(s) + design/token seed) so any later re-projection reuses the same design instead of re-classifying — keeping visual design stable across the many mutations the workflow chain performs.
_Avoid_: theme, style config

**Projection**:
The act of rendering an artifact's HTML *view* from its island. The HTML is always a projection of the island, never an independent source. Content flows island→HTML only; the HTML adds presentation, never facts.
_Avoid_: render (ambiguous with the scrapped renderer), build

## Flagged ambiguities

**"Supersede" vs "scrap"** (resolved 2026-07-09): the June MDX `local-visual-artifact-renderer` / `/visual-artifact` / `visual-artifact` skill system is **scrapped and removed** from the plugin surface, not kept dormant. Use "scrap/remove," not "supersede/deprecate."
