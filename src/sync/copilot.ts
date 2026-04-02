import fs from "fs/promises"
import path from "path"
import type { ClaudeHomeConfig } from "../parsers/claude-home"
import type { CopilotMcpConfig } from "../types/copilot"
import { convertClaudeMcpServersForCopilot } from "../utils/copilot"
import { assertSafeOutputName } from "../utils/path-safety"
import { forceSymlink } from "../utils/symlink"

export async function syncToCopilot(
  config: ClaudeHomeConfig,
  outputRoot: string,
): Promise<void> {
  const skillsDir = path.join(outputRoot, "skills")
  await fs.mkdir(skillsDir, { recursive: true })

  for (const skill of config.skills) {
    try {
      assertSafeOutputName(skill.name, "skill")
    } catch {
      console.warn(`Skipping skill with invalid name: ${skill.name}`)
      continue
    }
    const target = path.join(skillsDir, skill.name)
    await forceSymlink(skill.sourceDir, target)
  }

  if (Object.keys(config.mcpServers).length > 0) {
    const mcpPath = path.join(outputRoot, "copilot-mcp-config.json")
    const existing = await readJsonSafe(mcpPath)
    const converted = convertClaudeMcpServersForCopilot(config.mcpServers) ?? {}
    const merged: CopilotMcpConfig = {
      mcpServers: {
        ...(existing.mcpServers ?? {}),
        ...converted,
      },
    }
    await fs.writeFile(mcpPath, JSON.stringify(merged, null, 2), { mode: 0o600 })
  }
}

async function readJsonSafe(filePath: string): Promise<Partial<CopilotMcpConfig>> {
  try {
    const content = await fs.readFile(filePath, "utf-8")
    return JSON.parse(content) as Partial<CopilotMcpConfig>
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return {}
    }
    throw err
  }
}
