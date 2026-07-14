# Primitives Catalog

The invariant design DNA shared by every `html-artifacts` artifact (see `CONTEXT.md` → **Primitive**). Every archetype and recipe in this gallery is composed from these primitives plus the mandatory island. This catalog is read by the `html-artifact-composer` skill whenever it drafts a bespoke throwaway template (no matching archetype/recipe) and is the blueprint every full exemplar and recipe sheet already implements.

Every primitive below is **dependency-free**: no CDN, no `<link>`, no `import`, no runtime package. All CSS lives in one inline `<style>` block; all JS lives in one inline `<script>` block, both in the single artifact file.

## The invariants (non-negotiable on every artifact)

1. **Single self-contained file.** No external `http(s)` `src`/`href`/`@import`/`url()`. No `<link>` tag. Everything inline.
2. **Token layer.** A `:root` block of CSS custom properties drives every color/spacing/radius decision; components reference `var(--token)`, never a hardcoded value. This is what makes design **systematic and zero-effort** for the user (SC5) — the composer never asks the user for a color or a font.
3. **JSON island.** Exactly one `<script type="application/json" id="artifact-data">…</script>`, produced with the T01 serialization primitive (see `island-contract.md`). It is the single source of truth; the surrounding HTML is a projection of it.
4. **The three exporters.** Copy-as-JSON, copy-as-prompt, copy-as-markdown — always present, always wired to the same island (see "Exporters" below).
5. **Responsive.** At least one `@media` breakpoint; side-nav/TOC collapses on narrow viewports.
6. **Accessible.** Real ARIA roles/labels on interactive primitives (tabs, accordion, theme toggle); native semantic elements (`<nav>`, `<details>`, `<table>`) preferred over div soup.
7. **Injection-safe.** Every fact projected into visible HTML prose is HTML-entity-escaped (`&lt;`, `&gt;`, `&amp;`) at render time; the island's own serialization uses the T01 unicode-escape primitive so a payload containing `</script>` can never break out of the `<script>` element regardless of where it appears.

## Token layer + light/dark toggle

```html
<style>
  :root {
    --bg: #ffffff;
    --surface: #f6f7f9;
    --fg: #17181c;
    --muted: #5b6270;
    --accent: #3457d5;
    --border: #dde1e7;
    --radius: 10px;
    --font-sans: -apple-system, "Segoe UI", Roboto, sans-serif;
    --font-mono: "SFMono-Regular", Consolas, monospace;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) { --bg:#0b0e14; --surface:#12161f; --fg:#e7e9ee; --muted:#9aa2b1; --accent:#7c9bff; --border:#262c38; }
  }
  :root[data-theme="dark"] { --bg:#0b0e14; --surface:#12161f; --fg:#e7e9ee; --muted:#9aa2b1; --accent:#7c9bff; --border:#262c38; }
  :root[data-theme="light"] { --bg:#ffffff; --surface:#f6f7f9; --fg:#17181c; --muted:#5b6270; --accent:#3457d5; --border:#dde1e7; }
  body { background: var(--bg); color: var(--fg); font-family: var(--font-sans); }
</style>
<script>
  document.getElementById("theme-toggle").addEventListener("click", () => {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
  });
</script>
```

Default to the system preference via `prefers-color-scheme`; the toggle button sets an explicit `data-theme` attribute on `<html>` that overrides it. No persistence layer (localStorage) is required — keep it the simplest thing that works.

## TOC / side-nav

A `<nav class="toc" aria-label="Table of contents">` with one `<a href="#section-id">` per rendered `<section id="section-id">`. Sticky-positioned on wide viewports, collapsible under the responsive breakpoint. Every anchor must resolve to a real section — never link to a section the projection didn't render.

## Tabbed code/content viewer (`[data-tabs]`)

```html
<div class="tabs" data-tabs>
  <div class="tab-list" role="tablist">
    <button role="tab" id="tab-A" aria-controls="panel-A" aria-selected="true" data-tab-target="panel-A">A</button>
    <button role="tab" id="tab-B" aria-controls="panel-B" aria-selected="false" data-tab-target="panel-B" hidden-panel>B</button>
  </div>
  <div class="tab-panels">
    <div role="tabpanel" id="panel-A" data-tab-panel>…</div>
    <div role="tabpanel" id="panel-B" data-tab-panel hidden>…</div>
  </div>
</div>
<script>
  document.querySelectorAll("[data-tabs]").forEach((group) => {
    group.querySelectorAll('[role="tab"]').forEach((tabButton) => {
      tabButton.addEventListener("click", () => {
        group.querySelectorAll('[role="tab"]').forEach((btn) => btn.setAttribute("aria-selected", "false"));
        group.querySelectorAll('[data-tab-panel]').forEach((panel) => panel.setAttribute("hidden", ""));
        tabButton.setAttribute("aria-selected", "true");
        document.getElementById(tabButton.dataset.tabTarget).removeAttribute("hidden");
      });
    });
  });
</script>
```

One tab per array entry when tabs represent island array data (execution slices, comparison rows, code files) — the tab **count must match the island array length**; never render a tab for a fact the island doesn't carry.

## Single-open accordion

Use native `<details name="...">` grouping — HTML natively guarantees only one member of a same-named `<details>` group is open at a time, with zero JavaScript:

```html
<details name="plan-accordion" open>
  <summary>TDD &amp; Evidence Contract</summary>
  <div>…</div>
</details>
<details name="plan-accordion">
  <summary>Runtime Stack &amp; Environments</summary>
  <div>…</div>
</details>
```

All members of one accordion group **must share the exact same `name` value**. Prefer this over a hand-rolled JS accordion — it is simpler, dependency-free, and accessible by construction.

## Diff-rows + comment bubbles

For before/after or reviewed-vs-original content: `<div class="diff-row diff-row--added">`/`diff-row--removed` with a `<aside class="comment-bubble">` anchored beside the line it annotates. Use when an archetype's island data legitimately carries both an old and new value (e.g. a code-review recipe); never fabricate a diff from a single value.

## Stat-cards

```html
<div class="stat-cards">
  <article class="stat-card">
    <h3>SC1</h3>
    <p>A user can export any report they can view as a CSV file.</p>
    <footer>Verification: …</footer>
  </article>
</div>
```

One card per island array entry (success criteria, KPIs, metrics) — same one-card-per-fact discipline as tabs.

## Timeline / milestone-roadmap grid

```html
<ol class="timeline">
  <li class="timeline-item" data-status="done">
    <span class="timeline-marker"></span>
    <h4>S01 — toCsv() serializer</h4>
    <p>No dependencies.</p>
  </li>
  <li class="timeline-item" data-status="pending">
    <span class="timeline-marker"></span>
    <h4>S02 — export route</h4>
    <p>Depends on S01 (hard).</p>
  </li>
</ol>
```

Order and dependency text come directly from `slices[].depends_on` / `slices[].dependency_type` — the timeline is a re-presentation of existing island facts, never a new schedule invented by the composer.

## Clickable SVG → detail panel

An inline `<svg>` with clickable `<g data-detail-target="panel-id">` nodes wired to reveal/scroll to a matching detail `<div id="panel-id">`. Used by the `flowchart` archetype for pipeline/architecture diagrams. The SVG is drawn inline (no image file); the detail text must already exist as an island fact.

## Inline SVG figures + download

Any diagram is inline `<svg>`, never a `<img src>`/external asset. Offer a "Download SVG" link built from a `Blob`/`URL.createObjectURL` of the inline markup — no server round-trip, no dependency.

## Semantic-span syntax highlighting

For code excerpts pulled from `slices[].files` or a code-family recipe: wrap tokens in `<span class="tok-kw">`, `<span class="tok-str">`, etc., colored via token-layer variables. Keep this light — a few span classes, not a full tokenizer; when in doubt, render code as plain `<pre><code>` with the file path as a caption instead of half-hearted highlighting.

## Milestone/roadmap grid, risk/impact tables

The risk/impact table renders exactly the island's exception/waiver-shaped arrays (e.g. `tdd.exceptions[]`, `constitution.waivers`) as `<table class="risk-table">` rows — **never invent a risk that has no island backing.** If an archetype's document family genuinely needs a bespoke risk field with no fixed-core home, put it in `ext{}` (Tier 4) and render it from there, per the one hard rule.

## Injection-safe rendering (composer self-check)

Before projecting any island field into visible HTML:

- **Prose fields** (Tier 3, or any Tier 2 field shown as running text) must be HTML-entity-escaped: `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`. Never interpolate raw island text into markup. This text-node escape set does not cover `"`/`'` and is insufficient for attribute contexts: island prose must never be interpolated into a quoted HTML attribute value (`title="…"`, `aria-label="…"`, `data-*="…"`, `alt="…"`) — render it only as text-node content.
- **The island `<script>` block itself** uses the T01 serialization primitive (`JSON.stringify` then escape `<`, `>`, `/`, U+2028, U+2029) — never the `&lt;`-entity approach, which is not reversible inside a `<script>` raw-text element (see `island-contract.md`).
- A representative hostile payload (`</script>`, `<img src=x onerror=...>`) must round-trip through the island exactly and render only in escaped form in the visible view. This is the composer's own self-check before finishing a generation — not something delegated to a downstream test.

## The three exporters (round-trip, SC4/SC6)

All three read the same parsed island once and the raw island `<script>` text once:

```html
<script>
  const islandRaw = document.getElementById("artifact-data").textContent;
  const islandData = JSON.parse(islandRaw);

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      return;
    }
    const scratch = document.createElement("textarea");
    scratch.value = text;
    document.body.appendChild(scratch);
    scratch.select();
    document.execCommand("copy");
    scratch.remove();
  }

  document.getElementById("export-json").addEventListener("click", () => copyText(islandRaw));
  document.getElementById("export-prompt").addEventListener("click", () => copyText(buildPromptExport(islandData)));
  document.getElementById("export-markdown").addEventListener("click", () => copyText(buildMarkdownExport(islandData)));
</script>
```

- **Copy-as-JSON** copies `islandRaw` **verbatim** — it is the symmetric inverse of the serializer by construction (no re-`JSON.stringify`, no re-derivation). This is what makes SC4's round-trip claim true: what gets copied is byte-identical to what the composer wrote.
- **Copy-as-prompt** wraps `islandData` in a short instruction ("Resume work on this plan; here is its structured island…") plus the raw JSON. The wrapper text is packaging, not a new fact.
- **Copy-as-markdown** regenerates a plaintext rendering of the island's fields (title, frontmatter-shaped block, prose sections, packet lists) — the plaintext-recoverability fallback (SC6) for `cat`/`grep`/git-diff workflows. Build it only from fields already in the island; never add content the island doesn't carry.

## `render_meta` (writer-only)

Every artifact must end its island with:

```json
"render_meta": { "archetypes": ["implementation-plan"], "design_seed": "html-artifact-composer-v1-<date>" }
```

`archetypes` lists every archetype id the composer actually composed (see `gallery-manifest.md`); `design_seed` is a stable string so a future re-projection (v2) can reuse the same design instead of re-classifying. No v1 reader consumes this field — it is recorded now so v2 needs no artifact migration.
