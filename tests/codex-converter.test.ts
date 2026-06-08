import { describe, expect, test } from "bun:test"
import path from "path"
import { convertClaudeToCodex } from "../src/converters/claude-to-codex"
import { parseFrontmatter } from "../src/utils/frontmatter"
import type { ClaudePlugin } from "../src/types/claude"

const fixturePlugin: ClaudePlugin = {
  root: "/tmp/plugin",
  manifest: { name: "fixture", version: "1.0.0", description: "Fixture plugin" },
  agents: [
    {
      name: "Security Reviewer",
      description: "Security-focused agent",
      capabilities: ["Threat modeling", "OWASP"],
      model: "claude-sonnet-4-6",
      codexModel: "gpt-5.5",
      body: "Focus on vulnerabilities.",
      sourcePath: "/tmp/plugin/agents/security-reviewer.md",
    },
  ],
  commands: [
    {
      name: "workflows:plan",
      description: "Planning command",
      argumentHint: "[FOCUS]",
      model: "inherit",
      codexModel: "gpt-5.5",
      allowedTools: ["Read"],
      body: "Plan the work.",
      sourcePath: "/tmp/plugin/commands/workflows/plan.md",
    },
  ],
  skills: [
    {
      name: "existing-skill",
      description: "Existing skill",
      codexModel: "gpt-5.4-mini",
      sourceDir: "/tmp/plugin/skills/existing-skill",
      skillPath: "/tmp/plugin/skills/existing-skill/SKILL.md",
    },
  ],
  hooks: undefined,
  mcpServers: {
    local: { command: "echo", args: ["hello"] },
  },
}

describe("convertClaudeToCodex", () => {
  test("converts commands to skills and agents to custom agents", () => {
    const bundle = convertClaudeToCodex(fixturePlugin, {
      agentMode: "subagent",
      inferTemperature: false,
      permissions: "none",
    })

    expect(bundle.pluginName).toBe("fixture")
    expect(bundle.pluginVersion).toBe("1.0.0")
    expect(bundle.pluginDescription).toBe("Fixture plugin")
    expect(bundle.prompts).toHaveLength(0)

    expect(bundle.skillDirs[0]?.name).toBe("existing-skill")
    expect(bundle.skillDirs[0]?.model).toBe("gpt-5.4-mini")
    expect(bundle.generatedSkills).toHaveLength(1)

    const commandSkill = bundle.generatedSkills.find((skill) => skill.name === "workflows-plan")
    expect(commandSkill).toBeDefined()
    const parsedCommandSkill = parseFrontmatter(commandSkill!.content)
    expect(parsedCommandSkill.data.name).toBe("workflows-plan")
    expect(parsedCommandSkill.data.description).toBe("Planning command")
    expect(parsedCommandSkill.data["argument-hint"]).toBe("[FOCUS]")
    expect(parsedCommandSkill.data.model).toBe("gpt-5.5")
    expect(parsedCommandSkill.body).toContain("Allowed tools")

    const agent = bundle.agents?.find((item) => item.name === "security-reviewer")
    expect(agent).toBeDefined()
    expect(agent?.description).toBe("Security-focused agent")
    expect(agent?.model).toBe("gpt-5.5")
    expect(agent?.instructions).toContain("Capabilities")
    expect(agent?.instructions).toContain("Threat modeling")
  })

  test("passes through MCP servers", () => {
    const bundle = convertClaudeToCodex(fixturePlugin, {
      agentMode: "subagent",
      inferTemperature: false,
      permissions: "none",
    })

    expect(bundle.mcpServers?.local?.command).toBe("echo")
    expect(bundle.mcpServers?.local?.args).toEqual(["hello"])
  })

  test("transforms Task agent calls to custom agent references when agents exist", () => {
    const plugin: ClaudePlugin = {
      ...fixturePlugin,
      commands: [
        {
          name: "plan",
          description: "Planning with agents",
          body: `Run these agents in parallel:

- Task repo-research-analyst(feature_description)
- Task learnings-researcher(feature_description)

Then consolidate findings.`,
          sourcePath: "/tmp/plugin/commands/plan.md",
        },
      ],
      agents: [
        {
          name: "repo-research-analyst",
          description: "Research repo",
          body: "Research.",
          sourcePath: "/tmp/plugin/agents/research/repo-research-analyst.md",
        },
        {
          name: "learnings-researcher",
          description: "Research learnings",
          body: "Research learnings.",
          sourcePath: "/tmp/plugin/agents/research/learnings-researcher.md",
        },
      ],
      skills: [],
    }

    const bundle = convertClaudeToCodex(plugin, {
      agentMode: "subagent",
      inferTemperature: false,
      permissions: "none",
    })

    const commandSkill = bundle.generatedSkills.find((s) => s.name === "plan")
    expect(commandSkill).toBeDefined()
    const parsed = parseFrontmatter(commandSkill!.content)

    expect(parsed.body).toContain("Spawn the custom agent `repo-research-analyst` with task: feature_description")
    expect(parsed.body).toContain("Spawn the custom agent `learnings-researcher` with task: feature_description")
    expect(parsed.body).not.toContain("Task repo-research-analyst")
    expect(parsed.body).not.toContain("Task learnings-researcher")
  })

  test("transforms known slash commands to skill references and preserves unknown paths", () => {
    const plugin: ClaudePlugin = {
      ...fixturePlugin,
      commands: [
        {
          name: "plan",
          description: "Planning with commands",
          body: `After planning, you can:

1. Run /deepen-plan to enhance
2. Run /plan_review for feedback
3. Start /workflows:work to implement

Don't confuse with file paths like /tmp/output.md or /dev/null.`,
          sourcePath: "/tmp/plugin/commands/plan.md",
        },
        {
          name: "deepen-plan",
          description: "Deepen plan",
          body: "Deepen.",
          sourcePath: "/tmp/plugin/commands/deepen-plan.md",
        },
        {
          name: "workflows:work",
          description: "Work",
          body: "Work.",
          sourcePath: "/tmp/plugin/commands/workflows/work.md",
        },
      ],
      agents: [],
      skills: [],
    }

    const bundle = convertClaudeToCodex(plugin, {
      agentMode: "subagent",
      inferTemperature: false,
      permissions: "none",
    })

    const commandSkill = bundle.generatedSkills.find((s) => s.name === "plan")
    expect(commandSkill).toBeDefined()
    const parsed = parseFrontmatter(commandSkill!.content)

    expect(parsed.body).toContain("$deepen-plan skill")
    expect(parsed.body).toContain("/plan_review")
    expect(parsed.body).toContain("$workflows-work skill")
    expect(parsed.body).toContain("/tmp/output.md")
    expect(parsed.body).toContain("/dev/null")
  })

  test("keeps commands with disable-model-invocation as command skills", () => {
    const plugin: ClaudePlugin = {
      ...fixturePlugin,
      commands: [
        {
          name: "normal-command",
          description: "Normal command",
          body: "Normal body.",
          sourcePath: "/tmp/plugin/commands/normal.md",
        },
        {
          name: "disabled-command",
          description: "Disabled command",
          disableModelInvocation: true,
          body: "Disabled body.",
          sourcePath: "/tmp/plugin/commands/disabled.md",
        },
      ],
      agents: [],
      skills: [],
    }

    const bundle = convertClaudeToCodex(plugin, {
      agentMode: "subagent",
      inferTemperature: false,
      permissions: "none",
    })

    expect(bundle.prompts).toHaveLength(0)
    expect(bundle.generatedSkills.some((skill) => skill.name === "normal-command")).toBe(true)
    const disabled = bundle.generatedSkills.find((skill) => skill.name === "disabled-command")
    expect(disabled).toBeDefined()
    expect(parseFrontmatter(disabled!.content).data["disable-model-invocation"]).toBe(true)
  })

  test("rewrites .claude paths in command skill bodies", () => {
    const plugin: ClaudePlugin = {
      ...fixturePlugin,
      commands: [
        {
          name: "review",
          description: "Review command",
          body: "Read ~/.claude/commands/workflows/review.md and .claude/skills/file-todos/SKILL.md.",
          sourcePath: "/tmp/plugin/commands/review.md",
        },
      ],
      agents: [],
      skills: [],
    }

    const bundle = convertClaudeToCodex(plugin, {
      agentMode: "subagent",
      inferTemperature: false,
      permissions: "none",
    })

    const commandSkill = bundle.generatedSkills.find((s) => s.name === "review")
    expect(commandSkill).toBeDefined()
    const parsed = parseFrontmatter(commandSkill!.content)

    expect(parsed.body).toContain("~/.agents/skills/workflows/review.md")
    expect(parsed.body).toContain(".agents/skills/file-todos/SKILL.md")
    expect(parsed.body).not.toContain(".claude/")
  })

  test("rewrites .claude paths in custom agent instructions", () => {
    const plugin: ClaudePlugin = {
      ...fixturePlugin,
      commands: [],
      skills: [],
      agents: [
        {
          name: "config-reader",
          description: "Reads config",
          body: "Read ~/.claude/agents/security-sentinel.md and .claude/plugins/converted-hooks.ts.",
          sourcePath: "/tmp/plugin/agents/config-reader.md",
        },
      ],
    }

    const bundle = convertClaudeToCodex(plugin, {
      agentMode: "subagent",
      inferTemperature: false,
      permissions: "none",
    })

    const agent = bundle.agents?.find((item) => item.name === "config-reader")
    expect(agent).toBeDefined()
    expect(agent?.instructions).toContain("~/.codex/agents/security-sentinel.md")
    expect(agent?.instructions).toContain(".codex/plugins/converted-hooks.ts")
    expect(agent?.instructions).not.toContain(".claude/")
  })

  test("copies command reference artifacts needed by custom agents", () => {
    const fixtureRoot = path.join(import.meta.dir, "fixtures", "sample-portable-plugin")
    const plugin: ClaudePlugin = {
      ...fixturePlugin,
      root: fixtureRoot,
      commands: [],
      skills: [],
      agents: [
        {
          name: "execution-agent",
          description: "Executes a scoped unit",
          body: "Use `commands/workflows/references/ignored.md` as the shared contract.",
          sourcePath: path.join(fixtureRoot, "agents", "workflow", "execution-agent.md"),
        },
      ],
    }

    const bundle = convertClaudeToCodex(plugin, {
      agentMode: "subagent",
      inferTemperature: false,
      permissions: "none",
    })

    const agent = bundle.agents?.find((item) => item.name === "execution-agent")
    expect(agent).toBeDefined()
    expect(agent?.instructions).toContain("Use `references/ignored.md`")
    expect(agent?.sidecarDirs).toEqual([
      {
        sourceDir: path.join(fixtureRoot, "commands", "workflows", "references"),
        targetName: "references",
      },
    ])
  })

  test("truncates custom agent descriptions to Codex limits and single line", () => {
    const longDescription = `Line one\nLine two ${"a".repeat(2000)}`
    const plugin: ClaudePlugin = {
      ...fixturePlugin,
      agents: [
        {
          name: "Long Description Agent",
          description: longDescription,
          body: "Body",
          sourcePath: "/tmp/plugin/agents/long.md",
        },
      ],
      commands: [],
      skills: [],
    }

    const bundle = convertClaudeToCodex(plugin, {
      agentMode: "subagent",
      inferTemperature: false,
      permissions: "none",
    })

    const generated = bundle.agents?.[0]
    const description = String(generated?.description ?? "")
    expect(description.length).toBeLessThanOrEqual(1024)
    expect(description).not.toContain("\n")
    expect(description.endsWith("...")).toBe(true)
  })
})
