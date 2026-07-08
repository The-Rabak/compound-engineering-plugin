# Shared Orchestration Protocol

This reference is consumed by the core workflow prompts so template loading, named-agent dispatch, and downstream handoff rules stay aligned instead of drifting across commands.

## Reference Template Loading

Use this before loading any workflow prompt template from `commands/workflows/references/*.md`.

1. Use the platform's file-search tool against the workflow reference directory to look for `<template-name>.md`. Search the directory, not a full path embedded in the pattern argument.
2. Use the file-read tool to load the full template.
3. Before continuing, quote the first non-empty line of the loaded template and record which file you used.
4. If you cannot quote the template because it was not found or could not be read, stop execution, raise the missing-template issue, and do not continue.
5. Fill placeholders from the loaded template. Do not reconstruct the prompt from memory.

## Named Agent Dispatch

Use this before every `Task(...)` call that names an agent.

1. Use the platform's file-search tool against the bundled agent directory to look for `<agent-name>.md`. Search the directory, not a full path embedded in the pattern argument.
2. If the bundled agent file exists, read only the metadata/header needed to verify `name`, `model`, and the first body heading when the platform supports partial reads. Do not read the full agent body just to dispatch it.
3. Only if no bundled agent file can be located, fall back to OpenViking/global context with `ov_load_global_agent "<agent-name>"`.
4. Before dispatching, quote the resolved source path plus the `name` and `model` metadata you verified.
5. Resolve the concrete subagent identifier from the verified source before dispatching:
   - For this Claude plugin, agents under `agents/<category>/<agent-name>.md` are plugin-scoped as `compound-engineering:<category>:<agent-name>`.
   - For project or user agents outside the plugin, use the verified agent's `name` frontmatter.
   - If multiple agents could match, use the scoped identifier or stop and report the ambiguity.
6. Dispatch the resolved subagent itself. Do not paste the agent file body into the delegated prompt; the subagent file is its system prompt. Pass only the workflow-specific payload and resolved handoff blocks.
7. If you cannot verify the agent source and metadata, stop execution, raise the missing-agent issue, and do not dispatch.

Never dispatch a named agent by name alone.

## Delegated Handoff Requirements

When a workflow has already resolved context, pass the resolved blocks as the delegated payload instead of rebuilding them from memory or appending agent template bodies.

- **WHY context** — problem narrative, user story, success criteria, and task/phase purpose.
- **Architecture handoff** — artifact path or explicit fallback contract, plus deletion-test, interface, seam, adapter, and contract guidance when relevant.
- **TDD/evidence expectations** — the resolved execution mode, required evidence, and any approved exceptions.
- **Workflow-specific payload** — diff content, task requirements, file lists, research scope, review mode, or other concrete inputs the receiving agent needs.
