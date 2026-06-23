# Local Visual Artifact Contract

Use this reference when a finalized workflow artifact should gain an optional visual review surface without replacing the canonical Markdown file.

## Core Rules

- Canonical Markdown artifacts remain the source of truth.
- Visual artifacts are optional sidecars created only after the source artifact is finalized.
- Lite mode still presents the visual follow-up option when the parent workflow supports it.
- Generated files live under `docs/visual-artifacts/<workflow>/<slug>/`.
- Expected local files are `plan.mdx`, optional `canvas.mdx`, optional `prototype.mdx`, and `.plan-state.json`.
- `.plan-state.json` must include `localOnly: true`.
- `.plan-url` is a local bridge/token file and must never be committed.
- Raw upstream `visual-plan` and `visual-recap` skills are not vendored in this iteration because their default guidance is hosted-first.

## Hosted Behavior Ban

Hosted MCP tools are forbidden for this workflow. Do not configure a hosted Plan MCP server, do not write to a Plan database, and do not offer share, publish, visibility, or hosted comment flows.

Forbidden hosted tools:

- `create-visual-plan`
- `create-visual-recap`
- `update-visual-plan`
- `patch-visual-plan-source`
- `import-visual-plan-source`
- `export-visual-plan`
- `set-resource-visibility`

Also forbid equivalent share/publish/update flows even if a future tool has a different name. The plugin manifest must not add an `mcpServers` entry named `plan`.

## Source-Loyal MDX Rules

- Read the source artifact first.
- Preserve the decisions, constraints, risks, non-goals, and evidence expectations already present in the source artifact.
- Do not create a new plan, recap, architecture, or review conclusion while rendering the visual artifact.
- Label inferred visuals as inferred.
- Prefer grounded file paths, workflow phases, acceptance criteria, and evidence commands over decorative visuals.
- Do not mutate the source artifact unless the parent workflow explicitly owns a metadata update.

## License And Package Gate

- `BuilderIO/skills` is MIT, but raw upstream skill vendoring is out of scope for this iteration.
- `@agent-native/core` may be invoked only as a pinned local CLI helper after the exact package version and transitive dependency set satisfy the approved license policy.
- Until that approval is recorded, examples must use `<approved-version>` instead of a concrete version.
- Do not use floating package tags.

## Local Validation And Viewing

Static sanity check:

```bash
npx @agent-native/core@<approved-version> plan local check --dir docs/visual-artifacts/<workflow>/<slug>
```

Static preview for visual plans:

```bash
npx @agent-native/core@<approved-version> plan local preview --dir docs/visual-artifacts/<workflow>/<slug> --kind plan --out docs/visual-artifacts/<workflow>/<slug>/preview.html
```

Interactive local viewing requires a local Plan viewer that is already running. Use a localhost URL only:

```bash
npx @agent-native/core@<approved-version> plan local serve --dir docs/visual-artifacts/<workflow>/<slug> --kind plan --app-url http://127.0.0.1:<port> --open
```

Review recaps use recap kind:

```bash
npx @agent-native/core@<approved-version> plan local serve --dir docs/visual-artifacts/review/<slug> --kind recap --app-url http://127.0.0.1:<port> --open
```

## Workflow Template Profiles

### brainstorm

Use for finalized brainstorm artifacts. Include:

- problem narrative
- user story
- success criteria
- chosen approach
- accepted constraints and non-goals
- key decisions
- open questions

Visuals should clarify the decision space and selected direction, not invent implementation scope.

### plan

Use for finalized implementation plans. Include:

- execution shape
- slices, infrastructure packets, or fix items
- file map
- scope fences
- evidence commands
- risks and mitigations

Visuals should make sequencing, ownership, and validation easier to review.

### architecture

Use for finalized architecture handoffs. Include:

- module blueprint
- feature homes
- shared/global boundaries
- diagrams
- deletion-test notes
- seams, adapters, and interfaces as test surfaces

Visuals should preserve the architecture artifact's boundary decisions.

### review

Use for finalized review artifacts or a reviewable diff summary. Render this as `kind: recap`. Include:

- file tree
- key diffs or findings
- architecture and contract movement
- evidence gaps
- follow-up todos

Visuals should help reviewers understand the change shape before reading raw diffs. Do not create PR comments, hosted links, or shareable review pages.
