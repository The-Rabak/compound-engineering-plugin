import { describe, expect, test } from "bun:test"
import { promises as fs } from "fs"
import path from "path"

const repoRoot = path.join(import.meta.dir, "..")

async function readRepoFile(...segments: string[]): Promise<string> {
  return fs.readFile(path.join(repoRoot, ...segments), "utf8")
}

describe("ticket-scoped work execution", () => {
  test("work can execute a ticket artifact without reloading the whole backlog", async () => {
    const workPrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "work.md",
    )
    const executionPrompt = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "references",
      "execution-agent-prompt.md",
    )

    expect(workPrompt).toContain("[plan file, ticket file, specification, or todo file path]")
    expect(workPrompt).toContain("ticket-execution-contract.md")
    expect(workPrompt).toContain("The ticket is the primary execution unit")
    expect(workPrompt).toContain("source_type: [plan | ticket | specification | todo]")
    expect(workPrompt).toContain("ticket_file: [path to ticket, if applicable]")
    expect(workPrompt).toContain("Prefer ticket-defined unit directly")
    expect(workPrompt).toContain("{{PARENT_REFS}}")
    expect(workPrompt).toContain("{{TICKET_LOCAL_CONTEXT}}")
    expect(workPrompt).toContain("update the ticket `status` field")
    expect(executionPrompt).toContain("**Parent refs:** {{PARENT_REFS}}")
    expect(executionPrompt).toContain("## Ticket-local context")
    expect(executionPrompt).toContain("{{TICKET_LOCAL_CONTEXT}}")
  })
})
