import path from "path"
import { copyDir, ensureDir, pathExists, readJson, readText, writeJson, writeText } from "../utils/files"
import { formatFrontmatter, parseFrontmatter } from "../utils/frontmatter"
import type { CursorBundle, CursorMcpServer } from "../types/cursor"
import { transformContentForCursor } from "../utils/cursor-content"
import {
  pruneManagedOutput,
  removeLegacyBackupArtifacts,
  writeManagedOutputState,
} from "../utils/managed-output"
import { assertSafeOutputName } from "../utils/path-safety"
import { sanitizeMarkdownForTarget, sanitizeMarkdownTreeForTarget } from "../utils/target-content"

const STATE_FILE_NAME = ".compound-engineering-cursor-state.json"

export async function writeCursorBundle(outputRoot: string, bundle: CursorBundle): Promise<void> {
  const paths = resolveCursorPaths(outputRoot)
  await ensureDir(paths.cursorDir)

  const managedPaths = collectManagedPaths(paths, bundle)
  const normalizedManagedPaths = await pruneManagedOutput(paths.cursorDir, STATE_FILE_NAME, managedPaths)
  await removeLegacyBackupArtifacts(paths.cursorDir, [/^mcp\.json\.bak\./])

  for (const agent of bundle.agents) {
    assertSafeOutputName(agent.name, "agent")
    await writeText(
      path.join(paths.agentsRoot, `${agent.name}.md`),
      sanitizeMarkdownForTarget(agent.content, "cursor") + "\n",
    )
  }

  for (const command of bundle.commands) {
    assertSafeOutputName(command.name, "command")
    await writeText(
      path.join(paths.commandsRoot, `${command.name}.md`),
      sanitizeMarkdownForTarget(command.content, "cursor", {
        transformBody: transformContentForCursor,
      }) + "\n",
    )
  }

  for (const skill of bundle.skillDirs) {
    assertSafeOutputName(skill.name, "skill")
    const targetDir = path.join(paths.skillsRoot, skill.name)
    await copyDir(skill.sourceDir, targetDir)
    await sanitizeMarkdownTreeForTarget(targetDir, "cursor", {
      transformBody: transformContentForCursor,
    })

    const raw = await readText(skill.skillPath ?? path.join(skill.sourceDir, "SKILL.md"))
    const parsed = parseFrontmatter(raw)
    const frontmatter: Record<string, unknown> = {
      name: skill.name,
      description: skill.description ?? parsed.data.description,
    }
    if (skill.model) {
      frontmatter.model = skill.model
    }
    const body = transformContentForCursor(parsed.body.trim())
    const content = sanitizeMarkdownForTarget(formatFrontmatter(frontmatter, body), "cursor")
    await writeText(path.join(targetDir, "SKILL.md"), content + "\n")
  }

  for (const skill of bundle.generatedSkills) {
    assertSafeOutputName(skill.name, "skill")
    const skillDir = path.join(paths.skillsRoot, skill.name)
    await writeText(path.join(skillDir, "SKILL.md"), sanitizeMarkdownForTarget(skill.content, "cursor") + "\n")
  }

  if (bundle.mcpServers && Object.keys(bundle.mcpServers).length > 0) {
    await mergeCursorMcpConfig(paths.mcpPath, bundle.mcpServers)
  }

  await writeManagedOutputState(paths.cursorDir, STATE_FILE_NAME, normalizedManagedPaths)
}

type CursorPaths = {
  cursorDir: string
  agentsRoot: string
  commandsRoot: string
  skillsRoot: string
  mcpPath: string
}

function resolveCursorPaths(outputRoot: string): CursorPaths {
  const cursorDir = resolveCursorRoot(outputRoot)
  return {
    cursorDir,
    agentsRoot: path.join(cursorDir, "agents"),
    commandsRoot: path.join(cursorDir, "commands"),
    skillsRoot: path.join(cursorDir, "skills"),
    mcpPath: path.join(cursorDir, "mcp.json"),
  }
}

function resolveCursorRoot(outputRoot: string): string {
  return path.basename(outputRoot) === ".cursor" ? outputRoot : path.join(outputRoot, ".cursor")
}

function collectManagedPaths(paths: CursorPaths, bundle: CursorBundle): string[] {
  const managed = new Set<string>()

  for (const agent of bundle.agents) {
    managed.add(path.join(paths.agentsRoot, `${agent.name}.md`))
  }
  for (const command of bundle.commands) {
    managed.add(path.join(paths.commandsRoot, `${command.name}.md`))
  }
  for (const skill of bundle.skillDirs) {
    managed.add(path.join(paths.skillsRoot, skill.name))
  }
  for (const skill of bundle.generatedSkills) {
    managed.add(path.join(paths.skillsRoot, skill.name))
  }
  if (bundle.mcpServers && Object.keys(bundle.mcpServers).length > 0) {
    managed.add(paths.mcpPath)
  }

  return [...managed]
}

async function mergeCursorMcpConfig(
  mcpPath: string,
  servers: Record<string, CursorMcpServer>,
): Promise<void> {
  const existing = await readMcpConfig(mcpPath)
  await writeJson(mcpPath, {
    mcpServers: {
      ...existing,
      ...servers,
    },
  })
}

async function readMcpConfig(mcpPath: string): Promise<Record<string, CursorMcpServer>> {
  if (!(await pathExists(mcpPath))) return {}
  try {
    const parsed = await readJson<{ mcpServers?: Record<string, CursorMcpServer> }>(mcpPath)
    return parsed.mcpServers ?? {}
  } catch {
    return {}
  }
}
