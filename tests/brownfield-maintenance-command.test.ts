import { describe, expect, test } from "bun:test"
import { promises as fs } from "fs"
import path from "path"
import { loadPortablePlugin } from "../src/parsers/portable"

const repoRoot = path.join(import.meta.dir, "..")
const portableRoot = path.join(repoRoot, "portable", "compound-engineering")

async function readRepoFile(...segments: string[]): Promise<string> {
  return fs.readFile(path.join(repoRoot, ...segments), "utf8")
}

describe("brownfield maintenance command", () => {
  test("registers the command and defines the brownfield audit contract", async () => {
    const plugin = await loadPortablePlugin(portableRoot)
    const command = plugin.commands.find((item) => item.name === "brownfield-maintenance")

    expect(command).toBeDefined()
    expect(command?.description).toContain("brownfield AI-layer gaps")

    const prompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "brownfield-maintenance.md",
    )

    expect(prompt).toContain("outside the canonical feature workflow")
    expect(prompt).toContain("docs/solutions/YYYY-MM-DD-<topic>-brownfield-ai-layer.md")
    expect(prompt).toContain("repo-research-analyst")
    expect(prompt).toContain("learnings-researcher")
    expect(prompt).toContain("audit-first")
    expect(prompt).toContain("feature-home ownership")
  })

  test("documents the new command in the shipped docs", async () => {
    const rootReadme = await readRepoFile("README.md")
    const pluginReadme = await readRepoFile("plugins", "compound-engineering", "README.md")
    const changelog = await readRepoFile("plugins", "compound-engineering", "CHANGELOG.md")

    expect(rootReadme).toContain("/brownfield-maintenance")
    expect(pluginReadme).toContain("/brownfield-maintenance")
    expect(pluginReadme).toContain("Includes 34 specialized agents, 28 commands, and 26 skills.")
    expect(changelog).toContain("**`/brownfield-maintenance` command**")
  })
})
