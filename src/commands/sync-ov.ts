import { defineCommand } from "citty"
import { promises as fs } from "fs"
import os from "os"
import path from "path"
import { loadPortablePlugin } from "../parsers/portable"
import type { PortablePlugin } from "../types/portable"
import { pathExists, walkFiles } from "../utils/files"
import { resolveTargetHome } from "../utils/resolve-home"

const DEFAULT_OV_CORE = path.join(os.homedir(), ".copilot-skills", "ov-core.sh")
const GLOBAL_SKILLS_URI = "viking://resources/_global/skills"

type SkillSupportResource = {
  sourcePath: string
  parentUri: string
  targetUri: string
}

export default defineCommand({
  meta: {
    name: "sync-ov",
    description: "Sync portable agents and skills into the OpenViking global index",
  },
  args: {
    source: {
      type: "positional",
      required: true,
      description: "Path to the portable plugin directory or plugin.yaml",
    },
    ovCore: {
      type: "string",
      alias: "ov-core",
      description: "Path to ov-core.sh (default: OV_CORE_PATH or ~/.copilot-skills/ov-core.sh)",
    },
  },
  async run({ args }) {
    const plugin = await loadPortablePlugin(String(args.source))
    const ovCorePath = resolveTargetHome(args.ovCore ?? process.env.OV_CORE_PATH, DEFAULT_OV_CORE)
    await assertReadableFile(ovCorePath, "OpenViking core script")

    const supportFiles = await collectSkillSupportResources(plugin)
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "compound-plugin-sync-ov-"))
    const scriptPath = path.join(tempRoot, "sync-ov.sh")

    try {
      await fs.writeFile(scriptPath, buildSyncScript(ovCorePath, plugin, supportFiles), "utf8")

      const proc = Bun.spawn(["bash", scriptPath], {
        cwd: plugin.root,
        stdout: "pipe",
        stderr: "pipe",
        env: sanitizeShellEnv(process.env),
      })
      const exitCode = await proc.exited
      const stdout = await new Response(proc.stdout).text()
      const stderr = await new Response(proc.stderr).text()

      if (exitCode !== 0) {
        throw new Error(
          `Failed to sync OpenViking globals (exit ${exitCode}).` +
            (stdout.trim() ? `\nstdout: ${stdout}` : "") +
            (stderr.trim() ? `\nstderr: ${stderr}` : ""),
        )
      }

      if (stdout.trim()) {
        process.stdout.write(stdout)
      }
      if (stderr.trim()) {
        process.stderr.write(stderr)
      }
    } finally {
      await fs.rm(tempRoot, { recursive: true, force: true })
    }

    console.log(
      `Synced ${plugin.agents.length} agents, ${plugin.skills.length} skills, and ` +
        `${supportFiles.length} skill support files to the OpenViking global index.`,
    )
  },
})

async function collectSkillSupportResources(plugin: PortablePlugin): Promise<SkillSupportResource[]> {
  const sortedSkills = [...plugin.skills].sort((left, right) => left.name.localeCompare(right.name))
  const resourcesBySkill = await Promise.all(
    sortedSkills.map(async (skill) => {
      assertNamespaceSegment(skill.name, "skill")
      const files = await walkFiles(skill.sourceDir)
      const resources: SkillSupportResource[] = []
      for (const file of files) {
        if (path.resolve(file) === path.resolve(skill.skillPath)) continue

        const relativePath = path.relative(skill.sourceDir, file)
        assertRelativePath(relativePath, file)

        resources.push({
          sourcePath: file,
          parentUri: buildSkillParentUri(skill.name, path.dirname(relativePath)),
          targetUri: buildSkillTargetUri(skill.name, relativePath),
        })
      }
      return resources
    }),
  )

  return resourcesBySkill.flat()
}

function buildSkillParentUri(skillName: string, relativeDir: string): string {
  const baseUri = `${GLOBAL_SKILLS_URI}/${skillName}`
  if (!relativeDir || relativeDir === ".") return baseUri
  return `${baseUri}/${relativeDir.split(path.sep).join("/")}`
}

function buildSkillTargetUri(skillName: string, relativePath: string): string {
  return `${GLOBAL_SKILLS_URI}/${skillName}/${relativePath.split(path.sep).join("/")}`
}

function buildSyncScript(
  ovCorePath: string,
  plugin: PortablePlugin,
  supportFiles: SkillSupportResource[],
): string {
  const lines = [
    "#!/usr/bin/env bash",
    "set -euo pipefail",
    "",
    `. ${shellEscape(ovCorePath)}`,
    "",
    "if declare -F ov_ensure_running >/dev/null 2>&1; then",
    "  ov_ensure_running >/dev/null 2>&1 || true",
    "fi",
    "",
    "for fn in ov_register_global_agent ov_register_global_skill _ov_add_resource; do",
    "  if ! declare -F \"$fn\" >/dev/null 2>&1; then",
    "    echo \"Missing OV helper: $fn\" >&2",
    "    exit 1",
    "  fi",
    "done",
    "",
    "register_global_fast() {",
    "  local name=\"$1\"",
    "  local source_file=\"$2\"",
    "  local global_dir=\"$3\"",
    "  local global_uri=\"$4\"",
    "  local fallback_fn=\"$5\"",
    "  if [[ -n \"$global_dir\" && -n \"$global_uri\" ]] && declare -F _ov_ensure_uri_dir >/dev/null 2>&1 && declare -F _ov_reset_uri >/dev/null 2>&1; then",
    "    _ov_ensure_uri_dir \"$global_uri\"",
    "    _ov_reset_uri \"$global_uri/$name\"",
    "    /bin/mkdir -p \"$global_dir\"",
    "    /bin/cp \"$source_file\" \"$global_dir/$name.md\"",
    "    _ov_add_resource \"$global_dir/$name.md\" --parent \"$global_uri\"",
    "  else",
    "    \"$fallback_fn\" \"$name\" \"$source_file\"",
    "  fi",
    "}",
    "",
    "mirror_skill_support_file() {",
    "  local source_file=\"$1\"",
    "  local parent_uri=\"$2\"",
    "  local target_uri=\"$3\"",
    "  if declare -F _ov_ensure_uri_dir >/dev/null 2>&1; then",
    "    _ov_ensure_uri_dir \"$parent_uri\"",
    "  fi",
    "  if declare -F _ov_reset_uri >/dev/null 2>&1; then",
    "    _ov_reset_uri \"$target_uri\"",
    "  fi",
    "  _ov_add_resource \"$source_file\" --parent \"$parent_uri\"",
    "}",
    "",
  ]

  for (const agent of [...plugin.agents].sort((left, right) => left.name.localeCompare(right.name))) {
    assertNamespaceSegment(agent.name, "agent")
    lines.push(
      `register_global_fast ${shellEscape(agent.name)} ${shellEscape(agent.sourcePath)} "\${OV_GLOBAL_AGENTS_DIR:-}" "\${OV_GLOBAL_AGENTS_URI:-}" ov_register_global_agent`,
    )
  }

  for (const skill of [...plugin.skills].sort((left, right) => left.name.localeCompare(right.name))) {
    assertNamespaceSegment(skill.name, "skill")
    lines.push(
      `register_global_fast ${shellEscape(skill.name)} ${shellEscape(skill.skillPath)} "\${OV_GLOBAL_SKILLS_DIR:-}" "\${OV_GLOBAL_SKILLS_URI:-}" ov_register_global_skill`,
    )
  }

  for (const resource of supportFiles) {
    lines.push(
      `mirror_skill_support_file ${shellEscape(resource.sourcePath)} ${shellEscape(resource.parentUri)} ${shellEscape(resource.targetUri)}`,
    )
  }

  lines.push("")
  lines.push("if declare -F _ov_rebuild_global_manifest >/dev/null 2>&1; then")
  lines.push("  _ov_rebuild_global_manifest")
  lines.push("fi")

  return lines.join("\n") + "\n"
}

function assertNamespaceSegment(value: string, label: string): void {
  const trimmed = value.trim()
  if (
    !trimmed ||
    trimmed === "." ||
    trimmed === ".." ||
    trimmed.includes("/") ||
    trimmed.includes("\\") ||
    trimmed.includes("\0") ||
    !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(trimmed)
  ) {
    throw new Error(`Invalid ${label} name for OpenViking sync: ${value}`)
  }
}

function assertRelativePath(relativePath: string, sourcePath: string): void {
  if (!relativePath || relativePath === "." || path.isAbsolute(relativePath) || relativePath.includes("\0")) {
    throw new Error(`Invalid skill support path for OpenViking sync: ${sourcePath}`)
  }

  const segments = relativePath.split(path.sep)
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    throw new Error(`Refusing to mirror unsafe skill support path: ${sourcePath}`)
  }
}

function shellEscape(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`
}

async function assertReadableFile(filePath: string, label: string): Promise<void> {
  if (!(await pathExists(filePath))) {
    throw new Error(`Could not find ${label.toLowerCase()} at ${filePath}`)
  }

  const stats = await fs.stat(filePath)
  if (!stats.isFile()) {
    throw new Error(`${label} must be a file: ${filePath}`)
  }
}

function sanitizeShellEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const sanitized = { ...env, PATH: buildTrustedPath(env) }
  for (const key of Object.keys(sanitized)) {
    if (key.startsWith("BASH_FUNC_")) {
      delete sanitized[key]
    }
  }
  delete sanitized.BASH_ENV
  delete sanitized.ENV
  delete sanitized.CDPATH
  return sanitized
}

function buildTrustedPath(env: NodeJS.ProcessEnv): string {
  const candidates = [
    env.HOME ? path.join(env.HOME, ".local", "bin") : undefined,
    env.HOME ? path.join(env.HOME, ".bun", "bin") : undefined,
    "/usr/local/sbin",
    "/usr/local/bin",
    "/usr/sbin",
    "/usr/bin",
    "/sbin",
    "/bin",
  ]

  const seen = new Set<string>()
  return candidates
    .filter((value): value is string => Boolean(value))
    .filter((value) => {
      if (seen.has(value)) return false
      seen.add(value)
      return true
    })
    .join(":")
}
