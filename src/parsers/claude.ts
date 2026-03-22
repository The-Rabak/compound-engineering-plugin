import path from "path"
import { parseFrontmatter } from "../utils/frontmatter"
import { readJson, readText, pathExists, walkFiles } from "../utils/files"
import type {
  ClaudeAgent,
  ClaudeCommand,
  ClaudeHooks,
  ClaudeManifest,
  ClaudeMcpServer,
  ClaudePlugin,
  ClaudeSkill,
} from "../types/claude"

const PLUGIN_MANIFEST = path.join(".claude-plugin", "plugin.json")

export async function loadClaudePlugin(inputPath: string): Promise<ClaudePlugin> {
  const root = await resolveClaudeRoot(inputPath)
  const manifestPath = path.join(root, PLUGIN_MANIFEST)
  const manifest = await readJson<ClaudeManifest>(manifestPath)

  const [agents, commands, skills, hooks] = await Promise.all([
    loadAgents(resolveComponentDirs(root, "agents", manifest.agents)),
    loadCommands(resolveComponentDirs(root, "commands", manifest.commands)),
    loadSkills(resolveComponentDirs(root, "skills", manifest.skills)),
    loadHooks(root, manifest.hooks),
  ])

  const mcpServers = await loadMcpServers(root, manifest)

  return {
    root,
    manifest,
    agents,
    commands,
    skills,
    hooks,
    mcpServers,
  }
}

async function resolveClaudeRoot(inputPath: string): Promise<string> {
  const absolute = path.resolve(inputPath)
  const manifestAtPath = path.join(absolute, PLUGIN_MANIFEST)
  if (await pathExists(manifestAtPath)) {
    return absolute
  }

  if (absolute.endsWith(PLUGIN_MANIFEST)) {
    return path.dirname(path.dirname(absolute))
  }

  if (absolute.endsWith("plugin.json")) {
    return path.dirname(path.dirname(absolute))
  }

  throw new Error(`Could not find ${PLUGIN_MANIFEST} under ${inputPath}`)
}

async function loadAgents(agentsDirs: string[]): Promise<ClaudeAgent[]> {
  const files = await collectMarkdownFiles(agentsDirs)

  return await Promise.all(
    files.map(async (file) => {
      const raw = await readText(file)
      const { data, body } = parseFrontmatter(raw)
      const name = (data.name as string) ?? path.basename(file, ".md")
      return {
        name,
        description: data.description as string | undefined,
        capabilities: data.capabilities as string[] | undefined,
        model: data.model as string | undefined,
        body: body.trim(),
        sourcePath: file,
      }
    }),
  )
}

async function loadCommands(commandsDirs: string[]): Promise<ClaudeCommand[]> {
  const files = await collectMarkdownFiles(commandsDirs)
  const commandFiles = files.filter((file) => !isReferenceDoc(file))

  return await Promise.all(
    commandFiles.map(async (file) => {
      const raw = await readText(file)
      const { data, body } = parseFrontmatter(raw)
      const name = (data.name as string) ?? path.basename(file, ".md")
      const allowedTools = parseAllowedTools(data["allowed-tools"])
      const disableModelInvocation = data["disable-model-invocation"] === true ? true : undefined
      return {
        name,
        description: data.description as string | undefined,
        argumentHint: data["argument-hint"] as string | undefined,
        model: data.model as string | undefined,
        allowedTools,
        disableModelInvocation,
        body: body.trim(),
        sourcePath: file,
      }
    }),
  )
}

async function loadSkills(skillsDirs: string[]): Promise<ClaudeSkill[]> {
  const entries = await collectFiles(skillsDirs)
  const skillFiles = entries.filter((file) => path.basename(file) === "SKILL.md")
  return await Promise.all(
    skillFiles.map(async (file) => {
      const raw = await readText(file)
      const { data, body } = parseFrontmatter(raw)
      const name = (data.name as string) ?? path.basename(path.dirname(file))
      const disableModelInvocation = data["disable-model-invocation"] === true ? true : undefined
      return {
        name,
        description: data.description as string | undefined,
        model: data.model as string | undefined,
        disableModelInvocation,
        body: body.trim(),
        sourceDir: path.dirname(file),
        skillPath: file,
      }
    }),
  )
}

async function loadHooks(root: string, hooksField?: ClaudeManifest["hooks"]): Promise<ClaudeHooks | undefined> {
  const hookConfigs: ClaudeHooks[] = []

  const defaultPath = path.join(root, "hooks", "hooks.json")
  if (await pathExists(defaultPath)) {
    hookConfigs.push(await readJson<ClaudeHooks>(defaultPath))
  }

  if (hooksField) {
    if (typeof hooksField === "string" || Array.isArray(hooksField)) {
      const hookPaths = toPathList(hooksField)
      for (const hookPath of hookPaths) {
        const resolved = resolveWithinRoot(root, hookPath, "hooks path")
        if (await pathExists(resolved)) {
          hookConfigs.push(await readJson<ClaudeHooks>(resolved))
        }
      }
    } else {
      hookConfigs.push(hooksField)
    }
  }

  if (hookConfigs.length === 0) return undefined
  return mergeHooks(hookConfigs)
}

async function loadMcpServers(
  root: string,
  manifest: ClaudeManifest,
): Promise<Record<string, ClaudeMcpServer> | undefined> {
  const field = manifest.mcpServers
  if (field) {
    if (typeof field === "string" || Array.isArray(field)) {
      return mergeMcpConfigs(await loadMcpPaths(root, field))
    }
    return field as Record<string, ClaudeMcpServer>
  }

  const mcpPath = path.join(root, ".mcp.json")
  if (await pathExists(mcpPath)) {
    return readJson<Record<string, ClaudeMcpServer>>(mcpPath)
  }

  return undefined
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

function resolveComponentDirs(
  root: string,
  defaultDir: string,
  custom?: string | string[],
): string[] {
  const dirs = [path.join(root, defaultDir)]
  for (const entry of toPathList(custom)) {
    dirs.push(resolveWithinRoot(root, entry, `${defaultDir} path`))
  }
  return dirs
}

function toPathList(value?: string | string[]): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  return [value]
}

async function collectMarkdownFiles(dirs: string[]): Promise<string[]> {
  const entries = await collectFiles(dirs)
  return entries.filter((file) => file.endsWith(".md"))
}

function isReferenceDoc(filePath: string): boolean {
  return filePath.includes(`${path.sep}references${path.sep}`)
}

async function collectFiles(dirs: string[]): Promise<string[]> {
  const existingDirs = await Promise.all(
    dirs.map(async (dir) => ((await pathExists(dir)) ? dir : undefined)),
  )
  const walkResults = await Promise.all(existingDirs.filter((dir): dir is string => Boolean(dir)).map(walkFiles))
  return walkResults.flat()
}

function mergeHooks(hooksList: ClaudeHooks[]): ClaudeHooks {
  const merged: ClaudeHooks = { hooks: {} }
  for (const hooks of hooksList) {
    if (!hooks.hooks || typeof hooks.hooks !== "object" || Array.isArray(hooks.hooks)) continue
    for (const [event, matchers] of Object.entries(hooks.hooks)) {
      if (!merged.hooks[event]) {
        merged.hooks[event] = []
      }
      const matcherList = Array.isArray(matchers) ? matchers : []
      merged.hooks[event].push(...matcherList)
    }
  }
  return merged
}

async function loadMcpPaths(
  root: string,
  value: string | string[],
): Promise<Record<string, ClaudeMcpServer>[]> {
  const configs: Record<string, ClaudeMcpServer>[] = []
  for (const entry of toPathList(value)) {
    const resolved = resolveWithinRoot(root, entry, "mcpServers path")
    if (await pathExists(resolved)) {
      configs.push(await readJson<Record<string, ClaudeMcpServer>>(resolved))
    }
  }
  return configs
}

function mergeMcpConfigs(configs: Record<string, ClaudeMcpServer>[]): Record<string, ClaudeMcpServer> {
  return configs.reduce((acc, config) => ({ ...acc, ...config }), {})
}

function resolveWithinRoot(root: string, entry: string, label: string): string {
  const resolvedRoot = path.resolve(root)
  const resolvedPath = path.resolve(root, entry)
  if (resolvedPath === resolvedRoot || resolvedPath.startsWith(resolvedRoot + path.sep)) {
    return resolvedPath
  }
  throw new Error(`Invalid ${label}: ${entry}. Paths must stay within the plugin root.`)
}
