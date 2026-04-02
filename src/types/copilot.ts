export type CopilotAgent = {
  name: string
  content: string
}

export type CopilotGeneratedSkill = {
  name: string
  content: string
}

export type CopilotSkillDir = {
  name: string
  description?: string
  model?: string
  sourceDir: string
  skillPath: string
}

export type CopilotMcpServer = {
  type: string
  command?: string
  args?: string[]
  url?: string
  tools: string[]
  env?: Record<string, string>
  headers?: Record<string, string>
}

export type CopilotMcpConfig = {
  mcpServers: Record<string, CopilotMcpServer>
}

export type CopilotBundle = {
  agents: CopilotAgent[]
  generatedSkills: CopilotGeneratedSkill[]
  skillDirs: CopilotSkillDir[]
  mcpConfig?: Record<string, CopilotMcpServer>
}
