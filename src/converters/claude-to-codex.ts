import fs, { type Dirent } from "fs"
import path from "path"
import { formatFrontmatter } from "../utils/frontmatter"
import type { ClaudeAgent, ClaudeCommand, ClaudePlugin } from "../types/claude"
import type { CodexAgent, CodexBundle, CodexGeneratedSkill, CodexSidecarDir } from "../types/codex"
import type { ClaudeToOpenCodeOptions } from "./claude-to-opencode"
import {
  normalizeCodexName,
  transformContentForCodex,
  type CodexInvocationTargets,
} from "../utils/codex-content"

export type ClaudeToCodexOptions = ClaudeToOpenCodeOptions

const CODEX_DESCRIPTION_MAX_LENGTH = 1024

export function convertClaudeToCodex(
  plugin: ClaudePlugin,
  _options: ClaudeToCodexOptions,
): CodexBundle {
  const skillDirs = plugin.skills.map((skill) => ({
    name: skill.name,
    description: skill.description,
    model: skill.codexModel,
    disableModelInvocation: skill.disableModelInvocation,
    sourceDir: skill.sourceDir,
    skillPath: skill.skillPath,
  }))

  const usedSkillNames = new Set<string>(skillDirs.map((skill) => normalizeCodexName(skill.name)))
  const rawAgents = convertAgents(plugin.agents)
  const invocationTargets: CodexInvocationTargets = {
    skillTargets: buildSkillTargets(plugin, skillDirs.map((skill) => skill.name)),
    agentTargets: buildAgentTargets(plugin.agents, rawAgents),
  }
  const agents = rawAgents.map((agent) => ({
    ...agent,
    instructions: transformContentForCodex(agent.instructions, invocationTargets, {
      unknownSlashBehavior: "preserve",
    }),
  }))
  const generatedSkills = plugin.commands.map((command) =>
    convertCommandSkill(command, usedSkillNames, invocationTargets),
  )

  return {
    pluginName: plugin.manifest.name,
    pluginVersion: plugin.manifest.version,
    pluginDescription: plugin.manifest.description,
    prompts: [],
    skillDirs,
    generatedSkills,
    agents,
    invocationTargets,
    mcpServers: plugin.mcpServers,
    hooks: plugin.hooks,
  }
}

function convertAgents(agents: ClaudeAgent[]): CodexAgent[] {
  const usedNames = new Set<string>()
  return agents.map((agent) => convertAgent(agent, usedNames))
}

function convertAgent(agent: ClaudeAgent, usedNames: Set<string>): CodexAgent {
  const name = uniqueName(normalizeCodexName(agent.name), usedNames)
  const description = sanitizeDescription(
    agent.description ?? `Converted from Claude agent ${agent.name}`,
  )

  let instructions = agent.body.trim()
  if (agent.capabilities && agent.capabilities.length > 0) {
    const capabilities = agent.capabilities.map((capability) => `- ${capability}`).join("\n")
    instructions = `## Capabilities\n${capabilities}\n\n${instructions}`.trim()
  }
  if (instructions.length === 0) {
    instructions = `Instructions converted from the ${agent.name} agent.`
  }

  const model = agent.codexModel && agent.codexModel !== "inherit" ? agent.codexModel : undefined
  return {
    name,
    description,
    instructions,
    model,
    sourcePath: agent.sourcePath,
    sidecarDirs: collectReferencedSidecarDirs(agent),
  }
}

function convertCommandSkill(
  command: ClaudeCommand,
  usedNames: Set<string>,
  invocationTargets: CodexInvocationTargets,
): CodexGeneratedSkill {
  const name = uniqueName(normalizeCodexName(command.name), usedNames)
  const frontmatter: Record<string, unknown> = {
    name,
    description: sanitizeDescription(
      command.description ?? `Converted from Claude command ${command.name}`,
    ),
  }
  if (command.argumentHint) {
    frontmatter["argument-hint"] = command.argumentHint
  }
  if (command.codexModel && command.codexModel !== "inherit") {
    frontmatter.model = command.codexModel
  }
  if (command.disableModelInvocation) {
    frontmatter["disable-model-invocation"] = true
  }

  const sections: string[] = []
  if (command.argumentHint) {
    sections.push(`## Arguments\n${command.argumentHint}`)
  }
  if (command.allowedTools && command.allowedTools.length > 0) {
    sections.push(`## Allowed tools\n${command.allowedTools.map((tool) => `- ${tool}`).join("\n")}`)
  }
  const transformedBody = transformContentForCodex(command.body.trim(), invocationTargets, {
    unknownSlashBehavior: "preserve",
  })
  sections.push(transformedBody)
  const body = sections.filter(Boolean).join("\n\n").trim()
  const content = formatFrontmatter(frontmatter, body.length > 0 ? body : command.body)
  return {
    name,
    content,
    sourcePath: command.sourcePath,
    sidecarDirs: collectCommandSidecarDirs(command),
  }
}

function buildSkillTargets(plugin: ClaudePlugin, skillNames: string[]): Record<string, string> {
  const targets: Record<string, string> = {}
  for (const skillName of skillNames) {
    targets[normalizeCodexName(skillName)] = normalizeCodexName(skillName)
  }
  for (const command of plugin.commands) {
    targets[normalizeCodexName(command.name)] = normalizeCodexName(command.name)
  }
  return targets
}

function buildAgentTargets(sourceAgents: ClaudeAgent[], agents: CodexAgent[]): Record<string, string> {
  const targets: Record<string, string> = {}
  sourceAgents.forEach((agent, index) => {
    const target = agents[index]?.name
    if (!target) return
    targets[normalizeCodexName(agent.name)] = target
    const category = getAgentCategory(agent)
    if (category) {
      targets[normalizeCodexName(`${category}:${agent.name}`)] = target
    }
  })
  return targets
}

function sanitizeDescription(value: string, maxLength = CODEX_DESCRIPTION_MAX_LENGTH): string {
  const normalized = value.replace(/\s+/g, " ").trim()
  if (normalized.length <= maxLength) return normalized
  const ellipsis = "..."
  return normalized.slice(0, Math.max(0, maxLength - ellipsis.length)).trimEnd() + ellipsis
}

function uniqueName(base: string, used: Set<string>): string {
  if (!used.has(base)) {
    used.add(base)
    return base
  }
  let index = 2
  while (used.has(`${base}-${index}`)) {
    index += 1
  }
  const name = `${base}-${index}`
  used.add(name)
  return name
}

function collectCommandSidecarDirs(command: ClaudeCommand): CodexSidecarDir[] {
  const referencesDir = path.join(path.dirname(command.sourcePath), "references")
  if (!directoryExists(referencesDir)) return []
  return [{ sourceDir: referencesDir, targetName: "references" }]
}

function collectReferencedSidecarDirs(agent: ClaudeAgent): CodexSidecarDir[] {
  const sourceDir = path.dirname(agent.sourcePath)
  const sidecars = new Map<string, CodexSidecarDir>()
  let entries: Dirent[]

  try {
    entries = fs.readdirSync(sourceDir, { withFileTypes: true })
  } catch {
    entries = []
  }

  for (const sidecar of entries
    .filter((entry) => entry.isDirectory())
    .filter((entry) => agent.body.includes(`${entry.name}/`) || agent.body.includes(`\`${entry.name}\``))
    .map((entry) => ({
      sourceDir: path.join(sourceDir, entry.name),
      targetName: entry.name,
    }))) {
    sidecars.set(`${sidecar.targetName}\0${sidecar.sourceDir}`, sidecar)
  }

  for (const sidecar of collectCommandReferenceSidecars(agent)) {
    sidecars.set(`${sidecar.targetName}\0${sidecar.sourceDir}`, sidecar)
  }

  return [...sidecars.values()]
}

function collectCommandReferenceSidecars(agent: ClaudeAgent): CodexSidecarDir[] {
  const pluginRoot = getPluginRootForAgent(agent.sourcePath)
  if (!pluginRoot) return []

  const sidecars = new Map<string, CodexSidecarDir>()
  const referencePattern = /commands\/([a-z0-9/_:-]+)\/references\/[a-z0-9-]+\.md/gi
  for (const match of agent.body.matchAll(referencePattern)) {
    const commandPath = match[1]
    if (!commandPath) continue
    const sourceDir = path.join(pluginRoot, "commands", ...commandPath.split("/"), "references")
    if (!directoryExists(sourceDir)) continue
    sidecars.set(sourceDir, { sourceDir, targetName: "references" })
  }

  return [...sidecars.values()]
}

function getPluginRootForAgent(sourcePath: string): string | null {
  const parts = sourcePath.split(path.sep)
  const agentsIndex = parts.lastIndexOf("agents")
  if (agentsIndex <= 0) return null
  return parts.slice(0, agentsIndex).join(path.sep) || path.sep
}

function getAgentCategory(agent: ClaudeAgent): string | null {
  const parts = agent.sourcePath.split(path.sep)
  const agentsIndex = parts.lastIndexOf("agents")
  if (agentsIndex === -1) return null
  const next = parts[agentsIndex + 1]
  if (!next || next.endsWith(".md")) return null
  return next
}

function directoryExists(dirPath: string): boolean {
  try {
    return fs.statSync(dirPath).isDirectory()
  } catch {
    return false
  }
}
