import { describe, expect, test } from "bun:test"
import { promises as fs } from "fs"
import os from "os"
import path from "path"
import { loadPortablePlugin } from "../src/parsers/portable"
import { writeClaudeBundle } from "../src/targets/claude"

const fixtureRoot = path.join(import.meta.dir, "fixtures", "sample-portable-plugin")

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

describe("writeClaudeBundle", () => {
  test("writes a Claude plugin layout from portable source", async () => {
    const plugin = await loadPortablePlugin(fixtureRoot)
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "claude-writer-"))
    const outputRoot = path.join(tempRoot, "plugins", plugin.manifest.name)

    await writeClaudeBundle(outputRoot, plugin)

    const manifestPath = path.join(outputRoot, ".claude-plugin", "plugin.json")
    const commandPath = path.join(outputRoot, "commands", "workflows", "plan.md")
    const agentPath = path.join(outputRoot, "agents", "research", "repo-research-analyst.md")
    const skillPath = path.join(outputRoot, "skills", "skill-one", "SKILL.md")
    const supportFilePath = path.join(outputRoot, "skills", "skill-one", "references", "guide.txt")
    const hooksPath = path.join(outputRoot, "hooks", "hooks.json")

    expect(await exists(manifestPath)).toBe(true)
    expect(await exists(commandPath)).toBe(true)
    expect(await exists(agentPath)).toBe(true)
    expect(await exists(skillPath)).toBe(true)
    expect(await exists(supportFilePath)).toBe(true)
    expect(await exists(hooksPath)).toBe(true)

    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8")) as { description?: string }
    expect(manifest.description).toContain("Includes 1 specialized agent, 1 command, and 1 skill")

    const commandContent = await fs.readFile(commandPath, "utf8")
    expect(commandContent).toContain("allowed-tools:")
    expect(commandContent).toContain("disable-model-invocation: true")

    const skillContent = await fs.readFile(skillPath, "utf8")
    expect(skillContent).toContain("model: haiku")
    expect(skillContent).toContain("disable-model-invocation: true")
    expect(skillContent).toContain("Use this skill when the user needs a shared portable workflow.")
  })

  test("uses parsed skill body without rereading from disk", async () => {
    const plugin = await loadPortablePlugin(fixtureRoot)
    plugin.skills[0]!.body = "Body provided by parser cache"

    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "claude-writer-body-"))
    const outputRoot = path.join(tempRoot, "plugins", plugin.manifest.name)

    await writeClaudeBundle(outputRoot, plugin)

    const skillPath = path.join(outputRoot, "skills", "skill-one", "SKILL.md")
    const skillContent = await fs.readFile(skillPath, "utf8")
    expect(skillContent).toContain("Body provided by parser cache")
  })

  test("removes stale generated hooks when the portable plugin has no hooks", async () => {
    const plugin = await loadPortablePlugin(fixtureRoot)
    plugin.hooks = undefined

    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "claude-writer-no-hooks-"))
    const outputRoot = path.join(tempRoot, "plugins", plugin.manifest.name)
    const hooksPath = path.join(outputRoot, "hooks", "hooks.json")
    const staleScriptPath = path.join(outputRoot, "hooks", "stop-hook.sh")

    await fs.mkdir(path.dirname(hooksPath), { recursive: true })
    await fs.writeFile(hooksPath, "{\n  \"hooks\": {}\n}\n", "utf8")
    await fs.writeFile(staleScriptPath, "#!/usr/bin/env bash\necho stale\n", "utf8")

    await writeClaudeBundle(outputRoot, plugin)

    expect(await exists(hooksPath)).toBe(false)
    expect(await exists(staleScriptPath)).toBe(false)
  })

  test("prunes stale generated agents, commands, and skills", async () => {
    const plugin = await loadPortablePlugin(fixtureRoot)
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "claude-writer-prune-"))
    const outputRoot = path.join(tempRoot, "plugins", plugin.manifest.name)

    await writeClaudeBundle(outputRoot, plugin)

    const oldAgentPath = path.join(outputRoot, "agents", "research", "repo-research-analyst.md")
    const oldCommandPath = path.join(outputRoot, "commands", "workflows", "plan.md")
    const oldSkillPath = path.join(outputRoot, "skills", "skill-one")
    expect(await exists(oldAgentPath)).toBe(true)
    expect(await exists(oldCommandPath)).toBe(true)
    expect(await exists(oldSkillPath)).toBe(true)

    const trimmedPlugin = {
      ...plugin,
      agents: [],
      commands: [],
      skills: [],
      hooks: undefined,
    }
    await writeClaudeBundle(outputRoot, trimmedPlugin)

    expect(await exists(oldAgentPath)).toBe(false)
    expect(await exists(oldCommandPath)).toBe(false)
    expect(await exists(oldSkillPath)).toBe(false)
  })
})
