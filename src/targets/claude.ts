import path from "path"
import { copyDir, ensureDir, readText, writeJson, writeText } from "../utils/files"
import { formatFrontmatter } from "../utils/frontmatter"
import { parseFrontmatter } from "../utils/frontmatter"
import type { ClaudeAgent, ClaudeCommand, ClaudeManifest, ClaudePlugin, ClaudeSkill } from "../types/claude"

export async function writeClaudeBundle(outputRoot: string, plugin: ClaudePlugin): Promise<void> {
  await ensureDir(outputRoot)
  await writeJson(path.join(outputRoot, ".claude-plugin", "plugin.json"), buildClaudeManifest(plugin.manifest))

  for (const agent of plugin.agents) {
    const relativePath = relativeComponentPath(plugin.root, "agents", agent.sourcePath, `${agent.name}.md`)
    await writeText(path.join(outputRoot, "agents", relativePath), formatAgent(agent) + "\n")
  }

  for (const command of plugin.commands) {
    const relativePath = relativeComponentPath(plugin.root, "commands", command.sourcePath, `${command.name}.md`)
    await writeText(path.join(outputRoot, "commands", relativePath), formatCommand(command) + "\n")
  }

  for (const skill of plugin.skills) {
    const relativeDir = relativeComponentDir(plugin.root, "skills", skill.sourceDir, skill.name)
    const destination = path.join(outputRoot, "skills", relativeDir)
    await copyDir(skill.sourceDir, destination)
    const body = await readSkillBody(skill)
    await writeText(path.join(destination, "SKILL.md"), formatSkill(skill, body) + "\n")
  }

  if (plugin.hooks) {
    await writeJson(path.join(outputRoot, "hooks", "hooks.json"), plugin.hooks)
  }
}

function buildClaudeManifest(manifest: ClaudeManifest): ClaudeManifest {
  return {
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    author: manifest.author,
    homepage: manifest.homepage,
    repository: manifest.repository,
    license: manifest.license,
    keywords: manifest.keywords,
    mcpServers: manifest.mcpServers,
  }
}

function formatAgent(agent: ClaudeAgent): string {
  return formatFrontmatter(
    {
      name: agent.name,
      description: agent.description,
      capabilities: agent.capabilities,
      model: agent.model,
    },
    agent.body,
  )
}

function formatCommand(command: ClaudeCommand): string {
  return formatFrontmatter(
    {
      name: command.name,
      description: command.description,
      "argument-hint": command.argumentHint,
      model: command.model,
      "allowed-tools": command.allowedTools,
      "disable-model-invocation": command.disableModelInvocation,
    },
    command.body,
  )
}

function formatSkill(skill: ClaudeSkill, body: string): string {
  return formatFrontmatter(
    {
      name: skill.name,
      description: skill.description,
      "disable-model-invocation": skill.disableModelInvocation,
    },
    body,
  )
}

async function readSkillBody(skill: ClaudeSkill): Promise<string> {
  const raw = await readText(skill.skillPath)
  return parseFrontmatter(raw).body.trim()
}

function relativeComponentPath(root: string, componentDir: string, sourcePath: string, fallback: string): string {
  const componentRoot = path.join(root, componentDir)
  if (sourcePath.startsWith(componentRoot + path.sep)) {
    return path.relative(componentRoot, sourcePath)
  }
  return fallback
}

function relativeComponentDir(root: string, componentDir: string, sourceDir: string, fallback: string): string {
  const componentRoot = path.join(root, componentDir)
  if (sourceDir.startsWith(componentRoot + path.sep)) {
    return path.relative(componentRoot, sourceDir)
  }
  return fallback
}
