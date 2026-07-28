# Cursor Spec (Rules, Commands, Skills, Agents, MCP)

Last verified: 2026-07-28

## Primary sources

```
https://docs.cursor.com/context/rules
https://docs.cursor.com/context/rules-for-ai
https://docs.cursor.com/customize/model-context-protocol
```

## Config locations

| Scope | Path |
|-------|------|
| Project rules | `.cursor/rules/*.mdc` |
| Project commands | `.cursor/commands/*.md` |
| Project skills | `.cursor/skills/*/SKILL.md` |
| Project agents | `.cursor/agents/*.md` |
| Project MCP | `.cursor/mcp.json` |
| Project CLI permissions | `.cursor/cli.json` |
| Global agents | `~/.cursor/agents/*.md` |
| Global commands | `~/.cursor/commands/*.md` |
| Global skills | `~/.cursor/skills/*/SKILL.md` |
| Global MCP | `~/.cursor/mcp.json` |
| Global CLI config | `~/.cursor/cli-config.json` |
| Legacy rules | `.cursorrules` (deprecated) |

## Compound Engineering export

Install/convert target: `cursor` (second-class, explicit-only).

```bash
bun run cli:install ./portable/compound-engineering --to cursor
# or
bun run convert ./portable/compound-engineering --to cursor
```

Default output root: `~/.cursor` (override with `--cursor-home`).

| Portable source | Cursor output |
|-----------------|---------------|
| Agents | `~/.cursor/agents/<name>.md` |
| Commands | `~/.cursor/commands/<name>.md` |
| Skills | `~/.cursor/skills/<name>/SKILL.md` |
| MCP servers | merged into `~/.cursor/mcp.json` |
| Hooks | skipped (unsupported) |

### Model routing

Content sanitization remaps Claude-grade model IDs:

| Grade | Cursor model ID |
|-------|-----------------|
| Opus | `cursor-grok-4.5-high` |
| Sonnet | `gpt-5.6-terra-high` |
| Haiku | `composer-2.5` |

`composer-2.5` is the non-fast Composer ID (high-quality default). Fast variant is `composer-2.5-fast` and is not used by this export.

## Agents (subagents)

- User-scoped agents live in `~/.cursor/agents/`; project agents live in `.cursor/agents/`.
- Each agent is a Markdown file with YAML frontmatter (`name`, `description`, optional `model`) and a markdown body used as the system prompt.
- When multiple agents share a name, project agents take priority over user agents.

## Rules (.mdc files)

- Rules are Markdown files with the `.mdc` extension stored in `.cursor/rules/`.
- Each rule has YAML frontmatter with three fields: `description`, `globs`, `alwaysApply`.
- Rules have four activation types based on frontmatter configuration:

| Type | `alwaysApply` | `globs` | `description` | Behavior |
|------|:---:|:---:|:---:|---|
| Always | `true` | ignored | optional | Included in every conversation |
| Auto Attached | `false` | set | optional | Included when matching files are in context |
| Agent Requested | `false` | empty | set | AI decides based on description relevance |
| Manual | `false` | empty | empty | Only included via `@rule-name` mention |

- Precedence: Team Rules > Project Rules > User Rules > Legacy `.cursorrules` > `AGENTS.md`.
- The compound-engineering Cursor export maps portable agents to Cursor agents, not rules.

## Commands (slash commands)

- Custom commands are Markdown files stored in `.cursor/commands/`.
- Commands are plain markdown with no YAML frontmatter support.
- The filename (without `.md`) becomes the command name.
- Commands are invoked by typing `/` in the chat UI.
- Commands support parameterized arguments via `$1`, `$2`, etc.
- Portable namespaced commands (`workflows:plan`) export as hyphenated filenames (`workflows-plan`).

## Skills (Agent Skills)

- Skills follow the open SKILL.md standard, identical to Claude Code and Codex.
- A skill is a folder containing `SKILL.md` plus optional `scripts/`, `references/`, and `assets/`.
- `SKILL.md` uses YAML frontmatter with required `name` and `description` fields.
- Skills can be repo-scoped in `.cursor/skills/` or user-scoped in `~/.cursor/skills/`.
- At startup, only each skill's name/description is loaded; full content is injected on invocation.

## MCP (Model Context Protocol)

- MCP configuration lives in `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global).
- Each server is configured under the `mcpServers` key.
- STDIO servers support `command` (required), `args`, and `env`.
- Remote servers support `url` (required) and optional `headers`.
- Cursor infers transport type from whether `command` or `url` is present.

Example:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "package-name"],
      "env": { "KEY": "value" }
    }
  }
}
```

## CLI (cursor-agent)

- Cursor CLI launched August 2025 as `cursor-agent`.
- Supports interactive mode, headless mode (`-p`), and cloud agents.
- Reads `.cursor/rules/`, `.cursorrules`, and `AGENTS.md` for instructions.
- CLI permissions controlled via `.cursor/cli.json` with allow/deny lists.
- Permission tokens: `Shell(command)`, `Read(path)`, `Write(path)`, `Delete(path)`, `Grep(path)`, `LS(path)`.
