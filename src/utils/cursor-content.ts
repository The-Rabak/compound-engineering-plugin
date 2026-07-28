/**
 * Transform Claude Code content into Cursor-compatible references.
 *
 * 1. Task agent calls: Task agent-name(args) -> Use the `agent-name` agent to: args
 * 2. Slash commands: /workflows:plan -> /workflows-plan
 * 3. Path rewriting: .claude/ -> .cursor/, ~/.claude/ -> ~/.cursor/
 * 4. Agent references: @agent-name -> the `agent-name` agent
 */
export function transformContentForCursor(body: string): string {
  let result = body

  const taskPattern = /^(\s*-?\s*)Task\s+([a-z][a-z0-9-]*)\(([^)]+)\)/gm
  result = result.replace(taskPattern, (_match, prefix: string, agentName: string, args: string) => {
    return `${prefix}Use the \`${normalizeCursorName(agentName)}\` agent to: ${args.trim()}`
  })

  const slashCommandPattern = /(?<![:\w])\/([a-z][a-z0-9_:-]*?)(?=[\s,."')\]}`]|$)/gi
  result = result.replace(slashCommandPattern, (match, commandName: string) => {
    if (commandName.includes("/")) return match
    if (["dev", "tmp", "etc", "usr", "var", "bin", "home"].includes(commandName)) return match
    return `/${normalizeCursorName(commandName)}`
  })

  result = result
    .replace(/~\/\.claude\//g, "~/.cursor/")
    .replace(/\.claude\//g, ".cursor/")

  const agentRefPattern =
    /@([a-z][a-z0-9-]*-(?:agent|reviewer|researcher|analyst|specialist|oracle|sentinel|guardian|strategist))/gi
  result = result.replace(agentRefPattern, (_match, agentName: string) => {
    return `the \`${normalizeCursorName(agentName)}\` agent`
  })

  return result
}

export function normalizeCursorName(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return "item"
  const normalized = trimmed
    .toLowerCase()
    .replace(/[\\/]+/g, "-")
    .replace(/[:\s]+/g, "-")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
  return normalized || "item"
}
