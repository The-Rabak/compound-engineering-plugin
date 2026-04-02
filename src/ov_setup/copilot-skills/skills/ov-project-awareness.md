# Skill: Dynamic Project Awareness

The current project is ALWAYS determined by the working directory at
the time copilot is invoked. Never hardcode project names.

## How It Works

    source ~/.copilot-skills/ov-core.sh
    echo $OV_PROJECT       # e.g., "my-api-server"
    echo $OV_PROJECT_URI   # e.g., "viking://resources/my-api-server"
    echo $OV_MEMORY_URI    # e.g., "viking://memories/my-api-server"
    echo $OV_SKILLS_URI    # e.g., "viking://skills/my-api-server"

## Detection Logic

1. Walk up from `pwd` looking for `.git/`, `package.json`,
   `Cargo.toml`, `pyproject.toml`, or `go.mod`.
2. Use the name of that root directory as the project name.
3. If no marker is found, fall back to `basename $(pwd)`.

## Override

Set `OV_PROJECT` before sourcing to override detection:

    OV_PROJECT="custom-name" source ~/.copilot-skills/ov-core.sh

## Behavioral Rules

1. **Never assume the project name.** Always let `ov_detect_project`
   determine it.
2. **If you're unsure which project context you're in**, run
   `echo $OV_PROJECT` and confirm with the user.
3. **When working across multiple projects**, remind the user to `cd`
   into the correct root before running commands, or explicitly set
   `OV_PROJECT`.
4. **All ov commands are project-scoped by default.** This means
   searching in project A will NOT return results from project B
   unless you explicitly pass a broader URI.
