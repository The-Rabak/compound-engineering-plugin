import { describe, expect, test } from "bun:test"
import { promises as fs } from "fs"
import path from "path"

const repoRoot = path.join(import.meta.dir, "..")

async function readRepoFile(...segments: string[]): Promise<string> {
  return fs.readFile(path.join(repoRoot, ...segments), "utf8")
}

async function pathExists(...segments: string[]): Promise<boolean> {
  try {
    await fs.access(path.join(repoRoot, ...segments))
    return true
  } catch {
    return false
  }
}

describe("TDD contract surfaces", () => {
  test("setup skill asks about the Ralph loop and writes visible config", async () => {
    const setupSkill = await readRepoFile(
      "portable",
      "compound-engineering",
      "skills",
      "setup",
      "SKILL.md",
    )

    expect(setupSkill).toContain("What should the default delivery loop be for this repo?")
    expect(setupSkill).toContain("Ralph-driven TDD (Recommended)")
    expect(setupSkill).toContain("tdd:")
    expect(setupSkill).toContain("precedence: plan_overrides_local")
    expect(setupSkill).toContain("tdd_enabled")
  })

  test("plan command defines explicit TDD precedence, evidence, and exceptions", async () => {
    const planPrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "plan.md",
    )

    expect(planPrompt).toContain("## TDD & Evidence Contract")
    expect(planPrompt).toContain("Plan-level `tdd` values override `compound-engineering.local.md`")
    expect(planPrompt).toContain("unit + e2e evidence")
    expect(planPrompt).toContain("replacement_evidence")
    expect(planPrompt).toContain("commands/workflows/references/execution-shape.md")
    expect(planPrompt).toContain("execution_shape:")
    expect(planPrompt).toContain("## Execution Shape")
    expect(planPrompt).toContain("vertical-slices")
  })

  test("deepen-plan preserves and validates the resolved TDD contract", async () => {
    const deepenPrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "deepen-plan.md",
    )

    expect(deepenPrompt).toContain("resolve the effective TDD contract")
    expect(deepenPrompt).toContain("Do not silently weaken the TDD contract")
    expect(deepenPrompt).toContain("unit + e2e evidence required")
    expect(deepenPrompt).toContain("justified exception")
  })

  test("deepen-plan defaults to targeted inline deepening instead of append-heavy summaries", async () => {
    const deepenPrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "deepen-plan.md",
    )

    expect(deepenPrompt).toContain("Default mode: targeted deepening")
    expect(deepenPrompt).toContain("Exhaustive fan-out is opt-in")
    expect(deepenPrompt).toContain("Integrate findings inline into the relevant plan section")
    expect(deepenPrompt).toContain("Optional compact change note")
    expect(deepenPrompt).not.toContain("The goal is MAXIMUM coverage, not efficiency")
    expect(deepenPrompt).not.toContain("## Enhancement Summary")
    expect(deepenPrompt).not.toContain("### Research Insights")
  })

  test("work command makes Ralph the default execution path and requires stable evidence", async () => {
    const workPrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "work.md",
    )

    expect(workPrompt).toContain("`/workflows:work` is the canonical Ralph red-green-refactor path")
    expect(workPrompt).toContain("resolve the effective TDD contract")
    expect(workPrompt).toContain("Ralph-driven `red-green-refactor` with unit + e2e evidence required")
    expect(workPrompt).toContain("stable `Red`, `Green`, and `Post-Refactor Green` evidence blocks")
  })

  test("execution agent prompt requires a stable red-green-post-refactor report format", async () => {
    const executionPrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "references",
      "execution-agent-prompt.md",
    )

    expect(executionPrompt).toContain("## TDD Execution Contract")
    expect(executionPrompt).toContain("### TDD Evidence")
    expect(executionPrompt).toContain("Post-Refactor Green")
    expect(executionPrompt).toContain("Ralph is the default TDD execution path")
    expect(executionPrompt).toContain("Red` and `Green` prove behavior coverage")
    expect(executionPrompt).toContain("Post-Refactor Green` proves cleanup safety")
    expect(executionPrompt).toContain("If no cleanup was needed, still rerun and say so")
  })

  test("execution agent carries explicit clean-code implementation guardrails", async () => {
    const executionAgent = await readRepoFile(
      "portable",
      "compound-engineering",
      "agents",
      "workflow",
      "execution-agent.md",
    )

    expect(executionAgent).toContain("## Clean-code operating rules")
    expect(executionAgent).toContain("Apply DRY by reason to change")
    expect(executionAgent).toContain("Apply SOLID deliberately")
    expect(executionAgent).toContain("Add doc blocks or docstrings above public or exported functions")
    expect(executionAgent).toContain("Keep imports at the top of the file")
    expect(executionAgent).toContain("Fail explicitly")
  })

  test("review prompts reject weak evidence and separate behavior coverage from cleanup quality", async () => {
    const reviewPrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "review.md",
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

    expect(reviewPrompt).toContain("#### TDD Evidence Gate (BEFORE reviewer dispatch)")
    expect(reviewPrompt).toContain("Missing behavior coverage")
    expect(reviewPrompt).toContain("Missing cleanup after refactor")
    expect(reviewPrompt).toContain("Keep the gate output terse and evidence-based")

    expect(specPrompt).toContain("## TDD Evidence Gate")
    expect(specPrompt).toContain("Missing behavior coverage")
    expect(specPrompt).toContain("Keep the report terse")

    expect(qualityPrompt).toContain("## TDD Evidence Gate")
    expect(qualityPrompt).toContain("Missing cleanup after refactor")
    expect(qualityPrompt).toContain("Do not reopen behavior-coverage gaps here")
    expect(qualityPrompt).toContain("Keep the report terse")
  })

  test("ralph helper commands and lrj route through ticketized work instead of detached side loops", async () => {
    const ralphLoop = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "ralph-loop.md",
    )
    const cancelRalph = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "cancel-ralph.md",
    )
    const lrj = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "lrj.md",
    )

    expect(ralphLoop).toContain("canonical red-green-refactor engine behind `/workflows:work`")
    expect(ralphLoop).toContain("Post-Refactor Green")
    expect(cancelRalph).toContain("default Ralph execution path")
    expect(lrj).toContain("/workflows:to-issues <plan_file>")
    expect(lrj).toContain("Run `ticket-flow-auditor` against the generated ticket set.")
    expect(lrj).toContain("Initialize `current_batch = 1` and `batch_window = 2`.")
    expect(lrj).toContain("/workflows:work <tickets_index_file> --batches <start>-<end>")
    expect(lrj).toContain("/workflows:review <tickets_index_file> <work_execution_session> --batches <start>-<end>")
    expect(lrj).toContain("/workflows:triage <review_todo_range> --auto-recommended --execute")
    expect(lrj).toContain("create one detailed git commit for all changes made during that two-batch window")
    expect(lrj).toContain("### 8. Batch Commit")
    expect(lrj).toContain("commit_sha")
    expect(lrj).toContain("Do not advance the cursor")
    expect(lrj).not.toContain("/compound-engineering:ralph-loop")
    expect(lrj).not.toContain("/resolve_todo_parallel")
    expect(lrj).not.toContain("/deepen-plan")
    expect(await pathExists("portable", "compound-engineering", "commands", "lfg.md")).toBe(false)
    expect(await pathExists("portable", "compound-engineering", "commands", "slfg.md")).toBe(false)
  })

  test("setup skill documents the visible local TDD defaults and precedence", async () => {
    const localConfig = await readRepoFile(
      "portable",
      "compound-engineering",
      "skills",
      "setup",
      "SKILL.md",
    )

    expect(localConfig).toContain("tdd_enabled: {true|false}")
    expect(localConfig).toContain("mode: {ralph|standard}")
    expect(localConfig).toContain("loop: {red-green-refactor|implementation-first}")
    expect(localConfig).toContain("precedence: plan_overrides_local")
    expect(localConfig).toContain("Plan-level `tdd` values override this file")
  })
})
