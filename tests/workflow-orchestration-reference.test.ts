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

  test("minimal effective planning reference defines scope control for brainstorm and plan", async () => {
    const minimalPlanning = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "references",
      "minimal-effective-planning.md",
    )
    const brainstormPrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "brainstorm.md",
    )
    const planPrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "plan.md",
    )

    expect(minimalPlanning).toContain("minimal effective solution")
    expect(minimalPlanning).toContain("explicit request")
    expect(minimalPlanning).toContain("confirmed brainstorm")
    expect(minimalPlanning).toContain("grill-me")
    expect(minimalPlanning).toContain("necessary inference")
    expect(minimalPlanning).toContain("deferred / non-goal")
    expect(minimalPlanning).toContain("complexity gate")
    expect(minimalPlanning).toContain("WHY")
    expect(minimalPlanning).toContain("success criteria")
    expect(minimalPlanning).toContain("TDD/evidence")
    expect(minimalPlanning).toContain("execution shape")
    expect(minimalPlanning).toContain("scope fences")

    for (const prompt of [brainstormPrompt, planPrompt]) {
      expect(prompt).toContain("commands/workflows/references/minimal-effective-planning.md")
    }
  })

  test("brainstorm prompt keeps discovery right-sized while preserving downstream handoff", async () => {
    const brainstormPrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "brainstorm.md",
    )

    expect(brainstormPrompt).toContain("Ask only decision-bearing questions by default")
    expect(brainstormPrompt).toContain("Non-goals / Deferred Ideas")
    expect(brainstormPrompt).toContain("Scope Boundary")
    expect(brainstormPrompt).toContain(
      "problem narrative, user story, architectural context, and success criteria mandatory",
    )
    expect(brainstormPrompt).toContain(
      "`/workflows:review` -> `/workflows:triage` -> `/workflows:compound`",
    )
  })

  test("plan prompt enforces specified scope before execution packet decomposition", async () => {
    const planPrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "plan.md",
    )
    const scopeContractIndex = planPrompt.indexOf(
      "#### Specified Scope Contract (Runs Before Issue Planning)",
    )
    const issuePlanningIndex = planPrompt.indexOf("### 2. Issue Planning & Structure")

    expect(scopeContractIndex).toBeGreaterThan(-1)
    expect(issuePlanningIndex).toBeGreaterThan(scopeContractIndex)
    expect(planPrompt).toContain("## Specified Scope Contract")
    expect(planPrompt).toContain("Explicitly included")
    expect(planPrompt).toContain("Confirmed by brainstorm/grill-me")
    expect(planPrompt).toContain("Inferred as necessary")
    expect(planPrompt).toContain("Deferred / non-goals")
    expect(planPrompt).toContain(
      "Every execution packet must trace to explicit, confirmed, or necessary scope",
    )
    expect(planPrompt).toContain("Reject or rework orphan packets")
    expect(planPrompt).toContain("Complexity Justification path")
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

  test("deepen-plan keeps deepening scoped and makes exhaustive breadth explicit opt-in", async () => {
    const deepenPrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "deepen-plan.md",
    )

    expect(deepenPrompt).toContain("Default mode: targeted deepening")
    expect(deepenPrompt).toContain("Only launch research/review agents for unresolved questions")
    expect(deepenPrompt).toContain("Exhaustive fan-out is opt-in")
    expect(deepenPrompt).not.toContain("Do NOT filter agents by \"relevance\" - run them ALL")
    expect(deepenPrompt).not.toContain("### WHY Integrity Check")
    expect(deepenPrompt).not.toContain("### Key Improvements")
    expect(deepenPrompt).not.toContain("### New Considerations Discovered")
  })

  test("plan prompt uses one adaptive template instead of detail-level menus", async () => {
    const planPrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "plan.md",
    )

    expect(planPrompt).toContain("### 4. Build One Adaptive Plan Template")
    expect(planPrompt).toContain("Optional sections catalog (include only when decision-bearing)")
    expect(planPrompt).toContain("Representative routine plan (compact and scannable)")
    expect(planPrompt).toContain("Include only when this section changes a decision")
    expect(planPrompt).not.toContain("### 4. Choose Implementation Detail Level")
    expect(planPrompt).not.toContain("#### 📄 MINIMAL (Quick Issue)")
    expect(planPrompt).not.toContain("#### 📋 MORE (Standard Issue)")
    expect(planPrompt).not.toContain("#### 📚 A LOT (Comprehensive Issue)")
  })
})
