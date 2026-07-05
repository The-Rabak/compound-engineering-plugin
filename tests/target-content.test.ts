import { describe, expect, test } from "bun:test"
import { canonicalModelForTarget, replaceModelIdsForTarget } from "../src/utils/target-content"

describe("target model replacement", () => {
  test("uses Claude Sonnet 5 as the Claude primary model", () => {
    expect(canonicalModelForTarget("claude")).toBe("claude-sonnet-5")
  })

  test("normalizes old and current Sonnet IDs without duplicating suffixes", () => {
    const legacyHyphenated = ["claude-sonnet", "4", "6"].join("-")
    const legacyDotted = [["claude-sonnet", "4"].join("-"), "6"].join(".")
    const content = [
      `model: ${legacyHyphenated}`,
      `fallback: ${legacyDotted}`,
      "current: claude-sonnet-5",
      "provider: anthropic/claude-sonnet-5",
    ].join("\n")

    expect(replaceModelIdsForTarget(content, "claude")).toBe(
      [
        "model: claude-sonnet-5",
        "fallback: claude-sonnet-5",
        "current: claude-sonnet-5",
        "provider: claude-sonnet-5",
      ].join("\n"),
    )
  })

  test("maps Claude Sonnet 5 to the target primary model for non-Claude surfaces", () => {
    expect(replaceModelIdsForTarget("model: claude-sonnet-5", "codex")).toBe("model: gpt-5.5")
    expect(replaceModelIdsForTarget("model: claude-sonnet-5", "copilot")).toBe("model: gpt-5.3-codex")
    expect(replaceModelIdsForTarget("model: claude-sonnet-5", "opencode")).toBe(
      "model: openrouter/moonshotai/kimi-k2.6",
    )
  })

  test("normalizes Opus shorthand to the Claude API ID", () => {
    const officialOpus = ["claude-opus", "4", "8"].join("-")
    const shorthandOpus = [["opus", "4"].join("-"), "8"].join(".")
    const content = [
      `model: ${shorthandOpus}`,
      `current: ${officialOpus}`,
      `provider: anthropic/${officialOpus}`,
    ].join("\n")

    expect(replaceModelIdsForTarget(content, "claude")).toBe(
      [`model: ${officialOpus}`, `current: ${officialOpus}`, `provider: ${officialOpus}`].join("\n"),
    )
    expect(replaceModelIdsForTarget(`model: ${officialOpus}`, "codex")).toBe("model: gpt-5.5")
    expect(replaceModelIdsForTarget(`model: ${shorthandOpus}`, "opencode")).toBe(
      "model: openrouter/moonshotai/kimi-k2.6",
    )
  })
})
