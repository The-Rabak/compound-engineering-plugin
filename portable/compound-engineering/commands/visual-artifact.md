---
name: visual-artifact
description: Render or serve a local visual artifact from only its artifact path
argument-hint: "[artifact path] [--serve] [--port 3001]"
platforms:
  codex:
    model: gpt-5.5

---

# Visual Artifact

Render or serve a local visual artifact folder created by `local-visual-artifact-renderer`. The user only needs to pass the artifact path; this command fills `--dir`, `--kind`, `--out`, and local `--app-url` flags.

## Inputs

<artifact_args> #$ARGUMENTS </artifact_args>

Expected first argument:

```text
docs/visual-artifacts/<workflow>/<slug>
```

The first argument may also point at a file inside that folder. If the path points to `plan.mdx`, `canvas.mdx`, `prototype.mdx`, or `preview.html`, use its parent directory as `<artifact-dir>`.

Optional flags:

- `--serve` -- use the local Plan viewer bridge instead of static preview.
- `--port <port>` -- localhost port for `--serve`; default to `3001`.

## Workflow

1. Validate the artifact path.
   - Require a non-empty path.
   - Normalize file paths to their parent directory when they point to a known artifact file.
   - Reject paths outside `docs/visual-artifacts/`.
   - Require the directory to contain `plan.mdx` or `.plan-state.json`.

2. Infer render kind.
   - Prefer `.plan-state.json.visualKind` when present.
   - Otherwise infer from the workflow path segment: review -> `recap`; everything else -> `plan`.
   - Do not ask the user for `--kind`.

3. Resolve the approved local CLI version.
   - Read `commands/workflows/references/local-visual-artifacts.md`.
   - If an exact approved `@agent-native/core@x.y.z` version is recorded there or in `.plan-state.json.agentNativeCoreVersion`, use it.
   - If only `@agent-native/core@<approved-version>` is present, stop before running commands and report the exact command shape with `<approved-version>`. Do not use `@latest`.

4. Run or report the filled command.
   - Default behavior runs check, then static preview.
   - `--serve` runs the localhost viewer bridge.
   - Do not write `.plan-url`.

## Filled Commands

Default path-only render:

```bash
npx @agent-native/core@<approved-version> plan local check --dir <artifact-dir>
npx @agent-native/core@<approved-version> plan local preview --dir <artifact-dir> --kind <inferred-kind> --out <artifact-dir>/preview.html
```

Local viewer bridge with `--serve`:

```bash
npx @agent-native/core@<approved-version> plan local serve --dir <artifact-dir> --kind <inferred-kind> --app-url http://127.0.0.1:<port> --open
```

## Guardrails

- Keep this wrapper local-only.
- Do not configure hosted Plan MCP.
- Do not call hosted Plan tools.
- Do not use floating package tags.
- Reject non-localhost `--app-url`; this command always fills `--app-url http://127.0.0.1:<port>` itself.
- Do not publish, share, update visibility, or create hosted comments.

## Report

Return:

- artifact directory
- inferred kind
- mode: `check+preview` or `serve`
- command run or blocked command shape
- output file path when preview succeeds
- whether the approved-version gate blocked execution
