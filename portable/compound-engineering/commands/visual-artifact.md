---
name: visual-artifact
description: Render or serve a local visual artifact from only its artifact path
argument-hint: "[artifact path] [--serve] [--port 3001]"
platforms:
  codex:
    model:
---

# Visual Artifact

Render or serve a local visual artifact folder created by `local-visual-artifact-renderer`. The user only needs to pass the artifact path; this command fills `--dir`, `--kind`, `--out`, and local viewer flags.

## Inputs

<artifact_args> #$ARGUMENTS </artifact_args>

Expected first argument:

```text
docs/visual-artifacts/<workflow>/<slug>
```

The first argument may also point at a file inside that folder. If the path points to `plan.mdx`, `canvas.mdx`, `prototype.mdx`, or `preview.html`, use its parent directory as `<artifact-dir>`.

Optional flags:

- `--serve` -- use the local Plan bridge against a local Plan UI instead of static preview.
- `--port <port>` -- wrapper-level local Plan UI port for `--serve`; default exactly to `3001`.

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

3. Resolve the pinned local CLI version.
   - Read `commands/workflows/references/local-visual-artifacts.md`.
   - Use the plugin-pinned `@agent-native/core@0.67.0`.
   - If `.plan-state.json.agentNativeCoreVersion` exists and differs from `0.67.0`, warn about the mismatch and continue with the plugin-pinned version.
   - Do not use `@latest`.

4. Resolve serve settings when `--serve` is present.
   - Set `DEFAULT_LOCAL_PLAN_APP_PORT = 3001`.
   - If no `--port` was supplied, use exactly `3001`; never use `30001`.
   - Validate the wrapper-level local Plan UI port as an integer from `1` to `65535`.
   - Map the wrapper-level port only into `--app-url http://127.0.0.1:<port>`.
   - Do not pass the wrapper-level port to the CLI `--port` flag; the CLI `--port` controls the localhost bridge port, not the Plan UI port.
   - Treat an existing `.plan-url` as stale local bridge state unless it was produced by the current successful `serve` command.

5. Run or report the filled command.
   - Default behavior runs check, then static preview.
   - `--serve` first checks that `http://127.0.0.1:<port>` is already reachable as a local Plan UI.
   - If the local Plan UI is not reachable, do not run `serve`, do not write `.plan-url`, and report the default static preview command as the fallback.
   - This wrapper does not start the local Plan UI; it only starts the local artifact bridge after the UI is reachable.

## Filled Commands

Default path-only render:

```bash
npx @agent-native/core@0.67.0 plan local check --dir <artifact-dir>
npx @agent-native/core@0.67.0 plan local preview --dir <artifact-dir> --kind <inferred-kind> --out <artifact-dir>/preview.html
```

Local viewer bridge with `--serve`:

```bash
npx @agent-native/core@0.67.0 plan local serve --dir <artifact-dir> --kind <inferred-kind> --app-url http://127.0.0.1:<port> --open
```

## Guardrails

- Keep this wrapper local-only.
- Do not configure hosted Plan MCP.
- Do not call hosted Plan tools.
- Do not use floating package tags.
- Reject non-localhost `--app-url`; this command always fills `--app-url http://127.0.0.1:<port>` itself.
- Never infer `30001` from the default; the default local Plan UI port is exactly `3001`.
- Do not run `serve` when the local Plan UI origin is down, because that creates a dead `.plan-url`.
- Do not publish, share, update visibility, or create hosted comments.

## Report

Return:

- artifact directory
- inferred kind
- mode: `check+preview` or `serve`
- command run or blocked command shape
- output file path when preview succeeds
- whether `.plan-state.json` had a version mismatch
- local Plan UI port and reachability when `--serve` is requested
