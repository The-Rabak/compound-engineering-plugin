import path from "path"
import { backupFile, copyDir, ensureDir, readText, writeJson, writeText } from "../utils/files"
import { transformContentForCopilot } from "../converters/claude-to-copilot"
import type { CopilotBundle } from "../types/copilot"
import { formatFrontmatter, parseFrontmatter } from "../utils/frontmatter"
import { assertSafeOutputName } from "../utils/path-safety"

export async function writeCopilotBundle(outputRoot: string, bundle: CopilotBundle): Promise<void> {
  const paths = resolveCopilotPaths(outputRoot)
  await ensureDir(paths.githubDir)

  if (bundle.agents.length > 0) {
    const agentsDir = path.join(paths.githubDir, "agents")
    for (const agent of bundle.agents) {
      assertSafeOutputName(agent.name, "agent")
      await writeText(path.join(agentsDir, `${agent.name}.agent.md`), agent.content + "\n")
    }
  }

  if (bundle.generatedSkills.length > 0) {
    const skillsDir = path.join(paths.githubDir, "skills")
    for (const skill of bundle.generatedSkills) {
      assertSafeOutputName(skill.name, "skill")
      await writeText(path.join(skillsDir, skill.name, "SKILL.md"), skill.content + "\n")
    }
  }

  if (bundle.skillDirs.length > 0) {
    const skillsDir = path.join(paths.githubDir, "skills")
    for (const skill of bundle.skillDirs) {
      assertSafeOutputName(skill.name, "skill")
      const targetDir = path.join(skillsDir, skill.name)
      await copyDir(skill.sourceDir, targetDir)

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
      await writeText(path.join(targetDir, "SKILL.md"), content + "\n")
    }
  }

  if (bundle.mcpConfig && Object.keys(bundle.mcpConfig).length > 0) {
    const mcpPath = path.join(paths.githubDir, "copilot-mcp-config.json")
    const backupPath = await backupFile(mcpPath)
    if (backupPath) {
      console.log(`Backed up existing copilot-mcp-config.json to ${backupPath}`)
    }
    await writeJson(mcpPath, { mcpServers: bundle.mcpConfig })
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
