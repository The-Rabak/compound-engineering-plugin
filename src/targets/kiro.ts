import path from "path"
import { copyDir, ensureDir, pathExists, readJson, writeJson, writeText } from "../utils/files"
import type { KiroBundle } from "../types/kiro"
import { assertSafeOutputName } from "../utils/path-safety"
import {
  pruneManagedOutput,
  removeLegacyBackupArtifacts,
  writeManagedOutputState,
} from "../utils/managed-output"

const STATE_FILE_NAME = ".compound-engineering-kiro-state.json"

export async function writeKiroBundle(outputRoot: string, bundle: KiroBundle): Promise<void> {
  const paths = resolveKiroPaths(outputRoot)
  await ensureDir(paths.kiroDir)
  const managedPaths = collectManagedPaths(paths, bundle)
  const normalizedManagedPaths = await pruneManagedOutput(paths.kiroDir, STATE_FILE_NAME, managedPaths)
  await removeLegacyBackupArtifacts(paths.kiroDir, [/^mcp\.json\.bak\./])

  // Write agents
  if (bundle.agents.length > 0) {
    for (const agent of bundle.agents) {
      // Validate name doesn't escape agents directory
      assertSafeOutputName(agent.name, "agent")

      // Write agent JSON config
      await writeJson(
        path.join(paths.agentsDir, `${agent.name}.json`),
        agent.config,
      )

      // Write agent prompt file
      await writeText(
        path.join(paths.agentsDir, "prompts", `${agent.name}.md`),
        agent.promptContent + "\n",
      )
    }
  }

  // Write generated skills (from commands)
  if (bundle.generatedSkills.length > 0) {
    for (const skill of bundle.generatedSkills) {
      assertSafeOutputName(skill.name, "skill")
      await writeText(
        path.join(paths.skillsDir, skill.name, "SKILL.md"),
        skill.content + "\n",
      )
    }
  }

  // Copy skill directories (pass-through)
  if (bundle.skillDirs.length > 0) {
    for (const skill of bundle.skillDirs) {
      assertSafeOutputName(skill.name, "skill directory")
      const destDir = path.join(paths.skillsDir, skill.name)

      // Validate destination doesn't escape skills directory
      const resolvedDest = path.resolve(destDir)
      if (!resolvedDest.startsWith(path.resolve(paths.skillsDir))) {
        console.warn(`Warning: Skill name "${skill.name}" escapes .kiro/skills/. Skipping.`)
        continue
      }

      await copyDir(skill.sourceDir, destDir)
    }
  }

  // Write steering files
  if (bundle.steeringFiles.length > 0) {
    for (const file of bundle.steeringFiles) {
      assertSafeOutputName(file.name, "steering file")
      await writeText(
        path.join(paths.steeringDir, `${file.name}.md`),
        file.content + "\n",
      )
    }
  }

  // Write MCP servers to mcp.json
  if (Object.keys(bundle.mcpServers).length > 0) {
    const mcpPath = path.join(paths.settingsDir, "mcp.json")

    // Merge with existing mcp.json if present
    let existingConfig: Record<string, unknown> = {}
    if (await pathExists(mcpPath)) {
      try {
        existingConfig = await readJson<Record<string, unknown>>(mcpPath)
      } catch {
        console.warn("Warning: existing mcp.json could not be parsed and will be replaced.")
      }
    }

    const existingServers =
      existingConfig.mcpServers && typeof existingConfig.mcpServers === "object"
        ? (existingConfig.mcpServers as Record<string, unknown>)
        : {}
    const merged = { ...existingConfig, mcpServers: { ...existingServers, ...bundle.mcpServers } }
    await writeJson(mcpPath, merged)
  }

  await writeManagedOutputState(paths.kiroDir, STATE_FILE_NAME, normalizedManagedPaths)
}

function resolveKiroPaths(outputRoot: string) {
  const base = path.basename(outputRoot)
  // If already pointing at .kiro, write directly into it
  if (base === ".kiro") {
    return {
      kiroDir: outputRoot,
      agentsDir: path.join(outputRoot, "agents"),
      skillsDir: path.join(outputRoot, "skills"),
      steeringDir: path.join(outputRoot, "steering"),
      settingsDir: path.join(outputRoot, "settings"),
    }

    function collectManagedPaths(
      paths: ReturnType<typeof resolveKiroPaths>,
      bundle: KiroBundle,
    ): string[] {
      const managed = new Set<string>()
      for (const agent of bundle.agents) {
        managed.add(path.join(paths.agentsDir, `${agent.name}.json`))
        managed.add(path.join(paths.agentsDir, "prompts", `${agent.name}.md`))
      }
      for (const skill of bundle.generatedSkills) {
        managed.add(path.join(paths.skillsDir, skill.name))
      }
      for (const skill of bundle.skillDirs) {
        managed.add(path.join(paths.skillsDir, skill.name))
      }
      for (const file of bundle.steeringFiles) {
        managed.add(path.join(paths.steeringDir, `${file.name}.md`))
      }
      if (Object.keys(bundle.mcpServers).length > 0) {
        managed.add(path.join(paths.settingsDir, "mcp.json"))
      }
      return [...managed]
    }
  }
  // Otherwise nest under .kiro
  const kiroDir = path.join(outputRoot, ".kiro")
  return {
    kiroDir,
    agentsDir: path.join(kiroDir, "agents"),
    skillsDir: path.join(kiroDir, "skills"),
    steeringDir: path.join(kiroDir, "steering"),
    settingsDir: path.join(kiroDir, "settings"),
  }
}
