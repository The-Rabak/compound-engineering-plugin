import { describe, expect, test } from "bun:test"
import { promises as fs } from "fs"
import path from "path"

const repoRoot = path.join(import.meta.dir, "..")

const baselineChars = {
  "portable/compound-engineering/skills/orchestrating-swarms/SKILL.md": 47241,
  "portable/compound-engineering/skills/compound-docs/SKILL.md": 14569,
  "portable/compound-engineering/skills/agent-native-architecture/SKILL.md": 25019,
  "portable/compound-engineering/agents/review/rabak-nest-reviewer.md": 16411,
  "portable/compound-engineering/agents/review/rabak-rust-reviewer.md": 15427,
  "portable/compound-engineering/agents/review/code-simplicity-reviewer.md": 15600,
  "portable/compound-engineering/agents/review/rabak-vue-reviewer.md": 12354,
  "portable/compound-engineering/agents/review/rabak-laravel-reviewer.md": 12307,
  "portable/compound-engineering/agents/research/learnings-researcher.md": 11176,
  "portable/compound-engineering/agents/review/agent-native-reviewer.md": 8556,
} as const

describe("prompt footprint", () => {
  test("heaviest prompt surfaces stay under the 75% footprint target", async () => {
    for (const [relativePath, baseline] of Object.entries(baselineChars)) {
      const content = await fs.readFile(path.join(repoRoot, relativePath), "utf8")
      expect(content.length).toBeLessThanOrEqual(Math.floor(baseline * 0.75))
    }
  })

  test("combined heaviest prompt surface stays under the 70% total-footprint target", async () => {
    let currentTotal = 0
    let baselineTotal = 0

    for (const [relativePath, baseline] of Object.entries(baselineChars)) {
      const content = await fs.readFile(path.join(repoRoot, relativePath), "utf8")
      currentTotal += content.length
      baselineTotal += baseline
    }

    expect(currentTotal).toBeLessThanOrEqual(Math.floor(baselineTotal * 0.7))
  })
})
