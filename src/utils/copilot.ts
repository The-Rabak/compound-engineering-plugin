import type { ClaudeMcpServer } from "../types/claude"
import type { CopilotMcpServer } from "../types/copilot"

export function convertClaudeMcpServersForCopilot(
  servers?: Record<string, ClaudeMcpServer>,
): Record<string, CopilotMcpServer> | undefined {
  if (!servers || Object.keys(servers).length === 0) return undefined

  const result: Record<string, CopilotMcpServer> = {}
  for (const [name, server] of Object.entries(servers)) {
    const entry: CopilotMcpServer = {
      type: server.command ? "local" : "sse",
      tools: ["*"],
    }

    if (server.command) {
      entry.command = server.command
      if (server.args && server.args.length > 0) entry.args = server.args
    } else if (server.url) {
      entry.url = server.url
      if (server.headers && Object.keys(server.headers).length > 0) entry.headers = server.headers
    }

    if (server.env && Object.keys(server.env).length > 0) {
      entry.env = prefixCopilotMcpEnvVars(server.env)
    }

    result[name] = entry
  }

  return result
}

export function prefixCopilotMcpEnvVars(env: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith("COPILOT_MCP_")) {
      result[key] = value
    } else {
      result[`COPILOT_MCP_${key}`] = value
    }
  }
  return result
}
