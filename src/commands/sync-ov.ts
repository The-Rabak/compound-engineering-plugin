import { defineCommand } from "citty"
import { promises as fs } from "fs"
import os from "os"
import path from "path"
import { convertClaudeToCopilot } from "../converters/claude-to-copilot"
import { loadPortablePlugin } from "../parsers/portable"
import type { PortablePlugin } from "../types/portable"
import { pathExists, walkFiles } from "../utils/files"
import { resolveTargetHome } from "../utils/resolve-home"

const DEFAULT_OV_CORE = path.join(os.homedir(), ".copilot-skills", "ov-core.sh")
const GLOBAL_SKILLS_URI = "viking://resources/_global/skills"
const OV_STATE_FILE_NAME = ".compound-engineering-sync-ov-state.json"

type SkillSupportResource = {
  sourcePath: string
  parentUri: string
  targetUri: string
}

type GeneratedCommandSkill = {
  name: string
  sourcePath: string
  commandSourcePath?: string
}

type SyncOvState = {
  version: 1
  agents: string[]
  skills: string[]
  supportUris: string[]
}

const LEGACY_COMMAND_SKILL_RENAMES: Record<string, string[]> = {
  "workflows-triage": ["triage"],
}

export default defineCommand({
  meta: {
    name: "sync-ov",
    description: "Sync portable agents, skills, and commands into the OpenViking global index",
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

    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "compound-plugin-sync-ov-"))
    const scriptPath = path.join(tempRoot, "sync-ov.sh")
    const generatedCommandSkills = await generateCommandSkills(plugin, tempRoot)
    const skillSupportFiles = await collectSkillSupportResources(plugin)
    const commandSupportFiles = await collectCommandSupportResources(generatedCommandSkills)
    const supportFiles = [...skillSupportFiles, ...commandSupportFiles]
    const syncState = buildSyncState(plugin, generatedCommandSkills, supportFiles)
    const legacySkillNames = collectLegacySkillNames(plugin, generatedCommandSkills)

    try {
      await fs.writeFile(
        scriptPath,
        buildSyncScript(ovCorePath, plugin, supportFiles, generatedCommandSkills, syncState, legacySkillNames),
        "utf8",
      )

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
      `Synced ${plugin.agents.length} agents, ${plugin.skills.length} skills, ` +
        `${generatedCommandSkills.length} commands, and ${supportFiles.length} skill support files ` +
        `to the OpenViking global index.`,
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

async function collectCommandSupportResources(
  generatedCommandSkills: GeneratedCommandSkill[],
): Promise<SkillSupportResource[]> {
  const resources: SkillSupportResource[] = []

  for (const skill of generatedCommandSkills) {
    if (!skill.commandSourcePath) continue

    const referencesDir = path.join(path.dirname(skill.commandSourcePath), "references")
    if (!(await pathExists(referencesDir))) continue

    const files = await walkFiles(referencesDir)
    for (const file of files) {
      const relativePath = path.relative(path.dirname(skill.commandSourcePath), file)
      assertRelativePath(relativePath, file)
      resources.push({
        sourcePath: file,
        parentUri: buildSkillParentUri(skill.name, path.dirname(relativePath)),
        targetUri: buildSkillTargetUri(skill.name, relativePath),
      })
    }
  }

  return resources
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
  generatedCommandSkills: GeneratedCommandSkill[],
  syncState: SyncOvState,
  legacySkillNames: string[],
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
    "if [[ -n \"${OV_GLOBAL_DIR:-}\" ]]; then",
    "  OV_STATE_DIR=\"$OV_GLOBAL_DIR\"",
    "elif [[ -n \"${OV_GLOBAL_SKILLS_DIR:-}\" ]]; then",
    "  OV_STATE_DIR=\"${OV_GLOBAL_SKILLS_DIR%/*}\"",
    "else",
    `  OV_STATE_DIR="${'${HOME}/openviking_workspace/global'}"`,
    "fi",
    "mkdir -p \"$OV_STATE_DIR\"",
    `OV_STATE_FILE="${'${OV_STATE_DIR}'}/${OV_STATE_FILE_NAME}"`,
    "",
    "compound_syncov_prune_stale() {",
    "  local kind=\"$1\"",
    "  local name=\"$2\"",
    "  if [[ -z \"$name\" ]]; then return 0; fi",
    "  if [[ \"$kind\" == \"agent\" ]]; then",
    "    rm -f \"${OV_GLOBAL_AGENTS_DIR}/${name}.md\"",
    "    rm -rf \"${OV_GLOBAL_AGENTS_DIR}/${name}\"",
    "    _ov_reset_uri \"${OV_GLOBAL_AGENTS_URI}/${name}\"",
    "    return 0",
    "  fi",
    "  rm -f \"${OV_GLOBAL_SKILLS_DIR}/${name}.md\"",
    "  rm -rf \"${OV_GLOBAL_SKILLS_DIR}/${name}\"",
    "  _ov_reset_uri \"${OV_GLOBAL_SKILLS_URI}/${name}\"",
    "}",
    "",
    "compound_syncov_prune_support_uri() {",
    "  local uri=\"$1\"",
    "  if [[ -z \"$uri\" ]]; then return 0; fi",
    "  local prefix=\"${OV_GLOBAL_SKILLS_URI}/\"",
    "  if [[ \"$uri\" == \"$prefix\"* ]]; then",
    "    local rel=\"${uri#${prefix}}\"",
    "    rm -f \"${OV_GLOBAL_SKILLS_DIR}/${rel}\"",
    "  fi",
    "  _ov_reset_uri \"$uri\"",
    "}",
    "",
    "compound_syncov_prune_from_state() {",
    "  local current_agents_json=\"$1\"",
    "  local current_skills_json=\"$2\"",
    "  local current_support_json=\"$3\"",
    "  python3 - \"$OV_STATE_FILE\" \"$current_agents_json\" \"$current_skills_json\" \"$current_support_json\" <<'PY'",
    "import json, sys",
    "state_path, agents_raw, skills_raw, support_raw = sys.argv[1:5]",
    "try:",
    "    with open(state_path, 'r', encoding='utf-8') as fh:",
    "        state = json.load(fh)",
    "except Exception:",
    "    state = {}",
    "old_agents = set(state.get('agents') or [])",
    "old_skills = set(state.get('skills') or [])",
    "old_support = set(state.get('supportUris') or [])",
    "new_agents = set(json.loads(agents_raw))",
    "new_skills = set(json.loads(skills_raw))",
    "new_support = set(json.loads(support_raw))",
    "for name in sorted(old_agents - new_agents):",
    "    print(f'agent\\t{name}')",
    "for name in sorted(old_skills - new_skills):",
    "    print(f'skill\\t{name}')",
    "for uri in sorted(old_support - new_support):",
    "    print(f'support\\t{uri}')",
    "PY",
    "}",
    "",
    `CURRENT_AGENTS_JSON=${shellEscape(JSON.stringify(syncState.agents))}`,
    `CURRENT_SKILLS_JSON=${shellEscape(JSON.stringify(syncState.skills))}`,
    `CURRENT_SUPPORT_JSON=${shellEscape(JSON.stringify(syncState.supportUris))}`,
    "",
    "while IFS=$'\\t' read -r kind value; do",
    "  [[ -z \"$kind\" ]] && continue",
    "  case \"$kind\" in",
    "    agent) compound_syncov_prune_stale agent \"$value\" ;;",
    "    skill) compound_syncov_prune_stale skill \"$value\" ;;",
    "    support) compound_syncov_prune_support_uri \"$value\" ;;",
    "  esac",
    "done < <(compound_syncov_prune_from_state \"$CURRENT_AGENTS_JSON\" \"$CURRENT_SKILLS_JSON\" \"$CURRENT_SUPPORT_JSON\")",
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

  for (const command of generatedCommandSkills) {
    assertNamespaceSegment(command.name, "command")
    lines.push(
      `register_global_fast ${shellEscape(command.name)} ${shellEscape(command.sourcePath)} "\${OV_GLOBAL_SKILLS_DIR:-}" "\${OV_GLOBAL_SKILLS_URI:-}" ov_register_global_skill`,
    )
  }

  for (const resource of supportFiles) {
    lines.push(
      `mirror_skill_support_file ${shellEscape(resource.sourcePath)} ${shellEscape(resource.parentUri)} ${shellEscape(resource.targetUri)}`,
    )
  }

  lines.push("")
  for (const skillName of legacySkillNames) {
    lines.push(`compound_syncov_prune_stale skill ${shellEscape(skillName)}`)
  }
  if (legacySkillNames.length > 0) {
    lines.push("")
  }

  lines.push("if declare -F _ov_rebuild_global_manifest >/dev/null 2>&1; then")
  lines.push("  _ov_rebuild_global_manifest")
  lines.push("fi")
  lines.push("")
  lines.push("cat >\"$OV_STATE_FILE\" <<'JSON'")
  lines.push(
    JSON.stringify(
      {
        version: 1,
        agents: syncState.agents,
        skills: syncState.skills,
        supportUris: syncState.supportUris,
      } satisfies SyncOvState,
      null,
      2,
    ),
  )
  lines.push("JSON")

  return lines.join("\n") + "\n"
}

async function generateCommandSkills(
  plugin: PortablePlugin,
  tempRoot: string,
): Promise<GeneratedCommandSkill[]> {
  const bundle = convertClaudeToCopilot(plugin, {
    agentMode: "subagent",
    inferTemperature: false,
    permissions: "none",
  })
  const outputDir = path.join(tempRoot, "generated-command-skills")
  await fs.mkdir(outputDir, { recursive: true })

  const generated: GeneratedCommandSkill[] = []
  for (const skill of bundle.generatedSkills) {
    assertNamespaceSegment(skill.name, "command")
    const targetPath = path.join(outputDir, `${skill.name}.md`)
    await fs.writeFile(targetPath, skill.content, "utf8")
    generated.push({
      name: skill.name,
      sourcePath: targetPath,
      commandSourcePath: skill.sourcePath,
    })
  }

  return generated.sort((left, right) => left.name.localeCompare(right.name))
}

function buildSyncState(
  plugin: PortablePlugin,
  generatedCommandSkills: GeneratedCommandSkill[],
  supportFiles: SkillSupportResource[],
): SyncOvState {
  const agents = [...new Set(plugin.agents.map((agent) => agent.name))].sort()
  const skills = [
    ...new Set([
      ...plugin.skills.map((skill) => skill.name),
      ...generatedCommandSkills.map((skill) => skill.name),
    ]),
  ].sort()
  const supportUris = [...new Set(supportFiles.map((resource) => resource.targetUri))].sort()

  return {
    version: 1,
    agents,
    skills,
    supportUris,
  }
}

function collectLegacySkillNames(
  plugin: PortablePlugin,
  generatedCommandSkills: GeneratedCommandSkill[],
): string[] {
  const currentSkillNames = new Set([
    ...plugin.skills.map((skill) => skill.name),
    ...generatedCommandSkills.map((skill) => skill.name),
  ])
  const legacySkillNames = new Set<string>()

  for (const generatedSkill of generatedCommandSkills) {
    for (const legacyName of LEGACY_COMMAND_SKILL_RENAMES[generatedSkill.name] ?? []) {
      if (!currentSkillNames.has(legacyName)) {
        legacySkillNames.add(legacyName)
      }
    }
  }

  return [...legacySkillNames].sort()
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
