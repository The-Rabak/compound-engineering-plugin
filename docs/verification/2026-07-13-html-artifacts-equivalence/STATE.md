# HTML-Artifacts Equivalence Verification — Live-Chain Run (2026-07-13)

Executes **todo 021, Option 1**: re-run each equivalence chain as a live agent session and commit
durable, re-checkable evidence — replacing the prior prose-only (v1 L3/L4) and throwaway-script
(v2 unit-02) evidence that the todo flagged as non-reproducible.

**Fixtures (matched arms, committed under `tests/fixtures/html-artifacts/`):**
`representative-{plan,brainstorm,architecture}.html` ↔ `frozen-premigration-{plan,brainstorm,architecture}.md`
— all encode the same hypothetical "CSV Export" feature.

**Method.** Live subagent sessions followed the real command / skill / helper prompts against the
committed fixtures. Deterministic island extraction / mutation / serialization used the **one
sanctioned reference impl** (`tests/support/island-spec.ts`, unit-tested by the L1/L2 suite). The
v2 content-mutation **re-projection was performed by a genuine fresh subagent** — the exact
mechanism the prior run faked with an in-process script. Every PASS below is traceable to
live-observed state or a re-runnable script in this directory, never to summary prose.

## Results

| Chain | Verdict | Evidence | Key result |
|---|---|---|---|
| v1 **L3** — `to-issues` plan `.html` vs `.md` | **PASS** | `L3-to-issues-equivalence.md` + `run-l3-diff.ts` | Both arms floor-pass (3 tickets ≥ 3 slices, all scope-fence/AC non-empty); cross-arm `diffs: []` over 10 packet fields × 3 tickets + ticket-id set + dependency edges + batch partition; `success_criteria.{id,statement}` strict-match; ref-normalizer proven non-trivial. Only the pre-accepted verification-prose diff (Finding A) noted, non-blocking. |
| v1 **L4** — malformed-island fail-loud | **PASS** | `L4-malformed-island-drill.md` (+ 4 corrupted copies, `run-extraction.ts`) | All four taxonomy codes reproduced with literal diagnostics: `INVALID_JSON`, `MISSING_ISLAND`, `EMPTY_ISLAND`, `MISSING_REQUIRED_FIELD` — each with artifact path + exact message; no partial-proceed, no HTML scrape, no `.md` fallback. |
| v2 **deepen-plan** — content mutation + fresh re-projection + scalar back-writes | **PASS** | `v2-deepen-plan-mutation.md`, `reprojected-plan-after-mutation.html` | Content class → a **genuine fresh subagent** re-projected only `#architectural-context` from the mutated island, reusing `render_meta` (byte-identical); `status` badge patched in place (`active`→`deepened`); `refs.tickets_ref` `null`→value routed to the Related-Artifacts fallback (not a no-op). Island: 16 required keys intact, only the 3 mutated fields changed, every other field byte-identical. |
| v2 **architecture** — downstream `.html` read | **PASS** | `v2-architecture-read.md` | All 19 architecture fixed-core keys present both arms; correct 3-key `handoff` shape; zero structured-field divergence (only benign Tier-3 prose formatting). `work.md`'s architecture branch reads the same set fact-for-fact. |
| v2 **brainstorm** — `.html` as plan/grill input | **FAIL** | `v2-brainstorm-grill.md` | The `.html` island's `architectural_context` holds only the lead sentence; the `.md` arm additionally carries **six structured "Architectural Context Map" facts** (feature home `src/reporting/`, interactions, user entry point, data flow, dependencies, shared/global notes) with **no home in the island** (`ext` is `{}`). A downstream `plan`/grill consumer reading the `.html` brainstorm gets materially less architectural detail → real SC3 gap. **Tracked as todo 029.** |

## Go / No-Go

- **v1 pilot gate (L3 + L4): GO** — plan `.html`↔`.md` equivalence and fail-loud both re-affirmed
  from live-observed, re-runnable state (`bun run .../run-l3-diff.ts` → floors pass, `diffs: []`).
- **v2 chains: GO for deepen-plan + architecture; NO-GO for brainstorm** until todo 029 resolves the
  `architectural_context` coverage gap (fixture under-capture vs composer projection limit — to be
  determined).

## The fresh-subagent re-projection (the previously-faked piece)

The prior v2 unit-02 evidence rested on a throwaway `deepen-plan-real-chain.ts` that re-implemented
`mutateContent`/`mutateScalarField` in-process and **never dispatched a live subagent** — so SC2's
single riskiest novel behavior (a fresh subagent re-projecting the affected view via recorded
`render_meta`) was never exercised. This run performs it for real: after the deterministic island
mutation, a **fresh subagent** (dispatch recorded in `v2-deepen-plan-mutation.md`) loaded the
composer SKILL in re-projection mode and re-rendered only `#architectural-context` from the mutated
island, reusing the exact `archetypes`/`design_seed`. Orchestrator independently verified: island
round-trips losslessly (16 keys, `render_meta` byte-identical), design stable, only the mutated
section changed, `\uXXXX` island escapes literal, committed fixture untouched.

## Reproduce

```
bun run docs/verification/2026-07-13-html-artifacts-equivalence/run-l3-diff.ts   # L3: floors pass, diffs []
bun run docs/verification/2026-07-13-html-artifacts-equivalence/run-extraction.ts # L4: literal fail-loud codes
bun test                                                                          # full contract suite: 291 pass / 0 fail
```

Evidence location is **non-gitignored** (`docs/execution-sessions/`, `docs/plans/`,
`docs/brainstorms/` are gitignored; `docs/verification/` is tracked) so this evidence is durable and
committed, per the todo's requirement.
