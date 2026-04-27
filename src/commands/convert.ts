import { defineCommand } from "citty"
import os from "os"
import path from "path"
import { loadPluginForTargetConversion } from "../parsers/conversion-source"
import {
  convertInstallTargetHelp,
  extraCompatibilityTargetHelp,
  getDeEmphasizedTargetNamesForSurface,
  getSurfaceTargetNotice,
  resolveTargetHandler,
} from "../targets"
import type { PermissionMode } from "../converters/claude-to-opencode"
import { ensureCodexAgentsFile } from "../utils/codex-agents"
import { expandHome, resolveTargetHome } from "../utils/resolve-home"

const permissionModes: PermissionMode[] = ["none", "broad", "from-commands"]

export default defineCommand({
  meta: {
    name: "convert",
    description: "Convert plugin sources for the OpenCode-first support matrix",
  },
  args: {
    source: {
      type: "positional",
      required: true,
      description: "Path to the Claude plugin directory",
    },
    to: {
      type: "string",
      default: "opencode",
      description: convertInstallTargetHelp,
    },
    output: {
      type: "string",
      alias: "o",
      description: "Output directory (project root)",
    },
    codexHome: {
      type: "string",
      alias: "codex-home",
      description: "Write Codex output to this .codex root (ex: ~/.codex)",
    },
    piHome: {
      type: "string",
      alias: "pi-home",
      description: "Write Pi output to this Pi root (ex: ~/.pi/agent or ./.pi)",
    },
    also: {
      type: "string",
      description: extraCompatibilityTargetHelp,
    },
    permissions: {
      type: "string",
      default: "broad",
      description: "Permission mapping: none | broad | from-commands",
    },
    agentMode: {
      type: "string",
      default: "subagent",
      description: "Default agent mode: primary | subagent",
    },
    inferTemperature: {
      type: "boolean",
      default: true,
      description: "Infer agent temperature from name/description",
    },
  },
  async run({ args }) {
    const targetName = String(args.to)
    const target = resolveTargetHandler(targetName, "convert")
    warnIfDeEmphasizedTarget(targetName)

    const permissions = String(args.permissions)
    if (!permissionModes.includes(permissions as PermissionMode)) {
      throw new Error(`Unknown permissions mode: ${permissions}`)
    }

    const plugin = await loadPluginForTargetConversion(String(args.source))
    const outputRoot = resolveOutputRoot(args.output)
    const codexHome = resolveTargetHome(args.codexHome, path.join(os.homedir(), ".codex"))
    const piHome = resolveTargetHome(args.piHome, path.join(os.homedir(), ".pi", "agent"))

    const options = {
      agentMode: String(args.agentMode) === "primary" ? "primary" : "subagent",
      inferTemperature: Boolean(args.inferTemperature),
      permissions: permissions as PermissionMode,
    }

    const primaryOutputRoot = resolveTargetOutputRoot(targetName, outputRoot, codexHome, piHome)
    const bundle = target.convert(plugin, options)
    if (!bundle) {
      throw new Error(`Target ${targetName} did not return a bundle.`)
    }

    await target.write(primaryOutputRoot, bundle)
    console.log(`Converted ${plugin.manifest.name} to ${targetName} at ${primaryOutputRoot}`)

    const extraTargets = parseExtraTargets(args.also, targetName)
    const allTargets = [targetName, ...extraTargets]
    for (const extra of extraTargets) {
      const handler = resolveTargetHandler(extra, "convert")
      warnIfDeEmphasizedTarget(extra)
      const extraBundle = handler.convert(plugin, options)
      if (!extraBundle) {
        console.warn(`Skipping ${extra}: no output returned.`)
        continue
      }
      const extraRoot = resolveTargetOutputRoot(extra, path.join(outputRoot, extra), codexHome, piHome)
      await handler.write(extraRoot, extraBundle)
      console.log(`Converted ${plugin.manifest.name} to ${extra} at ${extraRoot}`)
    }

    if (allTargets.includes("codex")) {
      await ensureCodexAgentsFile(codexHome)
    }
  },
})

function parseExtraTargets(value: unknown, primaryTarget?: string): string[] {
  if (!value) return []

  const allowedTargets = new Set(getDeEmphasizedTargetNamesForSurface("convert"))
  const parsedTargets: string[] = []

  for (const entry of String(value)
    .split(",")
    .map((targetName) => targetName.trim())
    .filter(Boolean)) {
    if (entry === primaryTarget || parsedTargets.includes(entry)) {
      continue
    }

    if (!allowedTargets.has(entry)) {
      console.warn(
        `Skipping ${entry}: --also only supports de-emphasized compatibility targets (${[...allowedTargets].join(", ")}).`,
      )
      continue
    }

    parsedTargets.push(entry)
  }

  return parsedTargets
}

function resolveOutputRoot(value: unknown): string {
  if (value && String(value).trim()) {
    const expanded = expandHome(String(value).trim())
    return path.resolve(expanded)
  }
  return process.cwd()
}

function resolveTargetOutputRoot(targetName: string, outputRoot: string, codexHome: string, piHome: string): string {
  if (targetName === "codex") return codexHome
  if (targetName === "pi") return piHome
  if (targetName === "droid") return path.join(os.homedir(), ".factory")
  if (targetName === "gemini") return path.join(outputRoot, ".gemini")
  if (targetName === "kiro") return path.join(outputRoot, ".kiro")
  return outputRoot
}

function warnIfDeEmphasizedTarget(targetName: string): void {
  const notice = getSurfaceTargetNotice(targetName, "convert")
  if (notice) {
    console.warn(`[support-tier] ${notice}`)
  }
}
