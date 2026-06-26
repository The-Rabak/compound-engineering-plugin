import { describe, expect, test } from "bun:test"
import { promises as fs } from "fs"
import path from "path"
import { loadPortablePlugin } from "../src/parsers/portable"

const repoRoot = path.join(import.meta.dir, "..")
const portableRoot = path.join(repoRoot, "portable", "compound-engineering")

async function readRepoFile(...segments: string[]): Promise<string> {
  return fs.readFile(path.join(repoRoot, ...segments), "utf8")
}

describe("workflow-next-step skill", () => {
  test("registers the skill and defines the core workflow graph", async () => {
    const plugin = await loadPortablePlugin(portableRoot)
    const skill = plugin.skills.find((candidate) => candidate.name === "workflow-next-step")
    const content = await readRepoFile(
      "portable",
      "compound-engineering",
      "skills",
      "workflow-next-step",
      "SKILL.md",
    )

    expect(skill).toBeDefined()
    expect(content).toContain("constitution -> brainstorm -> grill-with-docs -> plan -> architecture -> deepen-plan -> to-issues -> work -> review -> triage -> compound")
    expect(content).toContain("## Workflow Progress")
    expect(content).toContain("## Completed Stage Summaries")
    expect(content).toContain("## Next Session")
    expect(content).toContain("- [ ] grill-with-docs")
    expect(content).toContain("Recommended next step:")
    expect(content).toContain("## Advisor Procedure")
    expect(content).toContain("### Current Chain Selection")
    expect(content).toContain("## Stage Summaries")
    expect(content).toContain("### Decision Gate Order")
    expect(content).toContain("### Stage Rules")
    expect(content).toContain("After `brainstorm`, recommend `grill-with-docs`")
    expect(content).toContain("After `deepen-plan`, recommend `/workflows:to-issues")
    expect(content).toContain("/workflows:triage todos <first>-<last>")
    expect(content).toContain("/workflows:triage todos 13-23")
    expect(content).toContain("## Advisor-Owned Options")
    expect(content).toContain("## Visual Plan Routing")
    expect(content).toContain("Generate the local visual plan with local-visual-artifact-renderer")
    expect(content).toContain("Then run:")
  })

  test("defines a meticulous advisor decision procedure before routing", async () => {
    const content = await readRepoFile(
      "portable",
      "compound-engineering",
      "skills",
      "workflow-next-step",
      "SKILL.md",
    )

    const expectedProcedure = [
      "**Identify the active lane**",
      "**Bind the current chain**",
      "**Audit completion evidence**",
      "**Summarize completed stages**",
      "**Apply decision gates in order**",
      "**Emit one next-session directive**",
    ]
    for (const step of expectedProcedure) {
      expect(content).toContain(step)
    }

    const expectedGates = [
      "**Validity gate**",
      "**Blocked-input gate**",
      "**Visual-plan gate**",
      "**Graph gate**",
      "**Stop gate**",
    ]
    for (const gate of expectedGates) {
      expect(content).toContain(gate)
    }

    expect(content).toContain("If chain identity is ambiguous, do not infer completion from nearby files.")
    expect(content).toContain("Never mark a step complete only because an unrelated file exists.")
    expect(content).toContain("Do not invent a path.")
    expect(content).toContain("output one recommended path, not a menu")
  })

  test("requires concise path-grounded summaries for each prior workflow stage", async () => {
    const content = await readRepoFile(
      "portable",
      "compound-engineering",
      "skills",
      "workflow-next-step",
      "SKILL.md",
    )
    const summaryContracts = [
      "`constitution`: governing constraint",
      "`brainstorm`: user story",
      "`grill-with-docs`: canonical terms/boundaries",
      "`plan`: execution shape",
      "`architecture`: feature home",
      "`deepen-plan`: major hardening decisions",
      "`to-issues`: ticket index path",
      "`work`: execution-session state path",
      "`review`: review result",
      "`triage`: todo scope resolved",
      "`compound`: solution doc path",
      "`debug`: reproduced trigger",
      "`compound-refresh`: refreshed solution docs",
    ]

    for (const contract of summaryContracts) {
      expect(content).toContain(contract)
    }

    expect(content).toContain("Do not summarize stages that are merely adjacent or discovered by date.")
    expect(content).toContain("- `<stage>` — <one factual summary tied to an artifact path>")
  })

  test("documents every post-stage routing rule in graph order", async () => {
    const content = await readRepoFile(
      "portable",
      "compound-engineering",
      "skills",
      "workflow-next-step",
      "SKILL.md",
    )
    const stageRules = [
      "After `constitution`, recommend `/workflows:brainstorm",
      "After `brainstorm`, recommend `grill-with-docs`",
      "After `grill-with-docs`, recommend `/workflows:plan",
      "After `plan`, recommend `/workflows:architecture",
      "After `architecture`, recommend `/deepen-plan",
      "After `deepen-plan`, recommend `/workflows:to-issues",
      "After `to-issues`, recommend `/workflows:work",
      "After `work`, recommend `/workflows:review",
      "After `review`, recommend a full `/workflows:triage` command",
      "After `triage`, recommend another scoped `/workflows:review",
      "After `compound`, report the chain complete",
      "After `debug`, recommend the command named in the debug result's `Fix or next step`",
      "After `compound-refresh`, report maintenance complete",
    ]

    let previousIndex = -1
    for (const rule of stageRules) {
      const currentIndex = content.indexOf(rule)
      expect(currentIndex).toBeGreaterThan(previousIndex)
      previousIndex = currentIndex
    }

    expect(content).toContain("Never skip `review` after `work`")
    expect(content).toContain("never skip `triage` when review-created todos are pending")
    expect(content).toContain("never skip `compound` when a reusable solution was produced")
  })

  test("core workflows invoke the next-step advisor as their final handoff", async () => {
    const workflowFiles = [
      ["portable", "compound-engineering", "commands", "workflows", "constitution.md"],
      ["portable", "compound-engineering", "commands", "workflows", "brainstorm.md"],
      ["portable", "compound-engineering", "commands", "workflows", "plan.md"],
      ["portable", "compound-engineering", "commands", "workflows", "architecture.md"],
      ["portable", "compound-engineering", "commands", "deepen-plan.md"],
      ["portable", "compound-engineering", "commands", "workflows", "to-issues.md"],
      ["portable", "compound-engineering", "commands", "workflows", "work.md"],
      ["portable", "compound-engineering", "commands", "workflows", "review.md"],
      ["portable", "compound-engineering", "commands", "workflows", "triage.md"],
      ["portable", "compound-engineering", "commands", "workflows", "compound.md"],
      ["portable", "compound-engineering", "commands", "workflows", "debug.md"],
      ["portable", "compound-engineering", "commands", "workflows", "compound-refresh.md"],
    ]

    for (const file of workflowFiles) {
      const content = await readRepoFile(...file)
      expect(content).toContain("## Final Phase: Workflow Next Step Advisor")
      expect(content).toContain("load the `workflow-next-step` skill")
      expect(content).toContain("output the full core workflow checklist and the exact next-session command")
    }

    const grill = await readRepoFile("portable", "compound-engineering", "skills", "grill-me", "SKILL.md")
    expect(grill).toContain("## Final Handoff: Workflow Next Step Advisor")
    expect(grill).toContain("load the `workflow-next-step` skill")
  })

  test("core workflow commands do not own final handoff menus", async () => {
    const workflowFiles = [
      ["portable", "compound-engineering", "commands", "workflows", "constitution.md"],
      ["portable", "compound-engineering", "commands", "workflows", "brainstorm.md"],
      ["portable", "compound-engineering", "commands", "workflows", "plan.md"],
      ["portable", "compound-engineering", "commands", "workflows", "architecture.md"],
      ["portable", "compound-engineering", "commands", "deepen-plan.md"],
      ["portable", "compound-engineering", "commands", "workflows", "to-issues.md"],
      ["portable", "compound-engineering", "commands", "workflows", "work.md"],
      ["portable", "compound-engineering", "commands", "workflows", "review.md"],
      ["portable", "compound-engineering", "commands", "workflows", "triage.md"],
      ["portable", "compound-engineering", "commands", "workflows", "compound.md"],
      ["portable", "compound-engineering", "commands", "workflows", "debug.md"],
      ["portable", "compound-engineering", "commands", "workflows", "compound-refresh.md"],
    ]
    const forbiddenEndings = [
      "## Post-Generation Options",
      "## Post-Enhancement Options",
      "### Phase 4: Handoff",
      "## Done Options",
      "Then offer next steps:",
      "What would you like to do next?",
      "What's next?",
      "Based on selection:",
      "Loop back to options",
      "Create local visual artifact from this brainstorm.",
      "Create local visual plan from this plan.",
      "Create local architecture visual artifact.",
    ]

    for (const file of workflowFiles) {
      const content = await readRepoFile(...file)
      for (const forbidden of forbiddenEndings) {
        expect(content).not.toContain(forbidden)
      }
    }
  })
})
