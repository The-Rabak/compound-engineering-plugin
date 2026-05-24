import { describe, expect, test } from "bun:test"
import { promises as fs } from "fs"
import path from "path"
import { loadPortablePlugin } from "../src/parsers/portable"

const repoRoot = path.join(import.meta.dir, "..")
const portableRoot = path.join(repoRoot, "portable", "compound-engineering")

async function readRepoFile(...segments: string[]): Promise<string> {
  return fs.readFile(path.join(repoRoot, ...segments), "utf8")
}

describe("ticket flow review contract", () => {
  test("registers the reusable ticket-flow reviewer and wires it into review", async () => {
    const plugin = await loadPortablePlugin(portableRoot)
    expect(plugin.agents.some((agent) => agent.name === "ticket-flow-auditor")).toBe(true)

    const agent = await readRepoFile(
      "portable",
      "compound-engineering",
      "agents",
      "review",
      "ticket-flow-auditor.md",
    )
    const reviewPrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "review.md",
    )

    expect(agent).toContain("## Mission")
    expect(agent).toContain("## Workflow")
    expect(agent).toContain("ticket-set audit")
    expect(agent).toContain("implementation audit")
    expect(agent).toContain("execution-batch partitioning")
    expect(agent).toContain("Batch safety notes")
    expect(reviewPrompt).toContain("docs/tickets/*/index.md")
    expect(reviewPrompt).toContain("`docs/tickets/**/*.md`")
    expect(reviewPrompt).toContain("Ticket Set:")
    expect(reviewPrompt).toContain("`ticket-flow-auditor`")
    expect(reviewPrompt).toContain("scope fences, dependency honesty, and execution drift")
    expect(reviewPrompt).toContain("except for `/workflows:to-issues`")
  })
})
