# Skill: OpenViking Context Manager

You have access to a local OpenViking context database via shell
commands. The current project is dynamically detected from the working
directory.

## Available Commands

Source the library first in any shell block:

    source ~/.copilot-skills/ov-core.sh

### Retrieval

| Command                          | Purpose                              |
| -------------------------------- | ------------------------------------ |
| `ov_search "query"`              | Semantic search, scoped to project   |
| `ov_search "query" "uri" N`     | Search a specific URI, return N hits |
| `ov_grep "pattern"`              | Literal grep within project context  |
| `ov_ls`                          | List all indexed resources           |
| `ov_tree 3`                      | Tree view, depth 3                   |
| `ov_read "viking://..."`         | Read a specific indexed file         |
| `ov_brief`                       | Full project context summary         |

### Storage

| Command                          | Purpose                              |
| -------------------------------- | ------------------------------------ |
| `ov_add_local "./path"`          | Index a local file or directory      |
| `ov_add_url "https://..."`       | Index a URL (repo, docs, page)       |
| `ov_add_text "name" "content"`   | Index raw text as a named resource   |
| `ov_note "name" "content"`       | Save a persistent project note       |

### Updates

| Command                          | Purpose                              |
| -------------------------------- | ------------------------------------ |
| `ov_refresh`                     | Re-index all project resources       |
| `ov_refresh "viking://..."`      | Re-index a specific resource         |
| `ov_remove "viking://..."`       | Remove a resource from the DB        |
| `ov_sync`                        | Full re-index of project root        |

## Behavioral Rules

1. **At session start**: Run `ov_brief` to load project context before
   answering any project-specific question.
2. **Before answering a question about the codebase**: Run `ov_search`
   with a natural language query. Do NOT guess — retrieve first.
3. **After making significant changes**: Run `ov_refresh` so the context
   DB reflects the new state of the code.
4. **When the user shares new context** (architecture decisions, API
   docs, etc.): Store it with `ov_note` so it persists across sessions.
5. **Scope matters**: Always search within the current project URI first.
   Only broaden to `viking://resources/` if project-scoped search
   returns nothing useful.
6. **Token budget**: Prefer `ov_search` (returns ranked snippets) over
   `ov_read` (returns full files). Only use `ov_read` when you need
   the complete file content.
