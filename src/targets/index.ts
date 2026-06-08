import type { ClaudePlugin } from "../types/claude"
import type { OpenCodeBundle } from "../types/opencode"
import type { CodexBundle } from "../types/codex"
import type { DroidBundle } from "../types/droid"
import type { PiBundle } from "../types/pi"
import type { CopilotBundle } from "../types/copilot"
import type { GeminiBundle } from "../types/gemini"
import type { KiroBundle } from "../types/kiro"
import { convertClaudeToOpenCode, type ClaudeToOpenCodeOptions } from "../converters/claude-to-opencode"
import { convertClaudeToCodex } from "../converters/claude-to-codex"
import { convertClaudeToDroid } from "../converters/claude-to-droid"
import { convertClaudeToPi } from "../converters/claude-to-pi"
import { convertClaudeToCopilot } from "../converters/claude-to-copilot"
import { convertClaudeToGemini } from "../converters/claude-to-gemini"
import { convertClaudeToKiro } from "../converters/claude-to-kiro"
import { writeOpenCodeBundle } from "./opencode"
import { writeCodexBundle } from "./codex"
import { writeDroidBundle } from "./droid"
import { writePiBundle } from "./pi"
import { writeCopilotBundle } from "./copilot"
import { writeGeminiBundle } from "./gemini"
import { writeKiroBundle } from "./kiro"

export type SupportTier = "first-class" | "second-class" | "third-class" | "non-core"
export type CleanupRubric = "keep" | "de-emphasize" | "remove"
export type TargetSurface = "build" | "convert" | "install" | "sync"

export const supportTierPositioning =
  "OpenCode is first-class, Copilot and Codex are second-class generated surfaces, and Claude Code remains a third-class generated compatibility surface."

export const cleanupRubric = {
  keep: "Actively maintain the surface because it directly serves the supported workflow order.",
  "de-emphasize": "Keep the surface available as a compatibility bridge, but stop treating it as a co-equal product surface.",
  remove: "Document the migration path first, then remove the stale or duplicate surface in follow-up cleanup work.",
} as const satisfies Record<CleanupRubric, string>

export type TargetPolicy = {
  name: string
  tier: SupportTier
  cleanup: CleanupRubric
  rationale: string
  surfaces: TargetSurface[]
}

export const targetPolicies = {
  opencode: {
    name: "opencode",
    tier: "first-class",
    cleanup: "keep",
    rationale: "Primary daily-driver install, conversion, and sync target for the maintainer's real workflow.",
    surfaces: ["convert", "install", "sync"],
  },
  copilot: {
    name: "copilot",
    tier: "second-class",
    cleanup: "keep",
    rationale: "Supported generated output for GitHub-native workflows, but still behind OpenCode in authoring priority.",
    surfaces: ["build", "convert", "install", "sync"],
  },
  claude: {
    name: "claude",
    tier: "third-class",
    cleanup: "keep",
    rationale: "Maintained generated plugin and marketplace output, but no longer the repo's leading day-to-day surface.",
    surfaces: ["build"],
  },
  codex: {
    name: "codex",
    tier: "second-class",
    cleanup: "keep",
    rationale: "Supported generated output for OpenAI Codex workflows, including full local export and repo marketplace packaging.",
    surfaces: ["build", "convert", "install", "sync"],
  },
  droid: {
    name: "droid",
    tier: "non-core",
    cleanup: "de-emphasize",
    rationale: "Compatibility exporter retained while cleanup work trims low-value targets.",
    surfaces: ["convert", "install", "sync"],
  },
  pi: {
    name: "pi",
    tier: "non-core",
    cleanup: "de-emphasize",
    rationale: "Compatibility exporter retained for migration coverage, not because it is a core maintainer surface.",
    surfaces: ["convert", "install", "sync"],
  },
  gemini: {
    name: "gemini",
    tier: "non-core",
    cleanup: "de-emphasize",
    rationale: "Compatibility exporter kept available short-term, but it expands maintenance beyond the core stack.",
    surfaces: ["convert", "install"],
  },
  kiro: {
    name: "kiro",
    tier: "non-core",
    cleanup: "de-emphasize",
    rationale: "Compatibility exporter kept for now, but explicitly behind the OpenCode/Copilot/Claude support ladder.",
    surfaces: ["convert", "install"],
  },
} as const satisfies Record<string, TargetPolicy>

export const legacyAssets = [
  {
    name: ".github_gpt export tree",
    cleanup: "remove",
    rationale: "Historical Copilot-shaped output outside the canonical portable -> .github generation path.",
  },
  {
    name: "Dormant Cursor exporter and sync code",
    cleanup: "remove",
    rationale: "Cursor-specific converter, writer, and sync code exist in the repo but are not part of the surfaced target matrix.",
  },
  {
    name: "Claude-home sync mirrors",
    cleanup: "de-emphasize",
    rationale: "Migration-only path from older Claude-first local setups into newer targets.",
  },
] as const satisfies ReadonlyArray<{ name: string; cleanup: CleanupRubric; rationale: string }>

type TargetName = keyof typeof targetPolicies

const targetPolicyOrder = Object.keys(targetPolicies) as TargetName[]

export function getTargetPolicy(targetName: string): TargetPolicy | undefined {
  if (!Object.prototype.hasOwnProperty.call(targetPolicies, targetName)) {
    return undefined
  }
  return targetPolicies[targetName as TargetName]
}

export function getTargetPoliciesForSurface(surface: TargetSurface): TargetPolicy[] {
  return targetPolicyOrder
    .map((targetName) => targetPolicies[targetName])
    .filter((policy) => policy.surfaces.includes(surface))
}

export function getTargetNamesForSurface(surface: TargetSurface): string[] {
  return getTargetPoliciesForSurface(surface).map((policy) => policy.name)
}

export function getDeEmphasizedTargetNamesForSurface(surface: TargetSurface): string[] {
  return getTargetPoliciesForSurface(surface)
    .filter((policy) => policy.cleanup === "de-emphasize")
    .map((policy) => policy.name)
}

export function getSurfaceTargetNotice(targetName: string, surface: TargetSurface): string | null {
  const policy = getTargetPolicy(targetName)
  if (!policy || !policy.surfaces.includes(surface) || policy.cleanup !== "de-emphasize") {
    return null
  }

  return `${policy.name} is a de-emphasized compatibility target. ${policy.rationale}`
}

function formatTierTargets(targetNames: string[]): string {
  return targetNames
    .map((targetName) => {
      const policy = getTargetPolicy(targetName)
      return policy ? `${policy.name} (${policy.tier})` : targetName
    })
    .join(" | ")
}

const convertInstallCoreTargets = getTargetPoliciesForSurface("convert")
  .filter((policy) => policy.cleanup === "keep")
  .map((policy) => policy.name)

const convertInstallCompatibilityTargets = getDeEmphasizedTargetNamesForSurface("convert")
const convertInstallExtraTargets = getTargetPoliciesForSurface("convert")
  .filter((policy) => policy.name !== "opencode")
  .map((policy) => policy.name)
const syncCoreTargets = getTargetPoliciesForSurface("sync")
  .filter((policy) => policy.cleanup === "keep")
  .map((policy) => policy.name)
const syncLegacyTargets = getDeEmphasizedTargetNamesForSurface("sync")

export const convertInstallTargetHelp =
  `Target format. Core: ${formatTierTargets(convertInstallCoreTargets)}. Compatibility: ${convertInstallCompatibilityTargets.join(" | ")} (de-emphasized).`

export const extraCompatibilityTargetHelp =
  `Comma-separated extra targets to write alongside the primary target (supported: ${convertInstallExtraTargets.join(", ")})`

export const syncTargetHelp =
  `Target. Preferred: ${formatTierTargets(syncCoreTargets)}. Legacy mirrors: ${syncLegacyTargets.join(" | ")} (de-emphasized).`

export type TargetHandler<TBundle = unknown> = TargetPolicy & {
  name: string
  implemented: boolean
  convert: (plugin: ClaudePlugin, options: ClaudeToOpenCodeOptions) => TBundle | null
  write: (outputRoot: string, bundle: TBundle) => Promise<void>
}

export const targets: Record<string, TargetHandler> = {
  opencode: {
    name: "opencode",
    tier: targetPolicies.opencode.tier,
    cleanup: targetPolicies.opencode.cleanup,
    rationale: targetPolicies.opencode.rationale,
    surfaces: [...targetPolicies.opencode.surfaces],
    implemented: true,
    convert: convertClaudeToOpenCode,
    write: writeOpenCodeBundle,
  },
  codex: {
    name: "codex",
    tier: targetPolicies.codex.tier,
    cleanup: targetPolicies.codex.cleanup,
    rationale: targetPolicies.codex.rationale,
    surfaces: [...targetPolicies.codex.surfaces],
    implemented: true,
    convert: convertClaudeToCodex as TargetHandler<CodexBundle>["convert"],
    write: writeCodexBundle as TargetHandler<CodexBundle>["write"],
  },
  droid: {
    name: "droid",
    tier: targetPolicies.droid.tier,
    cleanup: targetPolicies.droid.cleanup,
    rationale: targetPolicies.droid.rationale,
    surfaces: [...targetPolicies.droid.surfaces],
    implemented: true,
    convert: convertClaudeToDroid as TargetHandler<DroidBundle>["convert"],
    write: writeDroidBundle as TargetHandler<DroidBundle>["write"],
  },
  pi: {
    name: "pi",
    tier: targetPolicies.pi.tier,
    cleanup: targetPolicies.pi.cleanup,
    rationale: targetPolicies.pi.rationale,
    surfaces: [...targetPolicies.pi.surfaces],
    implemented: true,
    convert: convertClaudeToPi as TargetHandler<PiBundle>["convert"],
    write: writePiBundle as TargetHandler<PiBundle>["write"],
  },
  copilot: {
    name: "copilot",
    tier: targetPolicies.copilot.tier,
    cleanup: targetPolicies.copilot.cleanup,
    rationale: targetPolicies.copilot.rationale,
    surfaces: [...targetPolicies.copilot.surfaces],
    implemented: true,
    convert: convertClaudeToCopilot as TargetHandler<CopilotBundle>["convert"],
    write: writeCopilotBundle as TargetHandler<CopilotBundle>["write"],
  },
  gemini: {
    name: "gemini",
    tier: targetPolicies.gemini.tier,
    cleanup: targetPolicies.gemini.cleanup,
    rationale: targetPolicies.gemini.rationale,
    surfaces: [...targetPolicies.gemini.surfaces],
    implemented: true,
    convert: convertClaudeToGemini as TargetHandler<GeminiBundle>["convert"],
    write: writeGeminiBundle as TargetHandler<GeminiBundle>["write"],
  },
  kiro: {
    name: "kiro",
    tier: targetPolicies.kiro.tier,
    cleanup: targetPolicies.kiro.cleanup,
    rationale: targetPolicies.kiro.rationale,
    surfaces: [...targetPolicies.kiro.surfaces],
    implemented: true,
    convert: convertClaudeToKiro as TargetHandler<KiroBundle>["convert"],
    write: writeKiroBundle as TargetHandler<KiroBundle>["write"],
  },
}

export function resolveTargetHandler(targetName: string, surface: Exclude<TargetSurface, "build">): TargetHandler {
  const policy = getTargetPolicy(targetName)
  if (!policy || !policy.surfaces.includes(surface)) {
    throw new Error(`Unknown ${surface} target: ${targetName}. Use one of: ${getTargetNamesForSurface(surface).join(", ")}`)
  }

  const target = targets[targetName]
  if (!target) {
    throw new Error(`Target ${targetName} is listed for ${surface} but has no implementation.`)
  }

  return target
}
