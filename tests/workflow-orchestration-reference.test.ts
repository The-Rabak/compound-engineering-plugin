import { describe, expect, test } from "bun:test"
import { promises as fs } from "fs"
import path from "path"

const repoRoot = path.join(import.meta.dir, "..")

async function readRepoFile(...segments: string[]): Promise<string> {
  return fs.readFile(path.join(repoRoot, ...segments), "utf8")
}

describe("workflow orchestration references", () => {
  test("defines shared orchestration and TDD references once", async () => {
    const orchestration = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "references",
      "orchestration-protocol.md",
    )
    const tdd = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "references",
      "tdd-evidence-contract.md",
    )
    const executionShape = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "references",
      "execution-shape.md",
    )
    const sliceArchitecture = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "references",
      "vertical-slice-architecture.md",
    )

    expect(orchestration).toContain("## Reference Template Loading")
    expect(orchestration).toContain("## Named Agent Dispatch")
    expect(orchestration).toContain("Never dispatch a named agent by name alone")
    expect(orchestration).toContain("Do not summarize or abbreviate the template")

    expect(tdd).toContain("## Contract Resolution")
    expect(tdd).toContain("## Plan Section Shape")
    expect(tdd).toContain("## Ralph Evidence Block")
    expect(tdd).toContain("## Review Gate Classifications")
    expect(tdd).toContain("replacement_evidence")
    expect(tdd).toContain("Missing cleanup after refactor")
    expect(executionShape).toContain("## Default")
    expect(executionShape).toContain("vertical-slices")
    expect(executionShape).toContain("infra-track")
    expect(executionShape).toContain("fix-batch")
    expect(executionShape).toContain("## Plan shape")
    expect(executionShape).toContain("Feature home")
    expect(sliceArchitecture).toContain("## Shared / global rule")
    expect(sliceArchitecture).toContain("## Context tiers")
  })

  test("plan, deepen, work, and review reference the shared orchestration rules instead of duplicating them", async () => {
    const planPrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "plan.md",
    )
    const deepenPrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "deepen-plan.md",
    )
    const architecturePrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "architecture.md",
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

    for (const prompt of [planPrompt, deepenPrompt, workPrompt, reviewPrompt]) {
      expect(prompt).toContain("commands/workflows/references/orchestration-protocol.md")
    }

    expect(planPrompt).not.toContain(
      "Before dispatching any named agent below, complete this protocol:",
    )
    expect(deepenPrompt).not.toContain(
      "Before dispatching any named agent discovered in this step, use the platform's file-search tool",
    )
    expect(workPrompt).not.toContain(
      "Before building `scoped_prompt`, complete this template-load protocol for `execution-agent-prompt.md`:",
    )
    expect(reviewPrompt).not.toContain(
      "Before dispatching any named review agent below, complete this protocol:",
    )
  })

  test("shared TDD reference drives plan, execution, and review evidence contracts", async () => {
    const planPrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "plan.md",
    )
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
    const specPrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "references",
      "spec-review-prompt.md",
    )
    const qualityPrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "references",
      "quality-review-prompt.md",
    )

    for (const prompt of [
      planPrompt,
      deepenPrompt,
      workPrompt,
      reviewPrompt,
      executionPrompt,
      specPrompt,
      qualityPrompt,
    ]) {
      expect(prompt).toContain("commands/workflows/references/tdd-evidence-contract.md")
    }

    expect(planPrompt).toContain("## TDD & Evidence Contract")
    expect(planPrompt).toContain("replacement_evidence")
    expect(workPrompt).toContain("stable `Red`, `Green`, and `Post-Refactor Green` evidence blocks")
    expect(reviewPrompt).toContain("#### TDD Evidence Gate (BEFORE reviewer dispatch)")
    expect(specPrompt).toContain("Missing behavior coverage")
    expect(qualityPrompt).toContain("Missing cleanup after refactor")
  })

  test("plan, deepen, and work share the execution-shape contract", async () => {
    const planPrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "plan.md",
    )
    const deepenPrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "deepen-plan.md",
    )
    const architecturePrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "architecture.md",
    )
    const workPrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "work.md",
    )

    for (const prompt of [planPrompt, architecturePrompt, deepenPrompt, workPrompt]) {
      expect(prompt).toContain("commands/workflows/references/execution-shape.md")
    }

    for (const prompt of [planPrompt, architecturePrompt, deepenPrompt, workPrompt]) {
      expect(prompt).toContain("commands/workflows/references/vertical-slice-architecture.md")
    }

    expect(planPrompt).toContain("execution_shape:")
    expect(planPrompt).toContain("## Execution Shape")
    expect(deepenPrompt).toContain("Resolve execution shape first")
    expect(workPrompt).toContain("execution_shape")
    expect(workPrompt).toContain("execution units")
  })
})
