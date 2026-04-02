# Skill: OpenViking Session Memory

You can persist and recall memories across sessions for the current
project. Memories survive terminal restarts and are searchable.

## Available Commands

    source ~/.copilot-skills/ov-core.sh

| Command                              | Purpose                          |
| ------------------------------------ | -------------------------------- |
| `ov_remember "key" "value"`          | Store a named memory             |
| `ov_recall "key"`                    | Retrieve a specific memory       |
| `ov_recall_all`                      | Dump all memories for project    |
| `ov_forget "key"`                    | Delete a memory                  |
| `ov_search "query" "$OV_MEMORY_URI"` | Semantic search over memories    |

## What to Remember

Proactively store these whenever they come up in conversation:

- **Architecture decisions**: "We chose PostgreSQL over MongoDB
  because..."
- **Environment quirks**: "The staging server requires VPN access
  via..."
- **User preferences**: "User prefers functional style, no classes"
- **Task state**: "TODO: refactor auth middleware after v2 ships"
- **Debugging context**: "The CORS issue was caused by the nginx
  proxy, not the app"
- **External dependencies**: "We depend on Stripe API v2023-10-16,
  do NOT upgrade"
- **Conventions**: "All API routes use kebab-case, all DB columns
  use snake_case"

## Behavioral Rules

1. **After every significant exchange**: Ask yourself "Is there
   anything here worth remembering for next session?" If yes,
   `ov_remember` it.
2. **At session start**: Run `ov_recall_all` to reload context from
   previous sessions.
3. **Memory keys should be descriptive**: Use keys like
   `auth-architecture`, `deploy-process`, `user-preferences` — not
   `note1`, `tmp`.
4. **Update, don't duplicate**: If a memory key already exists and the
   information has changed, overwrite it with `ov_remember` using the
   same key.
5. **Summarize, don't dump**: Memory values should be concise
   summaries, not full conversation logs.
