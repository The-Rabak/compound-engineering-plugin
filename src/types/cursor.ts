export type CursorAgent = {
  name: string
  content: string
}

export type CursorCommand = {
  name: string
  content: string
}

export type CursorSkillDir = {
  name: string
  description?: string
  model?: string
  sourceDir: string
  skillPath?: string
}

export type CursorGeneratedSkill = {
  name: string
  content: string
  sourcePath?: string
}

export type CursorMcpServer = {
  command?: string
  args?: string[]
  env?: Record<string, string>
  url?: string
  headers?: Record<string, string>
}

export type CursorBundle = {
  agents: CursorAgent[]
  commands: CursorCommand[]
  skillDirs: CursorSkillDir[]
  generatedSkills: CursorGeneratedSkill[]
  mcpServers?: Record<string, CursorMcpServer>
}
