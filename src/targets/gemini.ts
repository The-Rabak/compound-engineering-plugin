import path from "path"
import { copyDir, ensureDir, pathExists, readJson, writeJson, writeText } from "../utils/files"
import type { GeminiBundle } from "../types/gemini"
import {
  pruneManagedOutput,
  removeLegacyBackupArtifacts,
  writeManagedOutputState,
} from "../utils/managed-output"

const STATE_FILE_NAME = ".compound-engineering-gemini-state.json"

export async function writeGeminiBundle(outputRoot: string, bundle: GeminiBundle): Promise<void> {
  const paths = resolveGeminiPaths(outputRoot)
  await ensureDir(paths.geminiDir)
  const managedPaths = collectManagedPaths(paths, bundle)
  const normalizedManagedPaths = await pruneManagedOutput(paths.geminiDir, STATE_FILE_NAME, managedPaths)
  await removeLegacyBackupArtifacts(paths.geminiDir, [/^settings\.json\.bak\./])

  if (bundle.generatedSkills.length > 0) {
    for (const skill of bundle.generatedSkills) {
      await writeText(path.join(paths.skillsDir, skill.name, "SKILL.md"), skill.content + "\n")
    }
  }

  if (bundle.skillDirs.length > 0) {
    for (const skill of bundle.skillDirs) {
      await copyDir(skill.sourceDir, path.join(paths.skillsDir, skill.name))
    }
  }

  if (bundle.commands.length > 0) {
    for (const command of bundle.commands) {
      await writeText(path.join(paths.commandsDir, `${command.name}.toml`), command.content + "\n")
    }
  }

  if (bundle.mcpServers && Object.keys(bundle.mcpServers).length > 0) {
    const settingsPath = path.join(paths.geminiDir, "settings.json")

    // Merge mcpServers into existing settings if present
    let existingSettings: Record<string, unknown> = {}
    if (await pathExists(settingsPath)) {
      try {
        existingSettings = await readJson<Record<string, unknown>>(settingsPath)
      } catch {
        console.warn("Warning: existing settings.json could not be parsed and will be replaced.")
      }
    }

    const existingMcp = (existingSettings.mcpServers && typeof existingSettings.mcpServers === "object")
      ? existingSettings.mcpServers as Record<string, unknown>
      : {}
    const merged = { ...existingSettings, mcpServers: { ...existingMcp, ...bundle.mcpServers } }
    await writeJson(settingsPath, merged)
  }
  await writeManagedOutputState(paths.geminiDir, STATE_FILE_NAME, normalizedManagedPaths)
}

function resolveGeminiPaths(outputRoot: string) {
  const base = path.basename(outputRoot)
  // If already pointing at .gemini, write directly into it
  if (base === ".gemini") {
    return {
      geminiDir: outputRoot,
      skillsDir: path.join(outputRoot, "skills"),
      commandsDir: path.join(outputRoot, "commands"),
    }
  }
  // Otherwise nest under .gemini
  return {
    geminiDir: path.join(outputRoot, ".gemini"),
    skillsDir: path.join(outputRoot, ".gemini", "skills"),
    commandsDir: path.join(outputRoot, ".gemini", "commands"),
  }
}

function collectManagedPaths(
  paths: ReturnType<typeof resolveGeminiPaths>,
  bundle: GeminiBundle,
): string[] {
  const managed = new Set<string>()
  for (const skill of bundle.generatedSkills) {
    managed.add(path.join(paths.skillsDir, skill.name))
  }
  for (const skill of bundle.skillDirs) {
    managed.add(path.join(paths.skillsDir, skill.name))
  }
  for (const command of bundle.commands) {
    managed.add(path.join(paths.commandsDir, `${command.name}.toml`))
  }
  if (bundle.mcpServers && Object.keys(bundle.mcpServers).length > 0) {
    managed.add(path.join(paths.geminiDir, "settings.json"))
  }
  return [...managed]
}
