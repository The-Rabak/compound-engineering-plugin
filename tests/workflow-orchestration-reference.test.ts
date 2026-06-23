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

  test("local visual artifact reference defines local-only sidecar rules", async () => {
    const portableReference = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "references",
      "local-visual-artifacts.md",
    )
    const generatedReference = await readRepoFile(
      "plugins",
      "compound-engineering",
      "commands",
      "workflows",
      "references",
      "local-visual-artifacts.md",
    )
    const forbiddenHostedTools = [
      "create-visual-plan",
      "create-visual-recap",
      "update-visual-plan",
      "patch-visual-plan-source",
      "import-visual-plan-source",
      "export-visual-plan",
      "set-resource-visibility",
    ]

    for (const reference of [portableReference, generatedReference]) {
      expect(reference).toContain("Canonical Markdown artifacts remain the source of truth")
      expect(reference).toContain("docs/visual-artifacts/<workflow>/<slug>/")
      expect(reference).toContain(".plan-url")
      expect(reference).toContain("Raw upstream `visual-plan` and `visual-recap` skills are not vendored")
      expect(reference).toContain("Hosted MCP tools are forbidden")
      expect(reference).toContain("@agent-native/core@<approved-version> plan local check")
      expect(reference).toContain("@agent-native/core@<approved-version> plan local preview")
      expect(reference).toContain("@agent-native/core@<approved-version> plan local serve")
      expect(reference).toContain("--app-url http://127.0.0.1:<port>")
      expect(reference).toContain("--kind recap")
      expect(reference).toContain("## Workflow Template Profiles")
      expect(reference).toContain("### brainstorm")
      expect(reference).toContain("### plan")
      expect(reference).toContain("### architecture")
      expect(reference).toContain("### review")
      expect(reference).not.toContain("mcpServers.plan")
      expect(reference).not.toContain("@agent-native/core@latest")

      for (const tool of forbiddenHostedTools) {
        expect(reference).toContain(`\`${tool}\``)
      }
    }
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

  test("workflow prompts offer local visual artifacts only after canonical artifacts are finalized", async () => {
    const workflowPrompts = {
      brainstorm: await readRepoFile(
        "portable",
        "compound-engineering",
        "commands",
        "workflows",
        "brainstorm.md",
      ),
      plan: await readRepoFile(
        "portable",
        "compound-engineering",
        "commands",
        "workflows",
        "plan.md",
      ),
      architecture: await readRepoFile(
        "portable",
        "compound-engineering",
        "commands",
        "workflows",
        "architecture.md",
      ),
      review: await readRepoFile(
        "portable",
        "compound-engineering",
        "commands",
        "workflows",
        "review.md",
      ),
    }

    expect(workflowPrompts.brainstorm).toContain("Create local visual artifact from this brainstorm.")
    expect(workflowPrompts.plan).toContain("Create local visual plan from this plan.")
    expect(workflowPrompts.architecture).toContain("Create local architecture visual artifact.")
    expect(workflowPrompts.review).toContain("Create local visual recap from this review/diff.")

    expect(workflowPrompts.brainstorm).toContain("Lite mode still presents this option")
    expect(workflowPrompts.plan).toContain("Lite mode still presents this option")

    expect(workflowPrompts.brainstorm).toContain("source_workflow: brainstorm")
    expect(workflowPrompts.plan).toContain("source_workflow: plan")
    expect(workflowPrompts.architecture).toContain("source_workflow: architecture")
    expect(workflowPrompts.review).toContain("source_workflow: review")

    for (const prompt of [workflowPrompts.brainstorm, workflowPrompts.plan, workflowPrompts.architecture]) {
      expect(prompt).toContain("visual_kind: plan")
    }
    expect(workflowPrompts.review).toContain("visual_kind: recap")

    for (const prompt of Object.values(workflowPrompts)) {
      expect(prompt).toContain("local-visual-artifact-renderer")
      expect(prompt).toContain("source_path")
      expect(prompt).toContain("commands/workflows/references/local-visual-artifacts.md")
      expect(prompt).toContain("after the canonical Markdown artifact is finalized")
      expect(prompt).not.toContain("mcpServers.plan")
      expect(prompt).not.toContain("create-visual-plan")
      expect(prompt).not.toContain("create-visual-recap")
      expect(prompt).not.toContain("publish visual")
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

  test("lite mode is a compact path with the same planning contract", async () => {
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

    expect(minimalPlanning).toContain("Lite-mode inputs")
    expect(minimalPlanning).toContain("`--lite`")
    expect(minimalPlanning).toContain("small")
    expect(minimalPlanning).toContain("routine")
    expect(minimalPlanning).toContain("Lite-mode outputs")
    expect(minimalPlanning).toContain("one or a few execution packets")
    expect(minimalPlanning).toContain("direct `/workflows:work <plan>`")

    expect(brainstormPrompt).toContain("#### Lite / Already-Clear Requirement Path")
    expect(brainstormPrompt).toContain("When the user explicitly says `--lite`, \"lite\", \"small\", \"routine\"")
    expect(brainstormPrompt).toContain("Skip broad discovery and run the shortest decision-bearing dialogue")
    expect(brainstormPrompt).toContain("still produce or validate the problem narrative, user story, architectural context, and success criteria")

    expect(planPrompt).toContain("#### Lite Mode Contract")
    expect(planPrompt).toContain("Detect explicit lite intent from `--lite`, \"lite\", \"small\", \"routine\"")
    expect(planPrompt).toContain("Skip the structured project-input questionnaire unless the user mentions tickets, docs, Figma, or spec files")
    expect(planPrompt).toContain("Skip external research unless the topic is high-risk, unfamiliar, or lacks local patterns")
    expect(planPrompt).toContain("Use compact SpecFlow/e2e self-checks for low-risk work")
    expect(planPrompt).toContain("Produce one or a few execution packets")
    expect(planPrompt).toContain("Recommend direct `/workflows:work <plan>`")
    expect(planPrompt).toContain("Lite mode reduces ceremony, not evidence quality or traceability")
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
