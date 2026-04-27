import { describe, expect, test } from "bun:test"
import { promises as fs } from "fs"
import path from "path"
import { loadPortablePlugin } from "../src/parsers/portable"

const repoRoot = path.join(import.meta.dir, "..")
const portableRoot = path.join(repoRoot, "portable", "compound-engineering")

async function readRepoFile(...segments: string[]): Promise<string> {
  return fs.readFile(path.join(repoRoot, ...segments), "utf8")
}

describe("architecture workflow contract", () => {
  test("registers workflows:architecture and routes planning through it before deepen-plan", async () => {
    const plugin = await loadPortablePlugin(portableRoot)
    expect(plugin.commands.some((command) => command.name === "workflows:architecture")).toBe(true)

    const brainstormPrompt = await readRepoFile("portable", "compound-engineering", "commands", "workflows", "brainstorm.md")
    const planPrompt = await readRepoFile("portable", "compound-engineering", "commands", "workflows", "plan.md")
    expect(brainstormPrompt).toContain("`/workflows:architecture` before `/deepen-plan`")

    const architectureIndex = planPrompt.indexOf("Run `/workflows:architecture`")
    const deepenIndex = planPrompt.indexOf("Run `/deepen-plan`")

    expect(architectureIndex).toBeGreaterThan(-1)
    expect(deepenIndex).toBeGreaterThan(architectureIndex)
    expect(planPrompt).not.toContain("/technical_review")
  })

  test("defines the architecture artifact contract in docs/architecture with explicit vocabulary", async () => {
    const architecturePrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "architecture.md",
    )
    const referencePrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "references",
      "architecture-improvement-prompt.md",
    )

    expect(architecturePrompt).toContain("## Required inputs")
    expect(architecturePrompt).toContain("## Required outputs")
    expect(architecturePrompt).toContain("docs/architecture/")
    expect(referencePrompt).toContain("# Architecture Improvement Artifact Contract")
    expect(referencePrompt).toContain("Deepening Candidates")
    expect(referencePrompt).toContain("Deletion Test")
    expect(referencePrompt).toContain("Interfaces as Test Surfaces")
    expect(referencePrompt).toContain("Seams, Adapters, and Contracts")
    expect(referencePrompt).toContain("Design-It-Twice Options")
  })

  test("documents the shared vocabulary in the skill and repo workflow docs", async () => {
    const skill = await readRepoFile(
      "portable",
      "compound-engineering",
      "skills",
      "agent-native-architecture",
      "SKILL.md",
    )
    const rootReadme = await readRepoFile("README.md")
    const pluginReadme = await readRepoFile("plugins", "compound-engineering", "README.md")

    expect(skill).toContain("## Compound Architecture Artifact Contract")
    expect(skill).toContain("Deletion test")
    expect(skill).toContain("Interface as test surface")
    expect(skill).toContain("Seam")
    expect(skill).toContain("Adapter")
    expect(rootReadme).toContain("`/workflows:architecture`")
    expect(rootReadme).toContain("docs/architecture/")
    expect(pluginReadme).toContain("`/workflows:architecture`")
  })

  test("makes deepen, work, and review consume the architecture artifact or explicit handoff contract", async () => {
    const deepenPrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "deepen-plan.md",
    )
    const workPrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "work.md",
    )
    const reviewPrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "review.md",
    )
    const rootReadme = await readRepoFile("README.md")
    const pluginChangelog = await readRepoFile("plugins", "compound-engineering", "CHANGELOG.md")

    expect(deepenPrompt).toContain("explicit architecture handoff contract")
    expect(deepenPrompt).toContain("Read `architecture_ref`")
    expect(workPrompt).toContain("### Architecture Handoff")
    expect(workPrompt).toContain("{{ARCHITECTURE_HANDOFF}}")
    expect(reviewPrompt).toContain("Architecture Artifact")
    expect(reviewPrompt).toContain("Architecture Handoff")
    expect(reviewPrompt).toContain("docs/architecture/*.md")
    expect(rootReadme).toContain("architecture artifact or explicit architecture handoff contract")
    expect(pluginChangelog).toContain("Replace any `/technical_review` usage with `/workflows:architecture`")
  })
})
