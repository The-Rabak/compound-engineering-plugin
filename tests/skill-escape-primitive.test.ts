import { describe, expect, test } from "bun:test"
import { promises as fs } from "fs"
import path from "path"

/**
 * Regression guard for todo 020: the T01 island-serialization escape
 * primitive (`island-contract.md`'s "Serialization primitive" section --
 * `JSON.stringify(value)`, then `<`->`<`, `>`->`>`, `/`->`/`,
 * U+2028->` `, U+2029->` `) is hand-duplicated in prose across four
 * files: the spec (`island-contract.md`), the reference implementation
 * (`tests/support/island-spec.ts`), and the two operative SKILL files the
 * composer/mutator subagents actually read and follow
 * (`html-artifact-composer/SKILL.md`, `html-artifact-mutator/SKILL.md`).
 *
 * The round-trip tests in `html-artifact-island.test.ts` exercise the
 * reference implementation, not the SKILL prose -- so a corrupted SKILL
 * escape line (one that maps every source character to itself, a no-op)
 * stays invisible to that suite even though it would defuse none of the
 * escape's injection protection at generation time. This suite reads the
 * SKILL files as text and asserts each declared escape target is the
 * literal `\uXXXX` sequence documented in `island-contract.md`, never the
 * unescaped source character. It guards both the portable source and the
 * generated `plugins/` twin, for both the composer and the mutator.
 */

const repoRoot = path.join(import.meta.dir, "..")

async function readRepoFile(relativePath: string): Promise<string> {
  return fs.readFile(path.join(repoRoot, relativePath), "utf8")
}

/**
 * The five escape declarations the T01 primitive documents, keyed by the
 * exact source-side token as it appears immediately before the arrow in
 * both SKILL files' prose (`<`/`>`/`/` are backtick-quoted; the two
 * separators are written as bare `U+2028`/`U+2029`).
 */
const EXPECTED_ESCAPE_TARGETS: Record<string, string> = {
  "`<`": "\\u003C",
  "`>`": "\\u003E",
  "`/`": "\\u002F",
  "U+2028": "\\u2028",
  "U+2029": "\\u2029",
}

/**
 * Finds the backtick-quoted escape target declared for `sourceToken` in a
 * SKILL.md's T01 primitive sentence (`SOURCE → `TARGET`` or
 * `SOURCE→`TARGET`` -- the composer and mutator prose differ in arrow
 * spacing but not in structure). Throws if no declaration is found, so a
 * reworded or deleted escape line fails the test loudly instead of the
 * check silently matching nothing.
 */
function extractEscapeTarget(skillText: string, sourceToken: string): string {
  const escapedSource = sourceToken.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const pattern = new RegExp(`${escapedSource}\\s*→\\s*\`([^\`]*)\``)
  const match = skillText.match(pattern)
  if (!match) {
    throw new Error(`could not find an escape declaration for ${sourceToken} in the given SKILL text`)
  }
  return match[1]
}

const SKILL_FILES = [
  ["portable composer", "portable/compound-engineering/skills/html-artifact-composer/SKILL.md"],
  ["portable mutator", "portable/compound-engineering/skills/html-artifact-mutator/SKILL.md"],
  ["generated composer", "plugins/compound-engineering/skills/html-artifact-composer/SKILL.md"],
  ["generated mutator", "plugins/compound-engineering/skills/html-artifact-mutator/SKILL.md"],
] as const

describe("SKILL escape-primitive regression guard (todo 020)", () => {
  for (const [label, relativePath] of SKILL_FILES) {
    test(`${label} SKILL.md declares every T01 escape target as its literal \\uXXXX sequence, not a raw-char no-op`, async () => {
      const skillText = await readRepoFile(relativePath)

      for (const [sourceToken, expectedTarget] of Object.entries(EXPECTED_ESCAPE_TARGETS)) {
        const actualTarget = extractEscapeTarget(skillText, sourceToken)
        expect(actualTarget).toBe(expectedTarget)
      }
    })
  }
})
