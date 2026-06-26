# Agent-Native Plan Style And Primitives

Use this reference with `local-visual-artifacts.md` when authoring local Agent-Native MDX sidecars. It adapts the BuilderIO Agent-Native visual-plan style guidance and block registry for this plugin's local-only workflow.

## Source And Version

- Style source: BuilderIO Agent-Native visual-plan guidance from pinned package `@agent-native/core@0.67.0`.
- License gate: package metadata for `@agent-native/core@0.67.0` records `license: MIT`.
- Local-only constraint: do not call hosted Plan MCP tools, do not publish, do not share, and do not write to a Plan database.
- Raw upstream `visual-plan` and `visual-recap` skills are not vendored. This reference carries the local renderer rules and requires the pinned CLI for the live block catalog.

## Mandatory Block Catalog Pass

Before authoring MDX, generate and read the live block catalog from the pinned local CLI:

```bash
npx @agent-native/core@0.67.0 plan blocks --format reference --out <output-dir>/plan-blocks.md
```

When using nested or schema-heavy primitives such as `tabs`, `columns`, `api-endpoint`, `data-model`, `question-form`, or `wireframe`, also generate the schema:

```bash
npx @agent-native/core@0.67.0 plan blocks --format schema --out <output-dir>/plan-blocks.schema.json
```

Read the generated `plan-blocks.md` before writing `plan.mdx`. If command execution is unavailable, use the catalog below as the fallback and report the exact commands above. Do not author from memory, do not use floating package tags, and do not invent capitalized MDX tags.

## Complete Primitive Catalog

The pinned catalog exposes these authoring primitives. Prefer the live catalog output for exact syntax and required fields.

High-signal review primitives include `diagram`, `file-tree`, `tabs`, `annotated-code`, `diff`, `data-model`, `api-endpoint`, `json-explorer`, `checklist`, `table`, `callout`, `question-form`, `wireframe`.

| Type | MDX tag | Use |
| --- | --- | --- |
| `rich-text` | `<RichText>` | Plan prose, h3 block headings, summaries, rationale, lists, and source-loyal narrative. |
| `annotated-code` | `<AnnotatedCode>` | Line-numbered code walkthrough with anchored notes for load-bearing files. |
| `api-endpoint` | `<Endpoint>` | API endpoint contract with method, path, params, request, and responses. |
| `callout` | `<Callout>` | Decision, risk, warning, info, or success note. |
| `checklist` | `<Checklist>` | Acceptance, evidence, readiness, or execution status items. |
| `code` | `<Code>` | One syntax-highlighted snippet when annotations are unnecessary. |
| `code-tabs` | `<CodeTabs>` | Legacy file rail. Do not author new blocks; prefer `tabs` with `code` or `annotated-code` children. |
| `columns` | `<Columns>` with `<Column>` children | Side-by-side before/after or current/target comparisons with real nested blocks. |
| `custom-html` | `<HtmlBlock>` | Bounded escape hatch only. Prefer native blocks and `diagram` for architecture HTML/SVG. |
| `data-model` | `<DataModel>` | Entities, fields, and relations for schema or domain model reviews. |
| `diagram` | `<Diagram>` | Architecture, dependency, data-flow, state, ownership, or sequencing diagrams. |
| `diff` | `<Diff>` | Before/after file diff with optional annotations. |
| `file-tree` | `<FileTree>` | Source-derived file map with added/modified/removed/renamed badges and notes. |
| `json-explorer` | `<Json>` | Collapsible JSON payload, manifest, state, or config shape. |
| `mermaid` | `<Mermaid>` | Textual Mermaid grammar only when it is clearer than a spatial HTML diagram. |
| `openapi-spec` | `<OpenApi>` | Whole OpenAPI/Swagger spec reference. |
| `question-form` | `<QuestionForm>` | Bottom-only unresolved decisions with recommended options. |
| `table` | `<Table>` | Compact structured comparisons or parameter lists. |
| `tabs` | `<TabsBlock>` | Group related states, files, diffs, or evidence views. |
| `visual-questions` | `<VisualQuestions>` | Legacy visual intake. Do not author new blocks; prefer `question-form`. |
| `wireframe` | `<WireframeBlock>` | Product UI screen mockups using `<Screen>` and semantic HTML. |

Block headings do not live in block `title` fields. Put a `rich-text` h3 directly above the block so it appears in the document outline and remains editable.

Every capitalized block component must be self-closing or have a matching closing tag. A bare opening JSX tag breaks MDX import before the plan can render.

## Document Quality Bar

- Write a serious technical plan, not a marketing page. No hero sections, slogans, gradients, logos, landing-page cards, or decorative chrome unless the source artifact explicitly asks for them.
- The visual sidecar must stand alone. Fold the correct decisions into normal objective, scope, approach, roadmap, risks, and verification prose instead of referencing the chat or prior drafts.
- Preserve the source artifact's abstraction level. A concrete example can clarify a reusable mechanism, but do not turn the example into extra product scope.
- Use visuals to clarify real relationships, choices, ownership, file paths, contracts, or verification, not to decorate headings.
- For architecture/code work, the document itself is the visual surface: inline `diagram`, `file-tree`, `tabs`, `annotated-code`, `checklist`, `table`, `data-model`, and `callout` blocks should carry the substance.
- For UI/product work, the top canvas owns product screens and flows; the document owns implementation details, file maps, contracts, risks, and verification.
- Put unresolved answerable decisions in one bottom `question-form` section titled `### Open Questions`. Do not duplicate the same questions elsewhere.
- End with verification that exercises the real workflow, not just generic typecheck language.

## Anti-Flat-MDX Gate

A local visual artifact fails the style bar if `plan.mdx` is only prose rendered with a different background. For any non-trivial source artifact, include the smallest useful set of structured blocks:

Plain Markdown with only cosmetic styling is a failure for non-trivial artifacts.

- One spatial `diagram` when sequencing, ownership, dependencies, architecture boundaries, or local-vs-hosted behavior are load-bearing.
- One `file-tree`, `tabs`, `annotated-code`, `diff`, `data-model`, `api-endpoint`, or `json-explorer` block when the source names files, contracts, schemas, commands, or state.
- One `checklist`, `table`, or `callout` block for evidence, acceptance criteria, risks, or decisions.

Do not force visuals where the source is genuinely tiny. If the artifact can only support prose plus a checklist, say that in the report. Otherwise, Markdown-only output is not acceptable.

## Visual Surface Choice

- Do not use a top canvas for architecture-only, backend-only, data migration, command, plugin, packaging, policy, or workflow plans by default. Use a strong document with local inline diagrams and evidence blocks.
- UI screen, mockup, storyboard, product flow, loading state, layout, or visual comparison requests should use `canvas.mdx` as the primary visual surface, with real `<Screen>` wireframes.
- Prototype output belongs in `prototype.mdx` only when the source already requires an interaction model or click path.
- Do not substitute a document-body `diagram` for a requested UI storyboard or wireframe.
- Do not use `custom-html` as the primary home for UI mockups. Use canvas/wireframe primitives.

## Diagram Rules

Use `diagram` blocks for two-dimensional architecture, dependency, data-flow, ownership, state, before/after, or current/target relationships. Prefer spatial layouts such as matrices, swimlanes, layered regions, grouped panels, or before/after diagrams. Do not default to a left-to-right chain unless the relationship is truly sequential.

Author diagram blocks with `data.html` and `data.css` when possible. Use renderer-owned primitives and theme tokens:

- Classes: `.diagram-panel`, `.diagram-card`, `.diagram-node`, `.diagram-box`, `.diagram-pill`, `.diagram-muted`, and `[data-rough]`.
- Tokens: `--wf-ink`, `--wf-muted`, `--wf-line`, `--wf-paper`, `--wf-card`, `--wf-accent`, `--wf-accent-soft`, `--wf-warn`, and `--wf-ok`.
- Do not set `font-family`.
- Do not hard-code hex, rgb, or hsl colors.
- Keep labels short, leave room for sketch font rendering, and avoid overlap between labels, nodes, connectors, and annotations.
- Use Mermaid only when its textual grammar is materially clearer than an HTML/SVG spatial diagram.

## Wireframe Rules

Use wireframes only for product UI surfaces. A `WireframeBlock` is an HTML screen plus a `surface`.

- Write a self-contained semantic HTML fragment for the screen. Do not write `<html>`, `<body>`, `<script>`, `<style>`, or other document-level tags.
- Pick the real surface: `browser`, `desktop`, `mobile`, `popover`, or `panel`. Do not emit desktop and mobile variants unless responsive behavior materially changes.
- Let the renderer own theme, footprint, aspect, sketch/clean rendering, and icons.
- Use semantic elements and helper classes: `.wf-card`, `.wf-box`, `.wf-pill`, `.wf-chip`, `.wf-muted`, `button.primary`, and `[data-primary]`.
- Use renderer icons with empty markers such as `<span data-icon="search" aria-label="Search"></span>` instead of visible icon words.
- Use only `--wf-*` tokens for custom colors. Never hard-code hex, rgb, hsl, or `font-family`.
- Use inline flex/grid layout with real labels, real counts, real dates, and realistic product content.
- Keep product screens pure. Do not put architecture arrows, file paths, repo pills, or implementation callouts inside the product UI. Put those in separate annotations, diagrams, or document blocks.
- Avoid shadows unless the real product UI already has that shadow and it matters to the change.
- Keep padding, gaps, `min-width: 0`, nowrap rails, and overflow behavior deliberate so labels do not collide or wrap badly.
- For before/after document comparisons, put the wireframes in a `columns` block and use column labels for state names. Do not bake `Before` or `After` into the wireframe HTML.

## Canvas Rules

Use `canvas.mdx` only when product visuals are first-class in the source artifact.

- Canvas artboards use the same HTML wireframe path as document wireframes: `<Screen surface="..." html={...} />`.
- Do not author new nested kit-tree components such as `<FrameScreen>`, `<Card>`, `<Row>`, `<Title>`, or `<Btn>` inside canvas `<Screen>` tags.
- Do not create titled artboards with no interior wireframe content.
- Let surface presets determine artboard footprint. Do not set artboard width/height or coordinates inside wireframe HTML.
- Use board-level `x`/`y` only when it creates clear lanes for mixed broad and compact surfaces.
- Keep at least generous whitespace between artboards and connectors; labels and annotations must not overlap frames.
- Put ordinary notes next to the frame they explain with `targetId` plus `placement`; reserve arrows for one specific control or transition.
- Storyboards are canvas artifacts with neighboring artboards and connectors, not single document-body diagrams.

## Primitive Selection By Source Signal

- Execution slices, ownership, local/hosted boundaries, or dependencies -> `diagram`.
- File paths, generated outputs, package surfaces, or changed files -> `file-tree`; add `tabs` with `annotated-code` only when the source includes concrete code or planned code shapes worth reading.
- Evidence commands, acceptance criteria, readiness gates, or done checks -> `checklist`.
- Alternatives or before/after architecture shapes -> `columns` with nested `diagram`, `callout`, `table`, or `wireframe` blocks as appropriate.
- API contracts -> `api-endpoint`; whole specs -> `openapi-spec`.
- Schemas, domain entities, or relations -> `data-model`.
- JSON manifests, state files, or config payloads -> `json-explorer`.
- Specific code deltas -> `diff`; planned key code shape -> `annotated-code`; throwaway snippet -> `code`.
- Risks, decisions, warnings, or assumptions -> `callout`.
- Comparative matrices -> `table`.
- Multiple related files, states, or options -> `tabs`.
- Unresolved reviewer choices -> bottom `question-form`.

## Workflow Defaults

### Brainstorm

Use source-loyal prose, a decision-space diagram when useful, a compact table or columns block for chosen-vs-deferred directions, and a bottom question form only for still-open decisions.

### Plan

Use an execution-shape diagram, a file tree, a checklist for evidence commands, and tabs/columns for slices, packets, risks, or alternatives. For infra/plugin plans, prefer inline diagrams and file/evidence primitives over canvas.

### Architecture

Use module boundary diagrams, feature-home maps, data-model/API blocks when the source contains contracts, and checklists for deletion tests, seams, adapters, and interfaces as test surfaces.

### Review

Use recap kind. Lead with file tree and findings, use diffs/annotated code for high-signal changed files, diagrams for architecture or contract movement, and checklists/callouts for evidence gaps and follow-up todos.

## Final Visual Check

Before handoff, run `plan local check`, generate `preview.html`, and inspect enough of the rendered output to catch flat Markdown, invalid MDX, overlapping labels, empty artboards, dead canvas screens, clipped wireframes, unreadable diagrams, and missing evidence blocks. Static `preview.html` is a deterministic local receipt; the full Plan UI is the richer renderer, but the source MDX must still use native structured primitives.
