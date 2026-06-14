# OpenViking Setup Examples

This directory contains sanitized reference copies of local OpenViking bootstrap assets used with this repository.

## Purpose

These files show how to wire Copilot CLI sessions into OpenViking in a way that matches this repository workflow:

- bootstrap OV before project work
- load project and global context
- refresh OV after meaningful changes
- keep user-local helper files out of git

They are examples, not canonical runtime source for your machine.

## Included Material

- `copilot-skills/ov-core.sh` -- shell helper library for OV bootstrap, search, sync, and global registry helpers
- `copilot-skills/ov-init.sh` -- one-shot project bootstrap helper
- `copilot-skills/skills/` -- supporting OV skill and instruction documents
- `copilot/copilot-instructions.md` -- top-level Copilot instructions that reference the OV bootstrap flow

## Privacy Review

These copies were reviewed before being added.

Kept:

- generic localhost defaults such as `127.0.0.1:1933`
- generic home-relative paths such as `~/.copilot-skills/` and `~/.openviking/.api_key`
- helper logic and shell commands

Excluded:

- concrete API key values
- machine-specific absolute paths
- user-specific names, emails, or private repository values

## How To Use With This Repo

1. Copy these examples into local `~/.copilot-skills/` and `~/.copilot/` locations if you want to bootstrap a similar OV workflow.
2. In a Copilot session, run:

```bash
source ~/.copilot-skills/ov-core.sh
ov_ensure_running
ov_brief
```

3. Refresh the OV global index for this repo with:

```bash
bun run sync:ov
```

4. Keep local-only files ignored:

```gitignore
.copilot-instructions.md
compound-engineering.local.md
.worktrees/
docs/execution-sessions/
```

## Repository Notes

- This repo intentionally commits generated Claude outputs under `plugins/compound-engineering/` and `.claude-plugin/marketplace.json`. Generated Copilot and Codex export assets are explicit-only and ignored.
- This repo should not commit workflow scratch output such as `docs/execution-sessions/`.
- `portable/compound-engineering/` remains the only hand-edited source of truth for plugin content.
