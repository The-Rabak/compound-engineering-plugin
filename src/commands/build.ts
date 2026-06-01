import { defineCommand } from "citty"
import { promises as fs } from "fs"
import path from "path"
import { convertClaudeToCopilot } from "../converters/claude-to-copilot"
import { loadPortablePlugin } from "../parsers/portable"
import { writeClaudeBundle } from "../targets/claude"
import { writeCopilotBundle } from "../targets/copilot"
import { writeJson } from "../utils/files"

const validTargets = ["claude", "copilot"] as const

export default defineCommand({
  meta: {
    name: "build",
    description: "Build Claude and Copilot outputs from portable plugin source",
  },
  args: {
    source: {
      type: "positional",
      required: true,
      description: "Path to the portable plugin directory",
    },
    output: {
      type: "string",
      alias: "o",
      default: ".",
      description: "Repository root where generated outputs should be written",
    },
    targets: {
      type: "string",
      default: "claude,copilot",
      description: "Comma-separated targets to build: claude,copilot",
    },
  },
  async run({ args }) {
    const targets = parseTargets(args.targets)
    const outputRoot = path.resolve(String(args.output))
    const plugin = await loadPortablePlugin(String(args.source))

    if (targets.includes("claude")) {
      const claudeRoot = path.join(outputRoot, "plugins", plugin.manifest.name)
      await removeGeneratedClaudeOutput(claudeRoot)
      await writeClaudeBundle(claudeRoot, plugin)
      await fs.rm(path.join(claudeRoot, ".compound-engineering-claude-state.json"), { force: true })
      await writeMarketplace(outputRoot, plugin)
      console.log(`Built Claude output at ${claudeRoot}`)
    }

    if (targets.includes("copilot")) {
      const copilotBundle = convertClaudeToCopilot(plugin, {
        agentMode: "subagent",
        inferTemperature: true,
        permissions: "none",
      })
      const copilotRoot = path.join(outputRoot, ".github")
      await removeGeneratedCopilotOutput(copilotRoot)
      await writeCopilotBundle(copilotRoot, copilotBundle)
      await fs.rm(path.join(copilotRoot, ".compound-engineering-copilot-state.json"), { force: true })
      console.log(`Built Copilot output at ${copilotRoot}`)
    }
  },
})

async function writeMarketplace(outputRoot: string, plugin: Awaited<ReturnType<typeof loadPortablePlugin>>): Promise<void> {
  const marketplace = plugin.portableManifest.marketplace
  if (!marketplace) return

  await writeJson(path.join(outputRoot, ".claude-plugin", "marketplace.json"), {
    name: marketplace.name,
    owner: marketplace.owner,
    metadata: marketplace.metadata,
    plugins: [
      {
        name: plugin.manifest.name,
        description: plugin.manifest.description,
        version: plugin.manifest.version,
        author: plugin.manifest.author,
        homepage: plugin.manifest.homepage,
        repository: plugin.manifest.repository,
        license: plugin.manifest.license,
        keywords: plugin.manifest.keywords,
        source: `./plugins/${plugin.manifest.name}`,
      },
    ],
  })
}

function parseTargets(value: unknown): Array<(typeof validTargets)[number]> {
  const requested = String(value)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)

  const invalid = requested.filter((entry) => !validTargets.includes(entry as (typeof validTargets)[number]))
  if (invalid.length > 0) {
    throw new Error(`Unknown build target(s): ${invalid.join(", ")}`)
  }

  return requested as Array<(typeof validTargets)[number]>
}

async function removeGeneratedCopilotOutput(copilotRoot: string): Promise<void> {
  await fs.rm(path.join(copilotRoot, "agents"), { recursive: true, force: true })
  await fs.rm(path.join(copilotRoot, "skills"), { recursive: true, force: true })
  await fs.rm(path.join(copilotRoot, "copilot-mcp-config.json"), { force: true })
  await fs.rm(path.join(copilotRoot, ".compound-engineering-copilot-state.json"), { force: true })
}

async function removeGeneratedClaudeOutput(claudeRoot: string): Promise<void> {
  await fs.rm(path.join(claudeRoot, "agents"), { recursive: true, force: true })
  await fs.rm(path.join(claudeRoot, "commands"), { recursive: true, force: true })
  await fs.rm(path.join(claudeRoot, "skills"), { recursive: true, force: true })
  await fs.rm(path.join(claudeRoot, "hooks"), { recursive: true, force: true })
  await fs.rm(path.join(claudeRoot, ".claude-plugin", "plugin.json"), { force: true })
  await fs.rm(path.join(claudeRoot, ".compound-engineering-claude-state.json"), { force: true })
}
