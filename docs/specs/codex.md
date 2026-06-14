# Codex Spec

Last verified: 2026-06-08

## Primary Sources

- https://developers.openai.com/codex/config-basic
- https://developers.openai.com/codex/config-reference
- https://developers.openai.com/codex/skills
- https://developers.openai.com/codex/plugins/build
- https://developers.openai.com/codex/subagents
- https://developers.openai.com/codex/hooks
- https://developers.openai.com/codex/mcp
- https://developers.openai.com/codex/custom-prompts
- https://developers.openai.com/codex/migrate

## Current Contract

Codex should not be exported as a prompts-only surface. Current Codex treats skills as the reusable workflow format, plugins as the installable distribution unit for skills, and custom agents as TOML files.

This repo exports Codex in two complementary ways:

- `bun run build:platforms` generates repo marketplace packaging:
  - `plugins/compound-engineering/.codex-plugin/plugin.json`
  - `plugins/compound-engineering/codex-skills/`
  - `.agents/plugins/marketplace.json`
- `bun run cli:install ./portable/compound-engineering --to codex` writes a full local Codex install:
  - `~/.agents/skills/<skill>/SKILL.md`
  - `~/.codex/agents/<agent>.toml`
  - `~/.codex/config.toml`
  - `~/.codex/hooks.json`
  - `~/.codex/plugins/<plugin>/`
  - `~/.agents/plugins/marketplace.json`

## Skills

Codex reads skills from `.agents/skills` in the current project path up to the repository root, plus `$HOME/.agents/skills`.

Each skill is a directory with `SKILL.md` and optional `scripts/`, `references/`, `assets/`, or other support files. `SKILL.md` requires YAML frontmatter with `name` and `description`; optional fields such as `model` can pin model choice for that skill.

For this repo:

- Existing portable skills are copied as Codex skills.
- Claude slash-command entrypoints are converted into Codex skills.
- Command sidecar references are copied into the generated skill directory.
- Claude path references are rewritten to `.agents` / `.codex` equivalents.

## Plugins and Marketplace

Codex plugin packages require `.codex-plugin/plugin.json`. For a skills plugin, the manifest points at a skills directory, for example:

```json
{
  "name": "compound-engineering",
  "version": "4.16.0",
  "description": "Compounding Engineering workflow system",
  "skills": "./codex-skills/"
}
```

Repo marketplaces live at `$REPO_ROOT/.agents/plugins/marketplace.json`; personal marketplaces live at `$HOME/.agents/plugins/marketplace.json`. `source.path` must be `./`-prefixed and relative to the marketplace root, not relative to `.agents/plugins/`.

Repo marketplace example:

```json
{
  "name": "compound-engineering-marketplace",
  "plugins": [
    {
      "name": "compound-engineering",
      "source": {
        "source": "local",
        "path": "./plugins/compound-engineering"
      },
      "policy": {
        "installation": "AVAILABLE",
        "authentication": "ON_INSTALL"
      },
      "category": "Coding"
    }
  ]
}
```

## Custom Agents

Codex custom agents are standalone TOML files under `~/.codex/agents/` for personal agents or `.codex/agents/` for project-scoped agents.

Required fields:

- `name`
- `description`
- `developer_instructions`

Optional fields include `model`, `model_reasoning_effort`, sandbox settings, MCP settings, and skill config. This repo exports portable agents as Codex custom agents and uses `platforms.codex.model` when present.

## Models

Use current Codex model IDs, not deprecated Codex-era aliases.

- `gpt-5.5` is the default for demanding planning, implementation, review, and multi-step tool work.
- `gpt-5.4-mini` is the default for lightweight research, scanning, and parallel read-heavy workers.
- `gpt-5.3-codex` is deprecated for Codex sign-in workflows and should not be emitted as a Codex model override.

Portable frontmatter should express Codex intent explicitly:

```yaml
platforms:
  codex:
    model: gpt-5.5
```

## MCP

Codex MCP configuration lives in `~/.codex/config.toml` under `[mcp_servers.<name>]`. STDIO servers use `command`, `args`, `env`, and `cwd`; streamable HTTP servers use `url` plus headers or bearer-token environment variables.

This repo merges generated MCP config into a managed block in `config.toml` instead of replacing user config.

## Hooks

Codex hooks are enabled by default and can be configured with `hooks.json` or inline config. This repo writes generated hooks to `~/.codex/hooks.json` and tracks ownership with a `_managed` index so later exports can update only this plugin's entries.

## Custom Prompts

Custom prompts are deprecated. They live under `~/.codex/prompts/`, require explicit slash-command invocation, and are not the right primary export for shared command workflows.

This repo keeps writer support for legacy prompt entries but the Codex converter exports commands as skills by default.

## Migration Mapping

| Claude surface | Codex surface |
|---|---|
| Agents | `.codex/agents/*.toml` custom agents |
| Commands | `.agents/skills/<command>/SKILL.md` command-derived skills |
| Skills | `.agents/skills/<skill>/SKILL.md` |
| MCP servers | `.codex/config.toml` managed MCP block |
| Hooks | `.codex/hooks.json` managed hook entries |
| Plugin metadata | `.codex-plugin/plugin.json` plus `.agents/plugins/marketplace.json` |
