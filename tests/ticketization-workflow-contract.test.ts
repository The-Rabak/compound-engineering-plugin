import { describe, expect, test } from "bun:test"
import { promises as fs } from "fs"
import path from "path"
import { loadPortablePlugin } from "../src/parsers/portable"

const repoRoot = path.join(import.meta.dir, "..")
const portableRoot = path.join(repoRoot, "portable", "compound-engineering")

async function readRepoFile(...segments: string[]): Promise<string> {
  return fs.readFile(path.join(repoRoot, ...segments), "utf8")
}

describe("ticketization workflow contract", () => {
  test("defines the shared reference for local ticket artifacts and context packaging", async () => {
    const contract = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "references",
      "ticketization-contract.md",
    )
    const executionContract = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "references",
      "ticket-execution-contract.md",
    )
    const primingSkill = await readRepoFile(
      "portable",
      "compound-engineering",
      "skills",
      "focused-ticket-priming",
      "SKILL.md",
    )

    expect(contract).toContain("# Ticketization Workflow Contract")
    expect(contract).toContain("**Command name:** `/workflows:to-issues`")
    expect(contract).toContain("focused-ticket-priming")
    expect(contract).toContain("docs/tickets/YYYY-MM-DD-<topic>/")
    expect(contract).toContain("tickets_ref:")
    expect(contract).toContain("local-artifact first")
    expect(contract).toContain("## Dependency graph and execution batches")
    expect(contract).toContain("Default-to-sequential rule")
    expect(contract).toContain("last_completed_batch")
    expect(contract).toContain("## Required ticket-local context")
    expect(contract).toContain("required frontmatter")
    expect(contract).toContain("required body section order")
    expect(contract).toContain("canonical WHY source path")
    expect(contract).toContain("## Final ticket-set review")
    expect(contract).toContain("ticket-flow-auditor")
    expect(executionContract).toContain("# Ticket Execution Contract")
    expect(executionContract).toContain("ticket_id:")
    expect(executionContract).toContain("## Required ticket body")
    expect(executionContract).toContain("status: ready")
    expect(executionContract).toContain("last_completed_batch")
    expect(executionContract).toContain("## Execution Batches")
    expect(executionContract).toContain("canonical WHY source path")
    expect(executionContract).toContain("should reference this file instead of restating the concrete ticket schema")
    expect(executionContract).not.toContain("smallest WHY summary")
    expect(primingSkill).toContain("# Focused Ticket Priming")
    expect(primingSkill).toContain("ticket-execution-contract.md")
    expect(primingSkill).toContain("Use when converting plans into local")
    expect(primingSkill).toContain("tickets or when execution needs one ticket-sized context pack")
  })

  test("registers workflows:to-issues and loads the shared ticketization contract", async () => {
    const plugin = await loadPortablePlugin(portableRoot)
    expect(plugin.commands.some((command) => command.name === "workflows:to-issues")).toBe(true)
    expect(plugin.skills.some((skill) => skill.name === "focused-ticket-priming")).toBe(true)

    const command = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "to-issues.md",
    )

    expect(command).toContain("This phase sits after `/workflows:plan` or `/deepen-plan`")
    expect(command).toContain("ticketization-contract.md")
    expect(command).toContain("ticket-execution-contract.md")
    expect(command).toContain("vertical-slice-architecture.md")
    expect(command).toContain("orchestration-protocol.md")
    expect(command).toContain("focused-ticket-priming/SKILL.md")
    expect(command).toContain("docs/tickets/YYYY-MM-DD-<topic>/")
    expect(command).toContain("ticket-flow-auditor")
    expect(command).toContain("document-review pass and final ticket-set review sweep")
    expect(command).toContain("dependency graph")
    expect(command).toContain("last_completed_batch")
  })

  test("documents the new workflow step and shipped command surface", async () => {
    const rootReadme = await readRepoFile("README.md")
    const pluginReadme = await readRepoFile("plugins", "compound-engineering", "README.md")
    const planPrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "plan.md",
    )
    const changelog = await readRepoFile("plugins", "compound-engineering", "CHANGELOG.md")

    expect(rootReadme).toContain("plan -> architecture -> deepen-plan -> to-issues -> work")
    expect(rootReadme).toContain("`/workflows:to-issues`")
    expect(rootReadme).toContain("docs/tickets/")
    expect(pluginReadme).toContain("Includes 34 specialized agents, 28 commands, and 26 skills.")
    expect(pluginReadme).toContain("| Commands | 28 |")
    expect(pluginReadme).toContain("`/workflows:to-issues`")
    expect(planPrompt).toContain("Run `/workflows:to-issues`")
    expect(planPrompt).toContain("tickets_ref")
    expect(changelog).toContain("**`/workflows:to-issues` command**")
  })
})
