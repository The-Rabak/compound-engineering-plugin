---
date: 2026-07-09
topic: rich-html-artifacts
status: complete
plan_ref: docs/plans/2026-07-09-feat-rich-html-artifacts-v1-plan.md
brainstorm_ref: docs/brainstorms/2026-07-09-rich-html-artifacts-brainstorm.md
handoff:
  deepen_plan: true
  work: true
  review: true
---

# Rich Interactive HTML Artifacts (v1 Pilot) Architecture Improvement

> Consumes the v1 plan and its brainstorm. Uses the canonical domain language in `CONTEXT.md` verbatim (Artifact, JSON island, Island-extraction helper, Primitive, Archetype, Composer skill, Projection, `render_meta`). This artifact does not re-open resolved decisions; it makes the **boundaries** those decisions imply explicit and consumable for `/deepen-plan`, `/workflows:work`, and `/workflows:review`.

## Purpose Linkage

- **Canonical WHY Source:** `docs/brainstorms/2026-07-09-rich-html-artifacts-brainstorm.md` (present; authoritative for stakeholder impact and resolved questions).
- **Local Intent:** Protect one architectural spine — **the JSON island is the single source of truth, and every consumer touches it through one stable contract, never through rendered HTML.** Everything else in this feature (layout, archetypes, gallery breadth, exporters) is intentionally replaceable around that spine.
- **Success-Criteria Focus:** SC2 (single self-contained file), SC3 (zero contract loss, defined by the field-coverage map), SC4 (symmetric export round-trip). These three are the ones with real architectural teeth; SC1/SC5/SC6/SC7 are presentation/composer-quality criteria that ride on the same spine.
- **Architectural Scope:** A new `html-artifacts` feature home in the portable source layer, plus explicit spans into the `plan` command write-step, three downstream reader commands, the `workflow-next-step` skill, the build/copy pipeline, and the `tests/` contract suite. No runtime services; no new npm/runtime dependencies (hard invariant).

## Feature Homes and Ownership

- **Feature home:** `portable/compound-engineering/commands/workflows/references/html-artifacts/` **+** `portable/compound-engineering/skills/html-artifact-composer/`
  - **Owns:** the design DNA (primitives catalog, hybrid archetype gallery, gallery manifest), the **machine contract** (fixed-core + open-extension island schema, serialization primitive spec, field-coverage map, island-extraction-helper prose), and the **create** capability (composer skill: classify → select/compose → draft-bespoke → project).
  - **Crosses into (stated explicitly, not pretending one home owns everything):**
    - `commands/workflows/plan.md` write-step (`:345–410`) — invokes the composer (Slice C).
    - `commands/workflows/{work,review,to-issues}.md` — dual-read consumers of the island (Slice D).
    - `skills/workflow-next-step/SKILL.md` — artifact-discovery globs made `.html`-aware; also the site of the MDX visual-plan-gate removal (Slices A + D).
    - Plugin-metadata surface (`plugin.yaml`, generated `plugin.json`, `marketplace.json`, README, CHANGELOG) — component-count + version reconciliation.
    - `tests/published-surface.test.ts`, `tests/workflow-next-step-skill.test.ts` — surface pins that currently enforce the MDX system.
    - Build/copy seam `src/targets/claude.ts` (`copyCommandReferenceDocs` `:132–138`) — no change required (verified below).
  - **Notes:** this is the correct home because the contract, the design DNA, and the create logic all change for the *same reason* (how artifacts are composed and read) and are reused by any future doc-generating command. The command prompts and the `tests/` suite change for *different* reasons and stay in their existing homes; this artifact keeps that split honest.
- **Scrapped home (Slice A):** the June MDX visual-artifact system (`agents/workflow/local-visual-artifact-renderer.md`, `commands/visual-artifact.md`, `commands/workflows/references/{local-visual-artifacts,agent-native-plan-style}.md`, and the `workflow-next-step` visual-plan gate) is **removed**, not deprecated. Per `CONTEXT.md`: use "scrap/remove," never "supersede/deprecate."

## Module Blueprint for Implementation

| Module | Feature home | Contains | Why this arrangement |
|--------|--------------|----------|----------------------|
| **Island contract** | `references/html-artifacts/island-contract.md` + canonical reference impl in `tests/` (or a spec-only `src/` util) | fixed-core schema v1, open-extension region, serialization primitive spec (`JSON.stringify` → escape `<`,`>`,`&`,U+2028/U+2029), inverse extraction, **field-coverage map** | This is the spine. It is authored **first** (Slice B) so the schema is built *to* the coverage map, not reverse-engineered. The reference impl lives in tests as the spec and is **never shipped** in an artifact — keeps the dependency-free invariant. |
| **Design DNA library** | `references/html-artifacts/{primitives-catalog,gallery-manifest,archetypes/,recipes/}.md/.html` | invariant primitives; one-line-per-entry manifest (`id, family, type, tags[], intent, path`); full HTML exemplars for the 4 plan-composing archetypes; recipe sheets for the long tail | Additive **content**, not architectural branching. The manifest is the only file read on *every* generation; tag-driven selective retrieval loads a handful of exemplars/recipes per generation, so breadth stays cheap. |
| **Composer skill (create)** | `skills/html-artifact-composer/SKILL.md` | classify → select/compose/draft-bespoke → **project** HTML from island; island-first order; the one hard rule; invariant enforcement; `render_meta` write | The single writer of artifacts. Depends on the island contract; nothing depends on the composer's internals — only on the island it produces. |
| **Island-extraction helper (read)** | `references/html-artifacts/island-extraction-helper.md` | prose contract: locate `#artifact-data` script, take `textContent`, `JSON.parse`, read fixed-core fields, **never scrape rendered HTML** | Prose, not a runnable module — downstream agents `Read` files and cannot execute JS, so a runnable helper would be uninvokable. One authorized reader spec, included by every consumer. |
| **Dual-read wiring (read, temporary)** | inline in `commands/workflows/{work,review,to-issues}.md` + `skills/workflow-next-step/SKILL.md` | per-file extension detection (`.md` → legacy frontmatter+sections; `.html` → island via the helper) | Feature-local branch in each consumer, not a shared abstraction — the branch is small, and it is **designed to be deleted** once migration completes (v2). Extracting it now would be a premature shared module. |

## Shared / Global Decisions

| Candidate | Keep in feature home / Move to shared | Why (DRY, SOLID, reason-to-change) |
|-----------|----------------------------------------|-----|
| Fixed-core island schema + serialization primitive | **Shared/global** (the `html-artifacts` contract) | Three consumer *classes* already rely on identical behavior: the composer (writer), the downstream commands (prose readers), and the inline exporters (runtime readers). That is the extraction rule's first trigger — multiple homes depend on one stable behavior. |
| Island-extraction-helper prose | **Shared/global** (one reference, included by all readers) | Single reason to change (how the contract is read). Duplicating it per consumer would drift the four readers apart — exactly the DRY hazard the helper exists to prevent. |
| Primitives catalog + token layer + gallery manifest | **Shared/global** | Design DNA reusable by any future doc-generating command; reason to change is cross-feature (design system), not `plan`-specific. |
| **Per-command island field set** (the specific fields `plan` needs) | **Feature-local to the command** | The `plan` field set changes when the `plan` contract changes — a `plan`-specific reason. Only the *fixed-core* fields downstream requires are shared; command-specific fields must **not** migrate into the shared core (see Drift Checks). |
| Dual-read extension branch | **Feature-local, temporary** | Not cross-feature infrastructure; a compatibility shim with a sunset. A little local duplication across three files is cheaper than a shared abstraction that must then be un-abstracted at cutover. |

## Deepening Candidates

Only areas that genuinely need more treatment before execution hardening:

- **Island schema shape + fixed-core field list (highest leverage).** The island is the artifact's **entire content model** — all prose sections rendered as structured data, not the frontmatter lifted into JSON. So the schema is broad, heterogeneous, and mostly-optional. Model it as a **discriminated union keyed on `kind`**, with field strictness driven by *consumption*, not by whether the datum was legacy frontmatter or body:
  - **Tier 1 — Envelope** (shared across every kind, strict, versioned): `schema_version`, `kind`, `title`, `type`, `date`, `status`, `refs{brainstorm_ref, architecture_ref, tickets_ref, source_docs}`, `render_meta`. The extraction helper reads this first to route any artifact regardless of kind.
  - **Tier 2 — Contract core** (per-kind, strict; downstream *acts* on these): for `plan` — `execution_shape`, `tdd`, `runtime_stack`, `constitution`, `slices[]` (each packet's `id, feature_home, scope, scope_fence, files, depends_on, dependency_type, acceptance_criteria, test_command`), `success_criteria[]` as `{id, statement, verification}` (semi-structured because `SC*` ids are cross-referenced — it earns strictness by being consumed).
  - **Tier 3 — Content/prose** (per-kind, loose rich-text slots; rendered, never parsed): `problem_narrative`, `user_story`, `architectural_context`, `specified_scope_contract`, `references`, narrative bodies — block content / markdown, not a strict grammar. Breadth lives here and is cheap because nothing machine-reads it.
  - **Tier 4 — Open extension** (`ext{}`): whatever a bespoke layout surfaces; machines ignore it, it renders richly, it keeps island backing.

  **Required set = envelope (all) + the field-coverage map's enumerated contract core.** Optionality is scoped per-kind (`constitution_version: null`, `source_docs.figma: []`, `tickets_ref: null` are legitimately absent); the contract stays strong because the *required* set is enumerated, not because everything is present. **v1 scope discipline:** fully define only the **envelope + `plan` kind**; reserve `kind`/`schema_version` so v2 kinds (`brainstorm`/`architecture`/`deepen-plan`) slot in without touching v1 readers — do **not** build the multi-kind registry now. The "dedicated schema definition" is the `island-contract.md` prose spec + the L2 coverage assertion + (optionally) a JSON Schema used *only by the test*, never shipped/validated at runtime in the artifact. This pin must land before Slice C; if wrong it forces rework of both the composer and every reader.
- **The L3 equivalence *oracle*.** "Equivalent ticket set and equivalent execution" needs an operational definition before Slice D: is equivalence set-equality on ticket ids/scope, semantic match, or human-judged? The plan rightly flags a suspiciously-all-green run as itself a finding — so the comparison method must be concrete enough that a false green is detectable. Currently underspecified.
- **Malformed / missing-island failure behavior.** The plan specifies the happy path (parse the island) but not the degenerate path: what does a downstream consumer do when an `.html` artifact has a missing, truncated, or non-`JSON.parse`-able island? Fail loud, fall back to `.md`, or skip? This is a real contract edge and should be decided in `/deepen-plan`, not discovered in `/workflows:work`.
- **`render_meta` shape (pin now, even though unused in v1).** It is recorded-but-unread in v1. Fixing its schema now (archetype id(s) + design/token seed) is near-free and avoids a v2 migration of already-generated artifacts. Deepen the *shape*, not the *reader*.

## Deletion Test

| Candidate | Keep / Delete / Delay | Why (user story, scope, complexity) |
|-----------|-----------------------|-----|
| Island-mutation skill (update capability) | **Delay to v2** | v1 is create + read only. No v1 consumer mutates an island. Adding it now is unused structure. |
| `deepen-plan` reading/enriching `plan.html` | **Delay to v2** | Out of the pilot's create→read→prove arc; `deepen-plan` stays `.md`-only for v1. |
| Programmatic/build-time HTML shell (Approach B) | **Delay behind a measurement trigger** | Deterministic rendering caps creativity and drags a runtime step into pure-prompt commands. Only revisit if post-pilot audits show the composer drops island facts too often. Do not build now. |
| Converting brainstorm/architecture/deepen-plan to HTML | **Delay to v2** | Pilot proves the contract on the hardest case (`plan`) first. |
| Full system-wide `.md`-ref sweep | **Delay to v2** | v1 migrates only **plan-pointing** refs. Tickets/todos/sessions/solutions/`CONTEXT.md`/config stay markdown by design (plaintext-native working docs — converting them is scope creep and loses git-diff/grep value for no benefit). |
| **`render_meta` recorded in v1** | **Keep (writer only)** | Survives deletion test: it is a near-free *data field*, not an abstraction or branch, and writing it avoids a v2 data migration. The *reader* of it is correctly deferred. |
| **Broad recipe-sheet gallery in v1** | **Keep** | Survives as **content**, not complexity: no new branching/coupling. Diverse exemplars widen the composer's design vocabulary (SC7), plans are multi-archetype, and tag-driven selective retrieval bounds per-generation cost. Kept cheap: full exemplars only for the 4 plan-composing archetypes; the long tail is recipe sheets. |
| Legacy `.md` parser support | **Keep for v1** | The dual-read window is what keeps the mixed MD→HTML chain safe during the pilot. Dropping it is a post-migration deletion. |

## Interfaces as Test Surfaces

- **Interface: the JSON island** (the machine contract, read via the envelope + per-`kind` contract core).
  - Callers/tests rely on: the shared envelope is present on every artifact; the `plan`-kind contract core (Tier 2) is present, `JSON.parse`-able, and matches the field-coverage map; downstream reads *only* the envelope + contract core, never Tier-3 prose or Tier-4 extension.
  - Must not leak: HTML layout, prose ordering, class names, presentation — none of it is contract; and no per-kind field leaks up into the shared envelope.
  - Evidence needed later: **L2** field-coverage assertion (a slot for every enumerated legacy element in the required set) + structural asserts over the committed `plan.html` fixture.
- **Interface: the serialization primitive** (`serialize`/`extract`).
  - Callers/tests rely on: `extract(serialize(x)) === x` **byte-for-byte**, including hostile payloads (`</script>`, `</SCRIPT >`, `<!--`, `&`, quotes, U+2028/U+2029).
  - Must not leak: any dependence on JSON string context — escaping `<` must defuse breakout regardless.
  - Evidence needed later: **L1** deterministic round-trip; the spec in `island-contract.md` must match the tested reference impl exactly.
- **Interface: the downstream equivalence contract** (the real product promise of SC3).
  - Callers/tests rely on: `to-issues` + `work` produce equivalent tickets/execution whether fed a `.md` or `.html` plan.
  - Must not leak: which artifact format produced the input — the reader path must be invisible downstream of the helper.
  - Evidence needed later: **L3** end-to-end pilot equivalence gate over real commands/artifacts — no in-process seam, no mocked island, no softened assertion.
- **Interface: the export round-trip** (SC4).
  - Callers/tests rely on: the inline exporter JS is the **symmetric inverse** of the serializer (copy-as-JSON reproduces the island).
  - Evidence needed later: structural assert that exporters are present + inverse-of-serializer.

## Seams, Adapters, and Contracts

- **Seam: island serialization** — the one *mandatory deterministic* seam in an otherwise model-driven system.
  - **Adapter:** the escaping primitive (`JSON.stringify` then escape `<`,`>`,`&`,U+2028/U+2029) + its inverse. Inline JS + a shared prose helper + a test-suite reference impl — never a shipped runnable module.
  - **Contract:** byte-identical round-trip; a plan quoting `</script>` can never truncate the machine contract. **Stability class: permanent, versioned.**
- **Seam: dual-read (`.md` vs `.html`)** — where the reader path varies by file extension.
  - **Adapter:** the island-extraction helper (`.html` path) vs the legacy frontmatter+sections parser (`.md` path).
  - **Contract:** both paths yield the same fixed-core fields. **Stability class: temporary — this seam is designed to be deleted** at full migration (v2). A healthy seam with a sunset, not permanent infrastructure.
- **Seam: composer projection** — where creative layout is *expected* to vary artifact-to-artifact.
  - **Adapter:** None (prose rule + composer self-check pass, not a translation layer).
  - **Contract:** island-first generation; **every decision-bearing fact in the HTML traces to an island field; facts flow island→HTML only; the HTML may add unlimited presentation but never a fact absent from the island.**
- **Seam: build copy + sanitize** (`copyCommandReferenceDocs` → `sanitizeMarkdownTreeForTarget`).
  - **Adapter:** `copyDir` (recursive, format-agnostic) then a sanitizer.
  - **Contract:** **`.html` exemplars pass through untouched.** **Verified:** `src/utils/target-content.ts:135` guards with `if (path.extname(filePath) !== ".md") continue`, so the sanitizer skips every non-`.md` file. **No build-side change is required.** The plan's flagged risk downgrades from a design risk to a one-line post-build regression guard (diff a fixture exemplar in Slice C).

## Design-It-Twice (the one high-leverage boundary)

The plan already resolved this; recording it so downstream does not re-litigate it and so the *reason* survives.

- **Option A — HTML as sidecar, Markdown canonical.** Two files, weaker round-trip, lowest downstream-breakage risk. **Rejected:** violates "single source of truth"; reintroduces a second maintained file.
- **Option B — Island-primary, HTML-projected (chosen).** One `.html` file whose `#artifact-data` island *is* the artifact; the HTML is a pure projection. Downstream reads only the island, so a human editing rendered prose can never corrupt the contract, and drift into downstream is *structurally impossible*.
- **Chosen for now: Option B.** It is the only model where "single source of truth," "zero contract loss," and "no drift" are simultaneously true. This is the spine every other decision hangs off; changing it invalidates the whole feature. (A secondary design-it-twice — model-as-projector vs deterministic renderer, and broad-vs-minimal gallery — is likewise resolved in the brainstorm and captured under Deletion Test; not re-opened here.)

## Context Tiers

- **Global context** (every downstream phase needs these): dependency-free single-file HTML is a **hard invariant**; **edit portable source first**; the `CLAUDE.md` component-update checklist (counts across four sites + version bump + `bun run build:platforms` + README/CHANGELOG + `/release-docs` + `jq` validation); stick to the official plugin spec (no custom marketplace fields); **island-is-truth / facts flow island→HTML only**; no `docs/constitution.md` exists, so plan-level TDD/evidence defaults apply.
- **On-demand context** (load when deepening or building, not into every ticket): this architecture artifact; the brainstorm; `CONTEXT.md` glossary; `references/html-artifacts/{island-contract, primitives-catalog, gallery-manifest, island-extraction-helper}`; the vertical-slice + execution-shape contracts; `docs/solutions/plugin-versioning-requirements.md`.
- **Ticket-local context** (the minimum packet per execution unit — each plan slice already carries this): its named feature home, the exact files, the scope fence, the single success/acceptance criterion, the one evidence/test command, and concise WHY linkage. A slice should not need the full plan to execute — the island contract (Slice B) is the only cross-slice dependency that must be resolved first.

## Review Depth

- **Depth used:** lightweight.
- **Why this depth:** the plan is already architecturally tight — explicit feature homes, scope fences, a three-layer verification gate, and a brainstorm that resolved every open question. The escalation triggers do not clear the bar: the island-primary model is a well-established pattern (not genuinely novel), blast radius is bounded to the plugin's prompt/skill/reference surface behind a dependency-free invariant and a dual-read safety window (nothing breaks mid-rollout), the one real shared extraction (the island contract) is already cleanly named and owned, and no boundary ownership is disputed. Running `architecture-strategist` + `uncle-bob` + `document-review` would add ceremony without proportional value. The single high-leverage boundary (the island contract) is instead elevated here via Design-It-Twice and the deepening candidates.

## Recommendations for `/deepen-plan`

- **Pin the fixed-core island schema first.** Turn the field-coverage map into an explicit, enumerated field list with a named island home for every legacy frontmatter key *and* every downstream-consumed section. Slice C must not start until this is locked. This is the highest-leverage deepening target.
- **Define the L3 equivalence oracle operationally.** State exactly how "equivalent ticket set / equivalent execution" is compared, and how a false-green over a half-built composer is caught. Without this, L3 can pass vacuously.
- **Decide malformed/missing-island behavior** as a first-class contract edge (fail-loud vs fallback vs skip) and add a deterministic test for it alongside L1/L2.
- **Fix the `render_meta` schema now** (writer-only) so v2 re-projection has a stable shape and no artifact migration is needed later.
- **Do not deepen deferred v2 items** (mutation skill, Approach B, other-artifact conversion, full ref sweep) — deepening them would re-inflate scope the plan deliberately cut.

## Recommendations for `/workflows:work`

- **Slice B before Slice C, always.** The composer is built *to* the pinned island contract; building it against an unpinned schema guarantees rework.
- **Preserve the hard rule in the composer:** every decision-bearing fact in the HTML traces to an island field; presentation may vary without limit, facts may not. Mold-breaking content goes in the open-extension region with island backing — never as HTML-only prose.
- **Keep the reference impl spec-only.** The serialize/extract reference implementation lives in the test suite (or a spec `src/` util) and is **never** imported into a shipped artifact — the dependency-free invariant is non-negotiable.
- **Downstream reads the island only** via the extraction helper; never scrape rendered HTML in `work`/`review`/`to-issues`/`workflow-next-step`.
- **Add the build regression guard, not a build change:** after `bun run build:platforms`, diff a fixture `.html` exemplar to confirm the sanitizer left it byte-identical (the seam is already safe — this just proves it stays safe).
- **Reconcile the surface exactly where the plan says:** per-slice count flips in `tests/published-surface.test.ts` (MDX removal → 38 agents / 27 commands; composer skill +1), and the **single** version bump + consolidated CHANGELOG + `/release-docs` happen once, in Slice D.

## Recommendations for `/workflows:review`

- Verify **no downstream consumer scrapes rendered HTML** — every read goes through the island-extraction helper against `#artifact-data`.
- Verify the **serialization spec in `island-contract.md` matches the tested reference impl exactly** (drift between spec and impl is a contract lie).
- Verify **no `.html` artifact carries a fact absent from its island** (audit the fixture against its island).
- Verify **no new npm/runtime dependency** entered the shipped artifact path and that the artifact is genuinely single-file (SC2 structural assert: no external `http(s)` `src`/`href`/`@import`/`url()`).
- Verify **per-command island fields did not leak into the shared fixed-core**, and that the dual-read branch stays feature-local (not prematurely extracted into a shared module).
- Verify **MDX removal is complete** — `grep -ri "visual-artifact\|local-visual\|agent-native-plan-style" portable/ tests/ plugins/` returns only intentional absence-assertions.
- Verify **counts match `find` across all four sites** and JSON validates (`jq .`).

## Drift Checks

Treat as architectural drift unless explicitly justified:

- A decision-bearing **fact rendered in the HTML that is absent from the island** (breaks island-is-truth).
- Any downstream consumer **parsing rendered HTML** instead of the island via the helper.
- A **second maintained `.md` mirror** creeping back alongside the `.html` (the sidecar model was rejected).
- The **gallery loaded wholesale** into a generation instead of via the manifest + tag-driven selective retrieval (breaks the breadth-stays-cheap invariant).
- **Per-command island fields migrating into the shared fixed-core** (the core is only what *all* readers require).
- The **dual-read branch hardening into permanent shared infrastructure** instead of staying a deletable compatibility shim.
- A **runnable serialize/extract module shipped inside an artifact** (breaks dependency-free).
- **`.md`-refs migrated beyond plan-pointing refs** in v1 (the sweep is discriminating; tickets/todos/sessions/solutions/config stay markdown).

## Open Questions

- **L3 equivalence oracle:** what precise comparison defines "equivalent" ticket set + execution, and how is a false-green detected? (Resolve in `/deepen-plan`.)
- **Malformed/missing-island failure mode:** fail-loud, fall back to `.md`, or skip? (Resolve in `/deepen-plan`; add a deterministic test.)
