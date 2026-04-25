import { describe, expect, test } from "bun:test"
import path from "path"
import { loadClaudePlugin } from "../src/parsers/claude"
import { loadPortablePlugin } from "../src/parsers/portable"
import { convertClaudeToCopilot } from "../src/converters/claude-to-copilot"
import { convertClaudeToOpenCode, transformContentForOpenCode } from "../src/converters/claude-to-opencode"
import { parseFrontmatter } from "../src/utils/frontmatter"
import type { ClaudePlugin } from "../src/types/claude"

const fixtureRoot = path.join(import.meta.dir, "fixtures", "sample-plugin")
const portableFixtureRoot = path.join(import.meta.dir, "fixtures", "sample-portable-plugin")

describe("convertClaudeToOpenCode", () => {
  test("maps commands, permissions, and agents", async () => {
    const plugin = await loadClaudePlugin(fixtureRoot)
    const bundle = convertClaudeToOpenCode(plugin, {
      agentMode: "subagent",
      inferTemperature: false,
      permissions: "from-commands",
    })

    expect(bundle.commandFiles.find((f) => f.name === "workflows:review")).toBeDefined()
    expect(bundle.commandFiles.find((f) => f.name === "plan_review")).toBeDefined()

    const permission = bundle.config.permission as Record<string, string | Record<string, string>>
    expect(Object.keys(permission).sort()).toEqual([
      "bash",
      "edit",
      "glob",
      "grep",
      "list",
      "patch",
      "question",
      "read",
      "skill",
      "task",
      "todoread",
      "todowrite",
      "webfetch",
      "write",
    ])
    expect(permission.edit).toBe("allow")
    expect(permission.write).toBe("allow")
    const bashPermission = permission.bash as Record<string, string>
    expect(bashPermission["ls *"]).toBe("allow")
    expect(bashPermission["git *"]).toBe("allow")
    expect(permission.webfetch).toBe("allow")

    const readPermission = permission.read as Record<string, string>
    expect(readPermission["*"]).toBe("deny")
    expect(readPermission[".env"]).toBe("allow")

    expect(permission.question).toBe("allow")
    expect(permission.todowrite).toBe("allow")
    expect(permission.todoread).toBe("allow")

    const agentFile = bundle.agents.find((agent) => agent.name === "repo-research-analyst")
    expect(agentFile).toBeDefined()
    const parsed = parseFrontmatter(agentFile!.content)
    expect(parsed.data.mode).toBe("subagent")
  })

  test("normalizes models and infers temperature", async () => {
    const plugin = await loadClaudePlugin(fixtureRoot)
    const bundle = convertClaudeToOpenCode(plugin, {
      agentMode: "subagent",
      inferTemperature: true,
      permissions: "none",
    })

    const securityAgent = bundle.agents.find((agent) => agent.name === "security-sentinel")
    expect(securityAgent).toBeDefined()
    const parsed = parseFrontmatter(securityAgent!.content)
    expect(parsed.data.model).toBe("anthropic/claude-sonnet-4-20250514")
    expect(parsed.data.temperature).toBe(0.1)

    const modelCommand = bundle.commandFiles.find((f) => f.name === "workflows:work")
    expect(modelCommand).toBeDefined()
    const cmdParsed = parseFrontmatter(modelCommand!.content)
    expect(cmdParsed.data.model).toBe("openai/gpt-4o")
  })

  test("resolves bare Claude model aliases to full IDs", () => {
    const plugin: ClaudePlugin = {
      root: "/tmp/plugin",
      manifest: { name: "fixture", version: "1.0.0" },
      agents: [
        {
          name: "cheap-agent",
          description: "Agent using bare alias",
          body: "Test agent.",
          sourcePath: "/tmp/plugin/agents/cheap-agent.md",
          model: "haiku",
        },
      ],
      commands: [],
      skills: [],
    }

    const bundle = convertClaudeToOpenCode(plugin, {
      agentMode: "subagent",
      inferTemperature: false,
      permissions: "none",
    })

    const agent = bundle.agents.find((a) => a.name === "cheap-agent")
    expect(agent).toBeDefined()
    const parsed = parseFrontmatter(agent!.content)
    expect(parsed.data.model).toBe("anthropic/claude-haiku-4-5")
  })

  test("converts hooks into plugin file", async () => {
    const plugin = await loadClaudePlugin(fixtureRoot)
    const bundle = convertClaudeToOpenCode(plugin, {
      agentMode: "subagent",
      inferTemperature: false,
      permissions: "none",
    })

    const hookFile = bundle.plugins.find((file) => file.name === "converted-hooks.ts")
    expect(hookFile).toBeDefined()
    expect(hookFile!.content).toContain("\"tool.execute.before\"")
    expect(hookFile!.content).toContain("\"tool.execute.after\"")
    expect(hookFile!.content).toContain("\"session.created\"")
    expect(hookFile!.content).toContain("\"session.deleted\"")
    expect(hookFile!.content).toContain("\"session.idle\"")
    expect(hookFile!.content).toContain("\"experimental.session.compacting\"")
    expect(hookFile!.content).toContain("\"permission.requested\"")
    expect(hookFile!.content).toContain("\"permission.replied\"")
    expect(hookFile!.content).toContain("\"message.created\"")
    expect(hookFile!.content).toContain("\"message.updated\"")
    expect(hookFile!.content).toContain("echo before")
    expect(hookFile!.content).toContain("echo before two")
    expect(hookFile!.content).toContain("// timeout: 30s")
    expect(hookFile!.content).toContain("// Prompt hook for Write|Edit")
    expect(hookFile!.content).toContain("// Agent hook for Write|Edit: security-sentinel")
  })

  test("converts MCP servers", async () => {
    const plugin = await loadClaudePlugin(fixtureRoot)
    const bundle = convertClaudeToOpenCode(plugin, {
      agentMode: "subagent",
      inferTemperature: false,
      permissions: "none",
    })

    const mcp = bundle.config.mcp ?? {}
    expect(mcp["local-tooling"]).toEqual({
      type: "local",
      command: ["echo", "fixture"],
      environment: undefined,
      enabled: true,
    })
    expect(mcp.context7).toEqual({
      type: "remote",
      url: "https://mcp.context7.com/mcp",
      headers: undefined,
      enabled: true,
    })
  })

  test("permission modes set expected keys", async () => {
    const plugin = await loadClaudePlugin(fixtureRoot)
    const noneBundle = convertClaudeToOpenCode(plugin, {
      agentMode: "subagent",
      inferTemperature: false,
      permissions: "none",
    })
    expect(noneBundle.config.permission).toBeUndefined()

    const broadBundle = convertClaudeToOpenCode(plugin, {
      agentMode: "subagent",
      inferTemperature: false,
      permissions: "broad",
    })
    expect(broadBundle.config.permission).toEqual({
      read: "allow",
      write: "allow",
      edit: "allow",
      bash: "allow",
      grep: "allow",
      glob: "allow",
      list: "allow",
      webfetch: "allow",
      skill: "allow",
      patch: "allow",
      task: "allow",
      question: "allow",
      todowrite: "allow",
      todoread: "allow",
    })
  })

  test("supports primary agent mode", async () => {
    const plugin = await loadClaudePlugin(fixtureRoot)
    const bundle = convertClaudeToOpenCode(plugin, {
      agentMode: "primary",
      inferTemperature: false,
      permissions: "none",
    })

    const agentFile = bundle.agents.find((agent) => agent.name === "repo-research-analyst")
    const parsed = parseFrontmatter(agentFile!.content)
    expect(parsed.data.mode).toBe("primary")
  })

  test("excludes commands with disable-model-invocation from command map", async () => {
    const plugin = await loadClaudePlugin(fixtureRoot)
    const bundle = convertClaudeToOpenCode(plugin, {
      agentMode: "subagent",
      inferTemperature: false,
      permissions: "none",
    })

    // deploy-docs has disable-model-invocation: true, should be excluded
    expect(bundle.commandFiles.find((f) => f.name === "deploy-docs")).toBeUndefined()

    // Normal commands should still be present
    expect(bundle.commandFiles.find((f) => f.name === "workflows:review")).toBeDefined()
  })

  test("rewrites Claude path prefixes to OpenCode path prefixes", () => {
    const result = transformContentForOpenCode(
      "Read ~/.claude/agents/security-sentinel.md, .claude/skills/file-todos/SKILL.md, and .claude/plugins/converted-hooks.ts.",
    )

    expect(result).toContain("~/.config/opencode/agents/security-sentinel.md")
    expect(result).toContain(".opencode/skills/file-todos/SKILL.md")
    expect(result).toContain(".opencode/plugins/converted-hooks.ts")
    expect(result).not.toContain(".claude/")
    expect(result).not.toContain("~/.claude/")
  })

  test("rewrites OpenCode command bodies with converted Claude paths", () => {
    const plugin: ClaudePlugin = {
      root: "/tmp/plugin",
      manifest: { name: "fixture", version: "1.0.0" },
      agents: [],
      commands: [
        {
          name: "review",
          description: "Review command",
          body: "Read ~/.claude/commands/workflows/review.md and .claude/skills/file-todos/assets/todo-template.md.",
          sourcePath: "/tmp/plugin/commands/review.md",
        },
      ],
      skills: [],
    }

    const bundle = convertClaudeToOpenCode(plugin, {
      agentMode: "subagent",
      inferTemperature: false,
      permissions: "none",
    })

    const reviewCmd = bundle.commandFiles.find((f) => f.name === "review")
    expect(reviewCmd).toBeDefined()
    expect(reviewCmd!.content).toContain("~/.config/opencode/commands/workflows/review.md")
    expect(reviewCmd!.content).toContain(".opencode/skills/file-todos/assets/todo-template.md")
  })

  test("rewrites OpenCode agent bodies with converted Claude paths", () => {
    const plugin: ClaudePlugin = {
      root: "/tmp/plugin",
      manifest: { name: "fixture", version: "1.0.0" },
      agents: [
        {
          name: "test-agent",
          description: "Test agent",
          body: "Read ~/.claude/agents/security-sentinel.md and .claude/plugins/converted-hooks.ts.",
          sourcePath: "/tmp/plugin/agents/test-agent.md",
        },
      ],
      commands: [],
      skills: [],
    }

    const bundle = convertClaudeToOpenCode(plugin, {
      agentMode: "subagent",
      inferTemperature: false,
      permissions: "none",
    })

    const agentFile = bundle.agents.find((a) => a.name === "test-agent")
    expect(agentFile).toBeDefined()
    expect(agentFile!.content).toContain("~/.config/opencode/agents/security-sentinel.md")
    expect(agentFile!.content).toContain(".opencode/plugins/converted-hooks.ts")
  })

  test("rewrites bundled agent-template instructions to OpenCode paths", () => {
    const result = transformContentForOpenCode(
      "Before dispatching any named review agent below, complete this protocol:\n1. Read its bundled template from `portable/compound-engineering/agents/<agent-name>.md` when present.\n2. If the agent comes from OpenViking/global context, load it with `ov_load_global_agent \"<agent-name>\"`.\n",
    )

    expect(result).toContain("`.opencode/agents/<agent-name>.md`")
    expect(result).toContain("`~/.config/opencode/agents/<agent-name>.md`")
    expect(result).not.toContain("portable/compound-engineering/agents/")
  })

  test("rewrites Task tool pseudocode to explicit OpenCode task-tool instructions", () => {
    const result = transformContentForOpenCode(
      'Task security-sentinel(branch diff content + WHY context block)\nTask {agent-name}(branch diff content)\n- Task repo-research-analyst("Understand this area. Report: (1) existing patterns, (2) touched modules.")\n- Task read-and-extract(plan_file_paths) -> Read each `.md` file, extract structure (title, problem statement, approach).',
    )

    expect(result).toContain(
      "Use the Task tool to invoke the security-sentinel subagent with this prompt: branch diff content + WHY context block",
    )
    expect(result).toContain(
      "Use the Task tool to invoke the {agent-name} subagent with this prompt: branch diff content",
    )
    expect(result).toContain(
      '- Use the Task tool to invoke the repo-research-analyst subagent with this prompt: "Understand this area. Report: (1) existing patterns, (2) touched modules."',
    )
    expect(result).toContain(
      "- Use the Task tool to invoke the read-and-extract subagent with this prompt: plan_file_paths -> Read each `.md` file, extract structure (title, problem statement, approach).",
    )
    expect(result).not.toContain("Task security-sentinel(")
  })
})

describe("convertClaudeToCopilot", () => {
  test("prefers Copilot model overrides for generated skills", async () => {
    const plugin = await loadPortablePlugin(portableFixtureRoot)
    const bundle = convertClaudeToCopilot(plugin, {
      agentMode: "subagent",
      inferTemperature: true,
      permissions: "none",
    })

    const generatedSkill = bundle.generatedSkills.find((skill) => skill.name === "workflows-plan")
    expect(generatedSkill).toBeDefined()

    const parsed = parseFrontmatter(generatedSkill!.content)
    expect(parsed.data.model).toBe("gpt-5.4-mini")
  })

  test("uses the shared model when no Copilot override exists", () => {
    const plugin: ClaudePlugin = {
      root: "/tmp/plugin",
      manifest: { name: "fixture", version: "1.0.0" },
      agents: [],
      commands: [
        {
          name: "shared-model",
          description: "Shared model fallback",
          body: "Reuse the shared model.",
          model: "haiku",
          sourcePath: "/tmp/plugin/commands/shared-model.md",
        },
      ],
      skills: [],
    }

    const bundle = convertClaudeToCopilot(plugin, {
      agentMode: "subagent",
      inferTemperature: false,
      permissions: "none",
    })

    const generatedSkill = bundle.generatedSkills.find((skill) => skill.name === "shared-model")
    expect(generatedSkill).toBeDefined()

    const parsed = parseFrontmatter(generatedSkill!.content)
    expect(parsed.data.model).toBe("haiku")
  })

  test("converts MCP env vars using Copilot prefixes", () => {
    const plugin: ClaudePlugin = {
      root: "/tmp/plugin",
      manifest: { name: "fixture", version: "1.0.0" },
      agents: [],
      commands: [],
      skills: [],
      mcpServers: {
        local: {
          command: "echo",
          env: {
            TOKEN: "secret",
            COPILOT_MCP_READY: "set",
          },
        },
      },
    }

    const bundle = convertClaudeToCopilot(plugin, {
      agentMode: "subagent",
      inferTemperature: false,
      permissions: "none",
    })

    expect(bundle.mcpConfig).toEqual({
      local: {
        type: "local",
        command: "echo",
        tools: ["*"],
        env: {
          COPILOT_MCP_TOKEN: "secret",
          COPILOT_MCP_READY: "set",
        },
      },
    })
  })
})
