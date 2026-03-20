---
name: agent-native-architecture
description: >-
  Build applications where agents are first-class citizens. Use this skill when designing autonomous agents, creating
  MCP tools, implementing self-modifying systems, or building apps where features are outcomes achieved by agents
  operating in a loop.
---

## Goal
Design applications where agents are first-class actors that achieve outcomes by using tools in a loop until completion.

## Use this skill when
- Designing autonomous systems or agent-native products.
- Creating MCP tools, agent runtimes, or self-modifying workflows.
- Refactoring an existing product so the agent can do what the UI can do.
- Reviewing whether an architecture is truly agent-native.

## Do not use this skill when
- You only need a traditional request-response feature with no agent loop.
- The agent is acting only as a router to hardcoded workflows.
- You plan to encode judgment inside workflow-shaped tools instead of primitives.

## Operating rules
1. Preserve parity. Whatever the user can do through the UI, the agent must be able to achieve through tools or tool composition.
2. Prefer granularity. Keep tools atomic. Define features as outcomes in prompts, not as choreographed code paths.
3. Preserve composability. New features should be addable by writing prompts, not by adding new code every time.
4. Expect emergent capability. Let users ask for outcomes you did not explicitly pre-build, then observe the patterns.
5. Improve over time through accumulated context, prompt refinement, and explicit safety rails for advanced self-modification.
- Give every entity full CRUD.
- Use explicit completion signals such as `complete_task`; do not rely on heuristics.
- Keep agent and user in a shared workspace.
- Maintain a `context.md` or equivalent knowledge file when persistent context matters.
- Inject available resources, available capabilities, and runtime state into the system prompt.

## Procedure / Reference
### Start with the core tests
- Parity test: pick any UI action and describe it to the agent. If it cannot achieve the outcome, add or expose the missing primitives.
- Granularity test: if changing behavior requires refactoring code instead of editing prose, the tool layer is too coarse.
- Composability test: add one new feature by writing a new prompt section only.
- Emergent capability test: ask for an open-ended domain task the product team did not explicitly design.
- Improvement-over-time test: confirm the app becomes more useful after a month of use even without shipping code.

### Maintain a capability map
| User Action | How Agent Achieves It |
|-------------|----------------------|
| Create a note | `write_file` to notes directory, or `create_note` tool |
| Tag a note as urgent | `update_file` metadata, or `tag_note` tool |
| Search notes | `search_files` or `search_notes` tool |
| Delete a note | `delete_file` or `delete_note` tool |

### Architecture review checklist
- Parity: every UI action has a corresponding agent capability.
- Granularity: tools are primitives; features are prompt-defined outcomes.
- Composability: new features can be added via prompts alone.
- Emergent capability: the agent can handle open-ended requests in-domain.
- Dynamic vs static API access: use discovery patterns where full API access is needed.
- CRUD completeness: every entity supports create, read, update, and delete.
- Shared workspace: agent and user operate on the same underlying data.
- `context.md` pattern: agent reads and updates a shared context file.
- Completion signals: use explicit completion tools.
- Partial completion: store progress for resume.
- Context limits: design for bounded context from the start.
- UI reflection: agent changes must show up in the UI immediately.

### Quick start
```typescript
const tools = [
  tool("read_file", "Read any file", { path: z.string() }, ...),
  tool("write_file", "Write any file", { path: z.string(), content: z.string() }, ...),
  tool("list_files", "List directory", { path: z.string() }, ...),
  tool("complete_task", "Signal task completion", { summary: z.string() }, ...),
];
```

```markdown
## Your Responsibilities
When asked to organize content, you should:
1. Read existing files to understand the structure
2. Analyze what organization makes sense
3. Create/move files using your tools
4. Use your judgment about layout and formatting
5. Call complete_task when you're done

You decide the structure. Make it good.
```

```typescript
const result = await agent.run({
  prompt: userMessage,
  tools: tools,
  systemPrompt: systemPrompt,
});
```

### Keep these anti-patterns out
- Agent as router.
- Build the app first, then bolt on an agent with no parity.
- Request/response thinking with no loop.
- Defensive tool design that over-constrains legitimate behavior.
- Workflow-shaped tools that encode judgment.
- Heuristic completion detection.
- Static tool mapping for dynamic APIs when discovery would work better.
- Incomplete CRUD.
- Sandbox isolation between user and agent workspaces.

### Reference files
- [references/architecture-patterns.md](./references/architecture-patterns.md)
- [references/files-universal-interface.md](./references/files-universal-interface.md)
- [references/shared-workspace-architecture.md](./references/shared-workspace-architecture.md)
- [references/mcp-tool-design.md](./references/mcp-tool-design.md)
- [references/from-primitives-to-domain-tools.md](./references/from-primitives-to-domain-tools.md)
- [references/agent-execution-patterns.md](./references/agent-execution-patterns.md)
- [references/system-prompt-design.md](./references/system-prompt-design.md)
- [references/dynamic-context-injection.md](./references/dynamic-context-injection.md)
- [references/action-parity-discipline.md](./references/action-parity-discipline.md)
- [references/product-implications.md](./references/product-implications.md)
- [references/mobile-patterns.md](./references/mobile-patterns.md)
- [references/self-modification.md](./references/self-modification.md)
- [references/agent-native-testing.md](./references/agent-native-testing.md)
- [references/refactoring-to-prompt-native.md](./references/refactoring-to-prompt-native.md)
