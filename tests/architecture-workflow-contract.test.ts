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
    const nextStepSkill = await readRepoFile("portable", "compound-engineering", "skills", "workflow-next-step", "SKILL.md")
    expect(brainstormPrompt).toContain("`/workflows:architecture` before `/deepen-plan`")

    const architectureIndex = nextStepSkill.indexOf("After `plan`, recommend `/workflows:architecture")
    const deepenIndex = nextStepSkill.indexOf("After `architecture`, recommend `/deepen-plan")

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
    const sliceReference = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "references",
      "vertical-slice-architecture.md",
    )

    expect(architecturePrompt).toContain("## Required inputs")
    expect(architecturePrompt).toContain("## Required outputs")
    expect(architecturePrompt).toContain("## Review depth")
    expect(architecturePrompt).toContain("Default path: lightweight implementation handoff")
    expect(architecturePrompt).toContain("Escalate to deep architecture review")
    expect(architecturePrompt).not.toContain("Always run these reviewers regardless of repo config")
    expect(architecturePrompt).toContain("vertical-slice-architecture.md")
    expect(architecturePrompt).toContain("architecture-strategist")
    expect(architecturePrompt).toContain("uncle-bob")
    expect(architecturePrompt).toContain("document-review")
    expect(architecturePrompt).toContain("module blueprint")
    expect(architecturePrompt).toContain("docs/architecture/")
    expect(referencePrompt).toContain("# Architecture Improvement Artifact Contract")
    expect(referencePrompt).toContain("## Feature Homes and Ownership")
    expect(referencePrompt).toContain("## Shared / Global Decisions")
    expect(referencePrompt).toContain("Deepening Candidates")
    expect(referencePrompt).toContain("## Module Blueprint for Implementation")
    expect(referencePrompt).toContain("| Module | Feature home | Contains | Why this arrangement |")
    expect(referencePrompt).toContain("## Context Tiers")
    expect(referencePrompt).toContain("Canonical WHY Source")
    expect(referencePrompt).toContain("Local Intent")
    expect(referencePrompt).not.toContain("Problem Narrative: <copied or summarized from plan>")
    expect(referencePrompt).toContain("## Drift Checks")
    expect(referencePrompt).toContain("Deletion Test")
    expect(referencePrompt).toContain("Interfaces as Test Surfaces")
    expect(referencePrompt).toContain("Seams, Adapters, and Contracts")
    expect(referencePrompt).toContain("Design-It-Twice (only for high-leverage risk)")
    expect(sliceReference).toContain("# Vertical Slice Architecture Contract")
    expect(sliceReference).toContain("## Context tiers")
    expect(sliceReference).toContain("Feature home")
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
    const executionPrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "references",
      "execution-agent-prompt.md",
    )
    const rootReadme = await readRepoFile("README.md")
    const pluginChangelog = await readRepoFile("plugins", "compound-engineering", "CHANGELOG.md")

    expect(deepenPrompt).toContain("explicit architecture handoff contract")
    expect(deepenPrompt).toContain("Read `architecture_ref`")
    expect(deepenPrompt).toContain("Feature Homes and Ownership")
    expect(workPrompt).toContain("### Architecture Handoff")
    expect(workPrompt).toContain("Feature-home ownership")
    expect(workPrompt).toContain("{{ARCHITECTURE_HANDOFF}}")
    expect(executionPrompt).toContain("## Architecture Handoff")
    expect(executionPrompt).toContain("**Feature home:** {{FEATURE_HOME}}")
    expect(executionPrompt).toContain("{{ARCHITECTURE_HANDOFF}}")
    expect(reviewPrompt).toContain("Architecture Artifact")
    expect(reviewPrompt).toContain("Architecture Handoff")
    expect(reviewPrompt).toContain("Feature Homes and Ownership")
    expect(reviewPrompt).toContain("docs/architecture/*.md")
    expect(reviewPrompt).toContain("mandatory reviewers")
    expect(reviewPrompt).toContain("`uncle-bob`")
    expect(rootReadme).toContain("architecture artifact or explicit architecture handoff contract")
    expect(pluginChangelog).toContain("Replace any `/technical_review` usage with `/workflows:architecture`")
  })

  test("review enforcement makes the feature-home versus shared-global boundary explicit", async () => {
    const uncleBobPrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "agents",
      "review",
      "uncle-bob.md",
    )
    const reviewPrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "review.md",
    )
    const architecturePrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "architecture.md",
    )

    expect(uncleBobPrompt).toContain("### Feature-home boundaries")
    expect(uncleBobPrompt).toContain("feature-home drift")
    expect(uncleBobPrompt).toContain("shared/global drift")
    expect(reviewPrompt).toContain("Introduces feature-home drift or shared/global drift")
    expect(reviewPrompt).toContain("feature-home boundaries, shared/global extractions")
    expect(architecturePrompt).toContain("feature-home ownership, shared/global extractions")
  })
})
