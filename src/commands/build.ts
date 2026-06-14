import { defineCommand } from "citty"
import { promises as fs } from "fs"
import path from "path"
import { convertClaudeToCodex } from "../converters/claude-to-codex"
import { convertClaudeToCopilot } from "../converters/claude-to-copilot"
import { loadPortablePlugin } from "../parsers/portable"
import { writeClaudeBundle } from "../targets/claude"
import { writeCopilotBundle } from "../targets/copilot"
import type { CodexBundle } from "../types/codex"
import { copyDir, readText, writeJson, writeText } from "../utils/files"
import { formatFrontmatter, parseFrontmatter } from "../utils/frontmatter"
import { normalizeCodexName, transformContentForCodex } from "../utils/codex-content"
import { sanitizeMarkdownForTarget, sanitizeMarkdownTreeForTarget } from "../utils/target-content"

const validTargets = ["claude", "copilot", "codex"] as const

export default defineCommand({
  meta: {
    name: "build",
    description: "Build target-specific outputs from portable plugin source",
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
      default: "claude",
      description: "Comma-separated targets to build: claude,copilot,codex. Copilot and Codex are explicit exports outside the default Claude surface.",
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

    if (targets.includes("codex")) {
      const codexBundle = convertClaudeToCodex(plugin, {
        agentMode: "subagent",
        inferTemperature: true,
        permissions: "none",
      })
      const codexPluginRoot = path.join(outputRoot, "plugins", plugin.manifest.name)
      await removeGeneratedCodexOutput(outputRoot, codexPluginRoot)
      await writeCodexPluginOutput(outputRoot, codexPluginRoot, codexBundle)
      console.log(`Built Codex output at ${codexPluginRoot}`)
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

async function removeGeneratedCodexOutput(outputRoot: string, pluginRoot: string): Promise<void> {
  await fs.rm(path.join(pluginRoot, ".codex-plugin", "plugin.json"), { force: true })
  await fs.rm(path.join(pluginRoot, "codex-skills"), { recursive: true, force: true })
  await fs.rm(path.join(outputRoot, ".agents", "plugins", "marketplace.json"), { force: true })
}

async function writeCodexPluginOutput(
  outputRoot: string,
  pluginRoot: string,
  bundle: CodexBundle,
): Promise<void> {
  await writeJson(path.join(pluginRoot, ".codex-plugin", "plugin.json"), {
    name: bundle.pluginName,
    version: bundle.pluginVersion,
    description: bundle.pluginDescription,
    skills: "./codex-skills/",
    interface: {
      displayName: "Compound Engineering",
      shortDescription: "Workflow, review, research, and engineering automation skills for Codex.",
      category: "Coding",
      capabilities: ["Read", "Write", "Interactive"],
    },
  })

  const codexSkillsRoot = path.join(pluginRoot, "codex-skills")
  for (const skill of bundle.skillDirs) {
    const targetDir = path.join(codexSkillsRoot, normalizeCodexName(skill.name))
    await copyDir(skill.sourceDir, targetDir)
    await sanitizeMarkdownTreeForTarget(targetDir, "codex", {
      transformBody: (body) =>
        transformContentForCodex(body, bundle.invocationTargets, {
          unknownSlashBehavior: "preserve",
        }),
    })
    const raw = await readText(skill.skillPath ?? path.join(skill.sourceDir, "SKILL.md"))
    const parsed = parseFrontmatter(raw)
    const frontmatter: Record<string, unknown> = {
      name: normalizeCodexName(skill.name),
      description: skill.description ?? parsed.data.description,
    }
    if (skill.model) {
      frontmatter.model = skill.model
    }
    if (skill.disableModelInvocation) {
      frontmatter["disable-model-invocation"] = true
    }
    const body = transformContentForCodex(parsed.body.trim(), bundle.invocationTargets, {
      unknownSlashBehavior: "preserve",
    })
    const content = sanitizeMarkdownForTarget(formatFrontmatter(frontmatter, body), "codex")
    await writeText(path.join(targetDir, "SKILL.md"), content + "\n")
  }

  for (const skill of bundle.generatedSkills) {
    const targetDir = path.join(codexSkillsRoot, normalizeCodexName(skill.name))
    await writeText(path.join(targetDir, "SKILL.md"), sanitizeMarkdownForTarget(skill.content, "codex") + "\n")
    for (const sidecar of skill.sidecarDirs ?? []) {
      const sidecarTarget = path.join(targetDir, sidecar.targetName)
      await copyDir(sidecar.sourceDir, sidecarTarget)
      await sanitizeMarkdownTreeForTarget(sidecarTarget, "codex", {
        transformBody: (body) =>
          transformContentForCodex(body, bundle.invocationTargets, {
            unknownSlashBehavior: "preserve",
          }),
      })
    }
  }

  await writeJson(path.join(outputRoot, ".agents", "plugins", "marketplace.json"), {
    name: `${bundle.pluginName}-marketplace`,
    interface: {
      displayName: "Compound Engineering",
    },
    plugins: [
      {
        name: bundle.pluginName,
        source: {
          source: "local",
          path: `./plugins/${bundle.pluginName}`,
        },
        policy: {
          installation: "AVAILABLE",
          authentication: "ON_INSTALL",
        },
        category: "Coding",
      },
    ],
  })
}
