import type { ClaudeHooks, ClaudeMcpServer } from "./claude"
import type { CodexInvocationTargets } from "../utils/codex-content"

export type CodexPrompt = {
  name: string
  content: string
}

export type CodexSkillDir = {
  name: string
  description?: string
  model?: string
  disableModelInvocation?: boolean
  sourceDir: string
  skillPath?: string
}

export type CodexGeneratedSkill = {
  name: string
  content: string
  sourcePath?: string
  sidecarDirs?: CodexSidecarDir[]
}

export type CodexSidecarDir = {
  sourceDir: string
  targetName: string
}

export type CodexAgent = {
  name: string
  description: string
  instructions: string
  model?: string
  sourcePath?: string
  sidecarDirs?: CodexSidecarDir[]
}

export type CodexBundle = {
  pluginName?: string
  pluginVersion?: string
  pluginDescription?: string
  prompts: CodexPrompt[]
  skillDirs: CodexSkillDir[]
  generatedSkills: CodexGeneratedSkill[]
  agents?: CodexAgent[]
  invocationTargets?: CodexInvocationTargets
  mcpServers?: Record<string, ClaudeMcpServer>
  hooks?: ClaudeHooks
}
