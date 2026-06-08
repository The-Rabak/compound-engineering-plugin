import { describe, expect, test } from "bun:test"
import { promises as fs } from "fs"
import path from "path"
import os from "os"
import { writeCodexBundle } from "../src/targets/codex"
import type { CodexBundle } from "../src/types/codex"

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

describe("writeCodexBundle", () => {
  test("writes prompts, skills, and config", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "codex-test-"))
    const bundle: CodexBundle = {
      pluginName: "compound-engineering",
      pluginVersion: "4.1.0",
      pluginDescription: "Compound Engineering",
      prompts: [{ name: "command-one", content: "Prompt content" }],
      skillDirs: [
        {
          name: "skill-one",
          description: "Skill one",
          model: "gpt-5.4-mini",
          sourceDir: path.join(import.meta.dir, "fixtures", "sample-plugin", "skills", "skill-one"),
        },
      ],
      generatedSkills: [{ name: "agent-skill", content: "Skill content" }],
      agents: [
        {
          name: "reviewer",
          description: "Review code",
          model: "gpt-5.5",
          instructions: "Review carefully.",
          sidecarDirs: [
            {
              sourceDir: path.join(
                import.meta.dir,
                "fixtures",
                "sample-portable-plugin",
                "commands",
                "workflows",
                "references",
              ),
              targetName: "references",
            },
          ],
        },
      ],
      mcpServers: {
        local: { command: "echo", args: ["hello"], env: { KEY: "VALUE" } },
        remote: {
          url: "https://example.com/mcp",
          headers: { Authorization: "Bearer token" },
        },
      },
    }

    await writeCodexBundle(tempRoot, bundle)

    expect(await exists(path.join(tempRoot, ".codex", "prompts", "command-one.md"))).toBe(true)
    expect(await exists(path.join(tempRoot, ".agents", "skills", "skill-one", "SKILL.md"))).toBe(true)
    expect(await exists(path.join(tempRoot, ".agents", "skills", "agent-skill", "SKILL.md"))).toBe(true)
    expect(await exists(path.join(tempRoot, ".codex", "agents", "reviewer.toml"))).toBe(true)
    expect(await exists(path.join(tempRoot, ".codex", "plugins", "compound-engineering", ".codex-plugin", "plugin.json"))).toBe(true)
    expect(await exists(path.join(tempRoot, ".agents", "plugins", "marketplace.json"))).toBe(true)

    const copiedSkill = await fs.readFile(path.join(tempRoot, ".agents", "skills", "skill-one", "SKILL.md"), "utf8")
    expect(copiedSkill).toContain("model: gpt-5.4-mini")
    expect(copiedSkill).not.toContain("~/.claude/")

    const agentToml = await fs.readFile(path.join(tempRoot, ".codex", "agents", "reviewer.toml"), "utf8")
    expect(agentToml).toContain('name = "reviewer"')
    expect(agentToml).toContain('model = "gpt-5.5"')
    expect(await exists(path.join(tempRoot, ".codex", "agents", "reviewer", "references", "ignored.md"))).toBe(true)

    const marketplace = await fs.readFile(path.join(tempRoot, ".agents", "plugins", "marketplace.json"), "utf8")
    expect(marketplace).toContain('"path": "./.codex/plugins/compound-engineering"')

    const configPath = path.join(tempRoot, ".codex", "config.toml")
    expect(await exists(configPath)).toBe(true)

    const config = await fs.readFile(configPath, "utf8")
    expect(config).toContain("# BEGIN compound-plugin Codex MCP")
    expect(config).toContain("[mcp_servers.local]")
    expect(config).toContain("command = \"echo\"")
    expect(config).toContain("args = [\"hello\"]")
    expect(config).toContain("[mcp_servers.local.env]")
    expect(config).toContain("KEY = \"VALUE\"")
    expect(config).toContain("[mcp_servers.remote]")
    expect(config).toContain("url = \"https://example.com/mcp\"")
    expect(config).toContain("http_headers")
  })

  test("writes directly into a .codex output root", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "codex-home-"))
    const codexRoot = path.join(tempRoot, ".codex")
    const bundle: CodexBundle = {
      prompts: [{ name: "command-one", content: "Prompt content" }],
      skillDirs: [
        {
          name: "skill-one",
          sourceDir: path.join(import.meta.dir, "fixtures", "sample-plugin", "skills", "skill-one"),
        },
      ],
      generatedSkills: [],
    }

    await writeCodexBundle(codexRoot, bundle)

    expect(await exists(path.join(codexRoot, "prompts", "command-one.md"))).toBe(true)
    expect(await exists(path.join(tempRoot, ".agents", "skills", "skill-one", "SKILL.md"))).toBe(true)
  })

  test("merges existing config.toml without backup artifacts", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "codex-backup-"))
    const codexRoot = path.join(tempRoot, ".codex")
    const configPath = path.join(codexRoot, "config.toml")

    // Create existing config
    await fs.mkdir(codexRoot, { recursive: true })
    const originalContent = "# My original config\n[custom]\nkey = \"value\"\n"
    await fs.writeFile(configPath, originalContent)

    const bundle: CodexBundle = {
      prompts: [],
      skillDirs: [],
      generatedSkills: [],
      mcpServers: { test: { command: "echo" } },
    }

    await writeCodexBundle(codexRoot, bundle)

    const newConfig = await fs.readFile(configPath, "utf8")
    expect(newConfig).toContain("[custom]")
    expect(newConfig).toContain('key = "value"')
    expect(newConfig).toContain("[mcp_servers.test]")
    expect(newConfig).toContain("# BEGIN compound-plugin Codex MCP")

    // Backup should not be created
    const files = await fs.readdir(codexRoot)
    const backupFileName = files.find((f) => f.startsWith("config.toml.bak."))
    expect(backupFileName).toBeUndefined()
  })

  test("prunes stale generated prompts and skills", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "codex-prune-"))
    const codexRoot = path.join(tempRoot, ".codex")

    const firstBundle: CodexBundle = {
      prompts: [{ name: "old-command", content: "Old" }],
      skillDirs: [
        {
          name: "skill-one",
          sourceDir: path.join(import.meta.dir, "fixtures", "sample-plugin", "skills", "skill-one"),
        },
      ],
      generatedSkills: [{ name: "old-generated", content: "Old generated" }],
    }
    await writeCodexBundle(codexRoot, firstBundle)

    const secondBundle: CodexBundle = {
      prompts: [{ name: "new-command", content: "New" }],
      skillDirs: [],
      generatedSkills: [],
    }
    await writeCodexBundle(codexRoot, secondBundle)

    expect(await exists(path.join(codexRoot, "prompts", "old-command.md"))).toBe(false)
    expect(await exists(path.join(tempRoot, ".agents", "skills", "old-generated", "SKILL.md"))).toBe(false)
    expect(await exists(path.join(tempRoot, ".agents", "skills", "skill-one"))).toBe(false)
    expect(await exists(path.join(codexRoot, "prompts", "new-command.md"))).toBe(true)
  })
})
