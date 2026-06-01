import path from "path"
import {
  copyDir,
  ensureDir,
  pathExists,
  readText,
  writeJson,
  writeText,
} from "../utils/files"
import type { PiBundle } from "../types/pi"
import {
  pruneManagedOutput,
  removeLegacyBackupArtifacts,
  writeManagedOutputState,
} from "../utils/managed-output"

const PI_AGENTS_BLOCK_START = "<!-- BEGIN COMPOUND PI TOOL MAP -->"
const PI_AGENTS_BLOCK_END = "<!-- END COMPOUND PI TOOL MAP -->"

const PI_AGENTS_BLOCK_BODY = `## Compound Engineering (Pi compatibility)

This block is managed by compound-plugin.

Compatibility notes:
- Claude Task(agent, args) maps to the subagent extension tool
- For parallel agent runs, batch multiple subagent calls with multi_tool_use.parallel
- AskUserQuestion maps to the ask_user_question extension tool
- MCP access uses MCPorter via mcporter_list and mcporter_call extension tools
- MCPorter config path: .pi/compound-engineering/mcporter.json (project) or ~/.pi/agent/compound-engineering/mcporter.json (global)
`
const STATE_FILE_NAME = ".compound-engineering-pi-state.json"

export async function writePiBundle(outputRoot: string, bundle: PiBundle): Promise<void> {
  const paths = resolvePiPaths(outputRoot)
  const managedPaths = collectManagedPaths(paths, bundle)
  const normalizedManagedPaths = await pruneManagedOutput(paths.root, STATE_FILE_NAME, managedPaths)
  await removeLegacyBackupArtifacts(paths.root, [/^mcporter\.json\.bak\./])

  await ensureDir(paths.skillsDir)
  await ensureDir(paths.promptsDir)
  await ensureDir(paths.extensionsDir)

  for (const prompt of bundle.prompts) {
    await writeText(path.join(paths.promptsDir, `${prompt.name}.md`), prompt.content + "\n")
  }

  for (const skill of bundle.skillDirs) {
    await copyDir(skill.sourceDir, path.join(paths.skillsDir, skill.name))
  }

  for (const skill of bundle.generatedSkills) {
    await writeText(path.join(paths.skillsDir, skill.name, "SKILL.md"), skill.content + "\n")
  }

  for (const extension of bundle.extensions) {
    await writeText(path.join(paths.extensionsDir, extension.name), extension.content + "\n")
  }

  if (bundle.mcporterConfig) {
    await writeJson(paths.mcporterConfigPath, bundle.mcporterConfig)
  }

  await ensurePiAgentsBlock(paths.agentsPath)
  await writeManagedOutputState(paths.root, STATE_FILE_NAME, normalizedManagedPaths)
}

function resolvePiPaths(outputRoot: string) {
  const base = path.basename(outputRoot)

  // Global install root: ~/.pi/agent
  if (base === "agent") {
    return {
      root: outputRoot,
      skillsDir: path.join(outputRoot, "skills"),
      promptsDir: path.join(outputRoot, "prompts"),
      extensionsDir: path.join(outputRoot, "extensions"),
      mcporterConfigPath: path.join(outputRoot, "compound-engineering", "mcporter.json"),
      agentsPath: path.join(outputRoot, "AGENTS.md"),
    }
  }

  // Project local .pi directory
  if (base === ".pi") {
    return {
      root: outputRoot,
      skillsDir: path.join(outputRoot, "skills"),
      promptsDir: path.join(outputRoot, "prompts"),
      extensionsDir: path.join(outputRoot, "extensions"),
      mcporterConfigPath: path.join(outputRoot, "compound-engineering", "mcporter.json"),
      agentsPath: path.join(outputRoot, "AGENTS.md"),
    }
  }

  // Custom output root -> nest under .pi
  return {
    root: path.join(outputRoot, ".pi"),
    skillsDir: path.join(outputRoot, ".pi", "skills"),
    promptsDir: path.join(outputRoot, ".pi", "prompts"),
    extensionsDir: path.join(outputRoot, ".pi", "extensions"),
    mcporterConfigPath: path.join(outputRoot, ".pi", "compound-engineering", "mcporter.json"),
    agentsPath: path.join(outputRoot, "AGENTS.md"),
  }
}

function collectManagedPaths(paths: ReturnType<typeof resolvePiPaths>, bundle: PiBundle): string[] {
  const managed = new Set<string>()
  for (const prompt of bundle.prompts) {
    managed.add(path.join(paths.promptsDir, `${prompt.name}.md`))
  }
  for (const skill of bundle.skillDirs) {
    managed.add(path.join(paths.skillsDir, skill.name))
  }
  for (const skill of bundle.generatedSkills) {
    managed.add(path.join(paths.skillsDir, skill.name))
  }
  for (const extension of bundle.extensions) {
    managed.add(path.join(paths.extensionsDir, extension.name))
  }
  if (bundle.mcporterConfig) {
    managed.add(paths.mcporterConfigPath)
  }
  return [...managed]
}

async function ensurePiAgentsBlock(filePath: string): Promise<void> {
  const block = buildPiAgentsBlock()

  if (!(await pathExists(filePath))) {
    await writeText(filePath, block + "\n")
    return
  }

  const existing = await readText(filePath)
  const updated = upsertBlock(existing, block)
  if (updated !== existing) {
    await writeText(filePath, updated)
  }
}

function buildPiAgentsBlock(): string {
  return [PI_AGENTS_BLOCK_START, PI_AGENTS_BLOCK_BODY.trim(), PI_AGENTS_BLOCK_END].join("\n")
}

function upsertBlock(existing: string, block: string): string {
  const startIndex = existing.indexOf(PI_AGENTS_BLOCK_START)
  const endIndex = existing.indexOf(PI_AGENTS_BLOCK_END)

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const before = existing.slice(0, startIndex).trimEnd()
    const after = existing.slice(endIndex + PI_AGENTS_BLOCK_END.length).trimStart()
    return [before, block, after].filter(Boolean).join("\n\n") + "\n"
  }

  if (existing.trim().length === 0) {
    return block + "\n"
  }

  return existing.trimEnd() + "\n\n" + block + "\n"
}
