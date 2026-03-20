import { describe, expect, test } from "bun:test"
import path from "path"
import { loadPortablePlugin, renderPortableDescription } from "../src/parsers/portable"

const fixtureRoot = path.join(import.meta.dir, "fixtures", "sample-portable-plugin")

describe("loadPortablePlugin", () => {
  test("loads portable manifest, components, hooks, and renders description", async () => {
    const plugin = await loadPortablePlugin(fixtureRoot)

    expect(plugin.manifest.name).toBe("compound-engineering")
    expect(plugin.manifest.description).toBe(
      "AI-powered development tools. Includes 1 specialized agent, 1 command, and 1 skill for code review, research, design, and workflow automation.",
    )
    expect(plugin.portableManifest.marketplace?.name).toBe("compound-engineering-marketplace")
    expect(plugin.agents[0]?.model).toBe("haiku")
    expect(plugin.commands[0]?.allowedTools).toEqual(["Read", "Write"])
    expect(plugin.commands[0]?.disableModelInvocation).toBe(true)
    expect(plugin.skills[0]?.disableModelInvocation).toBe(true)
    expect(plugin.hooks?.hooks.Stop?.[0]?.hooks[0]).toEqual({
      type: "command",
      command: "echo portable-stop",
    })
    expect(plugin.mcpServers?.context7?.url).toBe("https://mcp.context7.com/mcp")
  })

  test("supports manifest file path input", async () => {
    const plugin = await loadPortablePlugin(path.join(fixtureRoot, "plugin.yaml"))
    expect(plugin.manifest.name).toBe("compound-engineering")
  })

  test("ignores reference markdown nested under portable commands", async () => {
    const plugin = await loadPortablePlugin(fixtureRoot)
    expect(plugin.commands.find((command) => command.name === "ignored")).toBeUndefined()
    expect(plugin.commands).toHaveLength(1)
  })
})

describe("renderPortableDescription", () => {
  test("returns raw string descriptions unchanged", () => {
    expect(renderPortableDescription("Portable plugin", { agents: 1, commands: 2, skills: 3 })).toBe("Portable plugin")
  })
})
