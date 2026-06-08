export type CodexInvocationTargets = {
  skillTargets: Record<string, string>
  agentTargets: Record<string, string>
}

export type CodexTransformOptions = {
  unknownSlashBehavior?: "preserve" | "skill"
}

export function transformContentForCodex(
  body: string,
  targets?: CodexInvocationTargets,
  options: CodexTransformOptions = {},
): string {
  let result = body
  const skillTargets = targets?.skillTargets ?? {}
  const agentTargets = targets?.agentTargets ?? {}
  const unknownSlashBehavior = options.unknownSlashBehavior ?? "preserve"

  const taskPattern = /^(\s*-?\s*)Task\s+([a-z][a-z0-9:-]*)\(([^)]*)\)/gm
  result = result.replace(taskPattern, (_match, prefix: string, agentName: string, args: string) => {
    const agentTarget = resolveTarget(agentName, agentTargets)
    const trimmedArgs = args.trim()
    if (agentTarget) {
      return trimmedArgs
        ? `${prefix}Spawn the custom agent \`${agentTarget}\` with task: ${trimmedArgs}`
        : `${prefix}Spawn the custom agent \`${agentTarget}\``
    }

    const finalSegment = agentName.includes(":") ? agentName.split(":").pop()! : agentName
    const skillTarget = resolveTarget(finalSegment, skillTargets) ?? normalizeCodexName(finalSegment)
    return trimmedArgs
      ? `${prefix}Use the $${skillTarget} skill to: ${trimmedArgs}`
      : `${prefix}Use the $${skillTarget} skill`
  })

  const backtickedAgentPattern = /`([a-z][a-z0-9-]*(?::[a-z][a-z0-9-]*){1,2})`/gi
  result = result.replace(backtickedAgentPattern, (match, agentName: string) => {
    const agentTarget = resolveTarget(agentName, agentTargets)
    return agentTarget ? `custom agent \`${agentTarget}\`` : match
  })

  const slashCommandPattern = /(?<![:\w>}\]\)])\/([a-z][a-z0-9_:-]*?)(?=[\s,."')\]}`]|$)/gi
  result = result.replace(slashCommandPattern, (match, commandName: string) => {
    if (commandName.includes("/")) return match
    if (["dev", "tmp", "etc", "usr", "var", "bin", "home"].includes(commandName)) return match

    const skillTarget = resolveTarget(commandName, skillTargets)
    if (skillTarget) return `$${skillTarget} skill`
    if (unknownSlashBehavior === "skill") return `$${normalizeCodexName(commandName)} skill`
    return match
  })

  result = result
    .replace(/commands\/[a-z0-9/_:-]+\/references\/([a-z0-9-]+\.md)/gi, "references/$1")
    .replace(/command reference directory/g, "local `references/` directory bundled with this skill")
    .replace(/~\/\.claude\/agents\//g, "~/.codex/agents/")
    .replace(/~\/\.claude\/commands\//g, "~/.agents/skills/")
    .replace(/~\/\.claude\/skills\//g, "~/.agents/skills/")
    .replace(/~\/\.claude\/plugins\//g, "~/.codex/plugins/")
    .replace(/~\/\.claude\//g, "~/.codex/")
    .replace(/\.claude\/agents\//g, ".codex/agents/")
    .replace(/\.claude\/commands\//g, ".agents/skills/")
    .replace(/\.claude\/skills\//g, ".agents/skills/")
    .replace(/\.claude\/plugins\//g, ".codex/plugins/")
    .replace(/\.claude\//g, ".codex/")

  const agentRefPattern =
    /@([a-z][a-z0-9-]*-(?:agent|reviewer|researcher|analyst|specialist|oracle|sentinel|guardian|strategist))/gi
  result = result.replace(agentRefPattern, (_match, agentName: string) => {
    const agentTarget = resolveTarget(agentName, agentTargets)
    if (agentTarget) return `custom agent \`${agentTarget}\``
    return `$${normalizeCodexName(agentName)} skill`
  })

  return result
}

export function normalizeCodexName(value: string): string {
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

function resolveTarget(value: string, targets: Record<string, string>): string | null {
  const parts = value.split(":").filter(Boolean)
  const candidates = [
    normalizeCodexName(value),
    parts.length >= 2 ? normalizeCodexName(parts.slice(-2).join(":")) : "",
    parts.length >= 1 ? normalizeCodexName(parts[parts.length - 1]) : "",
  ].filter(Boolean)

  for (const candidate of candidates) {
    const target = targets[candidate]
    if (target) return target
  }
  return null
}
