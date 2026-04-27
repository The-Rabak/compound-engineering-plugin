import { defineCommand } from "citty"
import os from "os"
import path from "path"
import { loadClaudeHome } from "../parsers/claude-home"
import { syncToOpenCode } from "../sync/opencode"
import { syncToCodex } from "../sync/codex"
import { syncToPi } from "../sync/pi"
import { syncToDroid } from "../sync/droid"
import { syncToCopilot } from "../sync/copilot"
import { getSurfaceTargetNotice, getTargetNamesForSurface, syncTargetHelp } from "../targets"
import { expandHome } from "../utils/resolve-home"
 
const syncHandlers = {
  opencode: syncToOpenCode,
  copilot: syncToCopilot,
  codex: syncToCodex,
  droid: syncToDroid,
  pi: syncToPi,
} as const

type SyncTarget = keyof typeof syncHandlers

/** Check if any MCP servers have env vars that might contain secrets */
function hasPotentialSecrets(mcpServers: Record<string, unknown>): boolean {
  const sensitivePatterns = /key|token|secret|password|credential|api_key/i
  for (const server of Object.values(mcpServers)) {
    const env = (server as { env?: Record<string, string> }).env
    if (env) {
      for (const key of Object.keys(env)) {
        if (sensitivePatterns.test(key)) return true
      }
    }
  }
  return false
}

function resolveOutputRoot(target: SyncTarget): string {
  switch (target) {
    case "opencode":
      return path.join(os.homedir(), ".config", "opencode")
    case "codex":
      return path.join(os.homedir(), ".codex")
    case "pi":
      return path.join(os.homedir(), ".pi", "agent")
    case "droid":
      return path.join(os.homedir(), ".factory")
    case "copilot":
      return path.join(process.cwd(), ".github")
  }
}

export default defineCommand({
  meta: {
    name: "sync",
    description: "Sync Claude Code config into the OpenCode-first support matrix",
  },
  args: {
    target: {
      type: "string",
      required: true,
      description: syncTargetHelp,
    },
    claudeHome: {
      type: "string",
      alias: "claude-home",
      description: "Path to Claude home (default: ~/.claude)",
    },
  },
  async run({ args }) {
    const target = resolveSyncTarget(String(args.target))
    warnIfDeEmphasizedTarget(target)

    const claudeHome = expandHome(args.claudeHome ?? path.join(os.homedir(), ".claude"))
    const config = await loadClaudeHome(claudeHome)

    // Warn about potential secrets in MCP env vars
    if (hasPotentialSecrets(config.mcpServers)) {
      console.warn(
        "⚠️  Warning: MCP servers contain env vars that may include secrets (API keys, tokens).\n" +
        "   These will be copied to the target config. Review before sharing the config file.",
      )
    }

    console.log(
      `Syncing ${config.skills.length} skills, ${Object.keys(config.mcpServers).length} MCP servers...`,
    )

    const outputRoot = resolveOutputRoot(target)

    await syncHandlers[target](config, outputRoot)

    console.log(`✓ Synced to ${target}: ${outputRoot}`)
  },
})

function resolveSyncTarget(value: string): SyncTarget {
  const validTargets = getTargetNamesForSurface("sync")
  if (!validTargets.includes(value)) {
    throw new Error(`Unknown target: ${value}. Use one of: ${validTargets.join(", ")}`)
  }

  if (!Object.prototype.hasOwnProperty.call(syncHandlers, value)) {
    throw new Error(`Target ${value} is listed for sync but has no sync implementation.`)
  }

  return value as SyncTarget
}

function warnIfDeEmphasizedTarget(targetName: SyncTarget): void {
  const notice = getSurfaceTargetNotice(targetName, "sync")
  if (notice) {
    console.warn(`[support-tier] ${notice}`)
  }
}
