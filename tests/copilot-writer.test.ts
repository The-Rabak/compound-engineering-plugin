import { describe, expect, test } from "bun:test"
import { promises as fs } from "fs"
import os from "os"
import path from "path"
import { convertClaudeToCopilot } from "../src/converters/claude-to-copilot"
import { loadPortablePlugin } from "../src/parsers/portable"
import { writeCopilotBundle } from "../src/targets/copilot"
import type { CopilotBundle } from "../src/types/copilot"

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

describe("writeCopilotBundle", () => {
  test("writes copied skills with matching identifiers and working script paths", async () => {
    const repoPortableRoot = path.join(import.meta.dir, "..", "portable", "compound-engineering")
    const plugin = await loadPortablePlugin(repoPortableRoot)
    const bundle = convertClaudeToCopilot(plugin, {
      agentMode: "subagent",
      inferTemperature: false,
      permissions: "none",
    })

    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "copilot-writer-"))
    const githubRoot = path.join(tempRoot, ".github")
    await writeCopilotBundle(githubRoot, bundle)

    const skillRoot = path.join(githubRoot, "skills", "resolve-pr-parallel")
    const skillPath = path.join(skillRoot, "SKILL.md")
    const scriptPath = path.join(skillRoot, "scripts", "resolve-pr-thread")

    expect(await exists(skillPath)).toBe(true)
    expect(await exists(scriptPath)).toBe(true)
    expect(
      await exists(
        path.join(
          githubRoot,
          "skills",
          "workflows-work",
          "references",
          "execution-agent-prompt.md",
        ),
      ),
    ).toBe(true)

    const content = await fs.readFile(skillPath, "utf8")
    expect(content).toContain("name: resolve-pr-parallel")
    expect(content).toContain("skills/resolve-pr-parallel/scripts/resolve-pr-thread")

    const workflowContent = await fs.readFile(
      path.join(githubRoot, "skills", "workflows-work", "SKILL.md"),
      "utf8",
    )
    expect(workflowContent).toContain("references/execution-agent-prompt.md")
  })

  test("rejects unsafe generated output names", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "copilot-unsafe-"))
    const bundle: CopilotBundle = {
      agents: [],
      generatedSkills: [{ name: "../escape", content: "unsafe" }],
      skillDirs: [],
    }

    await expect(writeCopilotBundle(tempRoot, bundle)).rejects.toThrow(
      "skill name contains unsafe path characters: ../escape",
    )
  })
})
