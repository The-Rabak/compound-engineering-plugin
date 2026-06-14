import path from "path"
import { copyDir, ensureDir, pathExists, readText, walkFiles, writeJson, writeText } from "../utils/files"
import { transformContentForCopilot } from "../converters/claude-to-copilot"
import type { CopilotBundle } from "../types/copilot"
import { formatFrontmatter, parseFrontmatter } from "../utils/frontmatter"
import { assertSafeOutputName } from "../utils/path-safety"
import {
  pruneManagedOutput,
  removeLegacyBackupArtifacts,
  writeManagedOutputState,
} from "../utils/managed-output"
import { sanitizeMarkdownForTarget } from "../utils/target-content"

const STATE_FILE_NAME = ".compound-engineering-copilot-state.json"

export async function writeCopilotBundle(outputRoot: string, bundle: CopilotBundle): Promise<void> {
  const paths = resolveCopilotPaths(outputRoot)
  await ensureDir(paths.githubDir)
  const managedPaths = collectManagedPaths(paths.githubDir, bundle)
  const normalizedManagedPaths = await pruneManagedOutput(paths.githubDir, STATE_FILE_NAME, managedPaths)
  await removeLegacyBackupArtifacts(paths.githubDir, [/^copilot-mcp-config\.json\.bak\./])

  if (bundle.agents.length > 0) {
    const agentsDir = path.join(paths.githubDir, "agents")
    for (const agent of bundle.agents) {
      assertSafeOutputName(agent.name, "agent")
      await writeText(path.join(agentsDir, `${agent.name}.agent.md`), sanitizeMarkdownForTarget(agent.content, "copilot") + "\n")
    }
  }

  if (bundle.generatedSkills.length > 0) {
    const skillsDir = path.join(paths.githubDir, "skills")
    for (const skill of bundle.generatedSkills) {
      assertSafeOutputName(skill.name, "skill")
      const targetDir = path.join(skillsDir, skill.name)
      await writeText(path.join(targetDir, "SKILL.md"), sanitizeMarkdownForTarget(skill.content, "copilot") + "\n")
      if (skill.sourcePath) {
        await copyCommandReferenceDocs(skill.sourcePath, targetDir)
      }
    }
  }

  if (bundle.skillDirs.length > 0) {
    const skillsDir = path.join(paths.githubDir, "skills")
    for (const skill of bundle.skillDirs) {
      assertSafeOutputName(skill.name, "skill")
      const targetDir = path.join(skillsDir, skill.name)
      await copyDir(skill.sourceDir, targetDir)
      await transformCopiedMarkdownForCopilot(targetDir)

      const raw = await readText(skill.skillPath)
      const parsed = parseFrontmatter(raw)
      const content = formatFrontmatter(
        {
          name: skill.name,
          description: skill.description,
          model: skill.model,
        },
        transformContentForCopilot(parsed.body.trim()),
      )
      await writeText(path.join(targetDir, "SKILL.md"), sanitizeMarkdownForTarget(content, "copilot") + "\n")
    }
  }

  if (bundle.mcpConfig && Object.keys(bundle.mcpConfig).length > 0) {
    const mcpPath = path.join(paths.githubDir, "copilot-mcp-config.json")
    await writeJson(mcpPath, { mcpServers: bundle.mcpConfig })
  }

  await writeManagedOutputState(paths.githubDir, STATE_FILE_NAME, normalizedManagedPaths)
}

async function copyCommandReferenceDocs(commandSourcePath: string, targetDir: string): Promise<void> {
  const sourceReferencesDir = path.join(path.dirname(commandSourcePath), "references")
  if (!(await pathExists(sourceReferencesDir))) return
  const targetReferencesDir = path.join(targetDir, "references")
  await copyDir(sourceReferencesDir, targetReferencesDir)
  await transformCopiedMarkdownForCopilot(targetReferencesDir)
}

async function transformCopiedMarkdownForCopilot(targetDir: string): Promise<void> {
  if (!(await pathExists(targetDir))) return

  const files = await walkFiles(targetDir)
  for (const filePath of files) {
    if (path.extname(filePath) !== ".md") continue
    if (path.basename(filePath) === "SKILL.md") continue

    const original = await readText(filePath)
    const transformed = sanitizeMarkdownForTarget(original, "copilot", {
      transformBody: transformContentForCopilot,
    })
    if (transformed === original.trim()) continue
    await writeText(filePath, transformed + "\n")
  }
}

function resolveCopilotPaths(outputRoot: string) {
  const base = path.basename(outputRoot)
  // If already pointing at .github, write directly into it
  if (base === ".github") {
    return { githubDir: outputRoot }
  }
  // Otherwise nest under .github
  return { githubDir: path.join(outputRoot, ".github") }
}

function collectManagedPaths(githubDir: string, bundle: CopilotBundle): string[] {
  const managed = new Set<string>()
  for (const agent of bundle.agents) {
    managed.add(path.join(githubDir, "agents", `${agent.name}.agent.md`))
  }
  for (const skill of bundle.generatedSkills) {
    managed.add(path.join(githubDir, "skills", skill.name))
  }
  for (const skill of bundle.skillDirs) {
    managed.add(path.join(githubDir, "skills", skill.name))
  }
  if (bundle.mcpConfig && Object.keys(bundle.mcpConfig).length > 0) {
    managed.add(path.join(githubDir, "copilot-mcp-config.json"))
  }
  return [...managed]
}
