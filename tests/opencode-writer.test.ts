import { describe, expect, test } from "bun:test"
import { promises as fs } from "fs"
import path from "path"
import os from "os"
import { writeOpenCodeBundle } from "../src/targets/opencode"
import type { OpenCodeBundle } from "../src/types/opencode"

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

describe("writeOpenCodeBundle", () => {
  test("writes config, agents, plugins, and skills", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "opencode-test-"))
    const bundle: OpenCodeBundle = {
      config: { $schema: "https://opencode.ai/config.json" },
      agents: [{ name: "agent-one", content: "Agent content" }],
      plugins: [{ name: "hook.ts", content: "export {}" }],
      skillDirs: [
        {
          name: "skill-one",
          sourceDir: path.join(import.meta.dir, "fixtures", "sample-portable-plugin", "skills", "skill-one"),
          skillPath: path.join(import.meta.dir, "fixtures", "sample-portable-plugin", "skills", "skill-one", "SKILL.md"),
        },
      ],
    }

    await writeOpenCodeBundle(tempRoot, bundle)

    expect(await exists(path.join(tempRoot, "opencode.json"))).toBe(true)
    expect(await exists(path.join(tempRoot, ".opencode", "agents", "agent-one.md"))).toBe(true)
    expect(await exists(path.join(tempRoot, ".opencode", "plugins", "hook.ts"))).toBe(true)
    expect(await exists(path.join(tempRoot, ".opencode", "skills", "skill-one", "SKILL.md"))).toBe(true)
    const skillBody = await fs.readFile(
      path.join(tempRoot, ".opencode", "skills", "skill-one", "SKILL.md"),
      "utf8",
    )
    expect(skillBody).toContain("~/.config/opencode/skills/skill-one/notes.md")
    expect(skillBody).not.toContain("~/.claude/")
  })

  test("writes directly into a .opencode output root", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "opencode-root-"))
    const outputRoot = path.join(tempRoot, ".opencode")
    const bundle: OpenCodeBundle = {
      config: { $schema: "https://opencode.ai/config.json" },
      agents: [{ name: "agent-one", content: "Agent content" }],
      plugins: [],
      skillDirs: [
        {
          name: "skill-one",
          sourceDir: path.join(import.meta.dir, "fixtures", "sample-plugin", "skills", "skill-one"),
          skillPath: path.join(import.meta.dir, "fixtures", "sample-plugin", "skills", "skill-one", "SKILL.md"),
        },
      ],
    }

    await writeOpenCodeBundle(outputRoot, bundle)

    expect(await exists(path.join(outputRoot, "opencode.json"))).toBe(true)
    expect(await exists(path.join(outputRoot, "agents", "agent-one.md"))).toBe(true)
    expect(await exists(path.join(outputRoot, "skills", "skill-one", "SKILL.md"))).toBe(true)
    expect(await exists(path.join(outputRoot, ".opencode"))).toBe(false)
  })

  test("writes directly into ~/.config/opencode style output root", async () => {
    // Simulates the global install path: ~/.config/opencode
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "config-opencode-"))
    const outputRoot = path.join(tempRoot, ".config", "opencode")
    const bundle: OpenCodeBundle = {
      config: { $schema: "https://opencode.ai/config.json" },
      agents: [{ name: "agent-one", content: "Agent content" }],
      plugins: [],
      skillDirs: [
        {
          name: "skill-one",
          sourceDir: path.join(import.meta.dir, "fixtures", "sample-plugin", "skills", "skill-one"),
          skillPath: path.join(import.meta.dir, "fixtures", "sample-plugin", "skills", "skill-one", "SKILL.md"),
        },
      ],
    }

    await writeOpenCodeBundle(outputRoot, bundle)

    // Should write directly, not nested under .opencode
    expect(await exists(path.join(outputRoot, "opencode.json"))).toBe(true)
    expect(await exists(path.join(outputRoot, "agents", "agent-one.md"))).toBe(true)
    expect(await exists(path.join(outputRoot, "skills", "skill-one", "SKILL.md"))).toBe(true)
    expect(await exists(path.join(outputRoot, ".opencode"))).toBe(false)
  })

  test("copies command reference docs into the installed command tree", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "opencode-refs-"))
    const sourceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "portable-command-"))
    const sourceCommand = path.join(sourceRoot, "commands", "workflows", "work.md")
    const sourceReference = path.join(
      sourceRoot,
      "commands",
      "workflows",
      "references",
      "execution-agent-prompt.md",
    )

    await fs.mkdir(path.dirname(sourceReference), { recursive: true })
    await fs.writeFile(sourceCommand, "# work\n")
    await fs.writeFile(sourceReference, "# Execution Agent Prompt Template\n")

    const bundle: OpenCodeBundle = {
      config: { $schema: "https://opencode.ai/config.json" },
      agents: [],
      commandFiles: [
        {
          name: "workflows:work",
          content: "Use the installed references.",
          sourcePath: sourceCommand,
        },
      ],
      plugins: [],
      skillDirs: [],
    }

    await writeOpenCodeBundle(tempRoot, bundle)

    expect(
      await exists(
        path.join(
          tempRoot,
          ".opencode",
          "commands",
          "workflows",
          "references",
          "execution-agent-prompt.md",
        ),
      ),
    ).toBe(true)
  })

  test("merges existing opencode.json without creating backup files", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "opencode-backup-"))
    const outputRoot = path.join(tempRoot, ".opencode")
    const configPath = path.join(outputRoot, "opencode.json")

    // Create existing config
    await fs.mkdir(outputRoot, { recursive: true })
    const originalConfig = { $schema: "https://opencode.ai/config.json", custom: "value" }
    await fs.writeFile(configPath, JSON.stringify(originalConfig, null, 2))

    const bundle: OpenCodeBundle = {
      config: { $schema: "https://opencode.ai/config.json", new: "config" },
      agents: [],
      plugins: [],
      skillDirs: [],
    }

    await writeOpenCodeBundle(outputRoot, bundle)

    // Merged config should preserve existing user keys
    const newConfig = JSON.parse(await fs.readFile(configPath, "utf8"))
    expect(newConfig.custom).toBe("value")
    expect(newConfig.$schema).toBe("https://opencode.ai/config.json")

    // No backup files should be left behind
    const files = await fs.readdir(outputRoot)
    const backupFileName = files.find((f) => f.startsWith("opencode.json.bak."))
    expect(backupFileName).toBeUndefined()
  })

  test("prunes stale generated artifacts and legacy backup files", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "opencode-prune-"))
    const outputRoot = path.join(tempRoot, ".opencode")
    const commandDir = path.join(outputRoot, "commands")
    const skillFixture = path.join(import.meta.dir, "fixtures", "sample-plugin", "skills", "skill-one")
    const skillPath = path.join(skillFixture, "SKILL.md")

    const firstBundle: OpenCodeBundle = {
      config: { $schema: "https://opencode.ai/config.json" },
      agents: [{ name: "old-agent", content: "Old agent" }],
      commandFiles: [{ name: "old-command", content: "Old command" }],
      plugins: [{ name: "old-plugin.ts", content: "export {}" }],
      skillDirs: [{ name: "old-skill", sourceDir: skillFixture, skillPath }],
    }

    await writeOpenCodeBundle(outputRoot, firstBundle)
    await fs.writeFile(path.join(outputRoot, "opencode.json.bak.legacy"), "{}\n")
    await fs.mkdir(commandDir, { recursive: true })
    await fs.writeFile(path.join(commandDir, "old-command.md.bak.legacy"), "# stale backup\n")

    const secondBundle: OpenCodeBundle = {
      config: { $schema: "https://opencode.ai/config.json" },
      agents: [{ name: "new-agent", content: "New agent" }],
      commandFiles: [{ name: "new-command", content: "New command" }],
      plugins: [],
      skillDirs: [],
    }

    await writeOpenCodeBundle(outputRoot, secondBundle)

    expect(await exists(path.join(outputRoot, "agents", "old-agent.md"))).toBe(false)
    expect(await exists(path.join(outputRoot, "commands", "old-command.md"))).toBe(false)
    expect(await exists(path.join(outputRoot, "plugins", "old-plugin.ts"))).toBe(false)
    expect(await exists(path.join(outputRoot, "skills", "old-skill"))).toBe(false)
    expect(await exists(path.join(outputRoot, "agents", "new-agent.md"))).toBe(true)
    expect(await exists(path.join(outputRoot, "commands", "new-command.md"))).toBe(true)
    expect(await exists(path.join(outputRoot, "opencode.json.bak.legacy"))).toBe(false)
    expect(await exists(path.join(commandDir, "old-command.md.bak.legacy"))).toBe(false)
  })

  test("prunes legacy triage artifacts when workflows:triage is installed", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "opencode-triage-legacy-"))
    const outputRoot = path.join(tempRoot, ".opencode")
    const legacySkillRoot = path.join(outputRoot, "skills", "triage")

    await fs.mkdir(path.join(outputRoot, "commands"), { recursive: true })
    await fs.mkdir(legacySkillRoot, { recursive: true })
    await fs.writeFile(path.join(outputRoot, "commands", "triage.md"), "# stale triage\n")
    await fs.writeFile(path.join(legacySkillRoot, "SKILL.md"), "# stale triage skill\n")

    const bundle: OpenCodeBundle = {
      config: { $schema: "https://opencode.ai/config.json" },
      agents: [],
      commandFiles: [{ name: "workflows:triage", content: "Use workflows triage." }],
      plugins: [],
      skillDirs: [],
    }

    await writeOpenCodeBundle(outputRoot, bundle)

    expect(await exists(path.join(outputRoot, "commands", "triage.md"))).toBe(false)
    expect(await exists(legacySkillRoot)).toBe(false)
    expect(await exists(path.join(outputRoot, "commands", "workflows:triage.md"))).toBe(true)
  })
})
