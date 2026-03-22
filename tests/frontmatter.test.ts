import { describe, expect, test } from "bun:test"
import { formatFrontmatter, parseFrontmatter } from "../src/utils/frontmatter"

describe("frontmatter", () => {
  test("parseFrontmatter returns body when no frontmatter", () => {
    const raw = "Hello\nWorld"
    const result = parseFrontmatter(raw)
    expect(result.data).toEqual({})
    expect(result.body).toBe(raw)
  })

  test("formatFrontmatter round trips", () => {
    const body = "Body text"
    const formatted = formatFrontmatter({ name: "agent", description: "Test" }, body)
    const parsed = parseFrontmatter(formatted)
    expect(parsed.data.name).toBe("agent")
    expect(parsed.data.description).toBe("Test")
    expect(parsed.body.trim()).toBe(body)
  })

  test("quotes values containing inline YAML comments", () => {
    const formatted = formatFrontmatter({ model: "gpt-5.3-codex # stable" }, "Body text")
    const parsed = parseFrontmatter(formatted)
    expect(parsed.data.model).toBe("gpt-5.3-codex # stable")
  })

  test("quotes values starting with a YAML comment marker", () => {
    const formatted = formatFrontmatter({ description: "#important" }, "Body text")
    const parsed = parseFrontmatter(formatted)
    expect(parsed.data.description).toBe("#important")
  })
})
