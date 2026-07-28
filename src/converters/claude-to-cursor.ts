import { formatFrontmatter } from "../utils/frontmatter"
import type { ClaudeAgent, ClaudeCommand, ClaudeMcpServer, ClaudePlugin } from "../types/claude"
import type {
  CursorAgent,
  CursorBundle,
  CursorCommand,
  CursorMcpServer,
} from "../types/cursor"
import { normalizeCursorName, transformContentForCursor } from "../utils/cursor-content"
import type { ClaudeToOpenCodeOptions } from "./claude-to-opencode"

export type ClaudeToCursorOptions = ClaudeToOpenCodeOptions

export function convertClaudeToCursor(
  plugin: ClaudePlugin,
  _options: ClaudeToCursorOptions,
): CursorBundle {
  const usedAgentNames = new Set<string>()
  const usedCommandNames = new Set<string>()
  const usedSkillNames = new Set<string>()

  const agents = plugin.agents.map((agent) => convertAgent(agent, usedAgentNames))
  const commands = plugin.commands.map((command) => convertCommand(command, usedCommandNames))
  const skillDirs = plugin.skills.map((skill) => {
    const name = uniqueName(normalizeCursorName(skill.name), usedSkillNames)
    return {
      name,
      description: skill.description,
      model: skill.model,
      sourceDir: skill.sourceDir,
      skillPath: skill.skillPath,
    }
  })

  const mcpServers = convertMcpServers(plugin.mcpServers)

  if (plugin.hooks && Object.keys(plugin.hooks.hooks).length > 0) {
    console.warn("Warning: Cursor does not support hooks. Hooks were skipped during conversion.")
  }

  return { agents, commands, skillDirs, generatedSkills: [], mcpServers }
}

function convertAgent(agent: ClaudeAgent, usedNames: Set<string>): CursorAgent {
  const name = uniqueName(normalizeCursorName(agent.name), usedNames)
  const description = agent.description ?? `Converted from Claude agent ${agent.name}`

  const frontmatter: Record<string, unknown> = {
    name,
    description,
  }
  if (agent.model && agent.model !== "inherit") {
    frontmatter.model = agent.model
  }

  let body = transformContentForCursor(agent.body.trim())
  if (agent.capabilities && agent.capabilities.length > 0) {
    const capabilities = agent.capabilities.map((capability) => `- ${capability}`).join("\n")
    body = `## Capabilities\n${capabilities}\n\n${body}`.trim()
  }
  if (body.length === 0) {
    body = `Instructions converted from the ${agent.name} agent.`
  }

  return { name, content: formatFrontmatter(frontmatter, body) }
}

function convertCommand(command: ClaudeCommand, usedNames: Set<string>): CursorCommand {
  const name = uniqueName(normalizeCursorName(command.name), usedNames)
  const sections: string[] = []

  if (command.description) {
    sections.push(`<!-- ${command.description} -->`)
  }
  if (command.argumentHint) {
    sections.push(`## Arguments\n${command.argumentHint}`)
  }

  sections.push(transformContentForCursor(command.body.trim()))
  return {
    name,
    content: sections.filter(Boolean).join("\n\n").trim(),
  }
}

function convertMcpServers(
  servers?: Record<string, ClaudeMcpServer>,
): Record<string, CursorMcpServer> | undefined {
  if (!servers || Object.keys(servers).length === 0) return undefined

  const result: Record<string, CursorMcpServer> = {}
  for (const [name, server] of Object.entries(servers)) {
    const entry: CursorMcpServer = {}
    if (server.command) {
      entry.command = server.command
      if (server.args && server.args.length > 0) entry.args = server.args
      if (server.env && Object.keys(server.env).length > 0) entry.env = server.env
    } else if (server.url) {
      entry.url = server.url
      if (server.headers && Object.keys(server.headers).length > 0) entry.headers = server.headers
    }
    result[name] = entry
  }
  return result
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

export { transformContentForCursor, normalizeCursorName } from "../utils/cursor-content"
