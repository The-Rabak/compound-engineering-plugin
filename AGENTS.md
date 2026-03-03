# Agent Instructions

This repository is a Claude Code plugin marketplace distributing the compound-engineering plugin -- AI-powered development tools that get smarter with every use.

## Working Agreement

- **Branching:** Create a feature branch for any non-trivial change. If already on the correct branch for the task, keep using it; do not create additional branches or worktrees unless explicitly requested.
- **Safety:** Do not delete or overwrite user data. Avoid destructive commands.
- **ASCII-first:** Use ASCII unless the file already contains Unicode.

## Repository Structure

```
compound-engineering-plugin/
├── .claude-plugin/marketplace.json   # Marketplace catalog
├── plugins/compound-engineering/     # The plugin
│   ├── .claude-plugin/plugin.json
│   ├── agents/                       # Specialized AI agents
│   ├── commands/                     # Slash commands
│   ├── skills/                       # Skills
│   ├── hooks/                        # Hooks
│   └── mcp-servers/                  # MCP servers
└── docs/                             # Documentation site
```

## Component Update Checklist

When adding/removing agents, commands, or skills:

1. Update `plugins/compound-engineering/.claude-plugin/plugin.json` -- version + description counts
2. Update `.claude-plugin/marketplace.json` -- version + description counts
3. Update `plugins/compound-engineering/README.md` -- component tables
4. Update `plugins/compound-engineering/CHANGELOG.md` -- document changes
5. Validate JSON: `cat .claude-plugin/marketplace.json | jq .`

## Docs Directory Convention

All workflows write output to `{project_root}/docs/`:
- `docs/plans/` -- implementation plans
- `docs/brainstorms/` -- brainstorm documents
- `docs/solutions/` -- compounded learnings (DO NOT gitignore)
- `docs/execution-sessions/` -- work session logs