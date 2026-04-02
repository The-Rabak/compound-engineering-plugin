# Copilot Agent Instructions

You are operating inside a development environment with persistent
context management powered by **OpenViking**.

## Bootstrap (ALWAYS run this first)

Before responding to any project-related question, execute:

```bash
source ~/.copilot-skills/ov-core.sh
ov_ensure_running
ov_brief
```

This gives you the project name, indexed resources, registered skills,
and all persisted memories from previous sessions.

## Loaded Skills

You have access to these skills. Follow their rules:

1. **Context Manager** (`~/.copilot-skills/skills/ov-context-manager.md`)
   Retrieve, store, and update project context in OpenViking.

2. **Session Memory** (`~/.copilot-skills/skills/ov-memory.md`)
   Persist important information across sessions.

3. **Skills Registry** (`~/.copilot-skills/skills/ov-skills-registry.md`)
   Manage reusable instruction sets per project.

4. **Project Awareness** (`~/.copilot-skills/skills/ov-project-awareness.md`)
   Dynamic project detection from working directory.


	5. **Global Context** (`~/.copilot-skills/skills/ov-global-context.md`)
	   Load agent definitions and skills from the global cross-project
	   library. **When the user names a specific agent or skill in their
	   prompt, always load it from the global index before proceeding.**
	
	## Global Agent & Skill Resolution
	
	You do NOT have autocomplete access to the user's full library of
	agents and skills — they are not physically in the project directory.
	Instead, they are indexed in OpenViking's global store and loaded
	dynamically.
	
	**At session start**, `ov_brief` lists all available global agents and
	skills by name. When the user references one:
	
	```bash
	# User says: "use my code-reviewer agent"
	source ~/.copilot-skills/ov-core.sh
	AGENT_DEF=$(ov_load_global_agent "code-reviewer")
	# Now follow the instructions in $AGENT_DEF
```
## Core Workflow

## Core Workflow

```text
Session Start
  │
  ├─→ source ov-core.sh
  ├─→ ov_ensure_running
  ├─→ ov_brief              ← project context + memories + GLOBAL LIST
  │
  ├─→ User references a global agent/skill by name
  │     ├─→ ov_load_global_agent / ov_load_global_skill
  │     └─→ Follow loaded instructions for the task
  │
  ├─→ User asks project question
  │     ├─→ ov_search        ← project scope first
  │     ├─→ ov_search_global ← broaden if project scope misses
  │     ├─→ Answer using retrieved context
  │     └─→ ov_remember      ← persist key takeaways
  │
  ├─→ User creates a new reusable agent/skill
  │     └─→ ov_register_global_agent / ov_register_global_skill
  │
  └─→ Session end
        └─→ ov_remember "session-summary" "..."
```

## Rules of Engagement

1. **Retrieve before you respond.** If a question is about the
   codebase, search the context DB first.
2. **Remember what matters.** After significant exchanges, persist
   key takeaways.
3. **Refresh after mutations.** If you modified files, refresh the
   index.
4. **Never hardcode the project name.** It comes from `$OV_PROJECT`.
5. **Prefer scoped searches.** Search within `$OV_PROJECT_URI` before
   broadening.
6. **Be token-efficient.** Use `ov_search` (snippets) over `ov_read`
   (full files) unless you explicitly need the whole file.
7. **Offer to create skills.** When the user teaches you a repeatable
   process, offer to register it.
