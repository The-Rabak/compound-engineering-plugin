import { describe, expect, test } from "bun:test"
import { mkdtemp, readFile, rm } from "fs/promises"
import os from "os"
import path from "path"
import { convertClaudeToCursor, transformContentForCursor } from "../src/converters/claude-to-cursor"
import { writeCursorBundle } from "../src/targets/cursor"
import type { ClaudePlugin } from "../src/types/claude"
import { sanitizeMarkdownForTarget } from "../src/utils/target-content"

function samplePlugin(): ClaudePlugin {
  return {
    root: "/tmp/sample",
    manifest: {
      name: "compound-engineering",
      version: "1.0.0",
    },
    agents: [
      {
        name: "architecture-strategist",
        description: "Reviews architecture",
        model: "claude-sonnet-5",
        body: "Task code-simplicity-reviewer(review the diff)\nSee @performance-oracle and /workflows:plan",
        sourcePath: "/tmp/sample/agents/architecture-strategist.md",
      },
      {
        name: "ticket-flow-auditor",
        description: "Audits tickets",
        model: "claude-opus-4-8",
        body: "Audit ticket flow.",
        sourcePath: "/tmp/sample/agents/ticket-flow-auditor.md",
      },
      {
        name: "learnings-researcher",
        description: "Finds learnings",
        model: "claude-haiku-4-5-20251001",
        body: "Search docs/solutions.",
        sourcePath: "/tmp/sample/agents/learnings-researcher.md",
      },
    ],
    commands: [
      {
        name: "workflows:plan",
        description: "Create a plan",
        argumentHint: "<feature>",
        model: "claude-sonnet-5",
        body: "Plan the feature with /workflows:brainstorm context.",
        sourcePath: "/tmp/sample/commands/workflows/plan.md",
      },
    ],
    skills: [],
    mcpServers: {
      context7: {
        url: "https://mcp.example.com",
      },
    },
  }
}

describe("cursor converter", () => {
  test("maps agents, commands, and MCP into a Cursor bundle", () => {
    const bundle = convertClaudeToCursor(samplePlugin(), {
      agentMode: "subagent",
      inferTemperature: true,
      permissions: "none",
    })

    expect(bundle.agents.map((agent) => agent.name)).toEqual([
      "architecture-strategist",
      "ticket-flow-auditor",
      "learnings-researcher",
    ])
    expect(bundle.commands.map((command) => command.name)).toEqual(["workflows-plan"])
    expect(bundle.mcpServers?.context7).toEqual({ url: "https://mcp.example.com" })
    expect(bundle.agents[0]?.content).toContain("Use the `code-simplicity-reviewer` agent to:")
    expect(bundle.agents[0]?.content).toContain("the `performance-oracle` agent")
    expect(bundle.agents[0]?.content).toContain("/workflows-plan")
  })

  test("rewrites Claude model tiers to Cursor model IDs", () => {
    expect(sanitizeMarkdownForTarget("model: claude-opus-4-8", "cursor")).toBe(
      "model: cursor-grok-4.5-high",
    )
    expect(sanitizeMarkdownForTarget("model: claude-sonnet-5", "cursor")).toBe(
      "model: gpt-5.6-terra-high",
    )
    expect(sanitizeMarkdownForTarget("model: claude-haiku-4-5-20251001", "cursor")).toBe(
      "model: composer-2.5",
    )
  })

  test("writes a global ~/.cursor-shaped tree", async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "cursor-export-"))
    const cursorHome = path.join(tempRoot, ".cursor")

    try {
      const bundle = convertClaudeToCursor(samplePlugin(), {
        agentMode: "subagent",
        inferTemperature: true,
        permissions: "none",
      })
      await writeCursorBundle(cursorHome, bundle)

      const agent = await readFile(path.join(cursorHome, "agents", "architecture-strategist.md"), "utf8")
      const opusAgent = await readFile(path.join(cursorHome, "agents", "ticket-flow-auditor.md"), "utf8")
      const haikuAgent = await readFile(path.join(cursorHome, "agents", "learnings-researcher.md"), "utf8")
      const command = await readFile(path.join(cursorHome, "commands", "workflows-plan.md"), "utf8")
      const mcp = JSON.parse(await readFile(path.join(cursorHome, "mcp.json"), "utf8"))

      expect(agent).toContain("model: gpt-5.6-terra-high")
      expect(opusAgent).toContain("model: cursor-grok-4.5-high")
      expect(haikuAgent).toContain("model: composer-2.5")
      expect(command).toContain("/workflows-brainstorm")
      expect(mcp.mcpServers.context7.url).toBe("https://mcp.example.com")
    } finally {
      await rm(tempRoot, { recursive: true, force: true })
    }
  })

  test("transformContentForCursor rewrites paths and task calls", () => {
    const transformed = transformContentForCursor(
      "Task repo-research-analyst(scan the tree)\nRead ~/.claude/skills/foo and .claude/commands/bar",
    )
    expect(transformed).toContain("Use the `repo-research-analyst` agent to: scan the tree")
    expect(transformed).toContain("~/.cursor/skills/foo")
    expect(transformed).toContain(".cursor/commands/bar")
  })
})
