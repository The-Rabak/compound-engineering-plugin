# Skill: OpenViking Skills Registry

You can register, list, and load reusable skill definitions that are
scoped per project. Skills are markdown instruction sets that can be
loaded into any agent's context on demand.

## Available Commands

    source ~/.copilot-skills/ov-core.sh

| Command                                     | Purpose                    |
| ------------------------------------------- | -------------------------- |
| `ov_register_skill "name" "/path/to/file"`  | Register a skill           |
| `ov_list_skills`                             | List project skills        |
| `ov_load_skill "name"`                       | Load a skill's content     |
| `ov_search "query" "$OV_SKILLS_URI"`         | Search across skills       |

## When to Use

- **User says "remember how to do X"**: Create a skill for it.
- **Repetitive multi-step procedures**: Codify as a skill.
- **Project-specific conventions**: Store as a skill so all agents
  follow them.

## Skill File Format

Skills should be markdown files with this structure:

    # Skill: <Name>

    ## When to Activate
    <conditions under which this skill applies>

    ## Instructions
    <step by step instructions>

    ## Examples
    <concrete usage examples>

## Behavioral Rules

1. **Before starting a complex task**: Check `ov_list_skills` to see if
   there's already a skill for it.
2. **After teaching you a new procedure**: Offer to register it as a
   skill so it persists.
3. **Skills are composable**: One skill can reference others by name.
   Load multiple skills when a task requires it.
