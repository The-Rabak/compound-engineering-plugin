import path from "path"
import { load } from "js-yaml"
import { parseFrontmatter } from "../utils/frontmatter"
import { pathExists, readJson, readText, walkFiles } from "../utils/files"
import type { ClaudeAgent, ClaudeCommand, ClaudeHooks, ClaudeManifest, ClaudeSkill } from "../types/claude"
import type { PortableDescription, PortableManifest, PortablePlugin } from "../types/portable"

const PORTABLE_MANIFEST = "plugin.yaml"

export async function loadPortablePlugin(inputPath: string): Promise<PortablePlugin> {
  const root = await resolvePortableRoot(inputPath)
  const manifest = await readPortableManifest(path.join(root, PORTABLE_MANIFEST))

  const [agents, commands, skills, hooks] = await Promise.all([
    loadPortableAgents(root),
    loadPortableCommands(root),
    loadPortableSkills(root),
    loadPortableHooks(root),
  ])
  const description = renderPortableDescription(manifest.description, {
    agents: agents.length,
    commands: commands.length,
    skills: skills.length,
  })

  const claudeManifest: ClaudeManifest = {
    name: manifest.name,
    version: manifest.version,
    description,
    author: manifest.author,
    homepage: manifest.homepage,
    repository: manifest.repository,
    license: manifest.license,
    keywords: manifest.keywords,
    mcpServers: manifest.mcpServers,
  }

  return {
    root,
    portableManifest: manifest,
    manifest: claudeManifest,
    agents,
    commands,
    skills,
    hooks,
    mcpServers: manifest.mcpServers,
  }
}

export function renderPortableDescription(
  description: PortableDescription | undefined,
  counts: { agents: number; commands: number; skills: number },
): string | undefined {
  if (!description) return undefined
  if (typeof description === "string") return description

  const includes =
    `Includes ${counts.agents} specialized ${pluralize("agent", counts.agents)}, ` +
    `${counts.commands} ${pluralize("command", counts.commands)}, and ` +
    `${counts.skills} ${pluralize("skill", counts.skills)}`

  return [description.lead.trim(), includes, description.suffix?.trim()].filter(Boolean).join(" ")
}

async function resolvePortableRoot(inputPath: string): Promise<string> {
  const absolute = path.resolve(inputPath)
  const manifestAtPath = path.join(absolute, PORTABLE_MANIFEST)
  if (await pathExists(manifestAtPath)) {
    return absolute
  }

  if (absolute.endsWith(PORTABLE_MANIFEST)) {
    return path.dirname(absolute)
  }

  throw new Error(`Could not find ${PORTABLE_MANIFEST} under ${inputPath}`)
}

async function readPortableManifest(manifestPath: string): Promise<PortableManifest> {
  const raw = await readText(manifestPath)
  const parsed = load(raw)
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Invalid portable manifest: ${manifestPath}`)
  }
  return parsed as PortableManifest
}

async function loadPortableAgents(root: string): Promise<ClaudeAgent[]> {
  const agentsRoot = path.join(root, "agents")
  const files = await collectMarkdownFiles(agentsRoot)

  return await Promise.all(
    files.map(async (file) => {
      const raw = await readText(file)
      const { data, body } = parseFrontmatter(raw)
      const claude = getPlatformConfig(data, "claude")
      const copilot = getPlatformConfig(data, "copilot")
      const codex = getPlatformConfig(data, "codex")
      const opencode = getPlatformConfig(data, "opencode")
      return {
        name: asString(data.name) ?? path.basename(file, ".md"),
        description: asString(data.description),
        capabilities: asStringArray(data.capabilities),
        model: asString(claude?.model ?? data.model),
        copilotModel: asString(copilot?.model ?? data.model),
        codexModel: asString(codex?.model),
        opencodeModel: asString(opencode?.model ?? data.model),
        body: body.trim(),
        sourcePath: file,
      }
    }),
  )
}

async function loadPortableCommands(root: string): Promise<ClaudeCommand[]> {
  const commandsRoot = path.join(root, "commands")
  const files = (await collectMarkdownFiles(commandsRoot)).filter((file) => !isReferenceDoc(file))

  return await Promise.all(
    files.map(async (file) => {
      const raw = await readText(file)
      const { data, body } = parseFrontmatter(raw)
      const claude = getPlatformConfig(data, "claude")
      const copilot = getPlatformConfig(data, "copilot")
      const codex = getPlatformConfig(data, "codex")
      const opencode = getPlatformConfig(data, "opencode")
      return {
        name: asString(data.name) ?? path.basename(file, ".md"),
        description: asString(data.description),
        argumentHint: asString(data["argument-hint"] ?? data.arguments),
        model: asString(claude?.model ?? data.model),
        copilotModel: asString(copilot?.model ?? data.model),
        codexModel: asString(codex?.model),
        opencodeModel: asString(opencode?.model ?? data.model),
        allowedTools: parseAllowedTools(codex?.["allowed-tools"] ?? claude?.["allowed-tools"] ?? data["allowed-tools"]),
        disableModelInvocation: toOptionalBoolean(
          codex?.["disable-model-invocation"] ?? claude?.["disable-model-invocation"] ?? data["disable-model-invocation"],
        ),
        body: body.trim(),
        sourcePath: file,
      }
    }),
  )
}

async function loadPortableSkills(root: string): Promise<ClaudeSkill[]> {
  const skillsRoot = path.join(root, "skills")
  if (!(await pathExists(skillsRoot))) return []

  const files = await walkFiles(skillsRoot)
  const skillFiles = files.filter((file) => path.basename(file) === "SKILL.md")

  return await Promise.all(
    skillFiles.map(async (file) => {
      const raw = await readText(file)
      const { data, body } = parseFrontmatter(raw)
      const claude = getPlatformConfig(data, "claude")
      const copilot = getPlatformConfig(data, "copilot")
      const codex = getPlatformConfig(data, "codex")
      const opencode = getPlatformConfig(data, "opencode")
      return {
        name: asString(data.name) ?? path.basename(path.dirname(file)),
        description: asString(data.description),
        model: asString(claude?.model ?? data.model),
        copilotModel: asString(copilot?.model ?? data.model),
        codexModel: asString(codex?.model),
        opencodeModel: asString(opencode?.model ?? data.model),
        disableModelInvocation: toOptionalBoolean(
          codex?.["disable-model-invocation"] ?? claude?.["disable-model-invocation"] ?? data["disable-model-invocation"],
        ),
        body: body.trim(),
        sourceDir: path.dirname(file),
        skillPath: file,
      }
    }),
  )
}

async function loadPortableHooks(root: string): Promise<ClaudeHooks | undefined> {
  const hooksPath = path.join(root, "platforms", "claude", "hooks.json")
  if (!(await pathExists(hooksPath))) return undefined
  return await readJson<ClaudeHooks>(hooksPath)
}

async function collectMarkdownFiles(dir: string): Promise<string[]> {
  if (!(await pathExists(dir))) return []
  const entries = await walkFiles(dir)
  return entries.filter((file) => file.endsWith(".md"))
}

function isReferenceDoc(filePath: string): boolean {
  return filePath.includes(`${path.sep}references${path.sep}`)
}

function getPlatformConfig(
  data: Record<string, unknown>,
  platform: "claude" | "copilot" | "codex" | "opencode",
): Record<string, unknown> | undefined {
  const platforms = data.platforms
  if (!platforms || typeof platforms !== "object" || Array.isArray(platforms)) {
    return undefined
  }

  const config = (platforms as Record<string, unknown>)[platform]
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return undefined
  }

  return config as Record<string, unknown>
}

function parseAllowedTools(value: unknown): string[] | undefined {
  if (!value) return undefined
  if (Array.isArray(value)) {
    return value.map((item) => String(item))
  }
  if (typeof value === "string") {
    return value
      .split(/,/)
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return undefined
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  return value.map((item) => String(item))
}

function toOptionalBoolean(value: unknown): true | undefined {
  return value === true ? true : undefined
}

function pluralize(noun: string, count: number): string {
  return count === 1 ? noun : `${noun}s`
}
