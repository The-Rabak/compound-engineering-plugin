import { describe, expect, test } from "bun:test"
import { existsSync } from "fs"
import path from "path"
import convert from "../src/commands/convert"
import install from "../src/commands/install"
import sync from "../src/commands/sync"
import {
  cleanupRubric,
  getTargetNamesForSurface,
  legacyAssets,
  resolveTargetHandler,
  supportTierPositioning,
  targetPolicies,
} from "../src/targets"

describe("support-tier policy", () => {
  test("orders OpenCode first, Copilot second, and Claude third", () => {
    expect(targetPolicies.opencode.tier).toBe("first-class")
    expect(targetPolicies.opencode.cleanup).toBe("keep")
    expect(targetPolicies.copilot.tier).toBe("second-class")
    expect(targetPolicies.claude.tier).toBe("third-class")
    expect(supportTierPositioning).toContain("OpenCode is first-class")
    expect(supportTierPositioning).toContain("Copilot is second-class")
    expect(supportTierPositioning).toContain("Claude Code remains a third-class")
  })

  test("documents the cleanup rubric, non-core targets, and legacy assets", () => {
    expect(cleanupRubric.keep).toContain("maintain")
    expect(cleanupRubric["de-emphasize"]).toContain("compatibility bridge")
    expect(cleanupRubric.remove).toContain("migration path")

    expect(targetPolicies.codex.cleanup).toBe("de-emphasize")
    expect(targetPolicies.droid.cleanup).toBe("de-emphasize")
    expect(targetPolicies.pi.cleanup).toBe("de-emphasize")
    expect(targetPolicies.gemini.cleanup).toBe("de-emphasize")
    expect(targetPolicies.kiro.cleanup).toBe("de-emphasize")

    expect(legacyAssets.find((asset) => asset.name === ".github_gpt export tree")?.cleanup).toBe("remove")
    expect(legacyAssets.find((asset) => asset.name === "Dormant Cursor exporter and sync code")?.rationale).toContain(
      "not part of the surfaced target matrix",
    )
  })

  test("command help text exposes the support tiers", () => {
    expect(String(convert.meta.description)).toContain("OpenCode-first")
    expect(String(convert.args.to.description)).toContain("opencode (first-class)")
    expect(String(convert.args.to.description)).toContain("copilot (second-class)")
    expect(String(convert.args.to.description)).toContain("de-emphasized")

    expect(String(install.meta.description)).toContain("OpenCode-first")
    expect(String(install.args.to.description)).toContain("opencode (first-class)")
    expect(String(install.args.also.description)).toContain("de-emphasized compatibility")

    expect(String(sync.meta.description)).toContain("OpenCode-first")
    expect(String(sync.args.target.description)).toContain("Legacy mirrors")
  })

  test("surface registries only expose targets allowed by the support matrix", () => {
    expect(getTargetNamesForSurface("convert")).toEqual(["opencode", "copilot", "codex", "droid", "pi", "gemini", "kiro"])
    expect(getTargetNamesForSurface("install")).toEqual(["opencode", "copilot", "codex", "droid", "pi", "gemini", "kiro"])
    expect(getTargetNamesForSurface("sync")).toEqual(["opencode", "copilot", "codex", "droid", "pi"])

    expect(() => resolveTargetHandler("cursor", "convert")).toThrow("Unknown convert target: cursor")
    expect(() => resolveTargetHandler("claude", "install")).toThrow("Unknown install target: claude")
  })

  test("removes legacy cursor and github_gpt assets from the supported workflow", () => {
    const repoRoot = path.join(import.meta.dir, "..")

    expect(existsSync(path.join(repoRoot, ".github_gpt"))).toBe(false)
    expect(existsSync(path.join(repoRoot, "src", "converters", "claude-to-cursor.ts"))).toBe(false)
    expect(existsSync(path.join(repoRoot, "src", "sync", "cursor.ts"))).toBe(false)
    expect(existsSync(path.join(repoRoot, "src", "targets", "cursor.ts"))).toBe(false)
  })
})
