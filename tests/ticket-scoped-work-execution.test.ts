import { describe, expect, test } from "bun:test"
import { promises as fs } from "fs"
import path from "path"

const repoRoot = path.join(import.meta.dir, "..")

async function readRepoFile(...segments: string[]): Promise<string> {
  return fs.readFile(path.join(repoRoot, ...segments), "utf8")
}

describe("ticket-scoped work execution", () => {
  test("work can execute a ticket index or ticket artifact without reloading the whole backlog", async () => {
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
    const executionAgent = await readRepoFile(
      "portable",
      "compound-engineering",
      "agents",
      "workflow",
      "execution-agent.md",
    )

    expect(workPrompt).toContain("[plan file, ticket index, ticket file, specification, or todo file path]")
    expect(workPrompt).toContain("ticket-execution-contract.md")
    expect(workPrompt).toContain("When the input is a ticket index, that index becomes the authoritative execution queue")
    expect(workPrompt).toContain("that ticket becomes the primary execution packet")
    expect(workPrompt).toContain("Ticket execution must always go through the bundled `execution-agent`")
    expect(workPrompt).toContain("source_type: [plan | ticket-index | ticket | specification | todo]")
    expect(workPrompt).toContain("ticket_index: [path to ticket index, if applicable]")
    expect(workPrompt).toContain("ticket_file: [path to ticket, if applicable]")
    expect(workPrompt).toContain("last_completed_batch")
    expect(workPrompt).toContain("execute the next unresolved batch as written")
    expect(workPrompt).toContain("Prefer ticket-defined unit directly")
    expect(workPrompt).toContain("Named Agent Dispatch")
    expect(workPrompt).toContain("Task(execution-agent, prompt=scoped_prompt)")
    expect(workPrompt).toContain("{{PARENT_REFS}}")
    expect(workPrompt).toContain("{{TICKET_LOCAL_CONTEXT}}")
    expect(workPrompt).toContain("ticket-index input: update the selected batch status in `index.md`")
    expect(workPrompt).toContain("update the ticket `status` field")
    expect(executionPrompt).toContain("**Parent refs:** {{PARENT_REFS}}")
    expect(executionPrompt).toContain("## Ticket-local context")
    expect(executionPrompt).toContain("{{TICKET_LOCAL_CONTEXT}}")
    expect(executionPrompt).toContain("named `execution-agent`")
    expect(executionAgent).toContain("name: execution-agent")
    expect(executionAgent).toContain("doc blocks or docstrings above public or exported functions")
    expect(executionAgent).toContain("Keep imports at the top of the file")
  })
})
