import { promises as fs } from "fs"
import path from "path"
import { copyDir, ensureDir, pathExists, readJson, readText, writeJson, writeText } from "../utils/files"
import { transformContentForOpenCode } from "../converters/claude-to-opencode"
import { formatFrontmatter, parseFrontmatter } from "../utils/frontmatter"
import type { OpenCodeBundle, OpenCodeConfig } from "../types/opencode"

type OpenCodeInstallState = {
  version: 1
  generatedPaths: string[]
}

const STATE_FILE_NAME = ".compound-engineering-opencode-state.json"

// Merges plugin config into existing opencode.json. User keys win on conflict. See ADR-002.
async function mergeOpenCodeConfig(
  configPath: string,
  incoming: OpenCodeConfig,
): Promise<OpenCodeConfig> {
  // If no existing config, write plugin config as-is
  if (!(await pathExists(configPath))) return incoming

  let existing: OpenCodeConfig
  try {
    existing = await readJson<OpenCodeConfig>(configPath)
  } catch {
    // Safety first per AGENTS.md -- do not destroy user data even if their config is malformed.
    // Warn and fall back to plugin-only config rather than crashing.
    console.warn(
      `Warning: existing ${configPath} is not valid JSON. Writing plugin config without merging.`
    )
    return incoming
  }

  // User config wins on conflict -- see ADR-002
  // MCP servers: add plugin entry, skip keys already in user config.
  const mergedMcp = {
    ...(incoming.mcp ?? {}),
    ...(existing.mcp ?? {}), // existing takes precedence (overwrites same-named plugin entry)
  }

  // Permission: add plugin entry, skip keys already in user config.
  const mergedPermission = incoming.permission
    ? {
        ...(incoming.permission),
        ...(existing.permission ?? {}), // existing takes precedence
      }
    : existing.permission

  // Tools: same pattern
  const mergedTools = incoming.tools
    ? {
        ...(incoming.tools),
        ...(existing.tools ?? {}),
      }
    : existing.tools

  return {
    ...existing,                    // all user keys preserved
    $schema: incoming.$schema ?? existing.$schema,
    mcp: Object.keys(mergedMcp).length > 0 ? mergedMcp : undefined,
    permission: mergedPermission,
    tools: mergedTools,
  }
}

export async function writeOpenCodeBundle(outputRoot: string, bundle: OpenCodeBundle): Promise<void> {
  const openCodePaths = resolveOpenCodePaths(outputRoot)
  await ensureDir(openCodePaths.root)
  const desiredPaths = await collectDesiredManagedPaths(openCodePaths, bundle)
  await pruneStaleGeneratedArtifacts(openCodePaths.root, desiredPaths)
  await pruneLegacyRenamedArtifacts(openCodePaths, bundle)
  await removeLegacyBackupFiles(openCodePaths)

  const merged = await mergeOpenCodeConfig(openCodePaths.configPath, bundle.config)
  await writeJson(openCodePaths.configPath, merged)

  const agentsDir = openCodePaths.agentsDir
  for (const agent of bundle.agents) {
    await writeText(path.join(agentsDir, `${agent.name}.md`), agent.content + "\n")
  }

  for (const commandFile of bundle.commandFiles ?? []) {
    const dest = path.join(openCodePaths.commandDir, `${commandFile.name}.md`)
    await writeText(dest, commandFile.content + "\n")
    if (commandFile.sourcePath) {
      await copyCommandReferenceDocs(commandFile.sourcePath, openCodePaths.commandDir)
    }
  }

  if (bundle.plugins.length > 0) {
    const pluginsDir = openCodePaths.pluginsDir
    for (const plugin of bundle.plugins) {
      await writeText(path.join(pluginsDir, plugin.name), plugin.content + "\n")
    }
  }

  if (bundle.skillDirs.length > 0) {
    const skillsRoot = openCodePaths.skillsDir
    for (const skill of bundle.skillDirs) {
      const targetDir = path.join(skillsRoot, skill.name)
      await copyDir(skill.sourceDir, targetDir)

      // Rewrite SKILL.md with platform-specific model
      const raw = await readText(skill.skillPath)
      const parsed = parseFrontmatter(raw)
      const fm: Record<string, unknown> = {
        name: skill.name,
        description: skill.description,
      }
      if (skill.model) {
        fm.model = skill.model
      }
      const content = formatFrontmatter(fm, transformContentForOpenCode(parsed.body.trim()))
      await writeText(path.join(targetDir, "SKILL.md"), content + "\n")
    }
  }

  await writeInstallState(openCodePaths.root, desiredPaths)
}

async function collectDesiredManagedPaths(
  openCodePaths: ReturnType<typeof resolveOpenCodePaths>,
  bundle: OpenCodeBundle,
): Promise<string[]> {
  const paths = new Set<string>()

  for (const agent of bundle.agents) {
    paths.add(path.join(openCodePaths.agentsDir, `${agent.name}.md`))
  }
  for (const commandFile of bundle.commandFiles ?? []) {
    paths.add(path.join(openCodePaths.commandDir, `${commandFile.name}.md`))
    if (commandFile.sourcePath) {
      const sourceReferencesDir = path.join(path.dirname(commandFile.sourcePath), "references")
      if (await pathExists(sourceReferencesDir)) {
        const relativeDir = resolveCommandRelativeDir(commandFile.sourcePath)
        paths.add(path.join(openCodePaths.commandDir, relativeDir, "references"))
      }
    }
  }
  for (const plugin of bundle.plugins) {
    paths.add(path.join(openCodePaths.pluginsDir, plugin.name))
  }
  for (const skill of bundle.skillDirs) {
    paths.add(path.join(openCodePaths.skillsDir, skill.name))
  }

  return [...paths]
}

async function pruneStaleGeneratedArtifacts(rootDir: string, desiredPaths: string[]): Promise<void> {
  const state = await readInstallState(rootDir)
  if (!state) return

  const desired = new Set(desiredPaths.map((filePath) => path.resolve(filePath)))
  const stale = state.generatedPaths
    .map((filePath) => path.resolve(filePath))
    .filter((filePath) => !desired.has(filePath))
    .sort((a, b) => b.length - a.length)

  for (const stalePath of stale) {
    await fs.rm(stalePath, { recursive: true, force: true })
  }
}

async function removeLegacyBackupFiles(openCodePaths: ReturnType<typeof resolveOpenCodePaths>): Promise<void> {
  await removeMatchingFiles(openCodePaths.root, (name) => /^opencode\.json\.bak\./.test(name))
  await removeMatchingFiles(openCodePaths.commandDir, (name) => /\.md\.bak\./.test(name))
}

async function pruneLegacyRenamedArtifacts(
  openCodePaths: ReturnType<typeof resolveOpenCodePaths>,
  bundle: OpenCodeBundle,
): Promise<void> {
  const commandNames = new Set((bundle.commandFiles ?? []).map((commandFile) => commandFile.name))

  if (commandNames.has("workflows:triage")) {
    await fs.rm(path.join(openCodePaths.commandDir, "triage.md"), { force: true })
    await fs.rm(path.join(openCodePaths.skillsDir, "triage"), { recursive: true, force: true })
  }
}

async function removeMatchingFiles(
  rootDir: string,
  matcher: (name: string) => boolean,
): Promise<void> {
  if (!(await pathExists(rootDir))) return
  const entries = await fs.readdir(rootDir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name)
    if (entry.isDirectory()) {
      await removeMatchingFiles(fullPath, matcher)
      continue
    }
    if (entry.isFile() && matcher(entry.name)) {
      await fs.rm(fullPath, { force: true })
    }
  }
}

async function readInstallState(rootDir: string): Promise<OpenCodeInstallState | null> {
  const statePath = path.join(rootDir, STATE_FILE_NAME)
  if (!(await pathExists(statePath))) return null
  try {
    const state = await readJson<OpenCodeInstallState>(statePath)
    if (state.version !== 1 || !Array.isArray(state.generatedPaths)) {
      return null
    }
    return state
  } catch {
    return null
  }
}

async function writeInstallState(rootDir: string, desiredPaths: string[]): Promise<void> {
  const statePath = path.join(rootDir, STATE_FILE_NAME)
  const normalized = [...new Set(desiredPaths.map((filePath) => path.resolve(filePath)))].sort()
  await writeJson(statePath, { version: 1, generatedPaths: normalized } satisfies OpenCodeInstallState)
}

async function copyCommandReferenceDocs(commandSourcePath: string, commandDir: string): Promise<void> {
  const sourceReferencesDir = path.join(path.dirname(commandSourcePath), "references")
  if (!(await pathExists(sourceReferencesDir))) return

  const relativeDir = resolveCommandRelativeDir(commandSourcePath)
  const targetReferencesDir = path.join(commandDir, relativeDir, "references")
  await copyDir(sourceReferencesDir, targetReferencesDir)
}

function resolveCommandRelativeDir(commandSourcePath: string): string {
  const marker = `${path.sep}commands${path.sep}`
  const markerIndex = commandSourcePath.lastIndexOf(marker)
  if (markerIndex === -1) return ""

  const relativePath = commandSourcePath.slice(markerIndex + marker.length)
  const relativeDir = path.dirname(relativePath)
  return relativeDir === "." ? "" : relativeDir
}

function resolveOpenCodePaths(outputRoot: string) {
  const base = path.basename(outputRoot)
  // Global install: ~/.config/opencode (basename is "opencode")
  // Project install: .opencode (basename is ".opencode")
  if (base === "opencode" || base === ".opencode") {
    return {
      root: outputRoot,
      configPath: path.join(outputRoot, "opencode.json"),
      agentsDir: path.join(outputRoot, "agents"),
      pluginsDir: path.join(outputRoot, "plugins"),
      skillsDir: path.join(outputRoot, "skills"),
      // .md command files; alternative to the command key in opencode.json
      commandDir: path.join(outputRoot, "commands"),
    }
  }

  // Custom output directory - nest under .opencode subdirectory
  return {
    root: outputRoot,
    configPath: path.join(outputRoot, "opencode.json"),
    agentsDir: path.join(outputRoot, ".opencode", "agents"),
    pluginsDir: path.join(outputRoot, ".opencode", "plugins"),
    skillsDir: path.join(outputRoot, ".opencode", "skills"),
    // .md command files; alternative to the command key in opencode.json
    commandDir: path.join(outputRoot, ".opencode", "commands"),
  }
}
