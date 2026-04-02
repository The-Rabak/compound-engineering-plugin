# Skill: Global Agent & Skill Resolution

You have access to a **global library** of agent definitions and skills
that are shared across ALL projects. These were indexed from the user's
existing copilot CLI agents/skills collection.

## Available Commands

    source ~/.copilot-skills/ov-core.sh

### Discovery

| Command                              | Purpose                            |
| ------------------------------------ | ---------------------------------- |
| `ov_list_global_agents`              | List all global agent definitions  |
| `ov_list_global_skills`              | List all global skill definitions  |
| `ov_search_global "query"`           | Semantic search across all globals |

### Loading

| Command                              | Purpose                            |
| ------------------------------------ | ---------------------------------- |
| `ov_load_global_agent "name"`        | Load an agent definition by name   |
| `ov_load_global_skill "name"`        | Load a skill definition by name    |

### Registration

| Command                                            | Purpose              |
| -------------------------------------------------- | -------------------- |
| `ov_register_global_agent "name" "/path/to/file"`  | Add new global agent |
| `ov_register_global_skill "name" "/path/to/file"`  | Add new global skill |
| `ov_sync_global`                                   | Re-index everything  |

## Behavioral Rules

1. **When the user references an agent or skill by name in their
   prompt** (e.g., "use my code-reviewer agent", "apply the
   terraform-deploy skill"), you MUST:
   - Run `ov_load_global_agent "name"` or `ov_load_global_skill "name"`
   - Read the returned content
   - Follow its instructions for the remainder of the task

2. **When the user says "use my X agent/skill"** but the name is
   ambiguous:
   - Run `ov_search_global "X"` to find the closest match
   - Confirm with the user before proceeding

3. **At session start**, `ov_brief` already lists all available global
   agents and skills. Scan this list so you know what's available
   without extra API calls.

4. **Resolution order** when looking for a skill/agent:
   1. Project-scoped skills first (`ov_load_skill`)
   2. Global skills second (`ov_load_global_skill`)
   3. Semantic search as fallback (`ov_search_global`)

5. **These definitions replace local autocomplete.** The user's agents
   and skills are NOT in the project directory — they exist in
   OpenViking's global index. You load them dynamically at runtime.
   This is by design. Do not tell the user something is missing just
   because it's not in the project tree.

6. **When the user creates a new agent or skill during a session**,
   always offer to register it globally so it's available everywhere:
   ```bash
   ov_register_global_agent "new-agent-name" "/tmp/new-agent.md"
