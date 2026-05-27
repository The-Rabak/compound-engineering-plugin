import { describe, expect, test } from "bun:test"
import { promises as fs } from "fs"
import path from "path"

const repoRoot = path.join(import.meta.dir, "..")
const skillPath = path.join(repoRoot, "portable", "compound-engineering", "skills", "grill-me", "SKILL.md")

describe("grill-with-docs skill", () => {
  test("routes implementation details into the active feature artifact inline", async () => {
    const content = await fs.readFile(skillPath, "utf8")

    expect(content).toContain("the plan file is the implementation-decision sink")
    expect(content).toContain("the brainstorm document is the implementation-decision sink")
    expect(content).toContain("immediately write it into the active feature doc")
    expect(content).toContain("Do not wait until the end of the session")
    expect(content).toContain("CONTEXT.md` is only for canonical domain language")
    expect(content).toContain("`CONTEXT.md` should be totally devoid of implementation details")
  })
})
