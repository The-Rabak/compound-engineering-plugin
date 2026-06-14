import { describe, expect, test } from "bun:test"
import { promises as fs } from "fs"
import path from "path"
import { loadPortablePlugin } from "../src/parsers/portable"

const repoRoot = path.join(import.meta.dir, "..")
const portableRoot = path.join(repoRoot, "portable", "compound-engineering")

async function readRepoFile(...segments: string[]): Promise<string> {
  return fs.readFile(path.join(repoRoot, ...segments), "utf8")
}

async function readRepoJson<T>(...segments: string[]): Promise<T> {
  return JSON.parse(await readRepoFile(...segments)) as T
}

async function pathExists(...segments: string[]): Promise<boolean> {
  try {
    await fs.access(path.join(repoRoot, ...segments))
    return true
  } catch {
    return false
  }
}

describe("published support surface", () => {
  test("generated metadata and plugin docs match the portable counts and description", async () => {
    const plugin = await loadPortablePlugin(portableRoot)
    const pluginManifest = await readRepoJson<{ description: string }>("plugins", "compound-engineering", ".claude-plugin", "plugin.json")
    const marketplace = await readRepoJson<{ plugins: Array<{ description: string }> }>(".claude-plugin", "marketplace.json")
    const pluginReadme = await readRepoFile("plugins", "compound-engineering", "README.md")

    expect(pluginManifest.description).toBe(plugin.manifest.description)
    expect(marketplace.plugins[0]?.description).toBe(plugin.manifest.description)
    expect(pluginReadme).toContain(
      `Includes ${plugin.agents.length} specialized agents, ${plugin.commands.length} commands, and ${plugin.skills.length} skills.`,
    )
    expect(pluginReadme).toContain(`| Agents | ${plugin.agents.length} |`)
    expect(pluginReadme).toContain(`| Commands | ${plugin.commands.length} |`)
    expect(pluginReadme).toContain(`| Skills | ${plugin.skills.length} |`)
  })

  test("plugin README presents the reduced support surface as a tiered support ladder", async () => {
    const pluginReadme = await readRepoFile("plugins", "compound-engineering", "README.md")

    expect(pluginReadme).toContain("OpenCode first-class, GitHub Copilot and Codex second, Claude Code third")
    expect(pluginReadme).toContain("**Codex:** explicit full local export plus repo marketplace packaging")
    expect(pluginReadme).toContain("**De-emphasize:** compatibility exporters for Droid, Pi, Gemini, and Kiro")
    expect(pluginReadme).toContain("**Removed legacy surfaces:** `.github_gpt/` and dormant Cursor-specific export/sync code")
    expect(pluginReadme).toContain("`/workflows:architecture` is the architecture-improvement handoff")
    expect(pluginReadme).toContain("Plans default to unit + e2e evidence")
    expect(pluginReadme).not.toContain("Includes 29 specialized agents, 25 commands")
  })

  test("changelog records the cleanup and workflow-contract changes shipped in the published surface", async () => {
    const pluginChangelog = await readRepoFile("plugins", "compound-engineering", "CHANGELOG.md")

    expect(pluginChangelog).toContain("**Support-surface cleanup**")
    expect(pluginChangelog).toContain("OpenCode first-class, GitHub Copilot and Codex second, Claude Code third")
    expect(pluginChangelog).toContain("**Codex full export**")
    expect(pluginChangelog).toContain("**Architecture handoff workflow**")
    expect(pluginChangelog).toContain("`/workflows:architecture`")
    expect(pluginChangelog).toContain("**Ralph/TDD evidence contract**")
    expect(pluginChangelog).toContain("unit + e2e evidence")
  })

  test("published surfaces retire ideate as a standalone workflow and skill", async () => {
    const plugin = await loadPortablePlugin(portableRoot)
    const pluginReadme = await readRepoFile("plugins", "compound-engineering", "README.md")

    expect(plugin.commands.some((command) => command.name === "workflows:ideate")).toBeFalse()
    expect(plugin.skills.some((skill) => skill.name === "ideate")).toBeFalse()
    expect(pluginReadme).not.toContain("`/workflows:ideate`")
    expect(pluginReadme).not.toContain("| `ideate` |")
    expect(await pathExists("plugins", "compound-engineering", "commands", "workflows", "ideate.md")).toBeFalse()
    expect(await pathExists(".github", "skills", "workflows-ideate", "SKILL.md")).toBeFalse()
    expect(await pathExists("plugins", "compound-engineering", "skills", "ideate", "SKILL.md")).toBeFalse()
  })
})
