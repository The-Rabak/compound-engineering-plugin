import { describe, expect, test } from "bun:test"
import { promises as fs } from "fs"
import path from "path"

const repoRoot = path.join(import.meta.dir, "..")
const agentRoot = path.join(repoRoot, "portable", "compound-engineering", "agents")
const skillRoot = path.join(repoRoot, "portable", "compound-engineering", "skills")

async function walkMarkdownFiles(root: string): Promise<string[]> {
  const entries = await fs.readdir(root, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(root, entry.name)
      if (entry.isDirectory()) {
        return walkMarkdownFiles(fullPath)
      }
      return entry.name.endsWith('.md') ? [fullPath] : []
    }),
  )
  return files.flat().sort((left, right) => left.localeCompare(right))
}

describe("prompt style guide", () => {
  test("all portable agents use the shared concise section layout", async () => {
    const agentFiles = await walkMarkdownFiles(agentRoot)

    for (const file of agentFiles) {
      const content = await fs.readFile(file, "utf8")
      expect(content).toContain("## Mission")
      expect(content).toContain("## Workflow")
      expect(content).toContain("## Report")
      expect(content).toContain("## Guardrails")
    }
  })

  test("refreshed high-impact skills use the shared concise section layout", async () => {
    for (const relativePath of [
      path.join("orchestrating-swarms", "SKILL.md"),
      path.join("compound-docs", "SKILL.md"),
      path.join("agent-native-architecture", "SKILL.md"),
    ]) {
      const content = await fs.readFile(path.join(skillRoot, relativePath), "utf8")
      expect(content).toContain("## When to use")
      expect(content).toContain("## Workflow")
      expect(content).toContain("## Output")
      expect(content).toContain("## Guardrails")
    }
  })
})
